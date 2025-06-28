from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5000", "http://127.0.0.1:5000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Route de test pour vérifier que le serveur fonctionne
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "message": "Le serveur de test fonctionne correctement"
    })

# Route de test pour l'authentification
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    print(f"Tentative de connexion avec: {email}, {password}")
    
    # Vérifier les identifiants de test
    if email == "grandjean.alexandre5@gmail.com" and password == "profitum":
        return jsonify({
            "success": True,
            "data": {
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjNkMGFmMjViLTFjMmYtNGQzMS04MjU4LTJkN2M3MzNjMTJiNCIsImVtYWlsIjoiZ3JhbmRqZWFuLmFsZXhhbmRyZTVAZ21haWwuY29tIiwiZXhwIjoxNzQyMjI4MzQ2fQ.TQjmRlu2Xwn6U_JQ3_XhKzf6_4GTgRhF-8AcCN9BZX8",
                "client": {
                    "id": "3d0af25b-1c2f-4d31-8258-2d7c733c12b4",
                    "email": "grandjean.alexandre5@gmail.com",
                    "username": "Alexandre Grandjean"
                }
            }
        })
    else:
        return jsonify({
            "success": False,
            "message": "Identifiants invalides"
        }), 401

if __name__ == '__main__':
    print("Démarrage du serveur de test Flask...")
    app.run(debug=True, host='0.0.0.0', port=5001, threaded=True) 