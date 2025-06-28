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
            "http://[::1]:5001"
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
    "http://[::1]:5001"
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
