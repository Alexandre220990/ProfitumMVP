const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
const CLIENT_ID = '25274ba6-67e6-4151-901c-74851fe2d82a';

async function testProduitsSimple() {
  console.log('🔍 Test simple des produits éligibles\n');

  try {
    // 1. Connexion admin
    console.log('1️⃣ Connexion admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'grandjean.alexandre5@gmail.com',
      password: 'Adminprofitum'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Échec connexion admin:', loginResponse.data.message);
      return;
    }

    const adminToken = loginResponse.data.data.token;
    console.log('✅ Connexion admin réussie');

    // 2. Connexion client
    console.log('\n2️⃣ Connexion client...');
    const clientLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'grandjean.laporte@gmail.com',
      password: 'profitum'
    });

    if (!clientLoginResponse.data.success) {
      console.log('❌ Échec connexion client:', clientLoginResponse.data.message);
      return;
    }

    const clientToken = clientLoginResponse.data.data.token;
    console.log('✅ Connexion client réussie');

    // 3. Test avec token admin
    console.log('\n3️⃣ Test API avec token admin...');
    try {
      const adminResponse = await axios.get(`${BASE_URL}/api/produits-eligibles/client/${CLIENT_ID}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Réponse admin - Status:', adminResponse.status);
      console.log('✅ Réponse admin - Data:', JSON.stringify(adminResponse.data, null, 2));
    } catch (adminError) {
      console.log('❌ Erreur admin:', adminError.response?.status, adminError.response?.data);
    }

    // 4. Test avec token client
    console.log('\n4️⃣ Test API avec token client...');
    try {
      const clientResponse = await axios.get(`${BASE_URL}/api/produits-eligibles/client/${CLIENT_ID}`, {
        headers: {
          'Authorization': `Bearer ${clientToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Réponse client - Status:', clientResponse.status);
      console.log('✅ Réponse client - Data:', JSON.stringify(clientResponse.data, null, 2));
    } catch (clientError) {
      console.log('❌ Erreur client:', clientError.response?.status, clientError.response?.data);
    }

    // 5. Test sans token
    console.log('\n5️⃣ Test API sans token...');
    try {
      const noTokenResponse = await axios.get(`${BASE_URL}/api/produits-eligibles/client/${CLIENT_ID}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Réponse sans token - Status:', noTokenResponse.status);
      console.log('✅ Réponse sans token - Data:', JSON.stringify(noTokenResponse.data, null, 2));
    } catch (noTokenError) {
      console.log('❌ Erreur sans token:', noTokenError.response?.status, noTokenError.response?.data);
    }

    // 6. Vérifier la route directement
    console.log('\n6️⃣ Test route directe...');
    try {
      const directResponse = await axios.get(`${BASE_URL}/api/produits-eligibles/client/${CLIENT_ID}`);
      console.log('✅ Route directe - Status:', directResponse.status);
      console.log('✅ Route directe - Data:', JSON.stringify(directResponse.data, null, 2));
    } catch (directError) {
      console.log('❌ Erreur route directe:', directError.response?.status, directError.response?.data);
    }

    // 7. Test de la base de données via l'API
    console.log('\n7️⃣ Test base de données via API...');
    try {
      const dbResponse = await axios.get(`${BASE_URL}/api/admin/check-client-produits/${CLIENT_ID}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      console.log('✅ DB via API - Status:', dbResponse.status);
      console.log('✅ DB via API - Data:', JSON.stringify(dbResponse.data, null, 2));
    } catch (dbError) {
      console.log('❌ Erreur DB via API:', dbError.response?.status, dbError.response?.data);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testProduitsSimple(); 