from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import timedelta

auth_bp = Blueprint('auth', __name__)

def get_db_connection():
    try:
        print("Tentative de connexion à la base de données...")
        database_url = os.getenv('DATABASE_URL')
        print(f"URL de la base de données: {database_url}")
        
        conn = psycopg2.connect(database_url)
        print("✅ Connexion à la base de données réussie")
        return conn
    except Exception as e:
        print(f"❌ Erreur de connexion à la base de données: {str(e)}")
        import traceback
        print(f"Traceback complet: {traceback.format_exc()}")
        raise

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({
                'success': False,
                'error': 'Email et mot de passe requis'
            }), 400

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Vérifier d'abord dans la table Client (avec majuscule)
        cur.execute("""
            SELECT c.id, c.email, c.name as username, 'client' as type,
                   s.id as simulation_id, s.statut as simulation_status
            FROM "Client" c
            LEFT JOIN (
                SELECT DISTINCT ON ("clientId") *
                FROM "Simulation"
                ORDER BY "clientId", "createdAt" DESC
            ) s ON c.id = s."clientId"
            WHERE c.email = %s AND c.password = %s
        """, (email, password))

        user = cur.fetchone()

        # Si pas trouvé, vérifier dans la table Expert (avec majuscule)
        if not user:
            cur.execute("""
                SELECT id, email, name as username, 'expert' as type
                FROM "Expert"
                WHERE email = %s AND password = %s
            """, (email, password))
            user = cur.fetchone()

        if user:
            # Créer le token JWT
            access_token = create_access_token(
                identity=str(user['id']),
                additional_claims={'type': user['type']},
                expires_delta=timedelta(days=1)
            )

            # Préparer la réponse avec les informations de simulation si disponibles
            response_data = {
                'success': True,
                'data': {
                    'client': {
                        'id': user['id'],
                        'email': user['email'],
                        'username': user['username'],
                        'type': user['type']
                    },
                    'token': access_token
                }
            }

            # Ajouter les informations de simulation si elles existent
            if user.get('simulation_id'):
                response_data['data']['simulation'] = {
                    'id': user['simulation_id'],
                    'status': user['simulation_status']
                }

            return jsonify(response_data)
        else:
            return jsonify({
                'success': False,
                'error': 'Identifiants invalides'
            }), 401

    except Exception as e:
        print(f"Erreur lors de la connexion : {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erreur lors de la connexion'
        }), 500

    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

