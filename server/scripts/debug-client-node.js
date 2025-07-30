require('dotenv/config');
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables d\'environnement manquantes');
    console.log('SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugClient() {
    const clientId = '546a07b3-564e-4838-aaa4-96128ebca448';
    
    console.log('🔍 DEBUG CLIENT SIMPLIFIÉ');
    console.log('Client ID:', clientId);
    console.log('=====================================\n');

    try {
        // Test 1: Vérifier le client spécifique
        console.log('📋 Test 1: Client spécifique');
        const { data: client, error: clientError } = await supabase
            .from('Client')
            .select('*')
            .eq('id', clientId)
            .single();

        if (clientError) {
            console.error('❌ Erreur client:', clientError);
        } else {
            console.log('✅ Client trouvé:', client);
        }
        console.log('');

        // Test 2: Vérifier les produits éligibles
        console.log('📋 Test 2: Produits éligibles du client');
        const { data: produits, error: produitsError } = await supabase
            .from('ClientProduitEligible')
            .select(`
                *,
                ProduitEligible (
                    nom
                )
            `)
            .eq('clientId', clientId)
            .order('created_at', { ascending: false });

        if (produitsError) {
            console.error('❌ Erreur produits:', produitsError);
        } else {
            console.log('✅ Produits éligibles:', produits);
        }
        console.log('');

        // Test 3: Vérifier les sessions de simulateur (corrigé)
        console.log('📋 Test 3: Sessions simulateur');
        const { data: sessions, error: sessionsError } = await supabase
            .from('SimulatorSession')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (sessionsError) {
            console.error('❌ Erreur sessions:', sessionsError);
        } else {
            console.log('✅ Sessions simulateur (10 dernières):', sessions);
            
            // Filtrer manuellement pour test2@test.fr
            const sessionsTest2 = sessions.filter(session => 
                session.metadata && 
                JSON.stringify(session.metadata).includes('test2@test.fr')
            );
            
            if (sessionsTest2.length > 0) {
                console.log('✅ Sessions pour test2@test.fr:', sessionsTest2);
            } else {
                console.log('ℹ️  Aucune session trouvée pour test2@test.fr');
            }
        }
        console.log('');

        // Test 4: Vérifier les résultats d'éligibilité
        console.log('📋 Test 4: Résultats éligibilité simulateur');
        if (sessions && sessions.length > 0) {
            const sessionIds = sessions.map(s => s.id);
            const { data: eligibilities, error: eligibilitiesError } = await supabase
                .from('SimulatorEligibility')
                .select('*')
                .in('session_id', sessionIds)
                .order('created_at', { ascending: false });

            if (eligibilitiesError) {
                console.error('❌ Erreur éligibilité:', eligibilitiesError);
            } else {
                console.log('✅ Résultats éligibilité:', eligibilities);
            }
        } else {
            console.log('ℹ️  Aucune session trouvée pour vérifier l\'éligibilité');
        }
        console.log('');

        // Test 5: Vérifier l'existence des tables du simulateur
        console.log('📋 Test 5: Vérification des tables du simulateur');
        const tables = ['SimulatorSession', 'SimulatorEligibility', 'SimulatorResponse'];
        
        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('count')
                .limit(1);
            
            if (error) {
                console.log(`❌ Table ${table}: ${error.message}`);
            } else {
                console.log(`✅ Table ${table}: Existe`);
            }
        }

        // Test 6: Vérifier les produits éligibles disponibles
        console.log('\n📋 Test 6: Produits éligibles disponibles');
        const { data: allProduits, error: allProduitsError } = await supabase
            .from('ProduitEligible')
            .select('*')
            .order('nom');

        if (allProduitsError) {
            console.error('❌ Erreur produits disponibles:', allProduitsError);
        } else {
            console.log('✅ Produits disponibles:', allProduits.map(p => ({ id: p.id, nom: p.nom })));
        }

    } catch (error) {
        console.error('❌ Erreur générale:', error);
    }
}

debugClient(); 