from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import numpy as np

app = Flask(__name__)

# Charger le modèle une seule fois au démarrage
model = SentenceTransformer('all-MiniLM-L6-v2')

@app.route('/embed', methods=['POST'])
def embed_text():
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Générer l'embedding
        embedding = model.encode([text])[0]
        
        # Convertir en liste pour la sérialisation JSON
        embedding_list = embedding.tolist()
        
        return jsonify({
            'embedding': embedding_list,
            'dimension': len(embedding_list)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': 'all-MiniLM-L6-v2'})

if __name__ == '__main__':
    print("Démarrage du service d'embedding...")
    print("Modèle: all-MiniLM-L6-v2")
    app.run(host='localhost', port=5000, debug=False) 