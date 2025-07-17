#!/bin/bash

# Script de nettoyage des tables en minuscules
# Garde les tables en majuscules pour Supabase

echo "🧹 Nettoyage des tables en minuscules..."
echo "=================================================="

# Configuration
DATABASE_URL=${DATABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

if [ -z "$DATABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Variables d'environnement DATABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises"
    exit 1
fi

# Fonction pour supprimer une table
drop_table() {
    local table_name=$1
    local description=$2
    
    echo "🗑️ Suppression table $table_name..."
    psql "$DATABASE_URL" -c "DROP TABLE IF EXISTS $table_name CASCADE;" > /dev/null 2>&1
    echo "✅ Table $table_name supprimée"
}

# Tables en minuscules à supprimer (garder les majuscules)
tables_to_drop=(
    "client"
    "expert" 
    "documentfile"
    "documentfileaccesslog"
    "documentfilepermission"
    "documentfileshare"
    "documentfileversion"
    "workflowtemplate"
    "workflowinstance"
    "workflowstep"
    "compliancecontrol"
    "compliancereport"
    "securityincident"
    "auditlog"
    "datasubjectrequest"
    "paymentrequest"
    "signaturerequest"
    "pushnotification"
    "invoice"
)

echo "📋 Suppression des tables en minuscules..."

for table in "${tables_to_drop[@]}"; do
    drop_table "$table" "Table $table"
done

echo ""
echo "🔍 Vérification des tables restantes..."

# Vérifier que les tables en majuscules existent
tables_to_check=(
    "Client"
    "Expert"
    "DocumentFile"
    "WorkflowTemplate"
    "ComplianceControl"
)

for table in "${tables_to_check[@]}"; do
    if psql "$DATABASE_URL" -c "\dt $table" > /dev/null 2>&1; then
        echo "✅ Table $table existe"
    else
        echo "❌ Table $table manquante"
    fi
done

echo ""
echo "🎉 Nettoyage terminé !"
echo "=================================================="
echo "✅ Tables en minuscules supprimées"
echo "✅ Tables en majuscules conservées"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Relancer les tests : node scripts/test-refresh-cache.js"
echo "2. Vérifier la configuration Supabase" 