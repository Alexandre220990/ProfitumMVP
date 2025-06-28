from typing import Dict, List, Optional, Any, Tuple, Union
from datetime import datetime
from dataclasses import dataclass
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import logging
import re

# Configuration du logger
logger = logging.getLogger(__name__)

# Charger les variables d'environnement
load_dotenv()

# Configuration Supabase
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_ANON_KEY')

if not supabase_url or not supabase_key:
    raise ValueError("Variables d'environnement Supabase manquantes")

# Initialisation du client Supabase
supabase: Client = create_client(supabase_url, supabase_key)

def execute_query(query: str, params: Optional[Union[tuple, dict]] = None) -> List[Dict[str, Any]]:
    """
    Exécute une requête Supabase et retourne les résultats.
    Cette fonction remplace l'ancienne fonction PostgreSQL.
    
    Args:
        query: La requête SQL à exécuter
        params: Les paramètres de la requête (optionnel)
        
    Returns:
        Liste de dictionnaires contenant les résultats
    """
    try:
        # Extraire le nom de la table de la requête SQL
        # Format attendu: SELECT * FROM "TableName" WHERE ...
        table_match = re.search(r'FROM\s+"([^"]+)"', query, re.IGNORECASE)
        if not table_match:
            logger.error(f"Impossible d'extraire le nom de la table de la requête: {query}")
            return []
            
        table_name = table_match.group(1)
        
        # Extraire les conditions WHERE
        where_match = re.search(r'WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|\s+OFFSET|$)', query, re.IGNORECASE)
        where_clause = where_match.group(1) if where_match else None
        
        # Construire la requête Supabase
        query_builder = supabase.table(table_name).select("*")
        
        # Appliquer les conditions WHERE si présentes
        if where_clause:
            # Exemple simple: WHERE id = '123'
            id_match = re.search(r'id\s*=\s*[\'"]?([^\'"]+)[\'"]?', where_clause, re.IGNORECASE)
            if id_match:
                id_value = id_match.group(1)
                query_builder = query_builder.eq('id', id_value)
        
        # Exécuter la requête
        result = query_builder.execute()
        
        return result.data
    except Exception as e:
        logger.error(f"Erreur lors de l'exécution de la requête: {str(e)}")
        return []

def init_pooler_connection() -> bool:
    """
    Initialise une connexion à Supabase.
    Cette fonction remplace l'ancienne fonction PostgreSQL.
    
    Returns:
        True si la connexion est établie, False sinon
    """
    try:
        # Tester la connexion
        result = supabase.table('Client').select("*").limit(1).execute()
        return True
    except Exception as e:
        logger.error(f"Erreur de connexion à Supabase: {e}")
        return False

# Variable globale pour suivre l'état de la connexion
active_connection = False

def get_active_connection() -> bool:
    """
    Retourne l'état de la connexion active.
    
    Returns:
        True si la connexion est active, False sinon
    """
    global active_connection
    return active_connection

def set_active_connection(status: bool) -> None:
    """
    Met à jour l'état de la connexion active.
    
    Args:
        status: Nouvel état de la connexion
    """
    global active_connection
    active_connection = status

def execute_supabase_query(query: str, params: Optional[Dict] = None) -> List[Dict]:
    """
    Exécute une requête Supabase et retourne les résultats.
    
    Args:
        query (str): La requête SQL à exécuter
        params (Dict, optional): Les paramètres de la requête
        
    Returns:
        List[Dict]: Les résultats de la requête
    """
    try:
        # Extraction du nom de la table et des conditions
        table_match = re.search(r'FROM\s+(\w+)', query, re.IGNORECASE)
        where_match = re.search(r'WHERE\s+(.+)', query, re.IGNORECASE)
        
        if not table_match:
            raise ValueError("Nom de table non trouvé dans la requête")
            
        table_name = table_match.group(1)
        supabase_query = supabase.table(table_name).select('*')
        
        # Application des conditions WHERE si présentes
        if where_match and params:
            conditions = where_match.group(1)
            for key, value in params.items():
                if key in conditions:
                    supabase_query = supabase_query.eq(key, value)
        
        # Exécution de la requête
        result = supabase_query.execute()
        
        if hasattr(result, 'data'):
            return result.data
        return []
        
    except Exception as e:
        logger.error(f"Erreur lors de l'exécution de la requête Supabase: {str(e)}")
        raise

class BaseManager:
    def __init__(self, table_name: str):
        self.table_name = table_name

    def get_all(self) -> List[Dict]:
        success, result = execute_supabase_query(self.table_name, 'select')
        return result if success else []

    def get_by_id(self, id: str) -> Optional[Dict]:
        success, result = execute_supabase_query(self.table_name, 'select', id=id)
        return result[0] if success and result else None

    def create(self, data: Dict) -> Dict:
        success, result = execute_supabase_query(self.table_name, 'insert', data=data)
        return result if success else {}

    def update(self, id: str, data: Dict) -> Dict:
        success, result = execute_supabase_query(self.table_name, 'update', id=id, data=data)
        return result if success else {}

    def delete(self, id: str) -> bool:
        success, result = execute_supabase_query(self.table_name, 'delete', id=id)
        return success

@dataclass
class Expert:
    id: str
    email: str
    name: str
    specializations: List[str]
    status: str
    rating: float
    location: str

@dataclass
class Simulation:
    id: str
    client_id: str
    expert_id: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    data: Dict

@dataclass
class Audit:
    id: str
    client_id: str
    expert_id: Optional[str]
    type: str
    status: str
    created_at: datetime
    updated_at: datetime
    data: Dict

# Initialisation des managers
client_manager = BaseManager("Client")
expert_manager = BaseManager("Expert")
audit_manager = BaseManager("Audit")
dossier_manager = BaseManager("Dossier")
simulation_manager = BaseManager("Simulation")
notification_manager = BaseManager("Notification")

# Exportation des objets nécessaires
__all__ = [
    'execute_supabase_query',
    'BaseManager',
    'Expert',
    'Simulation',
    'Audit',
    'client_manager',
    'expert_manager',
    'audit_manager',
    'dossier_manager',
    'simulation_manager',
    'notification_manager'
] 