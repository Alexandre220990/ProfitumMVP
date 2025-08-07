#!/bin/bash

echo "🚀 Forçage du redéploiement sur Railway..."

# Vérifier si Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI n'est pas installé"
    echo "Installez-le avec: npm install -g @railway/cli"
    exit 1
fi

# Se connecter à Railway
echo "📋 Connexion à Railway..."
railway login

# Lister les projets
echo "📋 Projets disponibles:"
railway projects

# Redéployer le projet
echo "🚀 Redéploiement en cours..."
railway up

echo "✅ Redéploiement terminé"
echo "🔍 Vérifiez le statut sur: https://railway.app/dashboard"
