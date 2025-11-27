#!/bin/sh
# ============================================================================
# RAILWAY BUILD SCRIPT - PROFITUM MVP
# ============================================================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Démarrage du build Railway..."

# 1. Installer les dépendances de dev (nécessaires pour la compilation)
echo "📦 Installation des dépendances de développement..."
npm install --include=dev typescript @types/node @types/express

# 2. Compiler le TypeScript
echo "🔨 Compilation du TypeScript..."
npm run build

# 3. Vérifier que le build a réussi
if [ -d "dist" ]; then
    echo "✅ Build TypeScript réussi - dossier dist/ créé"
    
    # Lister les fichiers principaux
    echo "📋 Fichiers compilés:"
    ls -lh dist/ | head -20
else
    echo "❌ ERREUR: Dossier dist/ non créé après le build"
    exit 1
fi

# 4. Vérifier les fichiers critiques
for file in "dist/index.js" "dist/routes/simulator.js" "dist/routes/client-simulation.js"; do
    if [ -f "$file" ]; then
        echo "✅ $file existe"
    else
        echo "❌ ERREUR: $file manquant"
        exit 1
    fi
done

echo "✅ Build Railway terminé avec succès!"

