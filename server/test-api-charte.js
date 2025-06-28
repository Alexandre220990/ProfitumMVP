const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:5001';
const CLIENT_PRODUIT_ID = 'e87d3ef4-a394-4505-8fcc-41a56005c344';

// Fonction utilitaire pour faire des requêtes HTTP
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
        ...headers
      }
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: jsonResponse,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: body,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testCharteSignatureAPI() {
  console.log('🧪 Test de l\'API de signature de charte\n');
  console.log('📍 URL de base:', BASE_URL);
  console.log('🆔 ClientProduitId:', CLIENT_PRODUIT_ID);
  console.log('');

  try {
    // Test 1: Vérification de signature existante
    console.log('1️⃣ Test GET /api/charte-signature/:clientProduitId');
    const checkResponse = await makeRequest('GET', `/api/charte-signature/${CLIENT_PRODUIT_ID}`);
    console.log('   Status:', checkResponse.status);
    console.log('   Réponse:', JSON.stringify(checkResponse.data, null, 2));
    console.log('');

    // Test 2: Tentative de signature
    console.log('2️⃣ Test POST /api/charte-signature');
    const signData = {
      clientProduitEligibleId: CLIENT_PRODUIT_ID,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Script'
    };
    
    const signResponse = await makeRequest('POST', '/api/charte-signature', signData);
    console.log('   Status:', signResponse.status);
    console.log('   Réponse:', JSON.stringify(signResponse.data, null, 2));
    console.log('');

    // Test 3: Vérification après signature
    console.log('3️⃣ Test GET /api/charte-signature/:clientProduitId (après signature)');
    const checkAfterResponse = await makeRequest('GET', `/api/charte-signature/${CLIENT_PRODUIT_ID}`);
    console.log('   Status:', checkAfterResponse.status);
    console.log('   Réponse:', JSON.stringify(checkAfterResponse.data, null, 2));
    console.log('');

    // Test 4: Test sans token
    console.log('4️⃣ Test GET /api/charte-signature/:clientProduitId (sans token)');
    const noTokenResponse = await makeRequest('GET', `/api/charte-signature/${CLIENT_PRODUIT_ID}`, null, {
      'Authorization': undefined
    });
    console.log('   Status:', noTokenResponse.status);
    console.log('   Réponse:', JSON.stringify(noTokenResponse.data, null, 2));
    console.log('');

    // Test 5: Test avec token invalide
    console.log('5️⃣ Test GET /api/charte-signature/:clientProduitId (token invalide)');
    const invalidTokenResponse = await makeRequest('GET', `/api/charte-signature/${CLIENT_PRODUIT_ID}`, null, {
      'Authorization': 'Bearer invalid-token'
    });
    console.log('   Status:', invalidTokenResponse.status);
    console.log('   Réponse:', JSON.stringify(invalidTokenResponse.data, null, 2));
    console.log('');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }

  console.log('🎉 Tests terminés !');
}

// Exécuter les tests
testCharteSignatureAPI(); 