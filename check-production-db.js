#!/usr/bin/env node

/**
 * ============================================================================
 * VÉRIFICATION BASE DE PRODUCTION
 * ============================================================================
 * 
 * Ce script vérifie directement la base de production via l'API
 */

import fetch from 'node-fetch';

async function checkProductionDB() {
  console.log('🔍 VÉRIFICATION BASE DE PRODUCTION');
  console.log('===================================');
  console.log('');

  const baseUrl = 'https://profitummvp-production.up.railway.app';
  
  try {
    // Test 1: Appel direct à l'API avec les vraies credentials
    console.log('📡 1. Test direct avec les vraies credentials...');
    console.log('=================================================');
    
    const response = await fetch(`${baseUrl}/api/auth/apporteur/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'conseilprofitum@gmail.com',
        password: 'Berangerprofitum' // Mot de passe réel d'après les logs
      })
    });

    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log(`Réponse: ${JSON.stringify(data, null, 2)}`);
    console.log('');

    // Test 2: Analyser la réponse
    console.log('🔍 2. Analyse de la réponse...');
    console.log('==============================');
    
    if (response.status === 200) {
      console.log('✅ SUCCÈS: Authentification réussie !');
      console.log('   Le problème était résolu côté serveur');
    } else if (response.status === 403) {
      console.log('❌ ERREUR 403: Problème d\'authentification');
      
      if (data.message) {
        if (data.message.includes('pas encore activé')) {
          console.log('🔍 PROBLÈME: Statut non actif');
          console.log('   - Le statut dans la base de production n\'est pas "active"');
          console.log('   - Solution: Mettre à jour le statut en production');
        } else if (data.message.includes('pas enregistré')) {
          console.log('🔍 PROBLÈME: Apporteur non trouvé');
          console.log('   - L\'apporteur n\'existe pas dans la base de production');
          console.log('   - Solution: Créer l\'apporteur en production');
        } else {
          console.log(`🔍 PROBLÈME: ${data.message}`);
        }
      }
      
      if (data.status) {
        console.log(`   - Statut retourné: "${data.status}"`);
        console.log(`   - Type: ${typeof data.status}`);
      }
    } else if (response.status === 401) {
      console.log('❌ ERREUR 401: Email ou mot de passe incorrect');
      console.log('   - Vérifiez les credentials');
    } else {
      console.log(`⚠️ ERREUR INATTENDUE: ${response.status}`);
    }
    console.log('');

    // Test 3: Comparer avec les autres routes
    console.log('🧪 3. Test de comparaison avec l\'ancienne route...');
    console.log('===================================================');
    
    const oldResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'conseilprofitum@gmail.com',
        password: 'Berangerprofitum',
        type: 'apporteur_affaires'
      })
    });

    console.log(`Ancienne route - Status: ${oldResponse.status}`);
    const oldData = await oldResponse.json();
    console.log(`Ancienne route - Réponse: ${JSON.stringify(oldData, null, 2)}`);
    console.log('');

    // Test 4: Diagnostic final
    console.log('🎯 4. DIAGNOSTIC FINAL...');
    console.log('=========================');
    
    if (response.status === 200) {
      console.log('🎉 PROBLÈME RÉSOLU !');
      console.log('   - L\'authentification fonctionne maintenant');
      console.log('   - Le cache du navigateur était le problème');
    } else {
      console.log('❌ PROBLÈME PERSISTANT');
      console.log('   - Il y a une différence entre local et production');
      console.log('   - Action requise: Synchroniser la base de production');
    }

  } catch (error) {
    console.error('💥 Erreur lors du test:', error);
  }
}

// Exécuter la vérification
checkProductionDB()
  .then(() => {
    console.log('');
    console.log('🏁 Vérification terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