@auth_bp.route('/auth/check', methods=['GET'])
@jwt_required()
def check_auth():
    try:
        user_id = get_jwt_identity()
        print(f"✅ Vérification d'authentification pour l'ID: {user_id}")
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Afficher les colonnes de la table Client pour débogage
        try:
            print("📊 Vérification des colonnes de la table Client...")
            cur.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'Client' AND table_schema = 'public'
            """)
            columns = [col['column_name'] for col in cur.fetchall()]
            print(f"Colonnes disponibles: {columns}")
        except Exception as e:
            print(f"❌ Erreur lors de l'inspection des colonnes: {str(e)}")

        # Vérifier d'abord dans la table Client (avec majuscule)
        # Utiliser un alias explicit pour "type" qui est un mot-clé SQL
        try:
            print("🔍 Recherche du client dans la base de données...")
            cur.execute("""
                SELECT c.id, c.email, c.name as username
                FROM "Client" c
                WHERE c.id = %s
            """, (user_id,))
            
            user = cur.fetchone()
            print(f"Résultat de la recherche client: {user}")
        except Exception as e:
            print(f"❌ Erreur lors de la recherche du client: {str(e)}")
            raise e

        if user:
            # Si c'est un client, ajouter manuellement le type
            print("✅ Client trouvé, préparation de la réponse...")
            return jsonify({
                'success': True,
                'data': {
                    'id': user['id'],
                    'email': user['email'],
                    'username': user['username'],
                    'type': 'client'  # Ajouter le type manuellement
                }
            })
        
        # Si pas trouvé, vérifier dans la table Expert
        try:
            print("🔍 Recherche de l'expert dans la base de données...")
            cur.execute("""
                SELECT e.id, e.email, e.name as username
                FROM "Expert" e
                WHERE e.id = %s
            """, (user_id,))
            
            user = cur.fetchone()
            print(f"Résultat de la recherche expert: {user}")
        except Exception as e:
            print(f"❌ Erreur lors de la recherche de l'expert: {str(e)}")
            raise e

        if user:
            # Si c'est un expert, ajouter manuellement le type
            print("✅ Expert trouvé, préparation de la réponse...")
            return jsonify({
                'success': True,
                'data': {
                    'id': user['id'],
                    'email': user['email'],
                    'username': user['username'],
                    'type': 'expert'  # Ajouter le type manuellement
                }
            })
        
        # Si l'utilisateur n'a pas été trouvé
        print("❌ Aucun utilisateur trouvé avec cet ID")
        return jsonify({
            'success': False,
            'error': 'Utilisateur non trouvé'
        }), 404

    except Exception as e:
        print(f"❌ Erreur lors de la vérification d'authentification: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

@auth_bp.route('/client/login', methods=['POST'])
def client_login():
    try:
        data = request.get_json()
        print(f"Données reçues : {data}")  # Log des données reçues
        
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({
                'success': False,
                'error': 'Email et mot de passe requis'
            }), 400

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Vérifier dans la table Client (avec majuscule)
        query = """
            SELECT c.id, c.email, c.name as username, 'client' as type,
                   s.id as simulation_id, s.statut as simulation_status
            FROM "Client" c
            LEFT JOIN (
                SELECT DISTINCT ON ("clientId") *
                FROM "Simulation"
                ORDER BY "clientId", "createdAt" DESC
            ) s ON c.id = s."clientId"
            WHERE c.email = %s AND c.password = %s
        """
        print(f"Exécution de la requête : {query}")  # Log de la requête
        cur.execute(query, (email, password))

        user = cur.fetchone()
        print(f"Résultat de la requête : {user}")  # Log du résultat

        if user:
            # Créer le token JWT
            access_token = create_access_token(
                identity=str(user['id']),
                additional_claims={'type': user['type']},
                expires_delta=timedelta(days=1)
            )

            # Préparer la réponse avec les informations de simulation si disponibles
            response_data = {
                'success': True,
                'data': {
                    'client': {
                        'id': user['id'],
                        'email': user['email'],
                        'username': user['username'],
                        'type': user['type']
                    },
                    'token': access_token
                }
            }

            # Ajouter les informations de simulation si elles existent
            if user.get('simulation_id'):
                response_data['data']['client']['simulation'] = {
                    'id': user['simulation_id'],
                    'status': user['simulation_status']
                }

            print(f"Réponse envoyée : {response_data}")  # Log de la réponse
            return jsonify(response_data)
        else:
            return jsonify({
                'success': False,
                'error': 'Identifiants invalides'
            }), 401

    except Exception as e:
        print(f"Erreur détaillée lors de la connexion client : {str(e)}")
        import traceback
        print(f"Traceback complet : {traceback.format_exc()}")  # Log du traceback complet
        return jsonify({
            'success': False,
            'error': f'Erreur lors de la connexion client: {str(e)}'
        }), 500

    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

@auth_bp.route('/auth/logout', methods=['POST'])
def logout():
    return jsonify({
        'success': True,
        'message': 'Déconnexion réussie'
    })

@auth_bp.route('/client/check', methods=['GET'])
@jwt_required()
def client_check_auth():
    """Route compatible pour vérifier l'authentification des clients"""
    try:
        user_id = get_jwt_identity()
        print(f"✅ Vérification d'authentification client pour l'ID: {user_id}")
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Vérifier uniquement dans la table Client
        try:
            print("🔍 Recherche du client dans la base de données...")
            cur.execute("""
                SELECT c.id, c.email, c.name as username
                FROM "Client" c
                WHERE c.id = %s
            """, (user_id,))
            
            user = cur.fetchone()
            print(f"Résultat de la recherche client: {user}")
        except Exception as e:
            print(f"❌ Erreur lors de la recherche du client: {str(e)}")
            raise e

        if user:
            # Si c'est un client, retourner les informations
            print("✅ Client trouvé, préparation de la réponse...")
            return jsonify({
                'success': True,
                'data': {
                    'id': user['id'],
                    'email': user['email'],
                    'username': user['username'],
                    'type': 'client'
                }
            })
        
        # Si l'utilisateur n'est pas un client
        print("❌ Aucun client trouvé avec cet ID")
        return jsonify({
            'success': False,
            'error': 'Client non trouvé'
        }), 404

    except Exception as e:
        print(f"❌ Erreur lors de la vérification d'authentification client: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close() 