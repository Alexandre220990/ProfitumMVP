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

async function checkAllSimulationTables() {
    console.log('🔍 VÉRIFICATION COMPLÈTE DES TABLES DE SIMULATION');
    console.log('================================================\n');

    // Liste de toutes les tables impliquées dans le processus de simulation
    const simulationTables = [
        'Client',
        'Simulation', 
        'SimulatorSession',
        'SimulatorEligibility',
        'SimulatorResponse',
        'ClientProduitEligible',
        'ProduitEligible',
        'TICPESimulationResults',
        'TemporarySimulationSession'
    ];

    try {
        for (const tableName of simulationTables) {
            console.log(`📋 Vérification de la table: ${tableName}`);
            
            try {
                // Vérifier si la table existe et compter les enregistrements
                const { data, error, count } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });

                if (error) {
                    console.log(`❌ Table ${tableName}: ${error.message}`);
                } else {
                    console.log(`✅ Table ${tableName}: ${count} enregistrements`);
                }
            } catch (err) {
                console.log(`❌ Table ${tableName}: Erreur d'accès`);
            }
        }

        console.log('\n🔍 ANALYSE DÉTAILLÉE DU PROCESSUS DE SIMULATION\n');

        // 1. Vérifier les sessions de simulateur
        console.log('📋 1. Sessions de simulateur:');
        const { data: sessions, error: sessionsError } = await supabase
            .from('SimulatorSession')
            .select('status, count')
            .select('status')
            .limit(100);

        if (sessionsError) {
            console.error('❌ Erreur sessions:', sessionsError);
        } else {
            const statusCount = {};
            sessions.forEach(s => {
                statusCount[s.status] = (statusCount[s.status] || 0) + 1;
            });
            console.log('✅ Statuts des sessions:', statusCount);
        }

        // 2. Vérifier les résultats d'éligibilité
        console.log('\n📋 2. Résultats d\'éligibilité:');
        const { data: eligibilities, error: eligibilitiesError } = await supabase
            .from('SimulatorEligibility')
            .select('produit_id, eligibility_score')
            .limit(100);

        if (eligibilitiesError) {
            console.error('❌ Erreur éligibilité:', eligibilitiesError);
        } else {
            const productCount = {};
            eligibilities.forEach(e => {
                productCount[e.produit_id] = (productCount[e.produit_id] || 0) + 1;
            });
            console.log('✅ Produits évalués:', productCount);
        }

        // 3. Vérifier les clients avec produits éligibles
        console.log('\n📋 3. Clients avec produits éligibles:');
        const { data: clientProducts, error: clientProductsError } = await supabase
            .from('ClientProduitEligible')
            .select(`
                clientId,
                statut,
                Client (
                    email
                )
            `)
            .limit(100);

        if (clientProductsError) {
            console.error('❌ Erreur client produits:', clientProductsError);
        } else {
            const clientCount = {};
            clientProducts.forEach(cp => {
                const email = cp.Client?.email || 'unknown';
                clientCount[email] = (clientCount[email] || 0) + 1;
            });
            console.log('✅ Clients avec produits:', Object.keys(clientCount).length);
            console.log('   Détail:', clientCount);
        }

        // 4. Vérifier la table Simulation (si elle existe)
        console.log('\n📋 4. Table Simulation:');
        try {
            const { data: simulations, error: simulationsError } = await supabase
                .from('Simulation')
                .select('*')
                .limit(10);

            if (simulationsError) {
                console.log('❌ Erreur table Simulation:', simulationsError.message);
            } else {
                console.log(`✅ Table Simulation: ${simulations.length} enregistrements`);
                if (simulations.length > 0) {
                    console.log('   Structure:', Object.keys(simulations[0]));
                }
            }
        } catch (err) {
            console.log('❌ Table Simulation: N\'existe pas ou erreur d\'accès');
        }

        // 5. Vérifier les résultats TICPE
        console.log('\n📋 5. Résultats TICPE:');
        try {
            const { data: ticpeResults, error: ticpeError } = await supabase
                .from('TICPESimulationResults')
                .select('*')
                .limit(10);

            if (ticpeError) {
                console.log('❌ Erreur résultats TICPE:', ticpeError.message);
            } else {
                console.log(`✅ Résultats TICPE: ${ticpeResults.length} enregistrements`);
            }
        } catch (err) {
            console.log('❌ Table TICPESimulationResults: N\'existe pas ou erreur d\'accès');
        }

        // 6. Analyse du flux de données
        console.log('\n🔍 ANALYSE DU FLUX DE DONNÉES\n');

        // Vérifier les sessions migrées
        const { data: migratedSessions, error: migratedError } = await supabase
            .from('SimulatorSession')
            .select('metadata')
            .eq('status', 'migrated')
            .limit(10);

        if (migratedError) {
            console.error('❌ Erreur sessions migrées:', migratedError);
        } else {
            console.log(`📋 Sessions migrées: ${migratedSessions.length}`);
            migratedSessions.forEach(session => {
                const migratedTo = session.metadata?.migrated_to_client;
                if (migratedTo) {
                    console.log(`   → Migrée vers client: ${migratedTo}`);
                }
            });
        }

        console.log('\n✅ Vérification terminée');

    } catch (error) {
        console.error('❌ Erreur générale:', error);
    }
}

checkAllSimulationTables(); 