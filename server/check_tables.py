from supabase import create_client, Client
import os
from typing import Dict, List, Any
import json
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Configuration de Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')  # Utilisation de la clé de service

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Les variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définies")

# Initialisation du client Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_table_info(table_name: str) -> Dict[str, Any]:
    """Récupère les informations d'une table."""
    try:
        # Récupérer un enregistrement pour voir la structure
        result = supabase.table(table_name).select("*").limit(1).execute()
        return {
            "name": table_name,
            "count": len(result.data),
            "sample": result.data[0] if result.data else None
        }
    except Exception as e:
        return {
            "name": table_name,
            "error": str(e)
        }

def check_all_tables():
    """Vérifie toutes les tables disponibles."""
    print("\n=== Vérification des tables Supabase ===\n")
    print(f"URL: {SUPABASE_URL}")
    print(f"Utilisation de la clé de service: {'Oui' if SUPABASE_KEY else 'Non'}\n")
    
    # Liste complète des tables
    tables = [
        "Appointment", "Audit", "Charter", "Client", 
        "ClientProduitEligible", "Document", "Dossier", 
        "Expert", "ExpertCategory", "ExpertProduitEligible",
        "ExpertSpecialization", "Notification", "Plan",
        "ProduitEligible", "Question", "Question_VERSION_FINALE_60Q",
        "RegleEligibilite", "Reponse", "Simulation",
        "SimulationProcessed", "SimulationResult", "Specialization"
    ]
    
    # Vérifier chaque table
    for table in tables:
        print(f"\nTable {table}:")
        info = get_table_info(table)
        
        if "error" in info:
            print(f"❌ Erreur: {info['error']}")
        else:
            print(f"✅ Nombre d'enregistrements: {info['count']}")
            if info['sample']:
                print("Structure de la table:")
                for key, value in info['sample'].items():
                    print(f"  - {key}: {type(value).__name__}")
            else:
                print("Table vide")

if __name__ == "__main__":
    check_all_tables() 