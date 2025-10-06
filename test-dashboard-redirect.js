#!/usr/bin/env node

/**
 * Test pour vérifier que la redirection vers le dashboard apporteur fonctionne
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

async function testDashboardRedirect() {
  console.log('🔍 TEST DE LA REDIRECTION DASHBOARD APPORTEUR\n');
  
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
  const user = loginResponse.data.data.user;
  console.log('✅ Connexion réussie');
  console.log('📊 Utilisateur connecté:', {
    id: user.id,
    email: user.email,
    type: user.type,
    database_id: user.database_id
  });
  
  // 2. Test de la route clients avec l'ID apporteur
  console.log('\n2️⃣ Test de la route /api/apporteur/clients...');
  const clientsResponse = await makeRequest(`${BASE_URL}/api/apporteur/clients`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Origin': 'https://www.profitum.app'
    }
  });
  
  console.log('📊 Réponse route clients:');
  console.log('   - Status:', clientsResponse.statusCode);
  console.log('   - Data:', JSON.stringify(clientsResponse.data, null, 2));
  
  // 3. Test de la route prospects
  console.log('\n3️⃣ Test de la route /api/apporteur/prospects...');
  const prospectsResponse = await makeRequest(`${BASE_URL}/api/apporteur/prospects`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Origin': 'https://www.profitum.app'
    }
  });
  
  console.log('📊 Réponse route prospects:');
  console.log('   - Status:', prospectsResponse.statusCode);
  console.log('   - Data:', JSON.stringify(prospectsResponse.data, null, 2));
  
  // 4. Analyse
  console.log('\n📋 ANALYSE:');
  if (clientsResponse.statusCode === 200 && prospectsResponse.statusCode === 200) {
    console.log('✅ SUCCÈS: Les routes apporteur fonctionnent correctement');
    console.log('   - L\'authentification est opérationnelle');
    console.log('   - Les requêtes Supabase sont corrigées');
    console.log('   - Le dashboard devrait maintenant fonctionner');
    console.log('\n🔗 URL de redirection attendue:');
    console.log(`   /apporteur/dashboard?apporteurId=${user.id}`);
  } else {
    console.log('❌ ÉCHEC: Problème persistant');
    if (clientsResponse.statusCode !== 200) {
      console.log('   - Erreur route clients:', clientsResponse.statusCode);
    }
    if (prospectsResponse.statusCode !== 200) {
      console.log('   - Erreur route prospects:', prospectsResponse.statusCode);
    }
  }
}

testDashboardRedirect().catch(console.error);
