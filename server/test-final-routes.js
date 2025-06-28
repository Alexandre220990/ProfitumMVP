const axios = require('axios');

async function testFinalRoutes() {
  console.log('🧪 Test final des routes API\n');

  const baseURL = 'http://localhost:5001';
  const testClientId = '0538de29-4287-4c28-b76a-b65ef993f393';
  
  try {
    // 1. Test de la route produits-eligibles
    console.log('1️⃣ Test de la route /api/produits-eligibles/client/:clientId');
    
    try {
      const response = await axios.get(`${baseURL}/api/produits-eligibles/client/${testClientId}`);
      console.log('✅ Route produits-eligibles fonctionne:');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Success: ${response.data.success}`);
      console.log(`   - Produits trouvés: ${response.data.data?.length || 0}`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log('   - Détails des produits:');
        response.data.data.forEach((prod, index) => {
          console.log(`     ${index + 1}. ${prod.produit?.nom || 'N/A'} - ${prod.montant_final}€`);
        });
      }
    } catch (error) {
      console.log(`❌ Erreur route produits-eligibles: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // 2. Test de la route simulations check-recent
    console.log('\n2️⃣ Test de la route /api/simulations/check-recent/:clientId');
    
    try {
      const response = await axios.get(`${baseURL}/api/simulations/check-recent/${testClientId}`);
      console.log('✅ Route simulations check-recent fonctionne:');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Success: ${response.data.success}`);
      console.log(`   - Simulation récente: ${response.data.hasRecentSimulation}`);
      
      if (response.data.data?.simulation) {
        console.log(`   - Simulation ID: ${response.data.data.simulation.id}`);
        console.log(`   - Type: ${response.data.data.simulation.type}`);
        console.log(`   - Score: ${response.data.data.simulation.score}`);
      }
    } catch (error) {
      console.log(`❌ Erreur route simulations: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // 3. Test de la route debug
    console.log('\n3️⃣ Test de la route debug');
    
    try {
      const response = await axios.get(`${baseURL}/api/produits-eligibles/debug`);
      console.log('✅ Route debug fonctionne:');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Message: ${response.data.message}`);
    } catch (error) {
      console.log(`❌ Erreur route debug: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    console.log('\n✅ Test final terminé !');
    console.log('\n📋 Le dashboard devrait maintenant fonctionner correctement avec:');
    console.log('   - Affichage des produits éligibles');
    console.log('   - Détection des simulations récentes');
    console.log('   - Calcul des gains potentiels');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Attendre un peu que le serveur démarre
setTimeout(() => {
  testFinalRoutes();
}, 3000); 