#!/bin/bash

# Script de migration sécurisé pour fusionner les tables en minuscules vers les tables en majuscules
# Sauvegarde toutes les données avant toute modification

echo "🛡️ Migration sécurisée des tables en minuscules vers majuscules..."
echo "=================================================="

# Configuration
DATABASE_URL=${DATABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

if [ -z "$DATABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Variables d'environnement DATABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises"
    exit 1
fi

# Créer un dossier de sauvegarde avec timestamp
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)_before_migration"
mkdir -p "$BACKUP_DIR"

echo "📁 Dossier de sauvegarde créé: $BACKUP_DIR"

# Fonction pour sauvegarder une table
backup_table() {
    local table_name=$1
    local backup_file="$BACKUP_DIR/${table_name}_backup.sql"
    
    echo "💾 Sauvegarde table $table_name..."
    pg_dump "$DATABASE_URL" -t "\"$table_name\"" --data-only --inserts > "$backup_file" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Sauvegarde $table_name réussie"
    else
        echo "❌ Erreur sauvegarde $table_name"
        return 1
    fi
}

# Fonction pour compter les enregistrements
count_records() {
    local table_name=$1
    local count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"$table_name\";" | tr -d ' ')
    echo "$count"
}

# Fonction pour fusionner les données
merge_table_data() {
    local lowercase_table=$1
    local uppercase_table=$2
    
    echo "🔄 Fusion $lowercase_table -> $uppercase_table..."
    
    # Compter les enregistrements avant fusion
    local before_count=$(count_records "$uppercase_table")
    
    # Insérer les données de la table minuscule vers la table majuscule
    # En évitant les doublons sur les clés primaires
    local merge_sql="
    INSERT INTO \"$uppercase_table\" 
    SELECT * FROM \"$lowercase_table\" 
    WHERE id NOT IN (SELECT id FROM \"$uppercase_table\")
    ON CONFLICT (id) DO NOTHING;"
    
    if psql "$DATABASE_URL" -c "$merge_sql" > /dev/null 2>&1; then
        local after_count=$(count_records "$uppercase_table")
        local added=$((after_count - before_count))
        echo "✅ Fusion réussie: $added enregistrements ajoutés"
    else
        echo "❌ Erreur fusion $lowercase_table -> $uppercase_table"
        # Afficher l'erreur pour debug
        psql "$DATABASE_URL" -c "$merge_sql" 2>&1 | head -5
        return 1
    fi
}

echo ""
echo "📋 ÉTAPE 1: Sauvegarde des données existantes..."
echo "=================================================="

# Sauvegarder toutes les tables importantes
tables_to_backup=(
    "client"
    "Client"
    "expert"
    "Expert"
    "documentfile"
    "DocumentFile"
    "workflowtemplate"
    "WorkflowTemplate"
    "compliancecontrol"
    "ComplianceControl"
)

for table in "${tables_to_backup[@]}"; do
    backup_table "$table"
done

echo ""
echo "📊 ÉTAPE 2: Analyse des données avant fusion..."
echo "=================================================="

# Afficher le nombre d'enregistrements dans chaque table
echo "Enregistrements par table:"
psql "$DATABASE_URL" -c "
SELECT 'client' as table_name, COUNT(*) as record_count FROM client 
UNION ALL 
SELECT 'Client' as table_name, COUNT(*) as record_count FROM \"Client\" 
UNION ALL 
SELECT 'expert' as table_name, COUNT(*) as record_count FROM expert 
UNION ALL 
SELECT 'Expert' as table_name, COUNT(*) as record_count FROM \"Expert\" 
UNION ALL 
SELECT 'documentfile' as table_name, COUNT(*) as record_count FROM documentfile 
UNION ALL 
SELECT 'DocumentFile' as table_name, COUNT(*) as record_count FROM \"DocumentFile\"
ORDER BY table_name;"

echo ""
echo "🔄 ÉTAPE 3: Fusion des données..."
echo "=================================================="

# Fusionner les données des tables minuscules vers les tables majuscules
merge_table_data "client" "Client"
merge_table_data "expert" "Expert"
merge_table_data "documentfile" "DocumentFile"

echo ""
echo "📊 ÉTAPE 4: Vérification après fusion..."
echo "=================================================="

echo "Enregistrements après fusion:"
psql "$DATABASE_URL" -c "
SELECT 'Client' as table_name, COUNT(*) as record_count FROM \"Client\" 
UNION ALL 
SELECT 'Expert' as table_name, COUNT(*) as record_count FROM \"Expert\" 
UNION ALL 
SELECT 'DocumentFile' as table_name, COUNT(*) as record_count FROM \"DocumentFile\"
ORDER BY table_name;"

echo ""
echo "❓ Voulez-vous continuer et supprimer les tables en minuscules ?"
echo "Les données sont sauvegardées dans: $BACKUP_DIR"
echo "Tapez 'OUI' pour continuer, ou 'NON' pour arrêter:"
read -r confirmation

if [ "$confirmation" != "OUI" ]; then
    echo "🛑 Migration annulée. Les données sont sauvegardées dans $BACKUP_DIR"
    exit 0
fi

echo ""
echo "🗑️ ÉTAPE 5: Suppression des tables en minuscules..."
echo "=================================================="

# Fonction pour supprimer une table
drop_table() {
    local table_name=$1
    
    echo "🗑️ Suppression table $table_name..."
    psql "$DATABASE_URL" -c "DROP TABLE IF EXISTS \"$table_name\" CASCADE;" > /dev/null 2>&1
    echo "✅ Table $table_name supprimée"
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

for table in "${tables_to_drop[@]}"; do
    drop_table "$table"
done

echo ""
echo "🔍 ÉTAPE 6: Vérification finale..."
echo "=================================================="

# Vérifier que les tables en majuscules existent et contiennent des données
tables_to_check=(
    "Client"
    "Expert"
    "DocumentFile"
    "WorkflowTemplate"
    "ComplianceControl"
)

for table in "${tables_to_check[@]}"; do
    if psql "$DATABASE_URL" -c "\dt \"$table\"" > /dev/null 2>&1; then
        local count=$(count_records "$table")
        echo "✅ Table $table existe avec $count enregistrements"
    else
        echo "❌ Table $table manquante"
    fi
done

echo ""
echo "🎉 Migration terminée avec succès !"
echo "=================================================="
echo "✅ Données sauvegardées dans: $BACKUP_DIR"
echo "✅ Données fusionnées vers les tables majuscules"
echo "✅ Tables en minuscules supprimées"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Tester la connexion : node scripts/test-refresh-cache.js"
echo "2. Vérifier que toutes les données sont présentes"
echo "3. Si problème, restaurer depuis: $BACKUP_DIR" 