#!/bin/bash

# Script pour appliquer la correction de la table Notification
# Date: 2025-01-03

echo "🔧 Application de la correction de la table Notification..."

# Variables
SUPABASE_URL="https://gvvlsgtubqfxdztldunj.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxnc3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU0OTMzNywiZXhwIjoyMDU1MTI1MzM3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8"

# Vérifier que les variables d'environnement sont définies
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Variables d'environnement Supabase manquantes"
    exit 1
fi

# Lire le contenu de la migration
MIGRATION_SQL=$(cat server/migrations/20250103_fix_notification_structure.sql)

echo "📋 Contenu de la migration:"
echo "$MIGRATION_SQL"
echo ""

# Appliquer la migration via l'API Supabase
echo "🚀 Application de la migration..."

curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"sql\": $(echo "$MIGRATION_SQL" | jq -R -s .)
  }"

echo ""
echo "✅ Migration appliquée avec succès !"
echo ""
echo "🔍 Vérification de la structure de la table..."

# Vérifier la structure de la table
curl -X GET \
  "${SUPABASE_URL}/rest/v1/Notification?select=*&limit=1" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"

echo ""
echo "🎉 Correction terminée !" 