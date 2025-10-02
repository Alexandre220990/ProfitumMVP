#!/usr/bin/env node

/**
 * ============================================================================
 * TEST ROUTE APPORTEUR
 * ============================================================================
 * 
 * Ce script teste directement la nouvelle route /api/auth/apporteur/login
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

async function testRouteApporteur() {
  console.log('🧪 TEST ROUTE /api/auth/apporteur/login');
  console.log('=======================================');
  console.log('');

  try {
    // Test avec les vraies credentials (vous devrez les remplacer)
    const testCredentials = {
      email: 'conseilprofitum@gmail.com',
      password: 'VOTRE_MOT_DE_PASSE_ICI' // ⚠️ REMPLACEZ PAR LE VRAI MOT DE PASSE
    };

    console.log('🔑 Test de la route avec:');
    console.log(`   Email: ${testCredentials.email}`);
    console.log(`   Password: [MASQUÉ]`);
    console.log('');

    const response = await fetch('https://profitummvp-production.up.railway.app/api/auth/apporteur/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCredentials)
    });

    console.log('📡 Réponse du serveur:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Status Text: ${response.statusText}`);
    console.log('');

    const data = await response.json();
    console.log('📦 Données de réponse:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    if (response.ok) {
      console.log('✅ SUCCÈS: La route fonctionne !');
    } else {
      console.log('❌ ERREUR: La route retourne une erreur');
      
      if (response.status === 403) {
        console.log('🔍 Analyse de l\'erreur 403:');
        if (data.message?.includes('pas encore activé')) {
          console.log('   → Problème de statut dans la base de données');
        } else if (data.message?.includes('pas enregistré')) {
          console.log('   → Apporteur non trouvé dans ApporteurAffaires');
        } else {
          console.log('   → Autre problème d\'authentification');
        }
      }
    }

  } catch (error) {
    console.error('💥 Erreur lors du test:', error);
  }
}

// Exécuter le test
testRouteApporteur()
  .then(() => {
    console.log('');
    console.log('🏁 Test terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
