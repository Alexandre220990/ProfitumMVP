#!/bin/bash

echo "🚀 Déploiement de la migration vers le système DossierStep..."

# Variables
PROJECT_DIR="/Users/alex/Desktop/FinancialTracker"
SERVER_DIR="$PROJECT_DIR/server"
CLIENT_DIR="$PROJECT_DIR/client"

echo "📁 Répertoire du projet: $PROJECT_DIR"

# 1. Vérifier que nous sommes dans le bon répertoire
if [ ! -d "$SERVER_DIR" ]; then
    echo "❌ Répertoire serveur non trouvé: $SERVER_DIR"
    exit 1
fi

echo "✅ Répertoire serveur trouvé"

# 2. Aller dans le répertoire serveur
cd "$SERVER_DIR"

echo "📂 Changement vers le répertoire serveur: $(pwd)"

# 3. Vérifier que le serveur fonctionne
echo "🔍 Vérification du serveur..."
if ! curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
    echo "❌ Le serveur ne répond pas. Démarrage du serveur..."
    nohup npm start > server.log 2>&1 &
    SERVER_PID=$!
    sleep 5
    
    if ! curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
        echo "❌ Impossible de démarrer le serveur"
        exit 1
    fi
    echo "✅ Serveur démarré (PID: $SERVER_PID)"
else
    echo "✅ Serveur déjà en cours d'exécution"
fi

# 4. Exécuter la migration SQL
echo "🗄️ Exécution de la migration SQL..."
psql $DATABASE_URL -f scripts/migrate-to-dossier-steps.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration SQL terminée"
else
    echo "❌ Erreur lors de la migration SQL"
    exit 1
fi

# 5. Générer automatiquement les étapes pour tous les dossiers éligibles
echo "🔧 Génération automatique des étapes..."
GENERATION_RESPONSE=$(curl -s -X POST http://localhost:5001/api/dossier-steps/generate-all)

if echo "$GENERATION_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Génération automatique réussie"
    echo "📊 Résultats:"
    echo "$GENERATION_RESPONSE" | jq '.data' 2>/dev/null || echo "$GENERATION_RESPONSE"
else
    echo "❌ Erreur lors de la génération automatique"
    echo "📋 Réponse: $GENERATION_RESPONSE"
    exit 1
fi

# 6. Test de récupération des étapes pour un dossier
echo "🧪 Test de récupération des étapes..."
# Récupérer un dossier existant pour le test
DOSSIER_ID=$(psql $DATABASE_URL -t -c "SELECT id FROM \"ClientProduitEligible\" WHERE statut IN ('eligible', 'en_cours') LIMIT 1;" | xargs)

if [ -n "$DOSSIER_ID" ]; then
    echo "📋 Test avec le dossier: $DOSSIER_ID"
    
    STEPS_RESPONSE=$(curl -s "http://localhost:5001/api/dossier-steps/$DOSSIER_ID")
    
    if echo "$STEPS_RESPONSE" | grep -q '"success":true'; then
        echo "✅ Récupération des étapes réussie"
        STEPS_COUNT=$(echo "$STEPS_RESPONSE" | jq '.data | length' 2>/dev/null || echo "0")
        echo "📊 Nombre d'étapes récupérées: $STEPS_COUNT"
    else
        echo "❌ Erreur lors de la récupération des étapes"
        echo "📋 Réponse: $STEPS_RESPONSE"
    fi
else
    echo "⚠️ Aucun dossier éligible trouvé pour le test"
fi

# 7. Vérification de la cohérence des données
echo "🔍 Vérification de la cohérence des données..."
COHERENCE_RESPONSE=$(curl -s http://localhost:5001/api/diagnostic/tables)

if echo "$COHERENCE_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Diagnostic de cohérence réussi"
    echo "📊 État des tables:"
    echo "$COHERENCE_RESPONSE" | jq '.data' 2>/dev/null || echo "$COHERENCE_RESPONSE"
else
    echo "❌ Erreur lors du diagnostic"
    echo "📋 Réponse: $COHERENCE_RESPONSE"
fi

# 8. Statistiques finales
echo "📈 Statistiques finales..."
STATS_RESPONSE=$(psql $DATABASE_URL -t -c "
SELECT 
    'Dossiers éligibles' as type,
    COUNT(*) as count
FROM \"ClientProduitEligible\" 
WHERE statut IN ('eligible', 'en_cours', 'termine')
UNION ALL
SELECT 
    'Étapes générées' as type,
    COUNT(*) as count
FROM \"DossierStep\"
UNION ALL
SELECT 
    'Étapes complétées' as type,
    COUNT(*) as count
FROM \"DossierStep\"
WHERE status = 'completed';
")

echo "$STATS_RESPONSE"

echo ""
echo "🎉 Migration vers DossierStep terminée avec succès!"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Intégrer useDossierSteps dans les pages frontend"
echo "  2. Remplacer current_step/progress par les données DossierStep"
echo "  3. Tester la cohérence entre toutes les pages"
echo "  4. Optimiser les performances des requêtes"
echo ""
echo "🔍 Commandes utiles:"
echo "  curl http://localhost:5001/api/dossier-steps/generate-all"
echo "  curl http://localhost:5001/api/dossier-steps/{dossier_id}"
echo "  curl http://localhost:5001/api/diagnostic/tables"
echo ""
echo "📋 Logs du serveur:"
echo "  tail -f server.log" 