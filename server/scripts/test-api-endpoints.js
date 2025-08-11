// ============================================================================
// SCRIPT DE TEST DES ENDPOINTS API - enhanced-client-documents
// ============================================================================

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'https://profitummvp-production.up.railway.app';
const API_PREFIX = '/api';

// Token de test (à remplacer par un vrai token)
const TEST_TOKEN = process.env.TEST_TOKEN || 'test-token';

// Configuration Axios
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Fonction de test générique
async function testEndpoint(method, endpoint, data = null) {
  try {
    console.log(`🔍 Test ${method.toUpperCase()} ${endpoint}`);
    
    const config = {
      method,
      url: `${API_PREFIX}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await api(config);
    
    console.log(`✅ Succès: ${response.status} ${response.statusText}`);
    console.log(`📄 Réponse:`, JSON.stringify(response.data, null, 2));
    
    return {
      success: true,
      status: response.status,
      data: response.data
    };
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.response?.status || 'Network Error'} ${error.response?.statusText || error.message}`);
    
    if (error.response) {
      console.log(`📄 Réponse d'erreur:`, JSON.stringify(error.response.data, null, 2));
    }
    
    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data || error.message
    };
  }
}

// Tests des endpoints
async function runTests() {
  console.log('🚀 Début des tests des endpoints API');
  console.log(`📍 URL de base: ${BASE_URL}`);
  console.log(`🔑 Token utilisé: ${TEST_TOKEN.substring(0, 10)}...`);
  console.log('=' .repeat(80));
  
  const results = [];
  
  // Test 1: GET /enhanced-client-documents/sections
  console.log('\n📋 Test 1: Récupération des sections');
  results.push(await testEndpoint('GET', '/enhanced-client-documents/sections'));
  
  // Test 2: GET /enhanced-client-documents/sections/formation/files
  console.log('\n📋 Test 2: Récupération des fichiers de la section formation');
  results.push(await testEndpoint('GET', '/enhanced-client-documents/sections/formation/files'));
  
  // Test 3: GET /enhanced-client-documents/sections/mes_documents/files
  console.log('\n📋 Test 3: Récupération des fichiers de la section mes_documents');
  results.push(await testEndpoint('GET', '/enhanced-client-documents/sections/mes_documents/files'));
  
  // Test 4: POST /enhanced-client-documents/sections/formation/upload (sans fichier)
  console.log('\n📋 Test 4: Test d\'upload sans fichier (doit échouer)');
  results.push(await testEndpoint('POST', '/enhanced-client-documents/sections/formation/upload', {
    description: 'Test upload'
  }));
  
  // Test 5: Test d'authentification
  console.log('\n📋 Test 5: Test sans token d\'authentification');
  const apiWithoutAuth = axios.create({
    baseURL: BASE_URL,
    timeout: 10000
  });
  
  try {
    const response = await apiWithoutAuth.get(`${API_PREFIX}/enhanced-client-documents/sections`);
    console.log(`❌ Erreur: L'endpoint devrait être protégé mais a réussi (${response.status})`);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`✅ Succès: Endpoint correctement protégé (401 Unauthorized)`);
    } else {
      console.log(`❌ Erreur inattendue: ${error.response?.status} ${error.response?.statusText}`);
    }
  }
  
  // Résumé des tests
  console.log('\n' + '=' .repeat(80));
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('=' .repeat(80));
  
  const successfulTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`✅ Tests réussis: ${successfulTests}/${totalTests}`);
  console.log(`❌ Tests échoués: ${totalTests - successfulTests}/${totalTests}`);
  
  if (successfulTests === totalTests) {
    console.log('🎉 Tous les tests sont passés avec succès !');
  } else {
    console.log('⚠️ Certains tests ont échoué. Vérifiez la configuration.');
  }
  
  // Détails des erreurs
  results.forEach((result, index) => {
    if (!result.success) {
      console.log(`\n❌ Test ${index + 1} échoué:`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Erreur: ${JSON.stringify(result.error, null, 2)}`);
    }
  });
}

// Test de connectivité de base
async function testConnectivity() {
  console.log('🔍 Test de connectivité de base...');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    console.log(`✅ Connectivité OK: ${response.status}`);
    return true;
  } catch (error) {
    console.log(`❌ Problème de connectivité: ${error.message}`);
    return false;
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Script de test des endpoints API - enhanced-client-documents');
  console.log('=' .repeat(80));
  
  // Test de connectivité
  const isConnected = await testConnectivity();
  
  if (!isConnected) {
    console.log('❌ Impossible de se connecter au serveur. Arrêt des tests.');
    process.exit(1);
  }
  
  // Exécuter les tests
  await runTests();
  
  console.log('\n🏁 Tests terminés');
}

// Exécution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testEndpoint,
  runTests,
  testConnectivity
}; 