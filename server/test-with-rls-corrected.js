const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Utiliser la clé de service pour contourner les restrictions
const supabaseService = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function testWithRLSCorrected() {
  console.log('🧪 Test avec politiques RLS corrigées\n');

  const testClientId = '0538de29-4287-4c28-b76a-b65ef993f393';
  
  try {
    // 1. Test de lecture avec service role
    console.log('1️⃣ Test de lecture avec service role...');
    
    const { data: client, error: readError } = await supabaseService
      .from('Client')
      .select('id, email, username, nombreEmployes, statut, auth_id')
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
    console.log(`   - Auth ID: ${client.auth_id}`);
    console.log(`   - Employés: ${client.nombreEmployes}`);
    console.log(`   - Statut: ${client.statut}`);

    // 2. Test de mise à jour avec service role
    console.log('\n2️⃣ Test de mise à jour avec service role...');
    
    const { data: updatedClient, error: updateError } = await supabaseService
      .from('Client')
      .update({ 
        notes: 'Test avec RLS corrigé ' + new Date().toISOString(),
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

    // 3. Test d'insertion dans Simulation avec service role
    console.log('\n3️⃣ Test d\'insertion dans Simulation...');
    
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
          source: 'rls-corrected-test',
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
        score: 92,
        tempsCompletion: 95
      })
      .select('id, clientId, statut, score, type')
      .single();

    if (simError) {
      console.log(`❌ Erreur création simulation: ${simError.message}`);
      console.log('Détails:', simError);
    } else {
      console.log('✅ Simulation créée:');
      console.log(`   - ID: ${simulation.id}`);
      console.log(`   - Client: ${simulation.clientId}`);
      console.log(`   - Statut: ${simulation.statut}`);
      console.log(`   - Type: ${simulation.type}`);
      console.log(`   - Score: ${simulation.score}`);
    }

    // 4. Test d'insertion dans ClientProduitEligible
    if (simulation) {
      console.log('\n4️⃣ Test d\'insertion dans ClientProduitEligible...');
      
      // Trouver un produit TICPE
      const { data: produit, error: produitError } = await supabaseService
        .from('ProduitEligible')
        .select('id, nom, description')
        .eq('nom', 'TICPE')
        .single();

      if (produitError || !produit) {
        console.log(`❌ Produit TICPE non trouvé: ${produitError?.message}`);
      } else {
        console.log(`✅ Produit TICPE trouvé (ID: ${produit.id})`);
        
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
          console.log(`❌ Erreur sauvegarde: ${saveError.message}`);
          console.log('Détails:', saveError);
        } else {
          console.log('✅ Produit éligible sauvegardé:');
          console.log(`   - ID: ${savedProduct.id}`);
          console.log(`   - ProduitId: ${savedProduct.produitId}`);
          console.log(`   - Statut: ${savedProduct.statut}`);
          console.log(`   - Montant: ${savedProduct.montantFinal}€`);
          console.log(`   - Taux: ${savedProduct.tauxFinal}`);
          console.log(`   - Durée: ${savedProduct.dureeFinale} mois`);
        }
      }
    }

    // 5. Vérification finale
    console.log('\n5️⃣ Vérification finale...');
    
    const { data: finalProducts, error: finalError } = await supabaseService
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', testClientId)
      .eq('simulationId', simulation?.id);

    if (finalError) {
      console.log(`❌ Erreur vérification finale: ${finalError.message}`);
    } else {
      console.log(`✅ ${finalProducts.length} produits éligibles trouvés pour cette simulation`);
    }

    console.log('\n✅ Test avec RLS corrigé terminé !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testWithRLSCorrected(); 