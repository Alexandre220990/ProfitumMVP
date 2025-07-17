// Test simple pour vérifier la structure de réponse de l'API
const axios = require('axios');

async function testApiResponse() {
  console.log('🔍 Test de la structure de réponse API\n');

  try {
    // Connexion client
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'grandjean.laporte@gmail.com',
      password: 'profitum'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Échec connexion:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Connexion réussie');

    // Test API produits éligibles
    const response = await axios.get('http://localhost:5001/api/produits-eligibles/client/25274ba6-67e6-4151-901c-74851fe2d82a', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📊 Structure de la réponse:');
    console.log('response.status:', response.status);
    console.log('response.data:', JSON.stringify(response.data, null, 2));
    
    console.log('\n🔍 Analyse de la structure:');
    console.log('response.data.success:', response.data.success);
    console.log('response.data.data:', Array.isArray(response.data.data) ? `${response.data.data.length} éléments` : response.data.data);
    console.log('response.data.message:', response.data.message);

    // Simulation de handleResponse
    const handleResponse = (response) => {
      if (response.data) {
        // Ancienne logique (problématique)
        const oldResult = {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
        
        // Nouvelle logique (corrigée)
        const newResult = {
          success: response.data.success,
          data: response.data.data,
          message: response.data.message
        };
        
        return { oldResult, newResult };
      }
    };

    const result = handleResponse(response);
    console.log('\n🔄 Comparaison des résultats:');
    console.log('Ancien résultat:', JSON.stringify(result.oldResult, null, 2));
    console.log('Nouveau résultat:', JSON.stringify(result.newResult, null, 2));

  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

testApiResponse(); 