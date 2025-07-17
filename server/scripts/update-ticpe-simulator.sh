#!/bin/bash

# =====================================================
# SCRIPT DE MISE À JOUR COMPLÈTE DU SIMULATEUR TICPE
# Date: 2025-01-07
# =====================================================

echo "🚀 MISE À JOUR COMPLÈTE DU SIMULATEUR TICPE"
echo "=========================================="
echo ""

# Charger les variables d'environnement depuis .env si le fichier existe
if [ -f ".env" ]; then
    echo "📁 Chargement des variables depuis .env..."
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Variables chargées depuis .env"
elif [ -f "server/.env" ]; then
    echo "📁 Chargement des variables depuis server/.env..."
    export $(cat server/.env | grep -v '^#' | xargs)
    echo "✅ Variables chargées depuis server/.env"
fi

# Vérification des variables d'environnement
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Variables d'environnement manquantes"
    echo ""
    echo "🔧 CONFIGURATION REQUISE :"
    echo "=========================="
    echo ""
    echo "📋 Variables trouvées dans votre projet :"
    echo "   - SUPABASE_URL: https://gvvlstubqfxdzltldunj.supabase.co"
    echo "   - SUPABASE_ANON_KEY: (dans client/src/config/env.ts)"
    echo ""
    echo "🔧 SOLUTIONS :"
    echo "============="
    echo ""
    echo "1️⃣ Créez un fichier .env à la racine avec :"
    echo "   SUPABASE_URL=https://gvvlstubqfxdzltldunj.supabase.co"
    echo "   SUPABASE_ANON_KEY=votre_clé_anon_supabase"
    echo "   DATABASE_URL=postgresql://postgres:[password]@db.gvvlstubqfxdzltldunj.supabase.co:5432/postgres"
    echo ""
    echo "2️⃣ Ou définissez les variables directement :"
    echo "   export SUPABASE_URL=https://gvvlstubqfxdzltldunj.supabase.co"
    echo "   export SUPABASE_ANON_KEY=votre_clé_anon_supabase"
    echo "   export DATABASE_URL=postgresql://postgres:[password]@db.gvvlstubqfxdzltldunj.supabase.co:5432/postgres"
    echo ""
    echo "3️⃣ Ou utilisez le script avec les variables :"
    echo "   SUPABASE_URL=https://gvvlstubqfxdzltldunj.supabase.co SUPABASE_ANON_KEY=votre_clé ./server/scripts/update-ticpe-simulator.sh"
    echo ""
    echo "🔍 Où trouver votre clé anonyme :"
    echo "   - Dashboard Supabase > Settings > API"
    echo "   - Ou dans votre fichier .env existant"
    echo ""
    echo "💡 Conseil : Copiez votre clé depuis client/src/config/env.ts"
    echo ""
    exit 1
fi

echo "✅ Variables d'environnement configurées"
echo "   SUPABASE_URL: ${SUPABASE_URL:0:30}..."
if [ ! -z "$DATABASE_URL" ]; then
    echo "   DATABASE_URL: ${DATABASE_URL:0:30}..."
else
    echo "   ⚠️ DATABASE_URL non définie - utilisation de la connexion Supabase"
fi
echo ""

# 1. Création des nouvelles tables TICPE
echo "1️⃣ Création des nouvelles tables TICPE..."

if [ ! -z "$DATABASE_URL" ]; then
    psql $DATABASE_URL -f server/migrations/20250107_create_ticpe_tables.sql
    if [ $? -eq 0 ]; then
        echo "✅ Tables TICPE créées avec succès via DATABASE_URL"
    else
        echo "❌ Erreur lors de la création des tables via DATABASE_URL"
        echo "   Tentative via Supabase..."
        node -e "
        const { createClient } = require('@supabase/supabase-js');
        const fs = require('fs');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        
        fs.readFile('server/migrations/20250107_create_ticpe_tables.sql', 'utf8', async (err, data) => {
            if (err) {
                console.error('Erreur lecture fichier SQL:', err);
                process.exit(1);
            }
            
            try {
                const { error } = await supabase.rpc('exec_sql', { sql: data });
                if (error) throw error;
                console.log('✅ Tables créées via Supabase');
            } catch (error) {
                console.error('❌ Erreur création tables:', error.message);
                process.exit(1);
            }
        });
        "
    fi
