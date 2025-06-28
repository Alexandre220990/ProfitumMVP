from functools import wraps
from flask import request, jsonify, g
import jwt
from ..connect_pooler import init_pooler_connection, execute_query

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'Token d\'authentification manquant'}), 401
            
        try:
            # Format attendu: "Bearer <token>"
            token = auth_header.split(' ')[1]
            # Décoder le token
            payload = jwt.decode(token, 'EhAhS26BXDsowVPe', algorithms=['HS256'])
            
            # Vérifier que l'utilisateur existe toujours
            success, result = execute_query('Client', {'id': payload['id']})
            
            if not success or not result:
                return jsonify({'error': 'Utilisateur non trouvé'}), 401
                
            # Stocker l'utilisateur dans le contexte global Flask
            g.user = result[0] if result else None
            return f(*args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expiré'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token invalide'}), 401
        except Exception as e:
            return jsonify({'error': str(e)}), 401
            
    return decorated 