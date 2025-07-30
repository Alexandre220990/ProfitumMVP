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

async function completeSimulationProcess() {
    const clientEmail = 'test2@test.fr';
    
    console.log('🚀 PROCESSUS COMPLET DE SIMULATION (Architecture API)');
    console.log('Client:', clientEmail);
    console.log('==================================================\n');

    try {
        // 1. Vérifier le client
        console.log('📋 1. Vérification du client...');
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

        // 2. Créer une session via l'API (comme dans /api/simulator/session)
        console.log('\n📋 2. Création de session via API...');
        const sessionToken = `test-session-${Date.now()}`;
        const clientData = {
            email: clientEmail,
            nom: client.username,
            societe: client.company_name,
            telephone: client.phone_number,
            adresse: client.address,
            code_postal: client.postal_code,
            ville: client.city,
            siret: client.siren
        };

        // Utiliser la fonction RPC comme dans l'API
        const { data: sessionData, error: sessionError } = await supabase
            .rpc('create_simulator_session_with_client_data', {
                p_session_token: sessionToken,
                p_client_data: clientData,
                p_expires_in_hours: 24
            });

        if (sessionError) {
            console.error('❌ Erreur création session:', sessionError);
            return;
        }
        console.log('✅ Session créée via API:', sessionData.session_id);

        // 3. Récupérer les questions (comme dans /api/simulator/questions)
        console.log('\n📋 3. Récupération des questions...');
        const { data: questions, error: questionsError } = await supabase
            .from('QuestionnaireQuestion')
            .select('*')
            .order('question_order', { ascending: true });

        if (questionsError) {
            console.error('❌ Erreur questions:', questionsError);
            return;
        }
        console.log(`✅ ${questions.length} questions récupérées`);

        // 4. Simuler des réponses (comme dans /api/simulator/response)
        console.log('\n📋 4. Simulation des réponses...');
        const responses = {
            'secteur_activite': { value: 'Transport' },
            'nombre_vehicules': { value: 5 },
            'chiffre_affaires': { value: 500000 },
            'type_carburant': { value: 'Diesel' },
            'nombre_employes': { value: 10 },
            'anciennete_entreprise': { value: 'Plus de 5 ans' }
        };

        // Utiliser la fonction RPC comme dans l'API
        const { data: responseData, error: responseError } = await supabase
            .rpc('save_simulator_responses', {
                p_session_token: sessionToken,
                p_responses: responses
            });

        if (responseError) {
            console.error('❌ Erreur sauvegarde réponses:', responseError);
            return;
        }
        console.log('✅ Réponses sauvegardées via API:', responseData.questions_saved);

        // 5. Calculer l'éligibilité (comme dans /api/simulator/calculate-eligibility)
        console.log('\n📋 5. Calcul de l\'éligibilité...');
        const { data: eligibilityData, error: eligibilityError } = await supabase
            .rpc('calculate_simulator_eligibility', {
                p_session_token: sessionToken
            });

        if (eligibilityError) {
            console.error('❌ Erreur calcul éligibilité:', eligibilityError);
            return;
        }
        console.log('✅ Éligibilité calculée via API:', eligibilityData.eligibility_results.length, 'résultats');

        // 6. Récupérer les résultats (comme dans /api/simulator/results/:session_token)
        console.log('\n📋 6. Récupération des résultats...');
        const { data: resultsData, error: resultsError } = await supabase
            .rpc('get_simulation_results', {
                p_session_token: sessionToken
            });

        if (resultsError) {
            console.error('❌ Erreur récupération résultats:', resultsError);
            return;
        }
        console.log('✅ Résultats récupérés via API');

        // 7. Enregistrer dans la table Simulation (historique)
        console.log('\n📋 7. Enregistrement historique...');
        const { error: simulationError } = await supabase
            .from('Simulation')
            .insert({
                clientId: client.id,
                dateCreation: new Date().toISOString(),
                statut: 'termine',
                Answers: responses,
                score: Math.max(...eligibilityData.eligibility_results.map(r => r.eligibility_score)),
                tempsCompletion: 120,
                type: 'simulateur',
                source: 'simulateur_web',
                metadata: {
                    session_token: sessionToken,
                    simulator_session_id: sessionData.session_id,
                    process_type: 'api_simulation',
                    eligibility_count: eligibilityData.eligibility_results.length
                }
            });

        if (simulationError) {
            console.error('❌ Erreur table Simulation:', simulationError);
        } else {
            console.log('✅ Enregistrement historique dans Simulation');
        }

        // 8. Migrer vers le client existant (comme dans /api/simulator/migrate/:session_token)
        console.log('\n📋 8. Migration vers le client existant...');
        const { data: migrationResult, error: migrationError } = await supabase
            .rpc('migrate_simulator_to_existing_client', {
                p_session_token: sessionToken,
                p_client_email: clientEmail
            });

        if (migrationError) {
            console.error('❌ Erreur migration:', migrationError);
        } else {
            console.log('✅ Migration réussie via API:', migrationResult);
        }

        // 9. Vérification finale
        console.log('\n📋 9. Vérification finale...');
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
                console.log(`  - ${p.ProduitEligible.nom} (${p.statut}) - Score: ${p.tauxFinal}% - Gain: ${p.montantFinal}€`);
            });
        }

        // 10. Statistiques finales
        console.log('\n📊 STATISTIQUES FINALES (Architecture API)');
        console.log('==========================================');
        console.log(`✅ Session créée via API: ${sessionData.session_id}`);
        console.log(`✅ Questions récupérées: ${questions.length}`);
        console.log(`✅ Réponses sauvegardées: ${responseData.questions_saved}`);
        console.log(`✅ Résultats d'éligibilité: ${eligibilityData.eligibility_results.length}`);
        console.log(`✅ Produits associés au client: ${finalProducts.length}`);
        console.log(`✅ Processus API complet terminé avec succès`);

        // 11. Vérification de la cohérence des données
        console.log('\n🔍 VÉRIFICATION DE COHÉRENCE');
        console.log('============================');
        
        // Vérifier que la session est bien marquée comme complétée
        const { data: finalSession, error: sessionCheckError } = await supabase
            .from('SimulatorSession')
            .select('status, metadata')
            .eq('session_token', sessionToken)
            .single();

        if (sessionCheckError) {
            console.error('❌ Erreur vérification session:', sessionCheckError);
        } else {
            console.log(`✅ Statut final de la session: ${finalSession.status}`);
            console.log(`✅ Métadonnées: ${JSON.stringify(finalSession.metadata, null, 2)}`);
        }

    } catch (error) {
        console.error('❌ Erreur générale:', error);
    }
}

completeSimulationProcess(); 