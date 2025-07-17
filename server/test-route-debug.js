const axios = require('axios');

async function testRouteDebug() {
  console.log('🔍 Debug des routes API\n');

  const baseURL = 'http://localhost:5001';
  
  // Test des routes existantes pour vérifier que le serveur fonctionne
  const testRoutes = [
    '/api/produits-eligibles/client/25274ba6-67e6-4151-901c-74851fe2d82a',
    '/api/simulations/client/25274ba6-67e6-4151-901c-74851fe2d82a',
    '/api/audits/client/25274ba6-67e6-4151-901c-74851fe2d82a',
    '/api/client-documents/client/25274ba6-67e6-4151-901c-74851fe2d82a' // Notre nouvelle route
  ];

  for (const route of testRoutes) {
    try {
      console.log(`🧪 Test de la route: ${route}`);
      const response = await axios.get(`${baseURL}${route}`, {
        headers: {
          'Authorization': 'Bearer test-token'
        },
        timeout: 5000
      });
      console.log(`   ✅ Status: ${response.status}`);
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ Status: ${error.response.status} - ${error.response.data?.message || 'Erreur'}`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ Serveur non accessible`);
        break;
      } else {
        console.log(`   ❌ Erreur: ${error.message}`);
      }
    }
  }

  // Test de routes inexistantes pour vérifier le comportement 404
  console.log('\n🔍 Test de routes inexistantes:');
  const invalidRoutes = [
    '/api/route-inexistante',
    '/api/client-documents/route-inexistante'
  ];

  for (const route of invalidRoutes) {
    try {
      const response = await axios.get(`${baseURL}${route}`, {
        headers: {
          'Authorization': 'Bearer test-token'
        },
        timeout: 5000
      });
      console.log(`   ⚠️ Route ${route} accessible (inattendu)`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`   ✅ Route ${route} correctement rejetée (404)`);
      } else if (error.response?.status === 401) {
        console.log(`   ✅ Route ${route} existe mais nécessite auth (401)`);
      } else {
        console.log(`   ❌ Erreur inattendue pour ${route}: ${error.response?.status || error.message}`);
      }
    }
  }

  console.log('\n🎯 Résumé du debug:');
  console.log('   - Vérification de l\'accessibilité du serveur');
  console.log('   - Test des routes existantes');
  console.log('   - Test de notre nouvelle route');
  console.log('   - Vérification du comportement 404');
}

// Exécuter le debug
testRouteDebug(); 