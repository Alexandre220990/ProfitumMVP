from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import json

audit_progress_bp = Blueprint('audit_progress', __name__)

def get_db_connection():
    return psycopg2.connect(
        dbname=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        host=os.getenv('DB_HOST'),
        port=os.getenv('DB_PORT')
    )

@audit_progress_bp.route('/api/audit-progress/<request_id>', methods=['GET'])
@jwt_required()
def get_audit_progress(request_id):
    try:
        user_id = get_jwt_identity()
        
        # Connexion à la base de données
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Récupérer la progression de l'audit
        cur.execute("""
            SELECT * FROM audit_progress
            WHERE request_id = %s
        """, (request_id,))
        
        progress = cur.fetchone()
        
        # Si aucune progression n'existe, en créer une nouvelle
        if not progress:
            # Initialiser une nouvelle entrée avec des valeurs par défaut
            default_progress = {
                'current_step': 1,
                'progress': {},
                'signed_charters': {},
                'selected_experts': {},
                'documents': {}
            }
            
            cur.execute("""
                INSERT INTO audit_progress
                (request_id, current_step, progress, signed_charters, selected_experts, documents)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                request_id, 
                1,  # étape initiale
                json.dumps({}),  # progression vide
                json.dumps({}),  # pas de chartes signées
                json.dumps({}),  # pas d'experts sélectionnés
                json.dumps({})   # pas de documents
            ))
            
            conn.commit()
            progress = cur.fetchone()
        
        # Convertir les champs JSON stockés en objets Python
        if progress:
            if isinstance(progress['progress'], str):
                progress['progress'] = json.loads(progress['progress'])
            if isinstance(progress['signed_charters'], str):
                progress['signed_charters'] = json.loads(progress['signed_charters'])
            if isinstance(progress['selected_experts'], str):
                progress['selected_experts'] = json.loads(progress['selected_experts'])
            if isinstance(progress['documents'], str):
                progress['documents'] = json.loads(progress['documents'])
        
        return jsonify({
            'success': True,
            'data': progress
        })
        
    except Exception as e:
        print(f"Erreur lors de la récupération de la progression : {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Erreur lors de la récupération de la progression: {str(e)}'
        }), 500
    
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

@audit_progress_bp.route('/api/audit-progress/<request_id>', methods=['POST'])
@jwt_required()
def update_audit_progress(request_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Connexion à la base de données
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Vérifier si une entrée existe déjà
        cur.execute("""
            SELECT * FROM audit_progress
            WHERE request_id = %s
        """, (request_id,))
        
        existing = cur.fetchone()
        
        # Préparer la mise à jour
        update_fields = []
        update_values = []
        
        if 'current_step' in data:
            update_fields.append("current_step = %s")
            update_values.append(data['current_step'])
            
        if 'progress' in data:
            update_fields.append("progress = %s")
            update_values.append(json.dumps(data['progress']))
            
        if 'signed_charters' in data:
            update_fields.append("signed_charters = %s")
            update_values.append(json.dumps(data['signed_charters']))
            
        if 'selected_experts' in data:
            update_fields.append("selected_experts = %s")
            update_values.append(json.dumps(data['selected_experts']))
            
        if 'documents' in data:
            update_fields.append("documents = %s")
            update_values.append(json.dumps(data['documents']))
            
        update_values.append(request_id)
        
        if existing:
            # Mettre à jour l'entrée existante
            query = f"""
                UPDATE audit_progress
                SET {', '.join(update_fields)}, updated_at = NOW()
                WHERE request_id = %s
                RETURNING *
            """
            cur.execute(query, update_values)
        else:
            # Créer une nouvelle entrée
            default_values = {
                'current_step': 1,
                'progress': {},
                'signed_charters': {},
                'selected_experts': {},
                'documents': {}
            }
            
            # Fusionner avec les données reçues
            for key, value in data.items():
                if key in default_values:
                    default_values[key] = value
            
            cur.execute("""
                INSERT INTO audit_progress
                (request_id, current_step, progress, signed_charters, selected_experts, documents)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                request_id,
                default_values['current_step'],
                json.dumps(default_values['progress']),
                json.dumps(default_values['signed_charters']),
                json.dumps(default_values['selected_experts']),
                json.dumps(default_values['documents'])
            ))
        
        conn.commit()
        updated = cur.fetchone()
        
        # Convertir les champs JSON stockés en objets Python
        if updated:
            if isinstance(updated['progress'], str):
                updated['progress'] = json.loads(updated['progress'])
            if isinstance(updated['signed_charters'], str):
                updated['signed_charters'] = json.loads(updated['signed_charters'])
            if isinstance(updated['selected_experts'], str):
                updated['selected_experts'] = json.loads(updated['selected_experts'])
            if isinstance(updated['documents'], str):
                updated['documents'] = json.loads(updated['documents'])
        
        return jsonify({
            'success': True,
            'data': updated
        })
        
    except Exception as e:
        print(f"Erreur lors de la mise à jour de la progression : {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Erreur lors de la mise à jour de la progression: {str(e)}'
        }), 500
    
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close() 