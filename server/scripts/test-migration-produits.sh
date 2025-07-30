#!/bin/bash

# Script de test pour la migration des produits éligibles
# Usage: ./test-migration-produits.sh

set -e

echo "🚀 LANCEMENT DES TESTS DE MIGRATION DES PRODUITS ÉLIGIBLES"
echo "=========================================================="

# Vérifier que le serveur est en cours d'exécution
echo "🔍 Vérification du serveur..."
if ! curl -s https://profitummvp-production.up.railway.app/api/health > /dev/null 2>&1; then
    echo "❌ Le serveur n'est pas accessible sur https://profitummvp-production.up.railway.app"
    echo "   Vérifiez que le serveur est déployé sur Railway"
    exit 1
fi

echo "✅ Serveur accessible"

# Vérifier les dépendances
echo "🔍 Vérification des dépendances..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

echo "✅ Dépendances OK"

# Aller dans le répertoire du serveur
cd "$(dirname "$0")/.."

# Compiler TypeScript si nécessaire
echo "🔧 Compilation TypeScript..."
if [ ! -d "dist" ] || [ "$(find src -newer dist 2>/dev/null | wc -l)" -gt 0 ]; then
    echo "   Compilation nécessaire..."
    npm run build
else
    echo "   Compilation à jour"
fi

# Lancer les tests
echo "🧪 Lancement des tests de migration..."
echo ""

# Exécuter le script de test
node -r ts-node/register src/scripts/test-migration-produits.ts

echo ""
echo "🎉 Tests terminés"
echo "📊 Consultez les logs ci-dessus pour les résultats détaillés" 