#!/usr/bin/env node

/**
 * Script pour tester la route enhanced
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

async function testEnhanced() {
  console.log('🧪 TEST DE LA ROUTE ENHANCED\n');
  
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
  
  // 2. Test de la route enhanced
  console.log('\n2️⃣ Test de la route /api/test-enhanced/test-enhanced...');
  const enhancedResponse = await makeRequest(`${BASE_URL}/api/test-enhanced/test-enhanced`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Origin': 'https://www.profitum.app'
    }
  });
  
  console.log('📊 Réponse route enhanced:');
  console.log('   - Status:', enhancedResponse.statusCode);
  console.log('   - Data:', JSON.stringify(enhancedResponse.data, null, 2));
  
  // 3. Comparaison avec la route simple
  console.log('\n3️⃣ Test de la route simple pour comparaison...');
  const simpleResponse = await makeRequest(`${BASE_URL}/api/test/test-clients`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Origin': 'https://www.profitum.app'
    }
  });
  
  console.log('📊 Réponse route simple:');
  console.log('   - Status:', simpleResponse.statusCode);
  console.log('   - Data:', JSON.stringify(simpleResponse.data, null, 2));
  
  // 4. Analyse
  console.log('\n📋 ANALYSE:');
  console.log('- Route simple:', simpleResponse.statusCode === 200 ? '✅ Fonctionne' : `❌ Échec (${simpleResponse.statusCode})`);
  console.log('- Route enhanced:', enhancedResponse.statusCode === 200 ? '✅ Fonctionne' : `❌ Échec (${enhancedResponse.statusCode})`);
  
  if (enhancedResponse.statusCode === 403) {
    console.log('\n🔍 DIAGNOSTIC:');
    console.log('La route enhanced retourne 403, ce qui signifie que:');
    console.log('- Le middleware s\'exécute (pas de 401)');
    console.log('- Mais la vérification user.type !== \'apporteur_affaires\' échoue');
    console.log('- Soit user.type est undefined/null');
    console.log('- Soit user.type a une valeur différente de \'apporteur_affaires\'');
  }
}

testEnhanced().catch(console.error);
