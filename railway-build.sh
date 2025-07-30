#!/bin/bash

# ============================================================================
# SCRIPT DE BUILD RAILWAY - PROFITUM MVP
# ============================================================================

# Configuration mémoire pour Railway 8GB
export NODE_OPTIONS="--max-old-space-size=6144"

echo "🚀 Démarrage du build Railway..."
echo "💾 Mémoire allouée: 6GB (sur 8GB disponibles)"

# Installer les dépendances du serveur uniquement
echo "📦 Installation des dépendances serveur..."
cd server
npm install --verbose
echo "✅ Dépendances installées"

# Vérifier que TypeScript est installé
echo "🔍 Vérification TypeScript..."
npx tsc --version
echo "✅ TypeScript disponible"

# Build du serveur avec plus de détails
echo "🔨 Build du serveur..."
npm run build --verbose
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du build TypeScript"
    echo "🔍 Affichage des erreurs TypeScript..."
    npx tsc --noEmit --listFiles
    exit 1
fi
echo "✅ Build serveur terminé"
cd ..

# ✅ CRÉER UN DOSSIER CLIENT VIDE POUR ÉVITER LES ERREURS
echo "📁 Création d'un dossier client minimal..."
mkdir -p server/client/dist
echo "<!DOCTYPE html><html><head><title>Profitum</title></head><body><h1>Profitum API</h1></body></html>" > server/client/dist/index.html
echo "✅ Dossier client minimal créé"

# Vérifier que le build a créé les fichiers nécessaires
echo "🔍 Vérification des fichiers buildés..."
if [ -f "server/dist/index.js" ]; then
    echo "✅ Fichier principal buildé: server/dist/index.js"
else
    echo "❌ Fichier principal manquant: server/dist/index.js"
    exit 1
fi

echo "✅ Build terminé avec succès !" 