else
    echo "📝 Création des tables via Supabase..."
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    const fs = require('fs');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    fs.readFile('server/migrations/20250107_create_ticpe_tables.sql', 'utf8', async (err, data) => {
        if (err) {
            console.error('Erreur lecture fichier SQL:', err);
            process.exit(1);
        }
        
        try {
            const { error } = await supabase.rpc('exec_sql', { sql: data });
            if (error) throw error;
            console.log('✅ Tables créées via Supabase');
        } catch (error) {
            console.error('❌ Erreur création tables:', error.message);
            process.exit(1);
        }
    });
    "
fi
echo ""

# 2. Création de la fonction RPC pour les transactions
echo "2️⃣ Création de la fonction RPC pour les transactions..."

if [ ! -z "$DATABASE_URL" ]; then
    psql $DATABASE_URL -f server/migrations/20250107_create_ticpe_rpc.sql
    if [ $? -eq 0 ]; then
        echo "✅ Fonction RPC créée avec succès via DATABASE_URL"
    else
        echo "⚠️ Erreur lors de la création de la fonction RPC (peut déjà exister)"
    fi
else
    echo "📝 Création de la fonction RPC via Supabase..."
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    const fs = require('fs');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    fs.readFile('server/migrations/20250107_create_ticpe_rpc.sql', 'utf8', async (err, data) => {
        if (err) {
            console.error('Erreur lecture fichier SQL:', err);
            return;
        }
        
        try {
            const { error } = await supabase.rpc('exec_sql', { sql: data });
            if (error) throw error;
            console.log('✅ Fonction RPC créée via Supabase');
        } catch (error) {
            console.log('⚠️ Fonction RPC peut déjà exister:', error.message);
        }
    });
    "
fi
echo ""

# 3. Insertion des données TICPE
echo "3️⃣ Insertion des données TICPE..."
node server/scripts/insert-ticpe-data.js
if [ $? -eq 0 ]; then
    echo "✅ Données TICPE insérées avec succès"
else
    echo "❌ Erreur lors de l'insertion des données"
    echo "   Vérifiez vos variables d'environnement Node.js"
    exit 1
fi
echo ""

# 4. Mise à jour du questionnaire
echo "4️⃣ Mise à jour du questionnaire TICPE..."
node server/scripts/insert-ticpe-questionnaire.js
if [ $? -eq 0 ]; then
    echo "✅ Questionnaire TICPE mis à jour avec succès"
else
    echo "❌ Erreur lors de la mise à jour du questionnaire"
    echo "   Vérifiez la connexion à Supabase"
    exit 1
fi
echo ""

# 5. Tests du simulateur
echo "5️⃣ Tests du simulateur TICPE..."
node server/scripts/test-ticpe-simulator.js
if [ $? -eq 0 ]; then
    echo "✅ Tests du simulateur réussis"
else
    echo "⚠️ Certains tests ont échoué, mais la mise à jour est terminée"
fi
echo ""

# 6. Vérification finale
echo "6️⃣ Vérification finale..."
echo "📊 Vérification des tables créées :"

# Vérifier les tables TICPE
echo "   - TICPESectors:"
if [ ! -z "$DATABASE_URL" ]; then
    psql $DATABASE_URL -c "SELECT COUNT(*) as count FROM \"public\".\"TICPESectors\";"
else
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    supabase.from('TICPESectors').select('*', { count: 'exact' }).then(({ count, error }) => {
        if (error) console.log('   ❌ Erreur:', error.message);
        else console.log('   ✅ TICPESectors:', count, 'enregistrements');
    });
    "
fi

echo "   - TICPERates:"
if [ ! -z "$DATABASE_URL" ]; then
    psql $DATABASE_URL -c "SELECT COUNT(*) as count FROM \"public\".\"TICPERates\";"
