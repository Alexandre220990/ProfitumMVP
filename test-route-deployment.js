#!/usr/bin/env node

/**
 * ============================================================================
 * TEST DÉPLOIEMENT ROUTE APPORTEUR
 * ============================================================================
 * 
 * Ce script teste si la route /api/auth/apporteur/login est bien déployée
 */

import fetch from 'node-fetch';

async function testRouteDeployment() {
  console.log('🧪 TEST DÉPLOIEMENT ROUTE APPORTEUR');
  console.log('====================================');
  console.log('');

  const baseUrl = 'https://profitummvp-production.up.railway.app';
  
  try {
    // Test 1: Vérifier si la route existe (OPTIONS)
    console.log('📡 1. Test OPTIONS (pré-vol)...');
    const optionsResponse = await fetch(`${baseUrl}/api/auth/apporteur/login`, {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log(`   Status: ${optionsResponse.status}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(optionsResponse.headers), null, 2)}`);
    console.log('');

    // Test 2: Test POST avec mauvais credentials
    console.log('📡 2. Test POST avec mauvais credentials...');
    const postResponse = await fetch(`${baseUrl}/api/auth/apporteur/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'wrong'
      })
    });

    console.log(`   Status: ${postResponse.status}`);
    const postData = await postResponse.json();
    console.log(`   Réponse: ${JSON.stringify(postData, null, 2)}`);
    console.log('');

    // Test 3: Comparer avec une route qui marche (admin)
    console.log('📡 3. Test route admin pour comparaison...');
    const adminResponse = await fetch(`${baseUrl}/api/admin/diagnostic`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log(`   Status: ${adminResponse.status}`);
    console.log('');

    // Test 4: Test route auth générique
    console.log('📡 4. Test route auth générique...');
    const authResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'wrong',
        type: 'apporteur_affaires'
      })
    });

    console.log(`   Status: ${authResponse.status}`);
    const authData = await authResponse.json();
    console.log(`   Réponse: ${JSON.stringify(authData, null, 2)}`);
    console.log('');

    // Analyse des résultats
    console.log('🔍 ANALYSE DES RÉSULTATS:');
    console.log('==========================');
    
    if (optionsResponse.status === 404) {
      console.log('❌ PROBLÈME: Route OPTIONS retourne 404');
      console.log('   → La route n\'est pas déployée');
    } else {
      console.log('✅ Route OPTIONS accessible');
    }
    
    if (postResponse.status === 404) {
      console.log('❌ PROBLÈME: Route POST retourne 404');
      console.log('   → La route n\'est pas déployée');
    } else if (postResponse.status === 401 || postResponse.status === 403) {
      console.log('✅ Route POST accessible (erreur attendue)');
    } else {
      console.log('⚠️ Route POST retourne un statut inattendu');
    }

  } catch (error) {
    console.error('💥 Erreur lors du test:', error);
  }
}

// Exécuter le test
testRouteDeployment()
  .then(() => {
    console.log('');
    console.log('🏁 Test terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
