from flask import Blueprint, request, jsonify, session, g
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
import sys
import os
from pathlib import Path
import logging
import time
import secrets
import string
import json
import hashlib
import jwt
from datetime import datetime, timedelta
from functools import lru_cache
from typing import Optional, Dict, Any, Union, List, Tuple
from contextlib import contextmanager
from supabase import create_client, Client
from flask_cors import CORS
from dotenv import load_dotenv
from database import (
    execute_query, init_pooler_connection, active_connection,
    get_active_connection, set_active_connection, execute_supabase_query,
    client_manager, expert_manager, audit_manager,
    dossier_manager, simulation_manager, notification_manager,
    Expert, Simulation, Audit
)

# Configuration du logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Charger les variables d'environnement
load_dotenv()

# Configuration de Supabase
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://gvvlsgtubqfxdztldunj.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Variables d'environnement Supabase manquantes")
    raise ValueError("Variables d'environnement Supabase manquantes")

try:
    # Initialisation du client Supabase
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Client Supabase initialisé avec succès")
except Exception as e:
    logger.error(f"Erreur lors de l'initialisation du client Supabase: {str(e)}")
    raise

# Constantes
VALID_AUDIT_TYPES = [
    'TICPE', 'CII', 'CIR', 'Foncier', 'URSSAF', 'DFS', 'MSA'
]

JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'EhAhS26BXDsowVPe')
JWT_EXPIRATION = int(os.environ.get('JWT_EXPIRATION', 86400))

# Création du Blueprint
api = Blueprint('api', __name__)

# Exportation des objets nécessaires
__all__ = ['api', 'execute_supabase_query']

@contextmanager
def get_db_connection():
    """Contexte pour les opérations de base de données avec Supabase"""
    try:
        if not supabase:
            raise ValueError("Client Supabase non initialisé")
        yield supabase
    except Exception as e:
        logger.error(f"Erreur de connexion Supabase: {str(e)}")
        raise

def generate_token(length=32) -> str:
    """Génère un token aléatoire sécurisé."""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def generate_jwt_token(user_id: str, email: str, expiration: int = JWT_EXPIRATION) -> str:
    """
    Génère un token JWT pour l'authentification.
    
    Args:
        user_id (str): L'ID de l'utilisateur
        email (str): L'email de l'utilisateur
        expiration (int): Durée de validité du token en secondes
    
    Returns:
        str: Le token JWT généré
    """
    payload = {
        'id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(seconds=expiration),
        'iat': datetime.utcnow(),
        'sub': str(user_id)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def validate_user_access(resource_owner_id: str, current_user_id: str, is_admin: bool = False) -> bool:
    """
    Vérifie si l'utilisateur a le droit d'accéder à une ressource.
    
    Args:
        resource_owner_id (str): L'ID du propriétaire de la ressource
        current_user_id (str): L'ID de l'utilisateur actuel
        is_admin (bool): Si l'utilisateur est un administrateur
        
    Returns:
        bool: True si l'utilisateur a le droit d'accéder à la ressource, False sinon
    """
    # Les administrateurs ont accès à toutes les ressources
    if is_admin:
        return True
    
    # Les utilisateurs ont accès à leurs propres ressources
    return resource_owner_id == current_user_id

def extract_response_value(answers: Dict, key: str) -> List:
    """
    Extrait la valeur d'une réponse, que ce soit une liste ou une valeur simple.
    
    Args:
        answers (dict): Le dictionnaire des réponses
        key (str): La clé à extraire
        
    Returns:
        list: La valeur extraite sous forme de liste
    """
    value = answers.get(key, [])
    if not value:
        return []
    if isinstance(value, list):
        return value
    return [value]

@api.before_request
def log_request_info() -> None:
    """Log les informations de chaque requête."""
    g.start_time = time.time()
    logger.info(f"Requête reçue: {request.method} {request.path}")

@api.after_request
def log_request_result(response):
    """Log le résultat de chaque requête."""
    duration_ms = (time.time() - g.start_time) * 1000 if hasattr(g, 'start_time') else None
    
    # Tenter de récupérer l'ID utilisateur
    user_id = None
    try:
        if verify_jwt_in_request(optional=True):
            user_id = get_jwt_identity()
    except Exception:
        pass
    
    logger.info(
        f"Réponse envoyée: {response.status_code} "
        f"(durée: {duration_ms:.2f}ms, utilisateur: {user_id})"
    )
    return response

# Routes d'authentification
@api.route('/auth/register', methods=['POST'])
def register():
    """Endpoint d'inscription."""
    try:
        data = request.get_json()
        
        # Vérifier les champs requis
        required_fields = ['email', 'password', 'name']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Champs requis manquants'}), 400
            
        # Vérifier si l'email existe déjà
        success, result = execute_supabase_query('Client', 'select', email=data['email'])
        if success and result:
            return jsonify({'error': 'Email déjà utilisé'}), 400
            
        # Créer le client
        client_data = {
            'email': data['email'],
            'password': hashlib.sha256(data['password'].encode()).hexdigest(),
            'name': data['name'],
            'company': data.get('company', ''),
            'phone': data.get('phone', ''),
            'createdAt': datetime.utcnow().isoformat(),
            'updatedAt': datetime.utcnow().isoformat()
        }
        
        success, result = execute_supabase_query('Client', 'insert', data=client_data)
        if not success:
            return jsonify({'error': 'Erreur lors de la création du client'}), 500
            
        # Générer le token
        token = generate_jwt_token(result[0]['id'], result[0]['email'])
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': result[0]['id'],
                'email': result[0]['email'],
                'name': result[0]['name']
            }
        })
        
    except Exception as e:
        logger.error(f"Erreur lors de l'inscription: {e}")
        return jsonify({'error': str(e)}), 500

