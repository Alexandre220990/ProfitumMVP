import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

try:
    conn = psycopg2.connect(
        dbname=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        host=os.getenv('DB_HOST'),
        port=os.getenv('DB_PORT')
    )
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Liste uniquement les tables existantes
    cur.execute("""
        SELECT DISTINCT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename;
    """)
    
    print("\n=== Tables existantes ===")
    for row in cur.fetchall():
        print(f"  {row['tablename']}")
    
    cur.close()
    conn.close()
except Exception as e:
    print('Erreur de connexion:', str(e)) 