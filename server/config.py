import os
from supabase import create_client, Client

# Configuration de Supabase
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://gvvlsgtubqfxdztldunj.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Njk4NDksImV4cCI6MjA1NzM0NTg0OX0.2hahkZasfMfdFhQvP7rvPHzO1DBCl0FfsRVkxVZfdgk')

# Initialisation du client Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Configuration JWT
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', '+aiFgbefNjLDV8MZOPyWt326RzCL1ZAS/JCOuzxG6/dnAp86jDjQKdWsJBCI7dR3p4I+hP70+aA7g+ZZcqSrRA==')
JWT_EXPIRATION = int(os.environ.get('JWT_EXPIRATION', 86400))

# Configuration de l'application
DEBUG_MODE = os.environ.get('DEBUG_MODE', 'False').lower() == 'true'

# Configuration des routes
API_PREFIX = '/api'
API_VERSION = 'v1'

# Configuration des tables
TABLES = {
    'CLIENT': 'Client',
    'EXPERT': 'Expert',
    'AUDIT': 'Audit',
    'SIMULATION': 'Simulation',
    'DOSSIER': 'Dossier',
    'NOTIFICATION': 'Notification'
} 