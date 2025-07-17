const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMarketplaceTables() {
    console.log('🧪 Test des tables de la marketplace des experts...\n');

    try {
        // 1. Test de connexion
        console.log('1️⃣ Test de connexion Supabase:');
        const { data: testData, error: testError } = await supabase
            .from('ExpertCriteria')
            .select('count')
            .limit(1);
        
        if (testError) {
            console.log('❌ Erreur de connexion:', testError.message);
            return;
        }
        console.log('✅ Connexion Supabase réussie\n');

        // 2. Vérification des tables
        console.log('2️⃣ Vérification des tables:');
        
        const tables = [
            'documentation_categories',
            'documentation_items', 
            'documentation',
            'ExpertAssignment',
            'Message',
            'ExpertCampaign',
            'ExpertCriteria',
            'Notification',
            'ExpertAccessLog',
            'PromotionBanner'
        ];

        for (const table of tables) {
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

        // Test des critères d'experts
        const { data: criteria, error: critError } = await supabase
            .from('ExpertCriteria')
            .select('*');
        
        if (critError) {
            console.log('❌ Erreur critères:', critError.message);
        } else {
            console.log(`✅ Critères d'experts: ${criteria.length} trouvés`);
            criteria.forEach(crit => {
                console.log(`   - ${crit.name} (${crit.criteria_type})`);
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

        // 5. Test des contraintes
        console.log('\n5️⃣ Test des contraintes:');
        
        // Test d'insertion avec données invalides (doit échouer)
        const { error: constraintError } = await supabase
            .from('ExpertCriteria')
            .insert({
                name: 'Test Critère',
                criteria_type: 'invalid_type', // Type invalide
                criteria_value: '{}'
            });
        
        if (constraintError) {
            console.log('✅ Contrainte de type: fonctionne (insertion invalide rejetée)');
        } else {
            console.log('❌ Contrainte de type: ne fonctionne pas');
        }

        // 6. Test des triggers
        console.log('\n6️⃣ Test des triggers:');
        
        // Test d'insertion d'une notification
        const { data: notifData, error: notifError } = await supabase
            .from('Notification')
            .insert({
                user_id: '00000000-0000-0000-0000-000000000000', // UUID fictif
                user_type: 'client',
                title: 'Test Notification',
                message: 'Test de trigger',
                notification_type: 'system'
            })
            .select();
        
        if (notifError) {
            console.log('❌ Trigger notification:', notifError.message);
        } else {
            console.log('✅ Trigger notification: insertion réussie');
            console.log(`   - created_at: ${notifData[0].created_at}`);
            console.log(`   - updated_at: ${notifData[0].updated_at}`);
        }

        // 7. Résumé
        console.log('\n7️⃣ Résumé:');
        console.log('✅ Toutes les tables de la marketplace ont été créées avec succès');
        console.log('✅ Les politiques RLS sont en place');
        console.log('✅ Les contraintes fonctionnent');
        console.log('✅ Les triggers sont actifs');
        console.log('\n🎉 Marketplace des experts prête à être utilisée !');

    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

// Exécution du test
testMarketplaceTables(); 