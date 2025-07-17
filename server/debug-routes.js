const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function debugRoutes() {
  console.log('🔍 Diagnostic complet des routes...\n');

  try {
    // Test 1: Connexion admin
    console.log('1️⃣ Connexion admin:');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'grandjean.alexandre5@gmail.com',
      password: 'Adminprofitum'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Échec de la connexion:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Connexion réussie');

    // Test 2: Routes qui fonctionnent
    console.log('\n2️⃣ Routes qui fonctionnent:');
    const workingRoutes = [
      '/api/auth/check',
      '/api/monitoring/health',
      '/api/tests/categories'
    ];

    for (const route of workingRoutes) {
      try {
        const response = await axios.get(`${BASE_URL}${route}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`✅ ${route} - ${response.status}`);
      } catch (error) {
        console.log(`❌ ${route} - ${error.response?.status || 'N/A'}`);
      }
    }

    // Test 3: Routes de documentation avec debug
    console.log('\n3️⃣ Debug des routes de documentation:');
    const docRoutes = [
      '/api/documentation/categories',
      '/api/documentation/stats',
      '/api/documentation/search?q=test'
    ];

    for (const route of docRoutes) {
      try {
        console.log(`\n🔄 Test de ${route}:`);
        const response = await axios.get(`${BASE_URL}${route}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
        
        console.log(`✅ Succès (${response.status})`);
        console.log('   Headers:', Object.keys(response.headers));
        console.log('   Data:', typeof response.data);
      } catch (error) {
        console.log(`❌ Erreur (${error.response?.status || 'N/A'}):`);
        console.log('   Message:', error.response?.data?.message || error.message);
        console.log('   Headers:', error.response?.headers ? Object.keys(error.response.headers) : 'Aucun');
        
        if (error.response?.data) {
          console.log('   Response data:', error.response.data);
        }
      }
    }

    // Test 4: Routes alternatives
    console.log('\n4️⃣ Test de routes alternatives:');
    const altRoutes = [
      '/documentation/categories',
      '/documentation/stats',
      '/api/admin/documentation/categories'
    ];

    for (const route of altRoutes) {
      try {
        const response = await axios.get(`${BASE_URL}${route}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`✅ ${route} - ${response.status}`);
      } catch (error) {
        console.log(`❌ ${route} - ${error.response?.status || 'N/A'}`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

debugRoutes(); 