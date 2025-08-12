const axios = require('axios');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function testExpertRoute() {
  console.log('🧪 Test de la route expert/select...');
  
  try {
    // Test 1: OPTIONS request (preflight)
    console.log('\n1. Test OPTIONS request...');
    const optionsResponse = await axios.options(`${API_URL}/api/dossier-steps/expert/select`);
    console.log('✅ OPTIONS request réussie:', optionsResponse.status);
    console.log('Headers CORS:', optionsResponse.headers);
    
    // Test 2: POST request (sans auth pour voir si la route existe)
    console.log('\n2. Test POST request (sans auth)...');
    try {
      const postResponse = await axios.post(`${API_URL}/api/dossier-steps/expert/select`, {
        dossier_id: 'test',
        expert_id: 'test'
      });
      console.log('❌ POST request a réussi (ne devrait pas sans auth):', postResponse.status);
    } catch (error) {
      if (error.response) {
        console.log('✅ POST request rejetée comme attendu:', error.response.status);
        console.log('Message:', error.response.data.message);
      } else {
        console.log('❌ Erreur réseau:', error.message);
      }
    }
    
    // Test 3: Vérifier si la route existe avec une requête GET
    console.log('\n3. Test GET request (pour voir si la route existe)...');
    try {
      const getResponse = await axios.get(`${API_URL}/api/dossier-steps/expert/select`);
      console.log('❌ GET request a réussi (ne devrait pas):', getResponse.status);
    } catch (error) {
      if (error.response) {
        console.log('✅ GET request rejetée comme attendu:', error.response.status);
        console.log('Message:', error.response.data.message);
      } else {
        console.log('❌ Erreur réseau:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testExpertRoute();
