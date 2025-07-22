#!/bin/bash

# Script pour appliquer la migration de session temporaire
# Ajoute la colonne sessionId à ClientProduitEligible et crée la table TemporarySimulationSession

set -e

echo "🚀 Application de la migration de session temporaire..."

# Vérifier les variables d'environnement
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Variable DATABASE_URL non définie"
    exit 1
fi

# Chemin vers le fichier de migration
MIGRATION_FILE="server/migrations/20250127_add_session_id_to_client_produit_eligible.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Fichier de migration non trouvé: $MIGRATION_FILE"
    exit 1
fi

echo "📁 Fichier de migration trouvé: $MIGRATION_FILE"

# Appliquer la migration
echo "🔄 Application de la migration..."
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Migration appliquée avec succès !"
    echo ""
    echo "📊 Résumé des modifications :"
    echo "   - Colonne sessionId ajoutée à ClientProduitEligible"
    echo "   - Table TemporarySimulationSession créée"
    echo "   - Index et contraintes ajoutés"
    echo "   - Fonctions de nettoyage automatique créées"
    echo ""
    echo "🎯 Prochaines étapes :"
    echo "   1. Redémarrer le serveur pour charger les nouvelles routes"
    echo "   2. Tester la création de sessions temporaires"
    echo "   3. Tester la migration vers des comptes clients"
else
    echo "❌ Erreur lors de l'application de la migration"
    exit 1
fi

echo ""
echo "🧪 Pour tester la migration, exécutez :"
echo "   cd server && node scripts/test-session-migration.js"
echo ""
echo "🎉 Migration terminée avec succès !" 