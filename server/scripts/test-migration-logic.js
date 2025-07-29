// Charger les variables d'environnement
require('dotenv').config({ path: '../.env' });

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapping des produits du simulateur vers les UUID de ProduitEligible
const PRODUCT_MAPPING = {
  'TICPE': '32dd9cf8-15e2-4375-86ab-a95158d3ada1',
  'URSSAF': 'd1e8f740-7c2a-4b5e-9a91-0e15c0e7d3a2',
  'DFS': 'e2f9a830-8d3b-4c7c-b590-1d7631c0d4b5',
  'FONCIER': 'c5d2e980-4f63-44c0-b8a9-9d6e8e21c0f7',
  'CIR': '37da1c4e-3fcc-49f8-9acb-9b75e231edfd',
  'CEE': 'b7f3c891-28d9-4982-b0eb-821c9e7cbcf0',
  'AUDIT_ENERGETIQUE': 'bc2b94ec-659b-4cf5-a693-d61178b03caf'
};

async function testMigrationLogic() {
  console.log('🧪 TEST LOGIQUE MIGRATION');
  console.log('=' .repeat(40));

  try {
    // 1. Récupérer la dernière session
    console.log('\n1️⃣ Récupération de la dernière session...');
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('TemporarySession')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionsError || !sessions || sessions.length === 0) {
      console.error('❌ Erreur récupération sessions:', sessionsError);
      return;
    }

    const session = sessions[0];
    console.log('✅ Session trouvée:', {
      id: session.id,
      session_token: session.session_token,
      completed: session.completed
    });

    // 2. Récupérer les éligibilités pour cette session (comme dans la migration)
    console.log('\n2️⃣ Récupération des éligibilités (logique migration)...');
    
    const { data: dbEligibilityResults, error: eligibilityError } = await supabase
      .from('TemporaryEligibility')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    if (eligibilityError) {
      console.error('❌ Erreur récupération éligibilités:', eligibilityError);
      return;
    }

    console.log(`✅ ${dbEligibilityResults?.length || 0} éligibilités trouvées`);
    
    if (!dbEligibilityResults || dbEligibilityResults.length === 0) {
      console.error('❌ Aucune éligibilité trouvée pour cette session');
      return;
    }

    for (const result of dbEligibilityResults) {
      console.log(`   - ${result.produit_id}: ${result.eligibility_score}% (${result.estimated_savings}€)`);
    }

    // 3. Créer un client de test
    console.log('\n3️⃣ Création d\'un client de test...');
    
    const timestamp = Date.now();
    const testUserData = {
      username: `logic-test-${timestamp}`,
      email: `logic-test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      company_name: 'Entreprise Test Logic',
      phone_number: '0123456789',
      address: '123 Rue Test',
      city: 'Paris',
      postal_code: '75001',
      siren: `${timestamp % 1000000000}`.padStart(9, '0'),
      type: 'client',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: client, error: clientError } = await supabase
      .from('Client')
      .insert(testUserData)
      .select()
      .single();

    if (clientError) {
      console.error('❌ Erreur création client:', clientError);
      return;
    }

    console.log('✅ Client créé:', client.id);

    // 4. Tester la logique de création des ClientProduitEligible
    console.log('\n4️⃣ Test de la logique de création des ClientProduitEligible...');
    
    const clientProduitsEligibles = [];
    
    console.log('🔍 Création des produits éligibles pour', dbEligibilityResults.length, 'résultats');
    
    for (const result of dbEligibilityResults) {
      console.log(`🔍 Traitement du produit: ${result.produit_id} (${result.estimated_savings}€)`);
      
      const produitId = result.produit_id && typeof result.produit_id === 'string' 
        ? PRODUCT_MAPPING[result.produit_id] 
        : undefined;
      
      if (!produitId) {
        console.warn(`⚠️ Produit non trouvé dans le mapping: ${result.produit_id}`);
        console.log('🔍 Mapping disponible:', Object.keys(PRODUCT_MAPPING));
        continue;
      }

      console.log(`   ✅ Mapping trouvé: ${result.produit_id} → ${produitId}`);

      const clientProduitEligible = {
        clientId: client.id,
        produitId: produitId,
        statut: result.eligibility_score >= 50 ? 'eligible' : 'non_eligible',
        tauxFinal: result.eligibility_score / 100,
        montantFinal: result.estimated_savings || 0,
        dureeFinale: 12,
        simulationId: null,
        metadata: {
          confidence_level: result.confidence_level,
          recommendations: result.recommendations || [],
          session_token: session.session_token,
          migrated_at: new Date().toISOString(),
          original_produit_id: result.produit_id
        },
        notes: `Migration depuis simulateur - Score: ${result.eligibility_score}%, Confiance: ${result.confidence_level}`,
        priorite: result.eligibility_score >= 80 ? 1 : result.eligibility_score >= 60 ? 2 : 3,
        dateEligibilite: new Date().toISOString(),
        current_step: 0,
        progress: 0,
        expert_id: null,
        charte_signed: false,
        charte_signed_at: null
      };

      clientProduitsEligibles.push(clientProduitEligible);
      console.log(`   ✅ ClientProduitEligible préparé pour ${result.produit_id}`);
    }

    // 5. Insérer les ClientProduitEligible
    console.log('\n5️⃣ Insertion des ClientProduitEligible...');
    
    if (clientProduitsEligibles.length > 0) {
      console.log(`📤 Tentative d'insertion de ${clientProduitsEligibles.length} produits...`);
      
      const { data: insertedProducts, error: insertError } = await supabase
        .from('ClientProduitEligible')
        .insert(clientProduitsEligibles)
        .select();

      if (insertError) {
        console.error('❌ Erreur insertion ClientProduitEligible:', insertError);
        console.error('📋 Détails erreur:', JSON.stringify(insertError, null, 2));
        console.error('📤 Données envoyées:', JSON.stringify(clientProduitsEligibles, null, 2));
      } else {
        console.log(`✅ ${insertedProducts?.length || 0} produits éligibles créés`);
        
        for (const product of insertedProducts || []) {
          console.log(`   - ${product.produitId}: ${product.statut} (${product.montantFinal}€)`);
        }
      }
    } else {
      console.log('⚠️ Aucun produit à insérer');
    }

    // 6. Vérification finale
    console.log('\n6️⃣ Vérification finale...');
    
    const { data: finalProducts, error: finalError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible (
          id,
          nom,
          categorie
        )
      `)
      .eq('clientId', client.id);

    if (finalError) {
      console.error('❌ Erreur vérification finale:', finalError);
    } else {
      console.log(`✅ Vérification finale: ${finalProducts?.length || 0} produits trouvés`);
      for (const product of finalProducts || []) {
        console.log(`   - ${product.ProduitEligible?.nom || product.produitId}: ${product.statut} (${product.montantFinal}€)`);
      }
    }

    // 7. Nettoyage
    console.log('\n7️⃣ Nettoyage...');
    
    if (finalProducts && finalProducts.length > 0) {
      await supabase.from('ClientProduitEligible').delete().eq('clientId', client.id);
      console.log('✅ ClientProduitEligible supprimés');
    }
    
    await supabase.from('Client').delete().eq('id', client.id);
    console.log('✅ Client supprimé');

    console.log('\n🎉 Test de logique terminé !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testMigrationLogic();