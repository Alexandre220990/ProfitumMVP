const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Utiliser la clé anon maintenant que RLS est désactivé
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testWithoutRLS() {
  console.log('🧪 Test sans RLS (RLS désactivé)\n');

  const testClientId = '0538de29-4287-4c28-b76a-b65ef993f393';
  
  try {
    // 1. Test de lecture simple
    console.log('1️⃣ Test de lecture simple...');
    
    const { data: client, error: readError } = await supabase
      .from('Client')
      .select('id, email, username, nombreEmployes, statut')
      .eq('id', testClientId)
      .single();

    if (readError) {
      console.log(`❌ Erreur lecture: ${readError.message}`);
      return;
    }

    console.log('✅ Lecture réussie:');
    console.log(`   - ID: ${client.id}`);
    console.log(`   - Email: ${client.email}`);
    console.log(`   - Username: ${client.username}`);
    console.log(`   - Employés: ${client.nombreEmployes}`);
    console.log(`   - Statut: ${client.statut}`);

    // 2. Test de mise à jour
    console.log('\n2️⃣ Test de mise à jour...');
    
    const { data: updatedClient, error: updateError } = await supabase
      .from('Client')
      .update({ 
        notes: 'Test sans RLS ' + new Date().toISOString(),
        derniereConnexion: new Date().toISOString()
      })
      .eq('id', testClientId)
      .select('id, notes, derniereConnexion')
      .single();

    if (updateError) {
      console.log(`❌ Erreur mise à jour: ${updateError.message}`);
    } else {
      console.log('✅ Mise à jour réussie:');
      console.log(`   - Notes: ${updatedClient.notes}`);
      console.log(`   - Dernière connexion: ${updatedClient.derniereConnexion}`);
    }

    // 3. Test d'insertion dans Simulation
    console.log('\n3️⃣ Test d\'insertion dans Simulation...');
    
    const { data: simulation, error: simError } = await supabase
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
          source: 'no-rls-test'
        },
        score: 90,
        tempsCompletion: 100
      })
      .select('id, clientId, statut, score')
      .single();

    if (simError) {
      console.log(`❌ Erreur création simulation: ${simError.message}`);
    } else {
      console.log('✅ Simulation créée:');
      console.log(`   - ID: ${simulation.id}`);
      console.log(`   - Client: ${simulation.clientId}`);
      console.log(`   - Statut: ${simulation.statut}`);
      console.log(`   - Score: ${simulation.score}`);
    }

    // 4. Test d'insertion dans ClientProduitEligible
    if (simulation) {
      console.log('\n4️⃣ Test d\'insertion dans ClientProduitEligible...');
      
      // Trouver un produit
      const { data: produit, error: produitError } = await supabase
        .from('ProduitEligible')
        .select('id, nom')
        .eq('nom', 'TICPE')
        .single();

      if (produitError || !produit) {
        console.log(`❌ Produit TICPE non trouvé: ${produitError?.message}`);
      } else {
        const { data: savedProduct, error: saveError } = await supabase
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
          .select('id, produitId, statut, montantFinal')
          .single();

        if (saveError) {
          console.log(`❌ Erreur sauvegarde: ${saveError.message}`);
        } else {
          console.log('✅ Produit éligible sauvegardé:');
          console.log(`   - ID: ${savedProduct.id}`);
          console.log(`   - ProduitId: ${savedProduct.produitId}`);
          console.log(`   - Statut: ${savedProduct.statut}`);
          console.log(`   - Montant: ${savedProduct.montantFinal}€`);
        }
      }
    }

    console.log('\n✅ Test sans RLS terminé !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testWithoutRLS(); 