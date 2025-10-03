#!/usr/bin/env node

/**
 * ============================================================================
 * VÉRIFICATION DÉPLOIEMENT - TEST COMPLET
 * ============================================================================
 * 
 * Ce script teste si le nouveau code est bien déployé
 */

import fetch from 'node-fetch';

async function verifyDeployment() {
  console.log('🔍 VÉRIFICATION DÉPLOIEMENT - TEST COMPLET');
  console.log('===========================================');
  console.log('');

  const baseUrl = 'https://profitummvp-production.up.railway.app';
  
  try {
    // Test 1: Vérifier la nouvelle route avec un test simple
    console.log('📡 1. Test de la nouvelle route /api/auth/apporteur/login...');
    
    const response = await fetch(`${baseUrl}/api/auth/apporteur/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'conseilprofitum@gmail.com',
        password: 'MOT_DE_PASSE_INCORRECT' // Test avec mauvais mot de passe
      })
    });

    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    console.log(`   Réponse: ${JSON.stringify(data, null, 2)}`);
    
    if (response.status === 401) {
      console.log('   ✅ Route fonctionne (erreur 401 attendue avec mauvais mot de passe)');
    } else if (response.status === 403) {
      console.log('   ✅ Route fonctionne (erreur 403 attendue si statut incorrect)');
    } else {
      console.log('   ⚠️ Réponse inattendue');
    }
    console.log('');

    // Test 2: Vérifier si le message d'erreur contient des indices
    console.log('🔍 2. Analyse du message d\'erreur...');
    
    if (data.message) {
      if (data.message.includes('pas encore activé')) {
        console.log('   ❌ PROBLÈME: Le message indique que le compte n\'est pas activé');
        console.log('   🔍 Cela signifie que apporteur.status !== "active"');
        console.log('   📊 Vérifiez que le statut dans la base est bien "active"');
      } else if (data.message.includes('Email ou mot de passe incorrect')) {
        console.log('   ✅ OK: Le message indique un problème d\'authentification');
        console.log('   🔍 Cela signifie que la logique de statut fonctionne');
      } else {
        console.log('   ⚠️ Message d\'erreur inattendu');
      }
    }
    console.log('');

    // Test 3: Vérifier les autres routes pour comparaison
    console.log('📡 3. Test des autres routes pour comparaison...');
    
    const routes = [
      { path: '/api/auth/client/login', name: 'Client' },
      { path: '/api/auth/expert/login', name: 'Expert' }
    ];

    for (const route of routes) {
      try {
        const testResponse = await fetch(`${baseUrl}${route.path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@test.com',
            password: 'wrong'
          })
        });

        console.log(`   ${route.name}: Status ${testResponse.status}`);
      } catch (error) {
        console.log(`   ${route.name}: Erreur - ${error.message}`);
      }
    }
    console.log('');

    // Test 4: Vérifier la version du code déployé
    console.log('📋 4. Vérification de la version du code...');
    console.log('   Si vous obtenez encore l\'erreur "pas encore activé",');
    console.log('   cela signifie que l\'ancienne logique est encore en place.');
    console.log('   Le nouveau code devrait retourner une erreur 401 avec');
    console.log('   "Email ou mot de passe incorrect" pour un mauvais mot de passe.');
    console.log('');

    console.log('🎯 CONCLUSION:');
    console.log('==============');
    if (data.message && data.message.includes('pas encore activé')) {
      console.log('❌ PROBLÈME CONFIRMÉ:');
      console.log('   - Le code déployé utilise encore l\'ancienne logique');
      console.log('   - Ou le statut dans la base n\'est pas "active"');
      console.log('   - Ou il y a un problème de cache');
    } else {
      console.log('✅ CODE DÉPLOYÉ:');
      console.log('   - La nouvelle logique semble être en place');
      console.log('   - Le problème vient peut-être d\'ailleurs');
    }

  } catch (error) {
    console.error('💥 Erreur lors du test:', error);
  }
}

// Exécuter la vérification
verifyDeployment()
  .then(() => {
    console.log('');
    console.log('🏁 Vérification terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
