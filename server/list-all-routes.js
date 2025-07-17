const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function listAllRoutes() {
  console.log('🔍 Liste de toutes les routes disponibles...\n');

  try {
    // Test de connectivité
    try {
      const healthResponse = await axios.get(`${BASE_URL}/api/health`);
      console.log('✅ Serveur accessible');
    } catch (error) {
      console.log('❌ Serveur inaccessible:', error.message);
      return;
    }

    // Routes connues à tester
    const knownRoutes = [
      // Routes d'authentification
      '/api/auth/login',
      '/api/auth/check',
      
      // Routes de monitoring
      '/api/monitoring/health',
      '/api/monitoring/network-server/status',
      
      // Routes de tests
      '/api/tests/categories',
      '/api/tests/run-category/security',
      
      // Routes de documentation (qui ne fonctionnent pas)
      '/api/documentation/categories',
      '/api/documentation/stats',
      '/api/documentation/search',
      
      // Routes alternatives
      '/documentation/categories',
      '/documentation/stats',
      
      // Autres routes
      '/api/audits',
      '/api/simulations',
      '/api/experts',
      '/api/admin'
    ];

    console.log('📋 Test de toutes les routes connues:\n');

    for (const route of knownRoutes) {
      try {
        console.log(`🔄 Test de ${route}:`);
        const response = await axios.get(`${BASE_URL}${route}`, {
          timeout: 5000,
          validateStatus: () => true // Accepter tous les codes de statut
        });
        
        if (response.status === 200) {
          console.log(`   ✅ Accessible (200)`);
        } else if (response.status === 401) {
          console.log(`   🔐 Nécessite authentification (401)`);
        } else if (response.status === 404) {
          console.log(`   ❌ Non trouvée (404)`);
        } else {
          console.log(`   ⚠️ Code ${response.status}`);
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log(`   ❌ Connexion refusée`);
        } else if (error.code === 'ETIMEDOUT') {
          console.log(`   ⏰ Timeout`);
        } else {
          console.log(`   ❌ Erreur: ${error.message}`);
        }
      }
    }

    console.log('\n📊 Résumé:');
    console.log('- Les routes de documentation retournent 404');
    console.log('- Cela signifie qu\'elles ne sont pas enregistrées dans le serveur');
    console.log('- Le problème est probablement dans l\'importation des routes');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

listAllRoutes(); 