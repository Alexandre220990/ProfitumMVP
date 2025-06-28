const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugNewClient() {
  console.log('🔍 Debug du nouveau client\n');

  const newClientId = 'e4dd024b-c6d7-41c5-9c7e-2faf3fdfbb01';
  const oldClientId = '0538de29-4287-4c28-b76a-b65ef993f393';
  
  try {
    // 1. Vérifier si le nouveau client existe
    console.log('1️⃣ Vérification du nouveau client...');
    const { data: newClient, error: newClientError } = await supabase
      .from('Client')
      .select('*')
      .eq('id', newClientId)
      .single();

    if (newClientError) {
      console.log(`❌ Nouveau client non trouvé: ${newClientError.message}`);
    } else {
      console.log(`✅ Nouveau client trouvé:`);
      console.log(`   - ID: ${newClient.id}`);
      console.log(`   - Email: ${newClient.email}`);
      console.log(`   - Nom: ${newClient.nom}`);
      console.log(`   - Créé le: ${newClient.created_at}`);
      console.log('');
    }

    // 2. Comparer avec l'ancien client
    console.log('2️⃣ Comparaison avec l\'ancien client...');
    const { data: oldClient, error: oldClientError } = await supabase
      .from('Client')
      .select('*')
      .eq('id', oldClientId)
      .single();

    if (oldClientError) {
      console.log(`❌ Ancien client non trouvé: ${oldClientError.message}`);
    } else {
      console.log(`✅ Ancien client trouvé:`);
      console.log(`   - ID: ${oldClient.id}`);
      console.log(`   - Email: ${oldClient.email}`);
      console.log(`   - Nom: ${oldClient.nom}`);
      console.log(`   - Créé le: ${oldClient.created_at}`);
      console.log('');
    }

    // 3. Vérifier les produits éligibles du nouveau client
    console.log('3️⃣ Vérification des produits éligibles du nouveau client...');
    const { data: newClientProduits, error: newProdError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', newClientId);

    if (newProdError) {
      console.log(`❌ Erreur produits nouveau client: ${newProdError.message}`);
    } else {
      console.log(`✅ ${newClientProduits?.length || 0} produits pour le nouveau client`);
    }

    // 4. Vérifier les simulations du nouveau client
    console.log('4️⃣ Vérification des simulations du nouveau client...');
    const { data: newClientSims, error: newSimError } = await supabase
      .from('Simulation')
      .select('*')
      .eq('clientId', newClientId);

    if (newSimError) {
      console.log(`❌ Erreur simulations nouveau client: ${newSimError.message}`);
    } else {
      console.log(`✅ ${newClientSims?.length || 0} simulations pour le nouveau client`);
      if (newClientSims && newClientSims.length > 0) {
        newClientSims.forEach((sim, index) => {
          console.log(`   ${index + 1}. ID: ${sim.id}, Type: ${sim.type}, Statut: ${sim.statut}`);
        });
      }
    }

    console.log('\n✅ Debug terminé !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

debugNewClient(); 