from functools import wraps
from flask import request, jsonify
import sys
import os
from pathlib import Path
import jwt
from typing import Optional, Dict, Any

# Ajouter le répertoire parent au chemin Python pour trouver les modules
parent_dir = str(Path(__file__).parent.parent.absolute())
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# Import de la fonction de base de données depuis database.py
from database import execute_query

# Clé secrète pour JWT - utiliser le mot de passe Supabase
JWT_SECRET = '+aiFgbefNjLDV8MZOPyWt326RzCL1ZAS/JCOuzxG6/dnAp86jDjQKdWsJBCI7dR3p4I+hP70+aA7g+ZZcqSrRA=='

# Mode débogage - à définir sur False en production
DEBUG_MODE = True

def authenticate_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Vérifier si le token est dans les headers
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({"error": "Token invalide"}), 401

        if not token:
            return jsonify({"error": "Token manquant"}), 401

        try:
            # Décoder le token
            decoded = jwt.decode(
                token,
                'your-secret-key',  # À remplacer par votre clé secrète
                algorithms=["HS256"]
            )

            try:
                # Utiliser la fonction execute_query avec le nom de la table directement
                client_data = execute_query('Client', {'id': str(decoded['id'])})
                
                if not client_data:
                    return jsonify({"error": "Client non trouvé"}), 401
                    
                # Ajouter l'utilisateur à la requête
                setattr(request, 'user', client_data[0])
                
                return f(*args, **kwargs)
            except Exception as db_error:
                return jsonify({"error": f"Erreur de base de données: {str(db_error)}"}), 500

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expiré"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token invalide"}), 401
        except Exception as e:
            return jsonify({"error": f"Erreur inattendue: {str(e)}"}), 500

    return decorated

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # En mode débogage, ignorer l'authentification
        if DEBUG_MODE:
            print("Mode débogage activé, authentification ignorée")
            # Ajouter un utilisateur fictif à la requête
            setattr(request, 'user', {'id': '1', 'email': 'debug@example.com'})
            return f(*args, **kwargs)
            
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "Token manquant"}), 401
            
        try:
            # Extraire le token du header Bearer
            token = token.split(' ')[1]
            
            # Décoder le token JWT
            decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            
            try:
                # Rechercher le client dans la base de données
                client_data = execute_query('SELECT * FROM "Client" WHERE id = :id', {'id': str(decoded['id'])})
                
                if not client_data:
                    return jsonify({"error": "Client non trouvé"}), 401
                    
                # Ajouter l'utilisateur à la requête
                setattr(request, 'user', client_data[0])
                
                return f(*args, **kwargs)
            except Exception as db_error:
                return jsonify({"error": f"Erreur de base de données: {str(db_error)}"}), 500
            
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expiré"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token invalide"}), 401
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    return decorated 