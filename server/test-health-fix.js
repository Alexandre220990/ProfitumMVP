const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testHealthFix() {
  console.log('🧪 Test après correction de la route /api/health...\n');

  try {
    // Test 1: Route de santé
    console.log('1️⃣ Test de /api/health:');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/api/health`);
      console.log('✅ Route de santé accessible:', healthResponse.data);
    } catch (error) {
      console.log('❌ Route de santé inaccessible:', error.response?.status, error.response?.data?.message);
    }

    // Test 2: Connexion admin
    console.log('\n2️⃣ Test de connexion admin:');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'grandjean.alexandre5@gmail.com',
        password: 'Adminprofitum'
      });

      if (loginResponse.data.success) {
        console.log('✅ Connexion réussie');
        const token = loginResponse.data.data.token;

        // Test 3: Routes de documentation
        console.log('\n3️⃣ Test des routes de documentation:');
        const docRoutes = [
          '/api/documentation/categories',
          '/api/documentation/stats'
        ];

        for (const route of docRoutes) {
          try {
            console.log(`\n🔄 Test de ${route}:`);
            const response = await axios.get(`${BASE_URL}${route}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            console.log(`✅ Succès (${response.status})`);
            if (response.data.success) {
              console.log(`   Données reçues`);
            }
          } catch (error) {
            console.log(`❌ Erreur (${error.response?.status || 'N/A'}):`, error.response?.data?.message || error.message);
          }
        }
      } else {
        console.log('❌ Échec de la connexion:', loginResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Erreur de connexion:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testHealthFix(); 