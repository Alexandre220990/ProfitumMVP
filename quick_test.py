#!/usr/bin/env python3

import requests
import json
from pprint import pprint

# URL de base
BASE_URL = 'http://localhost:5001'

def test_login():
    """Test de la route de connexion"""
    print("\n=== Test de la route de connexion ===")
    
    url = f"{BASE_URL}/api/auth/login"
    data = {
        "email": "grandjean.alexandre5@gmail.com",
        "password": "profitum"
    }
    
    try:
        response = requests.post(url, json=data)
        
        print(f"Status code: {response.status_code}")
        try:
            result = response.json()
            print("Réponse JSON:")
            pprint(result)
            
            # Si la connexion réussit, tester auth/check
            if response.status_code == 200 and result.get('success'):
                token = result.get('data', {}).get('token')
                if token:
                    test_auth_check(token)
            
        except json.JSONDecodeError:
            print("Réponse non-JSON:", response.text)
        
    except requests.RequestException as e:
        print(f"Erreur de requête: {str(e)}")

def test_auth_check(token):
    """Test de la route de vérification d'authentification"""
    print("\n=== Test de la route de vérification d'authentification ===")
    
    url = f"{BASE_URL}/api/auth/check"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        
        print(f"Status code: {response.status_code}")
        try:
            result = response.json()
            print("Réponse JSON:")
            pprint(result)
            
        except json.JSONDecodeError:
            print("Réponse non-JSON:", response.text)
        
    except requests.RequestException as e:
        print(f"Erreur de requête: {str(e)}")

if __name__ == "__main__":
    test_login() 