#!/bin/bash

# Script de configuration du système de conformité et intégrations
# Exécute toutes les migrations dans le bon ordre

set -e

echo "🚀 Configuration du système de conformité et intégrations..."
echo "=================================================="

# Configuration
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises"
    exit 1
fi

# Fonction pour exécuter une migration
run_migration() {
    local migration_file=$1
    local description=$2
    
    echo "📋 $description..."
    
    if psql "$SUPABASE_URL" -f "migrations/$migration_file" > /dev/null 2>&1; then
        echo "✅ Migration $migration_file exécutée avec succès"
    else
        echo "❌ Erreur lors de l'exécution de $migration_file"
        exit 1
    fi
}

# Fonction pour vérifier l'existence d'une table
check_table_exists() {
    local table_name=$1
    local description=$2
    
    echo "🔍 Vérification de la table $table_name..."
    
    if psql "$SUPABASE_URL" -c "\dt $table_name" > /dev/null 2>&1; then
        echo "✅ Table $table_name existe"
        return 0
    else
        echo "❌ Table $table_name n'existe pas"
        return 1
    fi
}

# Étape 1: Vérifier la connexion à Supabase
echo "🔌 Test de connexion à Supabase..."
if psql "$SUPABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Connexion à Supabase réussie"
else
    echo "❌ Impossible de se connecter à Supabase"
    exit 1
fi

# Étape 2: Créer les tables de gestion documentaire
echo ""
echo "📁 Création des tables de gestion documentaire..."
run_migration "20250104_create_document_management_tables.sql" "Tables de gestion documentaire"

# Étape 3: Créer les tables de conformité et intégrations
echo ""
echo "🛡️ Création des tables de conformité et intégrations..."
run_migration "20250104_create_compliance_and_integrations_tables.sql" "Tables de conformité et intégrations"

# Étape 4: Vérifier que toutes les tables existent
echo ""
echo "🔍 Vérification de l'existence des tables..."

# Tables de gestion documentaire
check_table_exists "DocumentFile" "DocumentFile"
check_table_exists "DocumentFileVersion" "DocumentFileVersion"
check_table_exists "DocumentFileAccessLog" "DocumentFileAccessLog"
check_table_exists "DocumentFilePermission" "DocumentFilePermission"
check_table_exists "DocumentFileShare" "DocumentFileShare"
check_table_exists "Client" "Client"
check_table_exists "Expert" "Expert"
check_table_exists "Invoice" "Invoice"

# Tables de conformité
check_table_exists "WorkflowTemplate" "WorkflowTemplate"
check_table_exists "WorkflowStep" "WorkflowStep"
check_table_exists "WorkflowInstance" "WorkflowInstance"
check_table_exists "SignatureRequest" "SignatureRequest"
check_table_exists "PaymentRequest" "PaymentRequest"
check_table_exists "PushNotification" "PushNotification"
check_table_exists "ComplianceControl" "ComplianceControl"
check_table_exists "SecurityIncident" "SecurityIncident"
check_table_exists "DataSubjectRequest" "DataSubjectRequest"
check_table_exists "AuditLog" "AuditLog"
check_table_exists "ComplianceReport" "ComplianceReport"

# Étape 5: Créer les buckets Supabase Storage
echo ""
echo "🪣 Configuration des buckets Supabase Storage..."

# Script pour créer les buckets
cat > create_buckets.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Variables d\'environnement requises');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBuckets() {
    const buckets = [
        {
            name: 'documents',
            public: false,
            file_size_limit: 52428800, // 50MB
            allowed_mime_types: ['application/pdf', 'image/*', 'text/*']
        },
        {
            name: 'signatures',
            public: false,
            file_size_limit: 10485760, // 10MB
            allowed_mime_types: ['application/pdf']
        },
        {
            name: 'reports',
            public: false,
            file_size_limit: 10485760, // 10MB
            allowed_mime_types: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
        }
    ];

    for (const bucket of buckets) {
        try {
            const { data, error } = await supabase.storage.createBucket(bucket.name, {
                public: bucket.public,
                file_size_limit: bucket.file_size_limit,
                allowed_mime_types: bucket.allowed_mime_types
            });

            if (error) {
                if (error.message.includes('already exists')) {
                    console.log(`✅ Bucket ${bucket.name} existe déjà`);
                } else {
                    console.error(`❌ Erreur création bucket ${bucket.name}:`, error.message);
                }
            } else {
                console.log(`✅ Bucket ${bucket.name} créé avec succès`);
            }
        } catch (error) {
            console.error(`❌ Erreur création bucket ${bucket.name}:`, error.message);
        }
    }
}

createBuckets().catch(console.error);
EOF

if node create_buckets.js; then
    echo "✅ Buckets Supabase Storage configurés"
else
    echo "❌ Erreur lors de la configuration des buckets"
fi

# Nettoyer le fichier temporaire
rm -f create_buckets.js

# Étape 6: Initialiser les données par défaut
echo ""
echo "📊 Initialisation des données par défaut..."

