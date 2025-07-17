const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listAllTables() {
    console.log('📋 Liste de toutes les tables existantes...\n');

    try {
        // Lister toutes les tables
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .order('table_name');

        if (tablesError) {
            console.log('❌ Erreur récupération tables:', tablesError.message);
        } else {
            console.log('✅ Tables trouvées:');
            tables?.forEach(table => {
                console.log(`   - ${table.table_name}`);
            });
        }

        // Vérifier les tables spécifiques avec différentes casses
        console.log('\n🔍 Vérification des tables spécifiques:');
        
        const tableNames = [
            'Expert', 'expert', 'EXPERT',
            'Client', 'client', 'CLIENT',
            'ProduitEligible', 'produiteligible', 'PRODUITELIGIBLE',
            'ExpertAssignment', 'expertassignment', 'EXPERTASSIGNMENT',
            'Message', 'message', 'MESSAGE',
            'Notification', 'notification', 'NOTIFICATION',
            'User', 'user', 'USER'
        ];

        for (const tableName of tableNames) {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);

                if (!error) {
                    console.log(`✅ Table "${tableName}" existe`);
                    if (data && data.length > 0) {
                        console.log(`   Colonnes: ${Object.keys(data[0]).join(', ')}`);
                    }
                }
            } catch (err) {
                // Table n'existe pas
            }
        }

        // Vérifier les vues
        console.log('\n👁️ Vérification des vues:');
        const { data: views, error: viewsError } = await supabase
            .from('information_schema.views')
            .select('table_name')
            .eq('table_schema', 'public')
            .order('table_name');

        if (viewsError) {
            console.log('❌ Erreur récupération vues:', viewsError.message);
        } else {
            console.log('✅ Vues trouvées:');
            views?.forEach(view => {
                console.log(`   - ${view.table_name}`);
            });
        }

        // Vérifier les fonctions
        console.log('\n⚙️ Vérification des fonctions:');
        const { data: functions, error: functionsError } = await supabase
            .from('information_schema.routines')
            .select('routine_name')
            .eq('routine_schema', 'public')
            .eq('routine_type', 'FUNCTION')
            .order('routine_name');

        if (functionsError) {
            console.log('❌ Erreur récupération fonctions:', functionsError.message);
        } else {
            console.log('✅ Fonctions trouvées:');
            functions?.forEach(func => {
                console.log(`   - ${func.routine_name}`);
            });
        }

        console.log('\n🎉 Vérification terminée !');

    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error);
    }
}

listAllTables(); 