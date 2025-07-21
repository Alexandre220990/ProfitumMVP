# -*- coding: utf-8 -*-
from flask import Flask, jsonify, make_response, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os
import sys
import importlib.util
import pathlib
import logging
import psycopg2
from datetime import datetime

# Configuration du logging
logging.basicConfig(level=logging.INFO)

# Charger le fichier routes.py directement avec son chemin absolu
script_dir = pathlib.Path(__file__).parent.absolute()
routes_path = os.path.join(script_dir, "routes.py")
routes_spec = importlib.util.spec_from_file_location("routes", routes_path)
if routes_spec is None:
    raise ImportError("Impossible de charger routes.py")
routes = importlib.util.module_from_spec(routes_spec)
if routes_spec.loader is None:
    raise ImportError("Erreur de chargement de routes.py")
routes_spec.loader.exec_module(routes)
api = routes.api

from routes.preferences import preferences
from routes.auth import auth_bp
from routes.audit_progress import audit_progress_bp

load_dotenv()

app = Flask(__name__)

# Configuration CORS
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://[::1]:3000",
            "http://localhost:4000",
            "http://127.0.0.1:4000",
            "http://[::1]:4000",
            "http://localhost:5001",
            "http://127.0.0.1:5001",
            "http://[::1]:5001",
            "https://profitum.app",
            "https://www.profitum.app",
            "https://profitum-mvp.vercel.app"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-CSRF-Token", "Accept", "Origin"],
        "supports_credentials": True,
        "expose_headers": ["Content-Type", "Authorization", "X-CSRF-Token"],
        "max_age": 3600
    }
})

# Configuration JWT
app.config["JWT_SECRET_KEY"] = os.getenv('JWT_SECRET_KEY', '+aiFgbefNjLDV8MZOPyWt326RzCL1ZAS/JCOuzxG6/dnAp86jDjQKdWsJBCI7dR3p4I+hP70+aA7g+ZZcqSrRA==')
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600  # 1 heure
app.config["JWT_HEADER_TYPE"] = "Bearer"
app.config["JWT_IDENTITY_CLAIM"] = "sub"  # Assurer que l'identity est stockée dans la revendication 'sub'
app.config["JWT_ALGORITHM"] = "HS256"  # Spécifier l'algorithme
app.config["JWT_TOKEN_LOCATION"] = ["headers"]  # Spécifier où chercher le token
app.config["JWT_HEADER_NAME"] = "Authorization"  # Spécifier le nom du header
app.config["JWT_HEADER_TYPE"] = "Bearer"  # Spécifier le type de token
app.config["JWT_ERROR_MESSAGE_KEY"] = "message"  # Spécifier la clé du message d'erreur
app.config["JWT_DEBUG"] = True  # Activer le mode debug
app.config["DEBUG"] = True  # Activer le mode debug de Flask
jwt = JWTManager(app)

# Liste des origines autorisées pour CORS
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://[::1]:3000",
    "http://localhost:4000",
    "http://127.0.0.1:4000",
    "http://[::1]:4000",
    "http://localhost:5001",
    "http://127.0.0.1:5001",
    "http://[::1]:5001",
    "https://profitum.app",
    "https://www.profitum.app",
    "https://profitum-mvp.vercel.app"
]

# Middleware pour gérer les requêtes CORS
@app.before_request
def handle_cors():
    if request.method == 'OPTIONS':
        response = make_response()
        origin = request.headers.get('Origin')
        if origin in ALLOWED_ORIGINS:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRF-Token, Accept, Origin'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Max-Age'] = '3600'
            response.headers['Access-Control-Expose-Headers'] = 'Content-Type, Authorization, X-CSRF-Token'
        return response

@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin in ALLOWED_ORIGINS:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Expose-Headers'] = 'Content-Type, Authorization, X-CSRF-Token'
    return response

