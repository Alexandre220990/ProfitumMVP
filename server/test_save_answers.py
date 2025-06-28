import requests
import json

def send_request():
    # Configuration
    url = "http://[::1]:5001/api/simulations/22/answers"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc0MzYwNzE0OSwianRpIjoiNTVhZGNjOTktOTNjYy00NjdkLWIyYTgtMTI3MDQyYmQ4MDJlIiwidHlwZSI6ImNsaWVudCIsInN1YiI6ImE3NTk0MTAzLTdhZTktNGRhZi1iZWUyLTFiNTYzYzYzMGVmYSIsIm5iZiI6MTc0MzYwNzE0OSwiY3NyZiI6IjEyZTUxZDc4LTkxM2ItNGRhMS1iYmM1LTFhNDY2ZjUyNGVhMiIsImV4cCI6MTc0MzY5MzU0OX0.aEMuMHCfI5Tg0lDh3Y86sJGfR_JkaUPGhKeQdQOrPaE"
    }
    
    # Données de test
    data = {
        "answers": {
            "1": ["option1"],
            "4": ["option1"],
            "5": ["option1"],
            "13": ["option1"],
            "20": ["option1"],
            "31": ["option1"],
            "33": ["option1"],
            "34": ["option1"],
            "35": ["option1"],
            "37": ["option1"],
            "38": ["option1"],
            "39": ["option1"],
            "40": ["option1"],
            "41": ["option1"],
            "42": ["option1"],
            "43": ["option1"],
            "44": ["option1"],
            "45": ["option1"]
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Erreur: {str(e)}")

if __name__ == "__main__":
    send_request() 