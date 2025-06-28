import psycopg2
from sentence_transformers import SentenceTransformer

# Paramètres de connexion à la base Supabase
DB_HOST = "gvvlsgtubqfxdztldunj.supabase.co"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASS = "EhAhS26BXDsowVPe"
DB_PORT = 5432

# Connexion à la base
conn = psycopg2.connect(
    host=DB_HOST,
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASS,
    port=DB_PORT
)
cur = conn.cursor()

# Charge le modèle d'embedding (MiniLM)
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# Récupère toutes les questions
cur.execute('SELECT id, texte FROM "Question"')
rows = cur.fetchall()

for qid, texte in rows:
    embedding = model.encode(texte)
    # Format PostgreSQL vector : string de floats séparés par virgule
    embedding_str = ','.join([str(x) for x in embedding])
    # Met à jour la colonne embedding
    cur.execute(
        'UPDATE "Question" SET embedding = %s WHERE id = %s',
        (f'[{embedding_str}]', qid)
    )

conn.commit()
cur.close()
conn.close()
print("Embeddings générés et insérés avec succès !") 