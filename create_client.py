from supabase import create_client, Client
import os
from datetime import datetime
import time

# Configuration de Supabase
SUPABASE_URL = "https://gvvlsgtubqfxdztldunj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Njk4NDksImV4cCI6MjA1NzM0NTg0OX0.2hahkZasfMfdFhQvP7rvPHzO1DBCl0FfsRVkxVZfdgk"

# Informations du nouveau client
NEW_CLIENT_EMAIL = "grandjean.alexandre5@gmail.com"
NEW_CLIENT_PASSWORD = "profitum"
CLIENT_DATA = {
    "name": "Alexandre Grandjean",
    "company": "Profitum"
}

try:
    print("🔄 Tentative de connexion à Supabase...")
    
    # Création du client Supabase
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Connexion établie avec succès!")
    
    print("\n⏳ Attente de 4 secondes pour respecter la limitation de taux...")
    time.sleep(4)
    
    print("\n👤 Création du compte client...")
    try:
        # Création du compte utilisateur
        auth_response = supabase.auth.sign_up({
            "email": NEW_CLIENT_EMAIL,
            "password": NEW_CLIENT_PASSWORD
        })
        
        if auth_response.user:
            print("✅ Compte utilisateur créé avec succès!")
            user_id = auth_response.user.id
            
            print("\n🔑 Authentification avec le nouveau compte...")
            auth_response = supabase.auth.sign_in_with_password({
                "email": NEW_CLIENT_EMAIL,
                "password": NEW_CLIENT_PASSWORD
            })
            
            if auth_response.user and auth_response.session:
                print("✅ Authentification réussie!")
                print(f"   Session token: {auth_response.session.access_token[:30]}...")
                
                # Mise à jour du client Supabase avec le token d'authentification
                supabase.auth.set_session(auth_response.session.access_token, auth_response.session.refresh_token)
                
                # Vérification de la session active
                session = supabase.auth.get_session()
                if session:
                    print("✅ Session active confirmée")
                    print(f"   User ID de la session: {session.user.id}")
                    user_id = session.user.id  # Utilisation de l'ID de la session
                else:
                    print("❌ Pas de session active")
                    raise Exception("Échec de la configuration de la session")
                
                # Ajout des données du client dans la table Client
                client_data = {
                    **CLIENT_DATA,
                    "id": user_id,
                    "email": NEW_CLIENT_EMAIL,
                    "password": NEW_CLIENT_PASSWORD
                }
                
                print("\n📝 Ajout des informations du client dans la base de données...")
                print(f"   ID utilisateur: {user_id}")
                try:
                    result = supabase.table('Client').insert(client_data).execute()
                    print("   Requête envoyée avec succès")
                    
                    print("\n✅ Client créé avec succès!")
                    print("\n📋 Informations de connexion :")
                    print(f"   Email: {NEW_CLIENT_EMAIL}")
                    print(f"   Mot de passe: {NEW_CLIENT_PASSWORD}")
                    print(f"   ID Client: {user_id}")
                    print("\n⚠️ Conservez ces informations précieusement!")
                    
                except Exception as insert_error:
                    print(f"❌ Erreur lors de l'insertion : {str(insert_error)}")
                    if hasattr(insert_error, 'code'):
                        print(f"   Code d'erreur : {insert_error.code}")
                    raise insert_error
            else:
                print("❌ Erreur lors de l'authentification")
                if auth_response.user:
                    print("   Utilisateur créé mais pas de session valide")
                if hasattr(auth_response, 'error'):
                    print(f"   Erreur: {auth_response.error}")
        else:
            print("❌ Erreur lors de la création du compte utilisateur")
            
    except Exception as auth_error:
        print(f"❌ Erreur lors de la création du client : {str(auth_error)}")
        if "User already registered" in str(auth_error):
            print("💡 Un compte existe déjà avec cet email")
        
except Exception as e:
    print(f"❌ Erreur de connexion : {str(e)}")
    print("💡 Conseil: Vérifiez vos identifiants Supabase et votre connexion internet") 