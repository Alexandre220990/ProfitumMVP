const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Utiliser la clé de service pour contourner RLS
const supabaseService = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function testWithServiceKey() {
  console.log('🔑 Test avec la clé de service (contourne RLS)\n');

  const testClientId = '0538de29-4287-4c28-b76a-b65ef993f393';
  
  try {
    // 1. Test de mise à jour avec service key
    console.log('1️⃣ Test de mise à jour avec service key...');
    
    const updateData = {
      nombreEmployes: 25,
      secteurActivite: 'Technologie',
      chiffreAffaires: 1500000.00,
      statut: 'actif',
      derniereConnexion: new Date().toISOString(),
      notes: 'Client mis à jour via service key',
      metadata: {
        source: 'service-key-test',
        version: '1.0',
        lastTest: new Date().toISOString()
      }
    };

    console.log('📝 Données de mise à jour:', JSON.stringify(updateData, null, 2));

    const { data: updatedClient, error: updateError } = await supabaseService
      .from('Client')
      .update(updateData)
      .eq('id', testClientId)
      .select()
      .single();

    if (updateError) {
      console.log(`❌ Erreur de mise à jour: ${updateError.message}`);
      console.log('Détails:', updateError);
    } else {
      console.log(`✅ Client mis à jour avec succès!`);
      console.log('📊 Nouvelles données:');
      console.log(`   - Nombre d'employés: ${updatedClient.nombreEmployes}`);
      console.log(`   - Secteur: ${updatedClient.secteurActivite}`);
      console.log(`   - CA: ${updatedClient.chiffreAffaires}`);
      console.log(`   - Statut: ${updatedClient.statut}`);
      console.log(`   - Notes: ${updatedClient.notes}`);
    }

    // 2. Test d'insertion dans Simulation avec service key
    console.log('\n2️⃣ Test d\'insertion dans Simulation...');
    
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
          source: 'service-key-test'
        },
        score: 85,
        tempsCompletion: 120
      })
      .select()
      .single();

    if (simError) {
      console.log(`❌ Erreur création simulation: ${simError.message}`);
    } else {
      console.log(`✅ Simulation créée avec l'ID: ${simulation.id}`);
    }

    // 3. Test d'insertion dans ClientProduitEligible
    if (simulation) {
      console.log('\n3️⃣ Test d\'insertion dans ClientProduitEligible...');
      
      // Trouver un produit TICPE
      const { data: produit, error: produitError } = await supabaseService
        .from('ProduitEligible')
        .select('*')
        .eq('nom', 'TICPE')
        .single();

      if (produitError || !produit) {
        console.log(`❌ Produit TICPE non trouvé: ${produitError?.message}`);
      } else {
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
          .select()
          .single();

        if (saveError) {
          console.log(`❌ Erreur sauvegarde produit: ${saveError.message}`);
        } else {
          console.log(`✅ Produit éligible sauvegardé (ID: ${savedProduct.id})`);
        }
      }
    }

    console.log('\n✅ Test avec service key terminé !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testWithServiceKey(); 