# Enregistrer les blueprints avec un seul préfixe /api
app.register_blueprint(preferences, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(audit_progress_bp, url_prefix='/api')
app.register_blueprint(api, url_prefix='/api')

# ============================================================================
# ROUTES DU SIMULATEUR - FLASK
# ============================================================================

@app.route('/api/simulator/session', methods=['POST'])
def create_simulator_session():
    """Créer une nouvelle session de simulation"""
    try:
        import uuid
        session_token = str(uuid.uuid4())
        
        # Ici tu peux ajouter la logique pour sauvegarder la session en base
        # Pour l'instant, on retourne juste le token
        
        return jsonify({
            "success": True,
            "session_token": session_token,
            "session_id": session_token
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/simulator/response', methods=['POST'])
def save_simulator_response():
    """Sauvegarder une réponse du simulateur"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        question_id = data.get('question_id')
        response_value = data.get('response_value')
        
        # Ici tu peux ajouter la logique pour sauvegarder la réponse en base
        
        return jsonify({
            "success": True,
            "message": "Réponse sauvegardée"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/simulator/calculate-eligibility', methods=['POST'])
def calculate_eligibility():
    """Calculer l'éligibilité pour tous les produits"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({
                "success": False,
                "error": "session_id requis"
            }), 400
        
        # Calcul d'éligibilité simplifié pour l'instant
        # Tu peux implémenter la logique complète ici
        eligibility_results = [
            {
                "produit_id": "TICPE",
                "eligibility_score": 75,
                "estimated_savings": 15000,
                "confidence_level": "élevé",
                "recommendations": [
                    "✅ Éligible à la récupération TICPE",
                    "💡 Optimisation possible avec documents complémentaires",
                    "📋 Contactez un expert pour finaliser le dossier"
                ]
            },
            {
                "produit_id": "URSSAF",
                "eligibility_score": 60,
                "estimated_savings": 8000,
                "confidence_level": "moyen",
                "recommendations": [
                    "✅ Éligible partiellement",
                    "💡 Amélioration possible avec plus de données",
                    "📋 Analyse approfondie recommandée"
                ]
            },
            {
                "produit_id": "DFS",
                "eligibility_score": 45,
                "estimated_savings": 5000,
                "confidence_level": "faible",
                "recommendations": [
                    "⚠️ Éligibilité limitée",
                    "💡 Optimisation possible avec documents supplémentaires",
                    "📋 Contactez un expert pour évaluation complète"
                ]
            },
            {
                "produit_id": "FONCIER",
                "eligibility_score": 30,
                "estimated_savings": 3000,
                "confidence_level": "faible",
                "recommendations": [
                    "❌ Éligibilité faible",
                    "💡 Optimisation possible avec plus d'informations",
                    "📋 Consultation spécialisée recommandée"
                ]
            }
        ]
        
        return jsonify({
            "success": True,
            "eligibility_results": eligibility_results,
            "total_savings": sum(r["estimated_savings"] for r in eligibility_results),
            "session_id": session_id
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/simulator/track', methods=['POST'])
def track_simulator_event():
    """Tracker un événement du simulateur"""
    try:
        data = request.get_json()
        # Ici tu peux ajouter la logique de tracking
        
        return jsonify({
            "success": True,
            "message": "Événement tracké"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Fonction d'aide pour la connexion à la base de données
def get_db_connection():
    return psycopg2.connect(
        host="db.gvvlsgtubqfxdztldunj.supabase.co",
        port="5432",
        database="postgres",
        user="postgres",
        password="EhAhS26BXDsowVPe",
        sslmode="require"
    )

# Gestionnaire d'erreurs pour les erreurs 404
@app.errorhandler(404)
def page_not_found(e):
    return jsonify({"error": "Route not found", "status": 404}), 404

# Gestionnaire d'erreurs pour les erreurs 500
@app.errorhandler(500)
def internal_server_error(e):
    return jsonify({"error": "Internal server error", "status": 500}), 500

if __name__ == "__main__":
    port = int(os.getenv("PYTHON_PORT", 4000))
    app.run(host="0.0.0.0", port=port, debug=True)
