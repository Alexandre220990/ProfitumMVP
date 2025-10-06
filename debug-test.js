#!/usr/bin/env node

/**
 * Script de test pour la route de test simple
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

async function testSimpleRoute() {
  console.log('🧪 TEST DE LA ROUTE SIMPLE\n');
  
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
  
  // 2. Test de la route simple
  console.log('\n2️⃣ Test de la route /api/test/test-clients...');
  const testResponse = await makeRequest(`${BASE_URL}/api/test/test-clients`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Origin': 'https://www.profitum.app'
    }
  });
  
  console.log('📊 Réponse route test:');
  console.log('   - Status:', testResponse.statusCode);
  console.log('   - Data:', JSON.stringify(testResponse.data, null, 2));
  
  // 3. Résumé
  console.log('\n📋 RÉSUMÉ:');
  console.log(`- Route test: ${testResponse.statusCode === 200 ? '✅' : '❌'} (${testResponse.statusCode})`);
  
  if (testResponse.statusCode === 200) {
    console.log('🎉 La route simple fonctionne ! Le problème est dans le middleware complexe.');
  } else {
    console.log('❌ Même la route simple échoue. Le problème est plus profond.');
  }
}

testSimpleRoute().catch(console.error);
