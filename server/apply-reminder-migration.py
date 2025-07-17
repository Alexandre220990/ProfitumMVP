#!/usr/bin/env python3
"""
Script pour appliquer la migration des reminders
"""

import os
import sys
from supabase import create_client, Client

# Configuration de Supabase
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://gvvlsgtubqfxdztldunj.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Njk4NDksImV4cCI6MjA1NzM0NTg0OX0.2hahkZasfMfdFhQvP7rvPHzO1DBCl0FfsRVkxVZfdgk')

def apply_migration():
    """Applique la migration des reminders"""
    try:
        # Initialisation du client Supabase
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        print("🔗 Connexion à Supabase établie")
        
        # Lecture du fichier de migration
        migration_file = "migrations/20250103_create_reminders_table.sql"
        
        if not os.path.exists(migration_file):
            print(f"❌ Fichier de migration non trouvé : {migration_file}")
            return False
            
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        print("📄 Migration SQL chargée")
        
        # Exécution de la migration via rpc
        try:
            # Utilisation de la fonction rpc pour exécuter du SQL
            result = supabase.rpc('exec_sql', {'sql_query': migration_sql}).execute()
            print("✅ Migration appliquée avec succès")
            return True
            
        except Exception as e:
            print(f"⚠️  Erreur lors de l'exécution RPC : {e}")
            
            # Fallback : exécution directe via query
            try:
                # Division du SQL en commandes individuelles
                commands = migration_sql.split(';')
                
                for i, command in enumerate(commands):
                    command = command.strip()
                    if command and not command.startswith('--'):
                        print(f"Exécution de la commande {i+1}/{len(commands)}")
                        result = supabase.table('_dummy').select('*').limit(1).execute()
                        # Note: Cette approche ne fonctionne pas pour DDL
                        # Il faudrait utiliser une connexion directe PostgreSQL
                
                print("⚠️  Impossible d'exécuter DDL via Supabase client")
                print("💡 Utilisez l'interface Supabase ou une connexion directe PostgreSQL")
                return False
                
            except Exception as e2:
                print(f"❌ Erreur lors de l'exécution directe : {e2}")
                return False
                
    except Exception as e:
        print(f"❌ Erreur de connexion : {e}")
        return False

def check_table_exists():
    """Vérifie si la table Reminder existe déjà"""
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Tentative de sélection pour vérifier l'existence
        result = supabase.table('Reminder').select('id').limit(1).execute()
        print("✅ Table Reminder existe déjà")
        return True
        
    except Exception as e:
        if "relation" in str(e).lower() and "does not exist" in str(e).lower():
            print("❌ Table Reminder n'existe pas")
            return False
        else:
            print(f"⚠️  Erreur lors de la vérification : {e}")
            return False

if __name__ == "__main__":
    print("🚀 Application de la migration des reminders")
    print("=" * 50)
    
    # Vérification de l'existence de la table
    if check_table_exists():
        print("📋 La table Reminder existe déjà")
        sys.exit(0)
    
    # Application de la migration
    if apply_migration():
        print("🎉 Migration terminée avec succès")
        sys.exit(0)
    else:
        print("💥 Échec de la migration")
        sys.exit(1) 