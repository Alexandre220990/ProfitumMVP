#!/usr/bin/env node

/**
 * Script pour tester si le middleware s'exécute
 */

import https from 'https';

const BASE_URL = 'https://profitummvp-production.up.railway.app';
const TEST_EMAIL = 'conseilprofitum@gmail.com';
const TEST_PASSWORD = 'Berangerprofitum';

// Fonction pour faire des requêtes
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : require('http');
    
    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testMiddleware() {
  console.log('🔍 TEST DU MIDDLEWARE AUTH-ENHANCED\n');
  
  // 1. Connexion pour obtenir le token
  console.log('1️⃣ Connexion...');
  const loginResponse = await makeRequest(`${BASE_URL}/api/auth/apporteur/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://www.profitum.app'
    },
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }
  });
  
  if (loginResponse.statusCode !== 200) {
    console.log('❌ Échec de connexion:', loginResponse.data);
    return;
  }
  
  const token = loginResponse.data.data.token;
  console.log('✅ Connexion réussie, token obtenu');
  
  // 2. Test de la route avec un token invalide
  console.log('\n2️⃣ Test avec token invalide...');
  const invalidResponse = await makeRequest(`${BASE_URL}/api/apporteur/clients`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer token_invalide',
      'Content-Type': 'application/json',
      'Origin': 'https://www.profitum.app'
    }
  });
  
  console.log('📊 Réponse avec token invalide:');
  console.log('   - Status:', invalidResponse.statusCode);
  console.log('   - Data:', JSON.stringify(invalidResponse.data, null, 2));
  
  // 3. Test de la route avec un token valide
  console.log('\n3️⃣ Test avec token valide...');
  const validResponse = await makeRequest(`${BASE_URL}/api/apporteur/clients`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Origin': 'https://www.profitum.app'
    }
  });
  
  console.log('📊 Réponse avec token valide:');
  console.log('   - Status:', validResponse.statusCode);
  console.log('   - Data:', JSON.stringify(validResponse.data, null, 2));
  
  // 4. Test de la route sans token
  console.log('\n4️⃣ Test sans token...');
  const noTokenResponse = await makeRequest(`${BASE_URL}/api/apporteur/clients`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://www.profitum.app'
    }
  });
  
  console.log('📊 Réponse sans token:');
  console.log('   - Status:', noTokenResponse.statusCode);
  console.log('   - Data:', JSON.stringify(noTokenResponse.data, null, 2));
  
  // 5. Analyse
  console.log('\n📋 ANALYSE:');
  console.log('- Token invalide:', invalidResponse.statusCode === 401 ? '✅ Middleware s\'exécute' : '❌ Middleware ne s\'exécute pas');
  console.log('- Sans token:', noTokenResponse.statusCode === 401 ? '✅ Middleware s\'exécute' : '❌ Middleware ne s\'exécute pas');
  console.log('- Token valide:', validResponse.statusCode === 200 ? '✅ Authentification OK' : `❌ Problème (${validResponse.statusCode})`);
}

testMiddleware().catch(console.error);
