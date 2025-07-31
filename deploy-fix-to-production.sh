#!/bin/bash

# Script pour déployer la correction client sur la production
echo "🚀 Déploiement de la correction client sur la production..."

# Variables d'environnement (à adapter selon votre configuration)
PRODUCTION_DB_URL="postgresql://postgres:password@your-railway-db-url:5432/your-db-name"

# 1. Exécuter le diagnostic sur la production
echo "📊 Diagnostic de la production..."
psql "$PRODUCTION_DB_URL" -f server/scripts/diagnose-client-simple.sql

# 2. Appliquer la correction sur la production
echo "🔧 Application de la correction..."
psql "$PRODUCTION_DB_URL" -f server/scripts/fix-client-issue-ultimate.sql

# 3. Vérifier que la correction a été appliquée
echo "✅ Vérification de la correction..."
psql "$PRODUCTION_DB_URL" -c "
SELECT 
    'VERIFICATION_PRODUCTION' as section,
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'wamuchacha@gmail.com') THEN '✅ Utilisateur auth OK'
        ELSE '❌ Utilisateur auth manquant'
    END as auth_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM \"Client\" WHERE email = 'wamuchacha@gmail.com') THEN '✅ Client OK'
        ELSE '❌ Client manquant'
    END as client_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM \"ClientProduitEligible\" cpe JOIN \"Client\" c ON cpe.\"clientId\" = c.id WHERE c.email = 'wamuchacha@gmail.com') THEN '✅ Produits éligibles OK'
        ELSE '❌ Aucun produit éligible'
    END as produits_status;
"

echo "🎉 Déploiement terminé !" 