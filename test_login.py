import requests
import json

def test_login():
    url = "http://127.0.0.1:5001/api/auth/login"
    headers = {
        "Content-Type": "application/json"
    }
    data = {
        "email": "grandjean.alexandre5@gmail.com",
        "password": "profitum"
    }
    
    print(f"Tentative de connexion avec {data['email']} et mot de passe {data['password']}")
    
    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        print(f"Statut de la réponse: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            print("Réponse complète:", json.dumps(response_data, indent=2))
            
            if response_data.get('success'):
                print("Connexion réussie!")
                token = response_data.get('data', {}).get('token')
                client = response_data.get('data', {}).get('client')
                
                if token:
                    print(f"Token reçu: {token[:20]}...")
                else:
                    print("Aucun token reçu")
                    
                if client:
                    print(f"Client: ID={client.get('id')}, Nom={client.get('username')}, Email={client.get('email')}")
                else:
                    print("Aucune information client reçue")
            else:
                print(f"Échec de la connexion: {response_data.get('error')}")
        else:
            print(f"Échec de la requête: {response.text}")
    
    except Exception as e:
        print(f"Erreur lors de la requête: {str(e)}")

if __name__ == "__main__":
    test_login() 