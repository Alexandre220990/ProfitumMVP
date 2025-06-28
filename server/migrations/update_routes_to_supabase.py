#!/usr/bin/env python3

import os
import sys
from pathlib import Path

# Ajouter le répertoire parent au chemin Python
parent_dir = str(Path(__file__).parent.parent.absolute())
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from config import supabase, TABLES
from routes import api

def execute_supabase_query(table: str, query_type: str = 'select', **kwargs):
    """
    Exécute une requête Supabase et retourne le résultat.
    
    Args:
        table (str): Nom de la table
        query_type (str): Type de requête ('select', 'insert', 'update', 'delete')
        **kwargs: Arguments supplémentaires pour la requête
    
    Returns:
        Tuple[bool, Any]: (succès, résultat ou message d'erreur)
    """
    try:
        table_ref = supabase.table(table)
        
        if query_type == 'select':
            result = table_ref.select(**kwargs).execute()
        elif query_type == 'insert':
            result = table_ref.insert(kwargs.get('data', {})).execute()
        elif query_type == 'update':
            result = table_ref.update(kwargs.get('data', {})).eq('id', kwargs.get('id')).execute()
        elif query_type == 'delete':
            result = table_ref.delete().eq('id', kwargs.get('id')).execute()
        else:
            return False, f"Type de requête non supporté: {query_type}"
        
        return True, result.data
    except Exception as e:
        print(f"Erreur Supabase: {str(e)}")
        return False, str(e)

def update_routes():
    """Met à jour les routes pour utiliser Supabase."""
    # Liste des routes à mettre à jour
    routes_to_update = [
        {
            'name': 'get_experts',
            'method': 'GET',
            'path': '/experts',
            'handler': lambda: execute_supabase_query(TABLES['EXPERT'], 'select')
        },
        {
            'name': 'get_expert',
            'method': 'GET',
            'path': '/experts/<expert_id>',
            'handler': lambda expert_id: execute_supabase_query(TABLES['EXPERT'], 'select', id=expert_id)
        },
        {
            'name': 'get_simulations',
            'method': 'GET',
            'path': '/simulations',
            'handler': lambda: execute_supabase_query(TABLES['SIMULATION'], 'select')
        },
        {
            'name': 'get_simulation',
            'method': 'GET',
            'path': '/simulations/<simulation_id>',
            'handler': lambda simulation_id: execute_supabase_query(TABLES['SIMULATION'], 'select', id=simulation_id)
        },
        {
            'name': 'create_simulation',
            'method': 'POST',
            'path': '/simulations',
            'handler': lambda data: execute_supabase_query(TABLES['SIMULATION'], 'insert', data=data)
        },
        {
            'name': 'update_simulation',
            'method': 'PUT',
            'path': '/simulations/<simulation_id>',
            'handler': lambda simulation_id, data: execute_supabase_query(TABLES['SIMULATION'], 'update', id=simulation_id, data=data)
        },
        {
            'name': 'get_audits',
            'method': 'GET',
            'path': '/audits',
            'handler': lambda: execute_supabase_query(TABLES['AUDIT'], 'select')
        },
        {
            'name': 'create_audit',
            'method': 'POST',
            'path': '/audits',
            'handler': lambda data: execute_supabase_query(TABLES['AUDIT'], 'insert', data=data)
        },
        {
            'name': 'update_audit',
            'method': 'PUT',
            'path': '/audits/<audit_id>',
            'handler': lambda audit_id, data: execute_supabase_query(TABLES['AUDIT'], 'update', id=audit_id, data=data)
        }
    ]

    # Mettre à jour chaque route
    for route in routes_to_update:
        print(f"Mise à jour de la route {route['name']}...")
        
        # Créer le décorateur de route
        route_decorator = getattr(api, route['method'].lower())
        
        # Créer la fonction de gestion
        def create_handler(handler_func):
            def handler(*args, **kwargs):
                try:
                    success, result = handler_func(*args, **kwargs)
                    if not success:
                        return {'error': result}, 500
                    return {route['name'].replace('get_', ''): result}, 200
                except Exception as e:
                    print(f"Erreur dans {route['name']}: {str(e)}")
                    return {'error': str(e)}, 500
            return handler
        
        # Appliquer le décorateur et la fonction de gestion
        route_decorator(route['path'])(create_handler(route['handler']))
        
        print(f"Route {route['name']} mise à jour avec succès!")

if __name__ == '__main__':
    update_routes()
    print("Migration terminée avec succès!") 