const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Utiliser la clé de service pour contourner les restrictions
const supabaseService = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function testFinalRLS() {
  console.log('🧪 Test final avec politiques RLS corrigées\n');

  const testClientId = '0538de29-4287-4c28-b76a-b65ef993f393';
  
  try {
    // 1. Test complet : Simulation + ClientProduitEligible
    console.log('1️⃣ Test complet d\'insertion...');
    
    // Créer une simulation
    const { data: simulation, error: simError } = await supabaseService
      .from('Simulation')
      .insert({
        clientId: testClientId,
        statut: 'termine',
        type: 'chatbot',
        dateCreation: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        Answers: {
          test: true,
          source: 'final-rls-test',
          questions: [
            'Secteur d\'activité ?',
            'Nombre d\'employés ?',
            'Chiffre d\'affaires ?'
          ],
          answers: [
            'Technologie',
            '25',
            '1500000'
          ]
        },
        score: 95,
        tempsCompletion: 80
      })
      .select('id, clientId, statut, score, type')
      .single();

    if (simError) {
      console.log(`❌ Erreur création simulation: ${simError.message}`);
      return;
    }

    console.log(`✅ Simulation créée (ID: ${simulation.id})`);

    // Trouver un produit TICPE
    const { data: produit, error: produitError } = await supabaseService
      .from('ProduitEligible')
      .select('id, nom')
      .eq('nom', 'TICPE')
      .single();

    if (produitError || !produit) {
      console.log(`❌ Produit TICPE non trouvé: ${produitError?.message}`);
      return;
    }

    console.log(`✅ Produit TICPE trouvé (ID: ${produit.id})`);

    // Insérer ClientProduitEligible
    const { data: savedProduct, error: saveError } = await supabaseService
      .from('ClientProduitEligible')
      .insert({
        clientId: testClientId,
        produitId: produit.id,
        simulationId: simulation.id,
        statut: 'eligible',
        tauxFinal: 0.85,
        montantFinal: 5000,
        dureeFinale: 12,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, produitId, statut, montantFinal, tauxFinal, dureeFinale')
      .single();

    if (saveError) {
      console.log(`❌ Erreur sauvegarde produit: ${saveError.message}`);
      return;
    }

    console.log('✅ Produit éligible sauvegardé:');
    console.log(`   - ID: ${savedProduct.id}`);
    console.log(`   - ProduitId: ${savedProduct.produitId}`);
    console.log(`   - Statut: ${savedProduct.statut}`);
    console.log(`   - Montant: ${savedProduct.montantFinal}€`);
    console.log(`   - Taux: ${savedProduct.tauxFinal}`);
    console.log(`   - Durée: ${savedProduct.dureeFinale} mois`);

    // 2. Vérification finale
    console.log('\n2️⃣ Vérification finale...');
    
    const { data: finalProducts, error: finalError } = await supabaseService
      .from('ClientProduitEligible')
      .select(`
        id,
        "clientId",
        "produitId",
        "simulationId",
        statut,
        "tauxFinal",
        "montantFinal",
        "dureeFinale",
        "created_at"
      `)
      .eq('clientId', testClientId)
      .eq('simulationId', simulation.id);

    if (finalError) {
      console.log(`❌ Erreur vérification: ${finalError.message}`);
    } else {
      console.log(`✅ ${finalProducts.length} produits éligibles trouvés pour cette simulation`);
      
      if (finalProducts.length > 0) {
        console.log('\n📊 Détails des produits éligibles:');
        finalProducts.forEach((entry, index) => {
          console.log(`   ${index + 1}. ID: ${entry.id}`);
          console.log(`      ProduitId: ${entry.produitId}`);
          console.log(`      SimulationId: ${entry.simulationId}`);
          console.log(`      Statut: ${entry.statut}`);
          console.log(`      Montant: ${entry.montantFinal}€`);
          console.log(`      Taux: ${entry.tauxFinal}`);
          console.log(`      Durée: ${entry.dureeFinale} mois`);
          console.log(`      Créé le: ${entry.created_at}`);
          console.log('');
        });
      }
    }

    // 3. Test de lecture avec clé anon (pour vérifier RLS)
    console.log('\n3️⃣ Test de lecture avec clé anon (RLS)...');
    
    const supabaseAnon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    const { data: anonRead, error: anonError } = await supabaseAnon
      .from('ClientProduitEligible')
      .select('id, statut')
      .eq('clientId', testClientId)
      .limit(1);

    if (anonError) {
      console.log(`❌ Erreur lecture anon: ${anonError.message}`);
    } else {
      console.log(`✅ Lecture anon réussie: ${anonRead.length} lignes trouvées`);
    }

    console.log('\n✅ Test final avec RLS terminé !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testFinalRLS(); 