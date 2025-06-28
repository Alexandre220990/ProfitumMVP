const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkClientExistence() {
  console.log('🔍 Vérification de l\'existence du client\n');

  const testClientId = '0538de29-4287-4c28-b76a-b65ef993f393';
  
  try {
    // 1. Lister tous les clients
    console.log('1️⃣ Liste de tous les clients...');
    
    const { data: allClients, error: listError } = await supabase
      .from('Client')
      .select('id, nom, email, "nombreEmployes", statut')
      .limit(10);

    if (listError) {
      console.log(`❌ Erreur lors de la liste: ${listError.message}`);
      return;
    }

    console.log(`✅ ${allClients.length} clients trouvés:`);
    allClients.forEach((client, index) => {
      console.log(`   ${index + 1}. ID: ${client.id}`);
      console.log(`      Nom: ${client.nom || 'Non défini'}`);
      console.log(`      Email: ${client.email}`);
      console.log(`      Employés: ${client.nombreEmployes || 'Non défini'}`);
      console.log(`      Statut: ${client.statut || 'Non défini'}`);
      console.log('');
    });

    // 2. Vérifier le client spécifique
    console.log('2️⃣ Vérification du client spécifique...');
    
    const { data: specificClient, error: specificError } = await supabase
      .from('Client')
      .select('*')
      .eq('id', testClientId);

    if (specificError) {
      console.log(`❌ Erreur lors de la recherche: ${specificError.message}`);
      return;
    }

    if (specificClient.length === 0) {
      console.log(`❌ Client avec l'ID ${testClientId} non trouvé`);
      
      // 3. Créer le client s'il n'existe pas
      console.log('\n3️⃣ Création du client...');
      const { data: newClient, error: createError } = await supabase
        .from('Client')
        .insert({
          id: testClientId,
          nom: 'Alexandre Grandjean',
          email: 'grandjean.alexandre5@gmail.com',
          nombreEmployes: 25,
          secteurActivite: 'Technologie',
          chiffreAffaires: 1500000.00,
          statut: 'actif',
          dateCreation: new Date().toISOString(),
          derniereConnexion: new Date().toISOString(),
          notes: 'Client créé via script de test',
          metadata: {
            source: 'test-script',
            version: '1.0'
          }
        })
        .select()
        .single();

      if (createError) {
        console.log(`❌ Erreur création: ${createError.message}`);
        console.log('Détails:', createError);
      } else {
        console.log(`✅ Client créé avec succès!`);
        console.log('📊 Détails:', JSON.stringify(newClient, null, 2));
      }
    } else {
      console.log(`✅ Client trouvé (${specificClient.length} entrées):`);
      specificClient.forEach((client, index) => {
        console.log(`   ${index + 1}. ID: ${client.id}`);
        console.log(`      Nom: ${client.nom || 'Non défini'}`);
        console.log(`      Email: ${client.email}`);
        console.log(`      Employés: ${client.nombreEmployes || 'Non défini'}`);
        console.log(`      Statut: ${client.statut || 'Non défini'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
checkClientExistence(); 