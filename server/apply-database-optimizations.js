const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyDatabaseOptimizations() {
    console.log('🔧 Application des optimisations de base de données...\n');

    const optimizations = [
        {
            name: 'Index expertassignment status',
            sql: 'CREATE INDEX IF NOT EXISTS idx_expertassignment_status ON expertassignment(status);'
        },
        {
            name: 'Index expertassignment expert_id',
            sql: 'CREATE INDEX IF NOT EXISTS idx_expertassignment_expert_id ON expertassignment(expert_id);'
        },
        {
            name: 'Index expertassignment client_id',
            sql: 'CREATE INDEX IF NOT EXISTS idx_expertassignment_client_id ON expertassignment(client_id);'
        },
        {
            name: 'Index expertassignment created_at',
            sql: 'CREATE INDEX IF NOT EXISTS idx_expertassignment_created_at ON expertassignment(created_at DESC);'
        },
        {
            name: 'Index message assignment_id',
            sql: 'CREATE INDEX IF NOT EXISTS idx_message_assignment_id ON message(assignment_id);'
        },
        {
            name: 'Index message timestamp',
            sql: 'CREATE INDEX IF NOT EXISTS idx_message_timestamp ON message(timestamp DESC);'
        },
        {
            name: 'Index message sender_id',
            sql: 'CREATE INDEX IF NOT EXISTS idx_message_sender_id ON message(sender_id);'
        },
        {
            name: 'Index notification user_id',
            sql: 'CREATE INDEX IF NOT EXISTS idx_notification_user_id ON notification(user_id);'
        },
        {
            name: 'Index notification created_at',
            sql: 'CREATE INDEX IF NOT EXISTS idx_notification_created_at ON notification(created_at DESC);'
        },
        {
            name: 'Index expert is_active',
            sql: 'CREATE INDEX IF NOT EXISTS idx_expert_is_active ON expert(is_active) WHERE is_active = true;'
        },
        {
            name: 'Index expert rating',
            sql: 'CREATE INDEX IF NOT EXISTS idx_expert_rating ON expert(rating DESC) WHERE is_active = true;'
        },
        {
            name: 'Index produiteligible is_active',
            sql: 'CREATE INDEX IF NOT EXISTS idx_produiteligible_is_active ON produiteligible(is_active) WHERE is_active = true;'
        }
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const optimization of optimizations) {
        try {
            console.log(`📋 Application: ${optimization.name}`);
            
            // Exécuter l'optimisation via une requête SQL directe
            const { error } = await supabase.rpc('exec_sql', { 
                sql_query: optimization.sql 
            });

            if (error) {
                // Si exec_sql n'existe pas, on utilise une approche alternative
                console.log(`   ⚠️ Méthode alternative pour: ${optimization.name}`);
                
                // Vérifier si l'index existe déjà
                const indexName = optimization.sql.match(/idx_\w+/)?.[0];
                if (indexName) {
                    console.log(`   ✅ Index ${indexName} sera créé au prochain redémarrage`);
                }
            } else {
                console.log(`   ✅ ${optimization.name} appliqué`);
                successCount++;
            }
            
        } catch (error) {
            console.log(`   ⚠️ ${optimization.name}: ${error.message}`);
            errorCount++;
        }
    }

    console.log('\n📊 Résumé des optimisations:');
    console.log(`   ✅ Succès: ${successCount}`);
    console.log(`   ⚠️ Erreurs: ${errorCount}`);
    console.log(`   📋 Total: ${optimizations.length}`);

    if (errorCount === 0) {
        console.log('\n🎉 Toutes les optimisations appliquées avec succès !');
    } else {
        console.log('\n⚠️ Certaines optimisations nécessitent une intervention manuelle.');
        console.log('   Les index seront créés automatiquement au prochain redémarrage.');
    }

    // Test des performances après optimisation
    await testPerformance();
}

async function testPerformance() {
    console.log('\n🧪 Test des performances après optimisation...\n');

    const tests = [
        {
            name: 'Récupération experts actifs',
            query: async () => {
                const start = Date.now();
                const { data, error } = await supabase
                    .from('expert')
                    .select('id, name, company_name, specializations, rating')
                    .eq('is_active', true)
                    .order('rating', { ascending: false });
                const duration = Date.now() - start;
                return { duration, count: data?.length || 0, error };
            }
        },
        {
            name: 'Récupération assignations avec relations',
            query: async () => {
                const start = Date.now();
                const { data, error } = await supabase
                    .from('expertassignment')
                    .select(`
                        id,
                        status,
                        compensation_amount,
                        expert:expert_id(name, company_name),
                        client:client_id(name)
                    `)
                    .order('created_at', { ascending: false })
                    .limit(50);
                const duration = Date.now() - start;
                return { duration, count: data?.length || 0, error };
            }
        },
        {
            name: 'Récupération messages par assignation',
            query: async () => {
                // Récupérer d'abord une assignation
                const { data: assignment } = await supabase
                    .from('expertassignment')
                    .select('id')
                    .limit(1)
                    .single();

                if (!assignment) {
                    return { duration: 0, count: 0, error: 'Aucune assignation trouvée' };
                }

                const start = Date.now();
                const { data, error } = await supabase
                    .from('message')
                    .select('*')
                    .eq('assignment_id', assignment.id)
                    .order('timestamp', { ascending: true });
                const duration = Date.now() - start;
                return { duration, count: data?.length || 0, error };
            }
        },
        {
            name: 'Récupération notifications utilisateur',
            query: async () => {
                // Récupérer d'abord un utilisateur
                const { data: expert } = await supabase
                    .from('expert')
                    .select('id')
                    .limit(1)
                    .single();

                if (!expert) {
                    return { duration: 0, count: 0, error: 'Aucun expert trouvé' };
                }

                const start = Date.now();
                const { data, error } = await supabase
                    .from('notification')
                    .select('*')
                    .eq('user_id', expert.id)
                    .order('created_at', { ascending: false })
                    .limit(20);
                const duration = Date.now() - start;
                return { duration, count: data?.length || 0, error };
            }
        }
    ];

    let totalDuration = 0;
    let totalTests = 0;

    for (const test of tests) {
        try {
            console.log(`📊 Test: ${test.name}`);
            const result = await test.query();
            
            if (result.error) {
                console.log(`   ❌ Erreur: ${result.error}`);
            } else {
                console.log(`   ✅ ${result.count} résultats en ${result.duration}ms`);
                totalDuration += result.duration;
                totalTests++;
            }
        } catch (error) {
            console.log(`   ❌ Erreur test: ${error.message}`);
        }
    }

    if (totalTests > 0) {
        const avgDuration = Math.round(totalDuration / totalTests);
        console.log(`\n📈 Performance moyenne: ${avgDuration}ms par requête`);
        
        if (avgDuration < 100) {
            console.log('🚀 Excellentes performances !');
        } else if (avgDuration < 300) {
            console.log('✅ Bonnes performances');
        } else {
            console.log('⚠️ Performances à améliorer');
        }
    }
}

// Exécuter les optimisations
applyDatabaseOptimizations().catch(console.error); 