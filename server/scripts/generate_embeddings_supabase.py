from supabase._sync.client import create_client
from supabase.client import Client
from sentence_transformers import SentenceTransformer

# Paramètres Supabase
url = "https://gvvlsgtubqfxdztldunj.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc2OTg0OSwiZXhwIjoyMDU3MzQ1ODQ5fQ.pN73GQUJHmd099PUcxAVGm-TFTe3KHeBemBk9IlGAcg"
supabase: Client = create_client(url, key)

# Charge le modèle d'embedding (MiniLM)
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# Récupère toutes les questions
questions = supabase.table("Question").select("id, texte").execute().data

for q in questions:
    embedding = model.encode(q["texte"]).tolist()
    # Met à jour la colonne embedding
    supabase.table("Question").update({"embedding": embedding}).eq("id", q["id"]).execute()

print("Embeddings générés et insérés avec succès via l'API Supabase !") 