const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSimpleTables() {
    console.log('🧪 Test simple des tables principales...\n');

    const tables = [
        'expert',
        'client', 
        'expertassignment',
        'message',
        'notification',
        'produiteligible'
    ];

    for (const tableName of tables) {
        try {
            console.log(`📋 Test table: ${tableName}`);
            
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);

            if (error) {
                console.log(`   ❌ Erreur: ${error.message}`);
            } else {
                console.log(`   ✅ Accessible - ${data?.length || 0} enregistrements`);
                if (data && data.length > 0) {
                    console.log(`   📋 Colonnes: ${Object.keys(data[0]).join(', ')}`);
                }
            }
        } catch (error) {
            console.log(`   ❌ Exception: ${error.message}`);
        }
        console.log('');
    }

    // Test des relations
    console.log('🔗 Test des relations...\n');
    
    try {
        const { data: assignments, error } = await supabase
            .from('expertassignment')
            .select(`
                id,
                status,
                expert_id,
                client_id
            `)
            .limit(1);

        if (error) {
            console.log(`❌ Erreur relations: ${error.message}`);
        } else {
            console.log(`✅ Relations expertassignment OK - ${assignments?.length || 0} assignations`);
        }
    } catch (error) {
        console.log(`❌ Exception relations: ${error.message}`);
    }
}

testSimpleTables(); 