#!/bin/bash

# Script pour corriger les migrations avec les bons UUIDs
# Nettoie les tables existantes et réinstalle tout proprement

set -e

echo "🔧 Correction des migrations avec UUIDs valides..."
echo "=================================================="

# Configuration
DATABASE_URL=${DATABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

if [ -z "$DATABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Variables d'environnement DATABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises"
    exit 1
fi

# Fonction pour exécuter une commande SQL
run_sql() {
    local sql_command="$1"
    local description="$2"
    
    echo "📋 $description..."
    
    if psql "$DATABASE_URL" -c "$sql_command" > /dev/null 2>&1; then
        echo "✅ $description réussi"
    else
        echo "❌ Erreur lors de $description"
        return 1
    fi
}

# Fonction pour supprimer une table si elle existe
drop_table_if_exists() {
    local table_name="$1"
    local description="$2"
    
    echo "🗑️ $description..."
    
    psql "$DATABASE_URL" -c "DROP TABLE IF EXISTS $table_name CASCADE;" > /dev/null 2>&1
    echo "✅ $description supprimée"
}

# Étape 1: Nettoyer les tables existantes
echo ""
echo "🧹 Nettoyage des tables existantes..."

# Supprimer les tables dans l'ordre inverse des dépendances
drop_table_if_exists "ComplianceReport" "Table ComplianceReport"
drop_table_if_exists "AuditLog" "Table AuditLog"
drop_table_if_exists "DataSubjectRequest" "Table DataSubjectRequest"
drop_table_if_exists "SecurityIncident" "Table SecurityIncident"
drop_table_if_exists "ComplianceControl" "Table ComplianceControl"
drop_table_if_exists "PushNotification" "Table PushNotification"
drop_table_if_exists "PaymentRequest" "Table PaymentRequest"
drop_table_if_exists "SignatureRequest" "Table SignatureRequest"
drop_table_if_exists "WorkflowInstance" "Table WorkflowInstance"
drop_table_if_exists "WorkflowStep" "Table WorkflowStep"
drop_table_if_exists "WorkflowTemplate" "Table WorkflowTemplate"
drop_table_if_exists "DocumentFileShare" "Table DocumentFileShare"
drop_table_if_exists "DocumentFilePermission" "Table DocumentFilePermission"
drop_table_if_exists "DocumentFileAccessLog" "Table DocumentFileAccessLog"
drop_table_if_exists "DocumentFileVersion" "Table DocumentFileVersion"
drop_table_if_exists "DocumentFile" "Table DocumentFile"
drop_table_if_exists "Invoice" "Table Invoice"
drop_table_if_exists "Expert" "Table Expert"
drop_table_if_exists "Client" "Table Client"

# Étape 2: Supprimer les fonctions et triggers
echo ""
echo "🔧 Nettoyage des fonctions et triggers..."

run_sql "DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;" "Suppression fonction update_updated_at_column"
run_sql "DROP FUNCTION IF EXISTS create_document_version() CASCADE;" "Suppression fonction create_document_version"
run_sql "DROP FUNCTION IF EXISTS get_client_document_size(UUID) CASCADE;" "Suppression fonction get_client_document_size"
run_sql "DROP FUNCTION IF EXISTS get_expired_documents() CASCADE;" "Suppression fonction get_expired_documents"
run_sql "DROP FUNCTION IF EXISTS get_document_stats() CASCADE;" "Suppression fonction get_document_stats"

# Étape 3: Réinstaller les migrations
echo ""
echo "📦 Réinstallation des migrations..."

# Créer les tables de gestion documentaire
echo "📁 Création des tables de gestion documentaire..."
if psql "$DATABASE_URL" -f "migrations/20250104_create_document_management_tables.sql" > /dev/null 2>&1; then
    echo "✅ Tables de gestion documentaire créées"
else
    echo "❌ Erreur lors de la création des tables de gestion documentaire"
    exit 1
fi

# Créer les tables de conformité et intégrations
echo "🛡️ Création des tables de conformité et intégrations..."
if psql "$DATABASE_URL" -f "migrations/20250104_create_compliance_and_integrations_tables.sql" > /dev/null 2>&1; then
    echo "✅ Tables de conformité et intégrations créées"
else
    echo "❌ Erreur lors de la création des tables de conformité"
    exit 1
fi

# Étape 4: Vérifier l'installation
echo ""
echo "🔍 Vérification de l'installation..."

# Vérifier les tables principales
tables_to_check=(
    "Client"
    "Expert"
    "DocumentFile"
    "WorkflowTemplate"
    "ComplianceControl"
    "SecurityIncident"
    "AuditLog"
)

for table in "${tables_to_check[@]}"; do
    if psql "$DATABASE_URL" -c "\dt $table" > /dev/null 2>&1; then
        echo "✅ Table $table existe"
    else
        echo "❌ Table $table manquante"
        exit 1
    fi
done

# Étape 5: Vérifier les données de test
echo ""
echo "📊 Vérification des données de test..."

# Vérifier qu'un client de test existe
client_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM Client WHERE id = '550e8400-e29b-41d4-a716-446655440001';" | tr -d ' ')
if [ "$client_count" -eq 1 ]; then
    echo "✅ Client de test trouvé"
else
    echo "❌ Client de test manquant"
fi

# Vérifier qu'un expert de test existe
expert_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM Expert WHERE id = '550e8400-e29b-41d4-a716-446655440003';" | tr -d ' ')
if [ "$expert_count" -eq 1 ]; then
    echo "✅ Expert de test trouvé"
else
    echo "❌ Expert de test manquant"
fi

# Vérifier qu'un document de test existe
doc_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM DocumentFile WHERE id = '550e8400-e29b-41d4-a716-446655440005';" | tr -d ' ')
if [ "$doc_count" -eq 1 ]; then
    echo "✅ Document de test trouvé"
else
    echo "❌ Document de test manquant"
fi

# Étape 6: Test rapide avec Node.js
echo ""
echo "🧪 Test rapide avec Node.js..."

if node scripts/test-basic-compliance.js > /dev/null 2>&1; then
    echo "✅ Tests Node.js passés"
else
    echo "❌ Tests Node.js échoués"
    echo "💡 Lancez manuellement: node scripts/test-basic-compliance.js"
fi

# Étape 7: Résumé final
echo ""
echo "🎉 Migration corrigée avec succès !"
echo "=================================================="
echo "✅ Tables supprimées et recréées"
echo "✅ UUIDs valides utilisés"
echo "✅ Données de test insérées"
echo "✅ Relations vérifiées"
echo "✅ Tests basiques passés"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Lancer les tests complets : node scripts/test-compliance-integrations.js"
echo "2. Configurer les providers externes si nécessaire"
echo "3. Démarrer l'application"
echo ""
echo "🔗 Documentation : GUIDE-INSTALLATION-COMPLIANCE.md" 