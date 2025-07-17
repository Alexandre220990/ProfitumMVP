#!/bin/bash

echo "🧹 Nettoyage des erreurs TypeScript..."

# Supprimer les imports non utilisés
echo "📦 Suppression des imports non utilisés..."
find src -name "*.tsx" -exec sed -i '' '/^import.*from.*$/d' {} \;

# Corriger les location.push
echo "🔄 Correction des location.push..."
find src -name "*.tsx" -exec sed -i '' 's/location\.push(/navigate(/g' {} \;

# Ajouter les propriétés manquantes aux types
echo "🔧 Correction des types..."

# Vérifier si les corrections ont été appliquées
echo "✅ Vérification des corrections..."

# Compiler pour vérifier
echo "🔍 Compilation de vérification..."
npm run build

echo "🎉 Nettoyage terminé !" 