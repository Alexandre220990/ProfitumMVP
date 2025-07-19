#!/bin/bash

# ============================================================================
# SCRIPT DE BUILD RAILWAY - PROFITUM MVP
# ============================================================================

echo "🚀 Démarrage du build Railway..."

# Installer les dépendances du client
echo "📦 Installation des dépendances client..."
cd client
npm install
npm run build
cd ..

# Installer les dépendances du serveur
echo "📦 Installation des dépendances serveur..."
cd server
npm install
npm run build
cd ..

echo "✅ Build terminé avec succès !" 