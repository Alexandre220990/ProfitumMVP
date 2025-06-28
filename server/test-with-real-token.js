const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:5001';
const CLIENT_PRODUIT_ID = 'e87d3ef4-a394-4505-8fcc-41a56005c344';
const REAL_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU5OTFiNDY1LTJlMzctNDVhZS05NDc1LTZkN2IxZTM1ZTM5MSIsImVtYWlsIjoiZ3JhbmRqZWFuLmFsZXhhbmRyZTVAZ21haWwuY29tIiwidHlwZSI6ImNsaWVudCIsImlhdCI6MTc1MDkyNjAyMSwiZXhwIjoxNzUxMDEyNDIxfQ.yWX_0EaI2xzDoncfltrIVqq4vOmuKTe_03SJo467LYI';

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
        'Authorization': `Bearer ${REAL_TOKEN}`,
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

async function testWithRealToken() {
  console.log('🧪 Test avec le vrai token utilisateur\n');
  console.log('📍 URL de base:', BASE_URL);
  console.log('🆔 ClientProduitId:', CLIENT_PRODUIT_ID);
  console.log('🔑 Token utilisé:', REAL_TOKEN.substring(0, 50) + '...');
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

    // Test 3: Test sans token pour comparaison
    console.log('3️⃣ Test GET /api/charte-signature/:clientProduitId (sans token)');
    const noTokenResponse = await makeRequest('GET', `/api/charte-signature/${CLIENT_PRODUIT_ID}`, null, {
      'Authorization': undefined
    });
    console.log('   Status:', noTokenResponse.status);
    console.log('   Réponse:', JSON.stringify(noTokenResponse.data, null, 2));
    console.log('');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }

  console.log('🎯 Analyse:');
  console.log('- Si Status 401: Le token est rejeté par Supabase Auth');
  console.log('- Si Status 200: Le token fonctionne');
  console.log('- Si Status 403: Le token fonctionne mais permissions insuffisantes');

  console.log('\n🔍 Problème probable:');
  console.log('Le token JWT local n\'est pas reconnu par Supabase Auth.');
  console.log('Le serveur utilise supabase.auth.getUser() qui attend un token Supabase.');

  console.log('\n💡 Solutions possibles:');
  console.log('1. Modifier le middleware pour accepter les tokens JWT locaux');
  console.log('2. Utiliser l\'authentification Supabase côté frontend');
  console.log('3. Créer un endpoint de test sans authentification');

  console.log('\n🎉 Test terminé !');
}

// Exécuter les tests
testWithRealToken(); 