import requests
import logging
from datetime import datetime

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
BASE_URL = "http://localhost:5001"
TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Njk4NDksImV4cCI6MjA1NzM0NTg0OX0.2hahkZasfMfdFhQvP7rvPHzO1DBCl0FfsRVkxVZfdgk"

def test_health_check():
    """Test de la route de santé"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            logger.info("✅ Route /health fonctionne correctement")
            return True
        else:
            logger.error(f"❌ Route /health a échoué avec le code {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"❌ Erreur lors du test de /health: {str(e)}")
        return False

def test_get_experts():
    """Test de la route des experts"""
    try:
        headers = {"Authorization": f"Bearer {TEST_TOKEN}"}
        response = requests.get(f"{BASE_URL}/api/experts", headers=headers)
        if response.status_code == 200:
            experts = response.json()
            logger.info(f"✅ Route /api/experts fonctionne correctement ({len(experts)} experts trouvés)")
            return True
        else:
            logger.error(f"❌ Route /api/experts a échoué avec le code {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"❌ Erreur lors du test de /api/experts: {str(e)}")
        return False

def test_client_routes():
    """Test des routes liées aux clients"""
    try:
        headers = {"Authorization": f"Bearer {TEST_TOKEN}"}
        
        # Test de la création d'un client
        client_data = {
            "email": f"test.client.{datetime.now().timestamp()}@example.com",
            "name": "Client Test",
            "company": "Entreprise Test",
            "phone": "0601020304"
        }
        response = requests.post(f"{BASE_URL}/api/clients", json=client_data, headers=headers)
        if response.status_code == 201:
            client_id = response.json()["id"]
            logger.info(f"✅ Création de client réussie (ID: {client_id})")
            
            # Test de la récupération du client
            response = requests.get(f"{BASE_URL}/api/clients/{client_id}", headers=headers)
            if response.status_code == 200:
                logger.info("✅ Récupération du client réussie")
                return True
        else:
            logger.error(f"❌ Création de client a échoué avec le code {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"❌ Erreur lors des tests des routes clients: {str(e)}")
        return False

def test_simulation_routes():
    """Test des routes liées aux simulations"""
    try:
        headers = {"Authorization": f"Bearer {TEST_TOKEN}"}
        
        # Test de la création d'une simulation
        simulation_data = {
            "clientId": "test-client-id",  # À remplacer par un vrai ID
            "type": "TICPE",
            "montant": 100000
        }
        response = requests.post(f"{BASE_URL}/api/simulations", json=simulation_data, headers=headers)
        if response.status_code == 201:
            simulation_id = response.json()["id"]
            logger.info(f"✅ Création de simulation réussie (ID: {simulation_id})")
            
            # Test de la récupération des simulations
            response = requests.get(f"{BASE_URL}/api/simulations", headers=headers)
            if response.status_code == 200:
                logger.info("✅ Récupération des simulations réussie")
                return True
        else:
            logger.error(f"❌ Création de simulation a échoué avec le code {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"❌ Erreur lors des tests des routes simulations: {str(e)}")
        return False

if __name__ == "__main__":
    logger.info("Démarrage des tests de l'API...")
    
    # Exécution des tests
    health_check = test_health_check()
    experts = test_get_experts()
    clients = test_client_routes()
    simulations = test_simulation_routes()
    
    # Résumé des tests
    logger.info("\nRésumé des tests:")
    logger.info(f"✅ Route /health: {'OK' if health_check else '❌'}")
    logger.info(f"✅ Route /api/experts: {'OK' if experts else '❌'}")
    logger.info(f"✅ Routes clients: {'OK' if clients else '❌'}")
    logger.info(f"✅ Routes simulations: {'OK' if simulations else '❌'}") 