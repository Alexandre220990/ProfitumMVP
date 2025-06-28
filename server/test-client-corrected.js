const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testClientCorrected() {
  console.log('🧪 Test de la table Client avec les vraies colonnes\n');

  const testClientId = '0538de29-4287-4c28-b76a-b65ef993f393';
  
  try {
    // 1. Vérifier le client existant
    console.log('1️⃣ Vérification du client existant...');
    
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('*')
      .eq('id', testClientId)
      .single();

    if (clientError) {
      console.log(`❌ Erreur lors de la récupération: ${clientError.message}`);
      return;
    }

    console.log('✅ Client trouvé:');
    console.log(`   - ID: ${client.id}`);
    console.log(`   - Email: ${client.email}`);
    console.log(`   - Username: ${client.username}`);
    console.log(`   - Company: ${client.company_name}`);
    console.log(`   - Nombre d'employés: ${client.nombreEmployes}`);
    console.log(`   - Chiffre d'affaires: ${client.chiffreAffaires}`);
    console.log(`   - Secteur: ${client.secteurActivite}`);
    console.log(`   - Statut: ${client.statut}`);

    // 2. Tester la mise à jour avec les vraies colonnes
    console.log('\n2️⃣ Test de mise à jour avec les vraies colonnes...');
    
    const updateData = {
      nombreEmployes: 25,           // Devrait être integer
      secteurActivite: 'Technologie', // Devrait être string
      chiffreAffaires: 1500000.00,  // Devrait être decimal
      statut: 'actif',
      derniereConnexion: new Date().toISOString(),
      notes: 'Client testé via script',
      metadata: {
        source: 'test-script',
        version: '1.0',
        lastTest: new Date().toISOString()
      }
    };

    console.log('📝 Données de mise à jour:', JSON.stringify(updateData, null, 2));

    const { data: updatedClient, error: updateError } = await supabase
      .from('Client')
      .update(updateData)
      .eq('id', testClientId)
      .select()
      .single();

    if (updateError) {
      console.log(`❌ Erreur de mise à jour: ${updateError.message}`);
      console.log('Détails:', updateError);
      
      // 3. Vérifier si c'est un problème de type
      console.log('\n3️⃣ Test avec des types différents...');
      
      // Test avec des valeurs JSON
      const updateDataJSON = {
        nombreEmployes: { value: 25, unit: 'employés' },
        secteurActivite: { value: 'Technologie', code: 'TECH' },
        chiffreAffaires: { value: 1500000.00, currency: 'EUR' },
        statut: 'actif',
        derniereConnexion: new Date().toISOString(),
        notes: 'Client testé via script (format JSON)',
        metadata: {
          source: 'test-script',
          version: '1.0',
          lastTest: new Date().toISOString()
        }
      };

      console.log('📝 Test avec format JSON:', JSON.stringify(updateDataJSON, null, 2));

      const { data: updatedClientJSON, error: updateErrorJSON } = await supabase
        .from('Client')
        .update(updateDataJSON)
        .eq('id', testClientId)
        .select()
        .single();

      if (updateErrorJSON) {
        console.log(`❌ Erreur avec JSON aussi: ${updateErrorJSON.message}`);
      } else {
        console.log(`✅ Mise à jour JSON réussie!`);
        console.log('📊 Nouvelles données:');
        console.log(`   - Nombre d'employés: ${JSON.stringify(updatedClientJSON.nombreEmployes)}`);
        console.log(`   - Secteur: ${JSON.stringify(updatedClientJSON.secteurActivite)}`);
        console.log(`   - CA: ${JSON.stringify(updatedClientJSON.chiffreAffaires)}`);
        console.log(`   - Statut: ${updatedClientJSON.statut}`);
      }
    } else {
      console.log(`✅ Client mis à jour avec succès!`);
      console.log('📊 Nouvelles données:');
      console.log(`   - Nombre d'employés: ${updatedClient.nombreEmployes}`);
      console.log(`   - Secteur: ${updatedClient.secteurActivite}`);
      console.log(`   - CA: ${updatedClient.chiffreAffaires}`);
      console.log(`   - Statut: ${updatedClient.statut}`);
    }

    console.log('\n✅ Test de la table Client terminé !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testClientCorrected(); 