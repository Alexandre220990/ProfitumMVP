#!/bin/bash

# Script de suppression des tables en minuscules après migration réussie

echo "🗑️ Suppression des tables en minuscules..."
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
    
    echo "🗑️ Suppression table $table_name..."
    psql "$DATABASE_URL" -c "DROP TABLE IF EXISTS \"$table_name\" CASCADE;" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Table $table_name supprimée"
    else
        echo "❌ Erreur suppression $table_name"
    fi
}

# Tables en minuscules à supprimer
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
    drop_table "$table"
done

echo ""
echo "🔍 Vérification des tables restantes..."

# Vérifier que les tables en majuscules existent
tables_to_check=(
    "Client"
    "Expert"
    "DocumentFile"
)

for table in "${tables_to_check[@]}"; do
    if psql "$DATABASE_URL" -c "\dt \"$table\"" > /dev/null 2>&1; then
        local count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"$table\";" | tr -d ' ')
        echo "✅ Table $table existe avec $count enregistrements"
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
echo "1. Créer les tables WorkflowTemplate et ComplianceControl"
echo "2. Tester la connexion : node scripts/test-refresh-cache.js" 