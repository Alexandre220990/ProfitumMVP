#!/usr/bin/env node

/**
 * Test pour vérifier les données utilisateur dans le token JWT
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

async function testUserData() {
  console.log('🔍 TEST DES DONNÉES UTILISATEUR\n');
  
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
  console.log('✅ Connexion réussie');
  
  // 2. Décoder le token pour voir les données
  console.log('\n2️⃣ Décodage du token JWT...');
  const parts = token.split('.');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  
  console.log('📊 Données dans le token JWT:');
  console.log(JSON.stringify(payload, null, 2));
  
  console.log('\n🔍 Analyse des champs critiques:');
  console.log('- id:', payload.id);
  console.log('- database_id:', payload.database_id);
  console.log('- type:', payload.type);
  console.log('- email:', payload.email);
  
  // 3. Test de la route clients
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
  console.log('   - Data:', JSON.stringify(clientsResponse.data, null, 2));
  
  // 4. Analyse
  console.log('\n📋 ANALYSE:');
  if (!payload.database_id) {
    console.log('❌ PROBLÈME: database_id est manquant dans le token JWT');
    console.log('   - Le token contient:', payload.id);
    console.log('   - Mais pas de database_id');
  } else {
    console.log('✅ database_id est présent:', payload.database_id);
  }
  
  if (clientsResponse.statusCode === 500) {
    console.log('❌ Erreur 500 - Problème probable dans la requête Supabase');
    console.log('   - Vérifiez que apporteur_id correspond à database_id');
    console.log('   - Vérifiez la structure de la table ApporteurProspects');
  }
}

testUserData().catch(console.error);
