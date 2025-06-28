const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Utiliser la clé de service pour contourner RLS
const supabaseService = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function testCompleteInsertion() {
  console.log('🧪 Test complet d\'insertion (Simulation + ClientProduitEligible)\n');

  const testClientId = '0538de29-4287-4c28-b76a-b65ef993f393';
  
  try {
    // 1. Créer une simulation
    console.log('1️⃣ Création d\'une simulation...');
    
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
          source: 'complete-test',
          questions: [
            'Quel est votre secteur d\'activité ?',
            'Combien d\'employés avez-vous ?',
            'Quel est votre chiffre d\'affaires ?'
          ],
          answers: [
            'Technologie',
            '25',
            '1500000'
          ]
        },
        score: 85,
        tempsCompletion: 120
      })
      .select()
      .single();

    if (simError) {
      console.log(`❌ Erreur création simulation: ${simError.message}`);
      console.log('Détails:', simError);
      return;
    }

    console.log(`✅ Simulation créée avec l'ID: ${simulation.id}`);

    // 2. Simuler les données du chatbot
    const mockChatbotProducts = [
      {
        nom: 'TICPE',
        estimatedGain: 5000,
        taux: 0.85,
        duree: 12
      },
      {
        nom: 'URSSAF',
        estimatedGain: 3000,
        taux: 0.75,
        duree: 6
      }
    ];

    // 3. Insérer les produits éligibles
    console.log('\n2️⃣ Insertion des produits éligibles...');
    const savedProducts = [];

    for (const product of mockChatbotProducts) {
      try {
        // Trouver le produit
        const { data: produitEligible, error: produitError } = await supabaseService
          .from('ProduitEligible')
          .select('*')
          .eq('nom', product.nom)
          .single();

        if (produitError || !produitEligible) {
          console.log(`   ⚠️ Produit "${product.nom}" non trouvé`);
          continue;
        }

        // Insérer ClientProduitEligible
        const insertData = {
          clientId: testClientId,
          produitId: produitEligible.id,
          simulationId: simulation.id,
          statut: 'eligible',
          tauxFinal: product.taux,
          montantFinal: product.estimatedGain,
          dureeFinale: product.duree,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log(`   📝 Insertion de ${product.nom}:`, JSON.stringify(insertData, null, 2));

        const { data: savedProduct, error: saveError } = await supabaseService
          .from('ClientProduitEligible')
          .insert(insertData)
          .select()
          .single();

        if (saveError) {
          console.log(`   ❌ Erreur pour ${product.nom}: ${saveError.message}`);
        } else {
          console.log(`   ✅ ${product.nom} sauvegardé (ID: ${savedProduct.id})`);
          savedProducts.push(savedProduct);
        }

      } catch (error) {
        console.log(`   ❌ Erreur générale pour ${product.nom}: ${error.message}`);
      }
    }

    // 4. Vérification finale
    console.log('\n3️⃣ Vérification finale...');
    
    // Vérifier la simulation
    const { data: finalSimulation, error: finalSimError } = await supabaseService
      .from('Simulation')
      .select('*')
      .eq('id', simulation.id)
      .single();

    if (finalSimError) {
      console.log(`❌ Erreur vérification simulation: ${finalSimError.message}`);
    } else {
      console.log(`✅ Simulation vérifiée:`);
      console.log(`   - ID: ${finalSimulation.id}`);
      console.log(`   - Client: ${finalSimulation.clientId}`);
      console.log(`   - Statut: ${finalSimulation.statut}`);
      console.log(`   - Score: ${finalSimulation.score}`);
    }

    // Vérifier les produits éligibles
    const { data: finalProducts, error: finalProductsError } = await supabaseService
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', testClientId)
      .eq('simulationId', simulation.id);

    if (finalProductsError) {
      console.log(`❌ Erreur vérification produits: ${finalProductsError.message}`);
    } else {
      console.log(`✅ ${finalProducts.length} produits éligibles trouvés pour cette simulation`);
      
      if (finalProducts.length > 0) {
        console.log('\n📊 Détails des produits éligibles:');
        finalProducts.forEach((entry, index) => {
          console.log(`   ${index + 1}. ID: ${entry.id}`);
          console.log(`      ProduitId: ${entry.produitId}`);
          console.log(`      Statut: ${entry.statut}`);
          console.log(`      Montant: ${entry.montantFinal}€`);
          console.log(`      Taux: ${entry.tauxFinal}`);
          console.log(`      Durée: ${entry.dureeFinale} mois`);
          console.log('');
        });
      }
    }

    console.log('\n✅ Test complet d\'insertion terminé !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testCompleteInsertion(); 