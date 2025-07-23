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
npm install
echo "🔨 Build du serveur..."
npm run build
echo "✅ Build serveur terminé"
cd ..

# ✅ CRÉER UN DOSSIER CLIENT VIDE POUR ÉVITER LES ERREURS
echo "📁 Création d'un dossier client minimal..."
mkdir -p server/client/dist
echo "<!DOCTYPE html><html><head><title>Profitum</title></head><body><h1>Profitum API</h1></body></html>" > server/client/dist/index.html
echo "✅ Dossier client minimal créé"

echo "✅ Build terminé avec succès !" 