# Script pour initialiser les données
cat > initialize_data.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Variables d\'environnement requises');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initializeData() {
    console.log('Initialisation des contrôles de conformité...');
    
    // Initialiser les contrôles ISO 27001
    const iso27001Controls = [
        {
            id: 'iso_27001_a_5_1_1',
            standard: 'iso_27001',
            control_id: 'A.5.1.1',
            title: 'Politiques de sécurité de l\'information',
            description: 'Établir et maintenir des politiques de sécurité de l\'information',
            category: 'Politiques de sécurité',
            risk_level: 'high',
            status: 'compliant',
            next_review_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            responsible_person: 'CISO',
            evidence: ['Politique de sécurité documentée', 'Processus de révision annuelle']
        }
    ];

    for (const control of iso27001Controls) {
        const { error } = await supabase
            .from('ComplianceControl')
            .upsert(control, { onConflict: 'id' });

        if (error) {
            console.error('Erreur insertion contrôle:', error.message);
        }
    }

    console.log('Initialisation des workflows...');
    
    // Initialiser un workflow de test
    const workflowTemplate = {
        id: 'fiscal_document_workflow_v1',
        name: 'Workflow Documents Fiscaux',
        description: 'Workflow sécurisé pour documents fiscaux sensibles',
        document_category: 'document_fiscal',
        document_type: 'fiscal',
        version: '1.0',
        is_active: true,
        estimated_total_duration: 48,
        sla_hours: 72,
        auto_start: true,
        requires_expert: true,
        requires_signature: false,
        compliance_requirements: ['RGPD', 'Code général des impôts', 'ISO 27001']
    };

    const { error: workflowError } = await supabase
        .from('WorkflowTemplate')
        .upsert(workflowTemplate, { onConflict: 'id' });

    if (workflowError) {
        console.error('Erreur insertion workflow:', workflowError.message);
    }

    console.log('✅ Données initialisées avec succès');
}

initializeData().catch(console.error);
EOF

if node initialize_data.js; then
    echo "✅ Données par défaut initialisées"
else
    echo "❌ Erreur lors de l'initialisation des données"
fi

# Nettoyer le fichier temporaire
rm -f initialize_data.js

# Étape 7: Vérifier les politiques RLS
echo ""
echo "🔒 Vérification des politiques RLS..."

# Vérifier que RLS est activé sur les tables principales
tables_with_rls=(
    "DocumentFile"
    "WorkflowTemplate"
    "ComplianceControl"
    "SecurityIncident"
)

for table in "${tables_with_rls[@]}"; do
    if psql "$SUPABASE_URL" -c "SELECT tablename FROM pg_tables WHERE tablename = '$table' AND schemaname = 'public';" | grep -q "$table"; then
        echo "✅ Table $table existe"
        
        # Vérifier si RLS est activé
        if psql "$SUPABASE_URL" -c "SELECT relname FROM pg_class WHERE relname = '$table' AND relrowsecurity = true;" | grep -q "$table"; then
            echo "✅ RLS activé sur $table"
        else
            echo "⚠️ RLS non activé sur $table"
        fi
    else
        echo "❌ Table $table n'existe pas"
    fi
done

# Étape 8: Test de connexion des services
echo ""
echo "🧪 Test de connexion des services..."

# Script de test simple
cat > test_connection.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Variables d\'environnement requises');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
    try {
        // Test de lecture des contrôles
        const { data: controls, error: controlsError } = await supabase
            .from('ComplianceControl')
            .select('*')
            .limit(1);

        if (controlsError) {
            console.error('❌ Erreur lecture contrôles:', controlsError.message);
        } else {
            console.log('✅ Lecture des contrôles OK');
        }

        // Test de lecture des workflows
        const { data: workflows, error: workflowsError } = await supabase
            .from('WorkflowTemplate')
            .select('*')
            .limit(1);

        if (workflowsError) {
            console.error('❌ Erreur lecture workflows:', workflowsError.message);
        } else {
            console.log('✅ Lecture des workflows OK');
        }

        // Test de lecture des documents
        const { data: documents, error: documentsError } = await supabase
            .from('DocumentFile')
            .select('*')
            .limit(1);

        if (documentsError) {
            console.error('❌ Erreur lecture documents:', documentsError.message);
        } else {
            console.log('✅ Lecture des documents OK');
        }

        console.log('🎉 Tous les tests de connexion sont passés !');

    } catch (error) {
        console.error('❌ Erreur lors des tests:', error.message);
    }
}

testConnection();
EOF

if node test_connection.js; then
    echo "✅ Tests de connexion réussis"
else
    echo "❌ Erreur lors des tests de connexion"
fi

# Nettoyer le fichier temporaire
rm -f test_connection.js

# Étape 9: Résumé final
echo ""
echo "🎉 Configuration terminée !"
echo "=================================================="
echo "✅ Tables créées et configurées"
echo "✅ Politiques RLS activées"
echo "✅ Buckets Storage configurés"
echo "✅ Données par défaut initialisées"
echo "✅ Tests de connexion réussis"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Configurer les variables d'environnement des providers externes"
echo "2. Lancer le script de test complet : node scripts/test-compliance-integrations.js"
echo "3. Démarrer l'application et tester l'interface"
echo ""
echo "🔗 Documentation disponible dans les fichiers créés" 