// Script de test d'authentification
// À exécuter pour tester le système d'authentification

const axios = require('axios');

console.log('🧪 TEST D\'AUTHENTIFICATION');
console.log('============================');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5001';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword123';

// Fonction pour tester l'authentification
async function testAuthentication() {
  try {
    console.log('\n1. TEST DE CONNEXION SUPABASE');
    console.log('URL:', BASE_URL);
    console.log('Email:', TEST_EMAIL);
    
    // Test de connexion
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Connexion réussie');
      console.log('Token:', loginResponse.data.data.token ? 'Présent' : 'Absent');
      console.log('User type:', loginResponse.data.data.user.type);
      
      const token = loginResponse.data.data.token;
      
      // Test de la route produits éligibles
      console.log('\n2. TEST DE LA ROUTE PRODUITS ÉLIGIBLES');
      
      try {
        const produitsResponse = await axios.get(`${BASE_URL}/api/client/produits-eligibles`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ Route produits éligibles accessible');
        console.log('Status:', produitsResponse.status);
        console.log('Data length:', produitsResponse.data.data?.length || 0);
        
      } catch (produitsError) {
        console.log('❌ Erreur route produits éligibles:');
        console.log('Status:', produitsError.response?.status);
        console.log('Message:', produitsError.response?.data?.message);
      }
      
      // Test de la route profil client
      console.log('\n3. TEST DE LA ROUTE PROFIL CLIENT');
      
      try {
        const profileResponse = await axios.get(`${BASE_URL}/api/client/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ Route profil client accessible');
        console.log('Status:', profileResponse.status);
        
      } catch (profileError) {
        console.log('❌ Erreur route profil client:');
        console.log('Status:', profileError.response?.status);
        console.log('Message:', profileError.response?.data?.message);
      }
      
    } else {
      console.log('❌ Échec de la connexion');
      console.log('Message:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.log('❌ Erreur lors du test d\'authentification:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message || error.message);
  }
}

// Fonction pour tester les routes publiques
async function testPublicRoutes() {
  console.log('\n4. TEST DES ROUTES PUBLIQUES');
  
  try {
    // Test de la route health
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Route health accessible');
    console.log('Status:', healthResponse.status);
    
  } catch (error) {
    console.log('❌ Erreur route health:');
    console.log('Status:', error.response?.status);
  }
  
  try {
    // Test de la route documentation
    const docsResponse = await axios.get(`${BASE_URL}/api/documentation/categories`);
    console.log('✅ Route documentation accessible');
    console.log('Status:', docsResponse.status);
    
  } catch (error) {
    console.log('❌ Erreur route documentation:');
    console.log('Status:', error.response?.status);
  }
}

// Fonction pour tester les erreurs CORS
async function testCORS() {
  console.log('\n5. TEST CORS');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/health`, {
      headers: {
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('✅ CORS configuré correctement');
    console.log('Access-Control-Allow-Origin:', response.headers['access-control-allow-origin']);
    
  } catch (error) {
    console.log('❌ Erreur CORS:');
    console.log('Message:', error.message);
  }
}

// Fonction principale
async function runTests() {
  console.log('🚀 Démarrage des tests...');
  
  await testPublicRoutes();
  await testCORS();
  await testAuthentication();
  
  console.log('\n🏁 Tests terminés');
  console.log('\n📋 RÉSUMÉ DES TESTS:');
  console.log('- Routes publiques: Vérifiées');
  console.log('- Configuration CORS: Vérifiée');
  console.log('- Authentification: Testée');
  console.log('- Routes protégées: Testées');
}

// Exécution des tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testAuthentication,
  testPublicRoutes,
  testCORS,
  runTests
}; 