#!/bin/bash

# Script pour corriger les structures de tables et tester la migration
# Date: 2025-01-27

echo "🔧 CORRECTION DES STRUCTURES DE TABLES ET TEST DE MIGRATION"
echo "=========================================================="

# 1. Vérifier les variables d'environnement
echo ""
echo "1️⃣ Vérification des variables d'environnement..."

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Variables d'environnement manquantes"
    echo "   SUPABASE_URL: $SUPABASE_URL"
    echo "   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:10}..."
    exit 1
fi

echo "✅ Variables d'environnement OK"

# 2. Analyser les structures actuelles
echo ""
echo "2️⃣ Analyse des structures actuelles..."

# Exécuter le script d'analyse
echo "📊 Analyse des structures de tables..."
psql "$SUPABASE_URL" -f scripts/analyze-table-structures.sql

if [ $? -eq 0 ]; then
    echo "✅ Analyse terminée"
else
    echo "❌ Erreur lors de l'analyse"
    exit 1
fi

# 3. Corriger les structures
echo ""
echo "3️⃣ Correction des structures de tables..."

echo "🔧 Application des corrections..."
psql "$SUPABASE_URL" -f scripts/fix-table-structures.sql

if [ $? -eq 0 ]; then
    echo "✅ Corrections appliquées"
else
    echo "❌ Erreur lors des corrections"
    exit 1
fi

# 4. Vérifier les produits et créer le mapping
echo ""
echo "4️⃣ Vérification des produits et mapping..."

echo "🔍 Vérification du mapping des produits..."
node check-products-mapping.js

if [ $? -eq 0 ]; then
    echo "✅ Mapping vérifié"
else
    echo "❌ Erreur lors de la vérification du mapping"
    exit 1
fi

# 5. Test de migration avec structure corrigée
echo ""
echo "5️⃣ Test de migration avec structure corrigée..."

echo "🧪 Test de migration..."
node test-migration-with-fixed-structure.js

if [ $? -eq 0 ]; then
    echo "✅ Test de migration terminé"
else
    echo "❌ Erreur lors du test de migration"
    exit 1
fi

# 6. Test final complet
echo ""
echo "6️⃣ Test final complet..."

echo "🎯 Test final de migration..."
node test-simple-migration-detailed.js

if [ $? -eq 0 ]; then
    echo "✅ Test final réussi"
else
    echo "❌ Erreur lors du test final"
    exit 1
fi

echo ""
echo "🎉 CORRECTION ET TESTS TERMINÉS AVEC SUCCÈS !"
echo "✅ Structures de tables corrigées"
echo "✅ Mapping des produits vérifié"
echo "✅ Migration simplifiée fonctionnelle"
echo "✅ Tests complets validés"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Déployer les modifications sur Railway"
echo "   2. Tester en production"
echo "   3. Vérifier l'affichage des produits sur le dashboard client" 