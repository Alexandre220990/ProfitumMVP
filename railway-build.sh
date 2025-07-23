#!/bin/bash

# ============================================================================
# SCRIPT DE BUILD RAILWAY - PROFITUM MVP
# ============================================================================

echo "🚀 Démarrage du build Railway..."

# Installer les dépendances du client
echo "📦 Installation des dépendances client..."
cd client
npm install
echo "🔨 Build du client..."
npm run build
echo "✅ Build client terminé"
cd ..

# Installer les dépendances du serveur
echo "📦 Installation des dépendances serveur..."
cd server
npm install
echo "🔨 Build du serveur..."
npm run build
echo "✅ Build serveur terminé"
cd ..

# ✅ COPIER LES FICHIERS DU CLIENT POUR LE SERVEUR
echo "📁 Copie des fichiers client pour le serveur..."
mkdir -p server/client/dist

# Vérifier que le build client existe
if [ ! -d "client/dist" ]; then
    echo "❌ ERREUR: Le dossier client/dist n'existe pas !"
    exit 1
fi

# Copier les fichiers
cp -r client/dist/* server/client/dist/
echo "✅ Fichiers client copiés vers server/client/dist/"

# Vérifier que les fichiers ont été copiés
if [ -f "server/client/dist/index.html" ]; then
    echo "✅ index.html trouvé dans server/client/dist/"
else
    echo "❌ ERREUR: index.html non trouvé dans server/client/dist/"
    exit 1
fi

echo "📋 Contenu du dossier server/client/dist/:"
ls -la server/client/dist/

echo "✅ Build terminé avec succès !" 