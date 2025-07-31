#!/bin/bash

echo "🚀 Exécution de la correction sur la base de production Railway..."

# Remplacez cette URL par votre vraie URL de connexion Railway
# Vous pouvez la trouver dans Railway Dashboard > Votre DB > Connect > Variables
RAILWAY_DB_URL="postgresql://postgres:password@your-railway-host:5432/your-db-name"

echo "📊 Exécution du script de correction..."
psql "$RAILWAY_DB_URL" -f fix-production-database.sql

echo "✅ Script exécuté ! Vérifiez les résultats ci-dessus."
echo "🔄 Redémarrez votre application Railway si nécessaire." 