@api.route('/auth/login', methods=['POST'])
def login():
    """Endpoint de connexion."""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email et mot de passe requis'}), 400
            
        # Vérifier les identifiants
        hashed_password = hashlib.sha256(data['password'].encode()).hexdigest()
        success, result = execute_supabase_query(
            'Client',
            'select',
            email=data['email'],
            password=hashed_password
        )
        
        if not success or not result:
            return jsonify({'error': 'Identifiants invalides'}), 401
            
        # Générer le token
        token = generate_jwt_token(result[0]['id'], result[0]['email'])
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': result[0]['id'],
                'email': result[0]['email'],
                'name': result[0]['name']
            }
        })
        
    except Exception as e:
        logger.error(f"Erreur lors de la connexion: {e}")
        return jsonify({'error': str(e)}), 500

@api.route('/auth/check', methods=['GET'])
@jwt_required()
def check_auth():
    """Vérifie l'authentification."""
    try:
        user_id = get_jwt_identity()
        success, result = execute_supabase_query('Client', 'select', id=user_id)
        
        if not success or not result:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
            
        return jsonify({
            'success': True,
            'user': {
                'id': result[0]['id'],
                'email': result[0]['email'],
                'name': result[0]['name']
            }
        })
        
    except Exception as e:
        logger.error(f"Erreur lors de la vérification de l'authentification: {e}")
        return jsonify({'error': str(e)}), 500

# Routes des clients
@api.route('/clients', methods=['GET'])
@jwt_required()
def get_clients():
    """Récupère la liste des clients."""
    try:
        success, result = execute_supabase_query('Client', 'select')
        if not success:
            return jsonify({'error': 'Erreur lors de la récupération des clients'}), 500
            
        return jsonify({
            'success': True,
            'clients': result
        })
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des clients: {e}")
        return jsonify({'error': str(e)}), 500

# Routes des audits
@api.route('/audits', methods=['POST'])
@jwt_required()
def create_audit():
    """Crée un nouvel audit."""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Vérifier les champs requis
        required_fields = ['clientId', 'type', 'status']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Champs requis manquants'}), 400
            
        # Vérifier l'accès
        if not validate_user_access(data['clientId'], user_id):
            return jsonify({'error': 'Accès non autorisé'}), 403
            
        # Créer l'audit
        audit_data = {
            'clientId': data['clientId'],
            'type': data['type'],
            'status': data['status'],
            'createdAt': datetime.utcnow().isoformat(),
            'updatedAt': datetime.utcnow().isoformat()
        }
        
        success, result = execute_supabase_query('Audit', 'insert', data=audit_data)
        if not success:
            return jsonify({'error': 'Erreur lors de la création de l\'audit'}), 500
            
        return jsonify({
            'success': True,
            'audit': result[0]
        })
        
    except Exception as e:
        logger.error(f"Erreur lors de la création de l'audit: {e}")
        return jsonify({'error': str(e)}), 500

@api.route('/audits/<audit_id>', methods=['GET'])
@jwt_required()
def get_audit(audit_id):
    """Récupère un audit par son ID."""
    try:
        user_id = get_jwt_identity()
        success, result = execute_supabase_query('Audit', 'select', id=audit_id)
        
        if not success or not result:
            return jsonify({'error': 'Audit non trouvé'}), 404
            
        # Vérifier l'accès
        if not validate_user_access(result[0]['clientId'], user_id):
            return jsonify({'error': 'Accès non autorisé'}), 403
            
        return jsonify({
            'success': True,
            'audit': result[0]
        })
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération de l'audit: {e}")
        return jsonify({'error': str(e)}), 500

@api.route('/audits/<audit_id>', methods=['PUT'])
@jwt_required()
def update_audit(audit_id):
    """Met à jour un audit."""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Vérifier l'existence de l'audit
        success, result = execute_supabase_query('Audit', 'select', id=audit_id)
        if not success or not result:
            return jsonify({'error': 'Audit non trouvé'}), 404
            
        # Vérifier l'accès
        if not validate_user_access(result[0]['clientId'], user_id):
            return jsonify({'error': 'Accès non autorisé'}), 403
            
        # Mettre à jour l'audit
        update_data = {
            **data,
            'updatedAt': datetime.utcnow().isoformat()
        }
        
        success, result = execute_supabase_query('Audit', 'update', id=audit_id, data=update_data)
        if not success:
            return jsonify({'error': 'Erreur lors de la mise à jour de l\'audit'}), 500
            
        return jsonify({
            'success': True,
            'audit': result[0]
        })
        
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour de l'audit: {e}")
        return jsonify({'error': str(e)}), 500

# Route de santé
@api.route('/health', methods=['GET'])
def health_check():
    """Vérifie l'état de l'API."""
    try:
        # Tester la connexion à Supabase
        success, _ = execute_supabase_query('Client', 'select')
        status = "connected" if success else "error"
        
        return jsonify({
            'status': status,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erreur lors de la vérification de l'état: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500