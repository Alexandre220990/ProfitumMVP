#!/bin/bash

# Script pour démarrer le serveur avec la Gestion Électronique Documentaire (GED)
# Usage: ./start-ged-server.sh

set -e

echo "🚀 Démarrage du serveur FinancialTracker avec GED..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis le dossier server/"
    exit 1
fi

# Vérifier les variables d'environnement
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "⚠️  Variables d'environnement Supabase non définies"
    echo "   Assurez-vous que SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définies"
    echo "   Vous pouvez les définir dans un fichier .env"
fi

# Vérifier que les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Vérifier que TypeScript est compilé
if [ ! -d "dist" ]; then
    echo "🔨 Compilation TypeScript..."
    npm run build
fi

# Appliquer la migration GED si nécessaire
echo "🗄️  Vérification de la migration GED..."
if [ -f "scripts/apply-ged-migration.js" ]; then
    echo "   Migration GED disponible"
    echo "   Pour l'appliquer: node scripts/apply-ged-migration.js"
else
    echo "   ⚠️  Script de migration GED non trouvé"
fi

# Démarrer le serveur
echo "🌐 Démarrage du serveur..."
echo "   URL: http://localhost:3001"
echo "   API: http://localhost:3001/api"
echo "   GED: http://localhost:3001/api/documents"
echo ""
echo "📋 Routes GED disponibles:"
echo "   GET  /api/documents          - Lister les documents"
echo "   POST /api/documents          - Créer un document"
echo "   GET  /api/documents/:id      - Récupérer un document"
echo "   PUT  /api/documents/:id      - Modifier un document"
echo "   DELETE /api/documents/:id    - Supprimer un document"
echo "   GET  /api/documents/labels   - Lister les labels"
echo "   POST /api/documents/labels   - Créer un label"
echo "   POST /api/documents/:id/favorite    - Ajouter aux favoris"
echo "   DELETE /api/documents/:id/favorite  - Retirer des favoris"
echo "   GET  /api/documents/favorites       - Récupérer les favoris"
echo ""

# Démarrer en mode développement
npm run dev 