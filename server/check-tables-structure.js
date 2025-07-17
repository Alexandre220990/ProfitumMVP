const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTablesStructure() {
    console.log('🔍 Vérification de la structure des tables...\n');

    try {
        // Récupérer toutes les tables du schéma public
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .order('table_name');

        if (tablesError) {
            console.error('❌ Erreur récupération tables:', tablesError);
            return;
        }

        console.log('📋 Tables disponibles dans le schéma public:');
        tables.forEach(table => {
            console.log(`   - ${table.table_name}`);
        });

        console.log(`\n📊 Total: ${tables.length} tables`);

        // Vérifier les tables principales
        const mainTables = ['expert', 'client', 'expertassignment', 'message', 'notification', 'produiteligible'];
        
        console.log('\n🔍 Vérification des tables principales:');
        for (const tableName of mainTables) {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('count')
                    .limit(1);
                
                if (error) {
                    console.log(`   ❌ ${tableName}: ${error.message}`);
                } else {
                    console.log(`   ✅ ${tableName}: accessible`);
                }
            } catch (error) {
                console.log(`   ❌ ${tableName}: ${error.message}`);
            }
        }

        // Vérifier les colonnes de quelques tables importantes
        console.log('\n🔍 Structure des tables importantes:');
        
        const tablesToCheck = ['expertassignment', 'message', 'notification'];
        
        for (const tableName of tablesToCheck) {
            try {
                const { data: columns, error } = await supabase
                    .from('information_schema.columns')
                    .select('column_name, data_type, is_nullable')
                    .eq('table_name', tableName)
                    .eq('table_schema', 'public')
                    .order('ordinal_position');

                if (error) {
                    console.log(`   ❌ ${tableName}: ${error.message}`);
                } else {
                    console.log(`\n   📋 ${tableName}:`);
                    columns.forEach(col => {
                        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
                        console.log(`      - ${col.column_name}: ${col.data_type} (${nullable})`);
                    });
                }
            } catch (error) {
                console.log(`   ❌ ${tableName}: ${error.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Erreur générale:', error);
    }
}

checkTablesStructure(); 