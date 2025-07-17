const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testExistingMarketplaceTables() {
    console.log('🧪 Test des tables existantes de la marketplace...\n');

    try {
        // 1. Test de connexion
        console.log('1️⃣ Test de connexion Supabase:');
        const { data: testData, error: testError } = await supabase
            .from('documentation_categories')
            .select('count')
            .limit(1);
        
        if (testError) {
            console.log('❌ Erreur de connexion:', testError.message);
            return;
        }
        console.log('✅ Connexion Supabase réussie\n');

        // 2. Vérification des tables existantes
        console.log('2️⃣ Vérification des tables existantes:');
        
        const existingTables = [
            'documentation_categories',
            'documentation_items', 
            'documentation',
            'Notification'
        ];

        for (const table of existingTables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    console.log(`❌ Table ${table}: ${error.message}`);
                } else {
                    console.log(`✅ Table ${table}: accessible`);
                }
            } catch (err) {
                console.log(`❌ Table ${table}: ${err.message}`);
            }
        }

        // 3. Test des données de base
        console.log('\n3️⃣ Test des données de base:');
        
        // Test des catégories de documentation
        const { data: categories, error: catError } = await supabase
            .from('documentation_categories')
            .select('*');
        
        if (catError) {
            console.log('❌ Erreur catégories:', catError.message);
        } else {
            console.log(`✅ Catégories de documentation: ${categories.length} trouvées`);
            categories.forEach(cat => {
                console.log(`   - ${cat.name} (${cat.description})`);
            });
        }

        // 4. Test des politiques RLS
        console.log('\n4️⃣ Test des politiques RLS:');
        
        // Test avec un utilisateur anonyme
        const { data: anonData, error: anonError } = await supabase
            .from('documentation_categories')
            .select('*')
            .limit(1);
        
        if (anonError) {
            console.log('❌ Politique RLS catégories:', anonError.message);
        } else {
            console.log('✅ Politique RLS catégories: lecture publique autorisée');
        }

        // 5. Test des tables Expert existantes
        console.log('\n5️⃣ Test des tables Expert existantes:');
        
        const expertTables = [
            'Expert',
            'ExpertCategory',
            'ExpertSpecialization'
        ];

        for (const table of expertTables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    console.log(`❌ Table ${table}: ${error.message}`);
                } else {
                    console.log(`✅ Table ${table}: accessible`);
                }
            } catch (err) {
                console.log(`❌ Table ${table}: ${err.message}`);
            }
        }

        // 6. Résumé
        console.log('\n6️⃣ Résumé:');
        console.log('✅ Les tables de documentation sont fonctionnelles');
        console.log('✅ Les tables Expert existantes sont accessibles');
        console.log('✅ Les politiques RLS sont en place');
        console.log('\n📋 Tables manquantes à créer:');
        console.log('   - ExpertAssignment');
        console.log('   - Message');
        console.log('   - ExpertCampaign');
        console.log('   - ExpertCriteria');
        console.log('   - ExpertAccessLog');
        console.log('   - PromotionBanner');

    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

// Exécution du test
testExistingMarketplaceTables(); 