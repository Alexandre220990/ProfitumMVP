#!/usr/bin/env node

/**
 * Script de diagnostic pour l'authentification apporteur
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

async function debugAuth() {
  console.log('🔍 DIAGNOSTIC COMPLET DE L\'AUTHENTIFICATION APPORTEUR\n');
  
  // 1. Test de connexion
  console.log('1️⃣ Test de connexion...');
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
  
  console.log('✅ Connexion réussie');
  const token = loginResponse.data.data.token;
  console.log('🔑 Token reçu:', token ? 'OUI' : 'NON');
  console.log('📊 Données utilisateur:', JSON.stringify(loginResponse.data.data.user, null, 2));
  
  // 2. Test de décodage du token
  console.log('\n2️⃣ Test de décodage du token...');
  try {
    // Décoder le JWT sans vérifier la signature (juste pour voir le contenu)
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('✅ Token JWT décodé avec succès');
    console.log('📋 Contenu du token:', JSON.stringify(payload, null, 2));
  } catch (error) {
    console.log('❌ Erreur de décodage JWT:', error.message);
  }
  
  // 3. Test de la route clients avec le token
  console.log('\n3️⃣ Test de la route /api/apporteur/clients...');
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
  console.log('   - Headers:', {
    'access-control-allow-origin': clientsResponse.headers['access-control-allow-origin'],
    'content-type': clientsResponse.headers['content-type']
  });
  console.log('   - Data:', JSON.stringify(clientsResponse.data, null, 2));
  
  // 4. Test de la route dashboard
  console.log('\n4️⃣ Test de la route /api/apporteur/dashboard...');
  const dashboardResponse = await makeRequest(`${BASE_URL}/api/apporteur/dashboard`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Origin': 'https://www.profitum.app'
    }
  });
  
  console.log('📊 Réponse route dashboard:');
  console.log('   - Status:', dashboardResponse.statusCode);
  console.log('   - Data:', JSON.stringify(dashboardResponse.data, null, 2));
  
  // 5. Résumé
  console.log('\n📋 RÉSUMÉ DU DIAGNOSTIC:');
  console.log(`- Connexion: ${loginResponse.statusCode === 200 ? '✅' : '❌'}`);
  console.log(`- Token reçu: ${token ? '✅' : '❌'}`);
  console.log(`- Route clients: ${clientsResponse.statusCode === 200 ? '✅' : '❌'} (${clientsResponse.statusCode})`);
  console.log(`- Route dashboard: ${dashboardResponse.statusCode === 200 ? '✅' : '❌'} (${dashboardResponse.statusCode})`);
  
  if (clientsResponse.statusCode === 403) {
    console.log('\n🔍 ANALYSE DE L\'ERREUR 403:');
    console.log('Le problème semble être dans le middleware d\'authentification.');
    console.log('Le token est créé mais pas reconnu par le middleware.');
  }
}

debugAuth().catch(console.error);