from supabase import create_client, Client
import os
from typing import Any, Dict, List, Optional, Tuple

# Configuration de Supabase
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://gvvlsgtubqfxdztldunj.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Njk4NDksImV4cCI6MjA1NzM0NTg0OX0.2hahkZasfMfdFhQvP7rvPHzO1DBCl0FfsRVkxVZfdgk')

# Initialisation du client Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def init_pooler_connection() -> Client:
    """Initialise et retourne une connexion à Supabase."""
    return supabase

def execute_query(query: str, params: Optional[Dict[str, Any]] = None) -> Tuple[bool, List[Dict[str, Any]]]:
    """
    Exécute une requête Supabase et retourne le résultat.
    
    Args:
        query (str): La requête à exécuter
        params (Optional[Dict[str, Any]]): Les paramètres de la requête
        
    Returns:
        Tuple[bool, List[Dict[str, Any]]]: (succès, résultats)
    """
    try:
        result = supabase.table(query).select().execute()
        return True, result.data
    except Exception as e:
        print(f"Erreur lors de l'exécution de la requête: {str(e)}")
        return False, [] 