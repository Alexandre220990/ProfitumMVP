#!/usr/bin/env node

/**
 * ============================================================================
 * TEST NOUVELLE ROUTE APPORTEUR
 * ============================================================================
 * 
 * Ce script teste si la nouvelle route /api/auth/apporteur/login est déployée
 */

import fetch from 'node-fetch';

async function testNewRoute() {
  console.log('🧪 TEST NOUVELLE ROUTE APPORTEUR');
  console.log('=================================');
  console.log('');

  const baseUrl = 'https://profitummvp-production.up.railway.app';
  
  // Test 1: Vérifier si la route existe (sans credentials)
  console.log('📡 1. Test d\'existence de la route...');
  try {
    const response = await fetch(`${baseUrl}/api/auth/apporteur/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   Status Text: ${response.statusText}`);
    
    const data = await response.json();
    console.log(`   Réponse: ${JSON.stringify(data, null, 2)}`);
    
    if (response.status === 400 || response.status === 401) {
      console.log('   ✅ La route existe (erreur attendue sans credentials)');
    } else if (response.status === 404) {
      console.log('   ❌ La route n\'existe pas (404)');
    } else {
      console.log('   ⚠️ Réponse inattendue');
    }
  } catch (error) {
    console.log(`   💥 Erreur: ${error.message}`);
  }
  console.log('');

  // Test 2: Comparer avec l'ancienne route
  console.log('📡 2. Test de l\'ancienne route pour comparaison...');
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   Status Text: ${response.statusText}`);
    
    const data = await response.json();
    console.log(`   Réponse: ${JSON.stringify(data, null, 2)}`);
    
  } catch (error) {
    console.log(`   💥 Erreur: ${error.message}`);
  }
  console.log('');

  // Test 3: Vérifier les routes client et expert
  console.log('📡 3. Test des autres routes distinctes...');
  
  const routes = [
    '/api/auth/client/login',
    '/api/auth/expert/login'
  ];

  for (const route of routes) {
    try {
      console.log(`   Test de ${route}...`);
      const response = await fetch(`${baseUrl}${route}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      console.log(`     Status: ${response.status}`);
      
      if (response.status === 400 || response.status === 401) {
        console.log('     ✅ Route existe');
      } else if (response.status === 404) {
        console.log('     ❌ Route n\'existe pas');
      } else {
        console.log('     ⚠️ Réponse inattendue');
      }
    } catch (error) {
      console.log(`     💥 Erreur: ${error.message}`);
    }
  }

  console.log('');
  console.log('🎯 CONCLUSION:');
  console.log('==============');
  console.log('Si la route /api/auth/apporteur/login retourne 404,');
  console.log('cela signifie que le nouveau code n\'est pas encore déployé.');
  console.log('');
  console.log('Si elle retourne 400/401, elle existe et le problème vient d\'ailleurs.');
}

// Exécuter le test
testNewRoute()
  .then(() => {
    console.log('🏁 Test terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
