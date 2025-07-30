require('dotenv/config');
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables d\'environnement manquantes');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMigrationExistingClient() {
    const clientEmail = 'test2@test.fr';
    
    console.log('🔧 TEST MIGRATION VERS CLIENT EXISTANT');
    console.log('Client Email:', clientEmail);
    console.log('=====================================\n');

    try {
        // 1. Vérifier que le client existe
        console.log('📋 Vérification du client...');
        const { data: client, error: clientError } = await supabase
            .from('Client')
            .select('*')
            .eq('email', clientEmail)
            .single();

        if (clientError) {
            console.error('❌ Client non trouvé:', clientError);
            return;
        }
        console.log('✅ Client trouvé:', client.id);

        // 2. Trouver une session complétée avec des résultats d'éligibilité
        console.log('\n📋 Recherche d\'une session complétée...');
        const { data: sessions, error: sessionsError } = await supabase
            .from('SimulatorSession')
            .select('*')
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(5);

        if (sessionsError) {
            console.error('❌ Erreur sessions:', sessionsError);
            return;
        }

        if (!sessions || sessions.length === 0) {
            console.log('ℹ️  Aucune session complétée trouvée');
            return;
        }

        console.log('✅ Sessions complétées trouvées:', sessions.length);

        // 3. Vérifier les résultats d'éligibilité pour chaque session
        for (const session of sessions) {
            console.log(`\n📋 Vérification session: ${session.session_token.substring(0, 8)}...`);
            
            const { data: eligibilities, error: eligibilitiesError } = await supabase
                .from('SimulatorEligibility')
                .select('*')
                .eq('session_id', session.id);

            if (eligibilitiesError) {
                console.error('❌ Erreur éligibilité:', eligibilitiesError);
                continue;
            }

            if (eligibilities && eligibilities.length > 0) {
                console.log(`✅ ${eligibilities.length} résultats d'éligibilité trouvés`);
                
                // 4. Tester la migration avec cette session
                console.log('🔄 Test de migration...');
                const { data: migrationResult, error: migrationError } = await supabase
                    .rpc('migrate_simulator_to_existing_client', {
                        p_session_token: session.session_token,
                        p_client_email: clientEmail
                    });

                if (migrationError) {
                    console.error('❌ Erreur migration:', migrationError);
                } else {
                    console.log('✅ Migration réussie:', migrationResult);
                    
                    // 5. Vérifier les produits éligibles après migration
                    console.log('\n📋 Vérification des produits éligibles après migration...');
                    const { data: finalProducts, error: finalError } = await supabase
                        .from('ClientProduitEligible')
                        .select(`
                            *,
                            ProduitEligible (
                                nom
                            )
                        `)
                        .eq('clientId', client.id);

                    if (finalError) {
                        console.error('❌ Erreur vérification finale:', finalError);
                    } else {
                        console.log('✅ Produits éligibles du client:');
                        finalProducts.forEach(p => {
                            console.log(`  - ${p.ProduitEligible.nom} (${p.statut}) - Score: ${p.tauxFinal}%`);
                        });
                    }
                    
                    // Sortir après la première migration réussie
                    break;
                }
            } else {
                console.log('ℹ️  Aucun résultat d\'éligibilité pour cette session');
            }
        }

    } catch (error) {
        console.error('❌ Erreur générale:', error);
    }
}

testMigrationExistingClient(); 