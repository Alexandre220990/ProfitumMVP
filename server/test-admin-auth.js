const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testAdminAuth() {
  console.log('🧪 Test d\'authentification admin...\n');

  try {
    // Test 1: Connexion avec les identifiants admin
    console.log('1️⃣ Connexion admin:');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'grandjean.alexandre5@gmail.com',
      password: 'Adminprofitum'
    });

    if (loginResponse.data.success) {
      console.log('✅ Connexion réussie');
      const token = loginResponse.data.data.token;
      console.log('Token obtenu:', token ? '✅' : '❌');

      // Test 2: Accès à la documentation avec le token
      console.log('\n2️⃣ Test accès documentation:');
      try {
        const docResponse = await axios.get(`${BASE_URL}/api/documentation/categories`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (docResponse.data.success) {
          console.log('✅ Accès à la documentation réussi');
          console.log('Catégories trouvées:', docResponse.data.data?.length || 0);
        } else {
          console.log('❌ Erreur accès documentation:', docResponse.data.message);
        }
      } catch (error) {
        console.log('❌ Erreur accès documentation:', error.response?.status, error.response?.data?.message);
      }

      // Test 3: Test des stats de documentation
      console.log('\n3️⃣ Test stats documentation:');
      try {
        const statsResponse = await axios.get(`${BASE_URL}/api/documentation/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (statsResponse.data.success) {
          console.log('✅ Stats documentation récupérées');
          console.log('Total documents:', statsResponse.data.data?.totalDocuments || 0);
        } else {
          console.log('❌ Erreur stats:', statsResponse.data.message);
        }
      } catch (error) {
        console.log('❌ Erreur stats:', error.response?.status, error.response?.data?.message);
      }

    } else {
      console.log('❌ Échec de la connexion:', loginResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.response?.data || error.message);
  }
}

// Attendre que le serveur soit prêt
setTimeout(testAdminAuth, 3000); 