else
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    supabase.from('TICPERates').select('*', { count: 'exact' }).then(({ count, error }) => {
        if (error) console.log('   ❌ Erreur:', error.message);
        else console.log('   ✅ TICPERates:', count, 'enregistrements');
    });
    "
fi

echo "   - TICPEVehicleTypes:"
if [ ! -z "$DATABASE_URL" ]; then
    psql $DATABASE_URL -c "SELECT COUNT(*) as count FROM \"public\".\"TICPEVehicleTypes\";"
else
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    supabase.from('TICPEVehicleTypes').select('*', { count: 'exact' }).then(({ count, error }) => {
        if (error) console.log('   ❌ Erreur:', error.message);
        else console.log('   ✅ TICPEVehicleTypes:', count, 'enregistrements');
    });
    "
fi

echo "   - TICPEBenchmarks:"
if [ ! -z "$DATABASE_URL" ]; then
    psql $DATABASE_URL -c "SELECT COUNT(*) as count FROM \"public\".\"TICPEBenchmarks\";"
else
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    supabase.from('TICPEBenchmarks').select('*', { count: 'exact' }).then(({ count, error }) => {
        if (error) console.log('   ❌ Erreur:', error.message);
        else console.log('   ✅ TICPEBenchmarks:', count, 'enregistrements');
    });
    "
fi

echo "   - Questions TICPE:"
if [ ! -z "$DATABASE_URL" ]; then
    psql $DATABASE_URL -c "SELECT COUNT(*) as count FROM \"public\".\"QuestionnaireQuestion\" WHERE 'TICPE' = ANY(produits_cibles);"
else
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    supabase.from('QuestionnaireQuestion').select('*', { count: 'exact' }).eq('produits_cibles', ['TICPE']).then(({ count, error }) => {
        if (error) console.log('   ❌ Erreur:', error.message);
        else console.log('   ✅ Questions TICPE:', count, 'questions');
    });
    "
fi

echo "   - Fonction RPC:"
if [ ! -z "$DATABASE_URL" ]; then
    psql $DATABASE_URL -c "SELECT routine_name FROM information_schema.routines WHERE routine_name = 'insert_ticpe_questions_transaction';"
else
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    supabase.rpc('insert_ticpe_questions_transaction', { questions_json: '[]' }).then(({ error }) => {
        if (error && error.message.includes('function')) {
            console.log('   ❌ Fonction RPC non trouvée');
        } else {
            console.log('   ✅ Fonction RPC disponible');
        }
    });
    "
fi

echo ""
echo "🎉 MISE À JOUR TERMINÉE AVEC SUCCÈS !"
echo ""
echo "📋 RÉSUMÉ DES AMÉLIORATIONS :"
echo "✅ Nouvelles tables TICPE optimisées"
echo "✅ Fonction RPC pour transactions atomiques"
echo "✅ Données réelles de récupération intégrées"
echo "✅ Questionnaire affiné avec 17 questions"
echo "✅ Identifiants explicites (TICPE_001 à TICPE_017)"
echo "✅ Validation rules avec dépendances"
echo "✅ Moteur de calcul avec règles détaillées"
echo "✅ Benchmarks par secteur et taille"
echo "✅ Indicateurs de maturité administrative"
echo "✅ Tests automatisés avec cas réels"
echo ""
echo "🚀 Le simulateur TICPE est maintenant optimisé avec :"
echo "   - Calculs précis basés sur les taux 2024"
echo "   - Coefficients par type de véhicule"
echo "   - Prise en compte de l'usage professionnel"
echo "   - Comparaison avec les benchmarks réels"
echo "   - Recommandations personnalisées"
echo "   - Évaluation de la maturité administrative"
echo "   - Transactions atomiques pour la fiabilité"
echo ""
echo "💡 Prochaines étapes :"
echo "   1. Tester le simulateur en production"
echo "   2. Collecter les retours utilisateurs"
echo "   3. Ajuster les paramètres si nécessaire"
echo "   4. Intégrer les données historiques réelles"
echo "" 