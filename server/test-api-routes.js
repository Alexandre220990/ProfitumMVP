const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5001/api';

async function testApiRoutes() {
  console.log('🧪 Test des routes API\n');

  const tests = [
    {
      name: 'Debug produits-eligibles',
      url: `${API_BASE}/produits-eligibles/debug`,
      method: 'GET'
    },
    {
      name: 'Produits éligibles (sans auth)',
      url: `${API_BASE}/produits-eligibles/produits-eligibles`,
      method: 'GET'
    },
    {
      name: 'Produits éligibles client (sans auth)',
      url: `${API_BASE}/produits-eligibles/client/test-client-id`,
      method: 'GET'
    },
    {
      name: 'Check auth (sans token)',
      url: `${API_BASE}/auth/check`,
      method: 'GET'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`🔍 Test: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Succès:`, data);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Erreur:`, errorText);
      }
      
    } catch (error) {
      console.log(`   ❌ Exception:`, error.message);
    }
    
    console.log(''); // Ligne vide
  }
}

// Exécuter les tests
testApiRoutes(); 