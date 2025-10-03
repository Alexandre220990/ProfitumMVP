#!/usr/bin/env node

/**
 * ============================================================================
 * TEST FINAL - VÉRIFICATION COMPLÈTE
 * ============================================================================
 * 
 * Ce script teste la connexion apporteur après toutes les corrections
 */

import fetch from 'node-fetch';

async function testFinalAuth() {
  console.log('🧪 TEST FINAL - VÉRIFICATION COMPLÈTE');
  console.log('======================================');
  console.log('');

  const baseUrl = 'https://profitummvp-production.up.railway.app';
  
  try {
    // Test de la connexion apporteur
    console.log('📡 Test de la connexion apporteur...');
    console.log('====================================');
    
    const response = await fetch(`${baseUrl}/api/auth/apporteur/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'conseilprofitum@gmail.com',
        password: 'Berangerprofitum'
      })
    });

    console.log(`Status: ${response.status}`);
    const data = await response.json();
    
    if (response.status === 200) {
      console.log('🎉 SUCCÈS ! Authentification réussie !');
      console.log('✅ Token généré:', data.data?.token ? 'OUI' : 'NON');
      console.log('✅ Utilisateur retourné:', data.data?.user ? 'OUI' : 'NON');
      if (data.data?.user) {
        console.log(`   - Type: ${data.data.user.type}`);
        console.log(`   - Email: ${data.data.user.email}`);
        console.log(`   - Statut: ${data.data.user.status}`);
      }
    } else {
      console.log('❌ ÉCHEC de l\'authentification');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Message: ${data.message}`);
      if (data.status) {
        console.log(`   - Statut retourné: ${data.status}`);
      }
    }
    console.log('');

    // Résumé des corrections
    console.log('📋 RÉSUMÉ DES CORRECTIONS APPLIQUÉES:');
    console.log('=====================================');
    console.log('✅ Base de données:');
    console.log('   - Statut apporteur mis à "active"');
    console.log('   - Timestamp mis à jour');
    console.log('');
    console.log('✅ Code backend:');
    console.log('   - Route /api/auth/apporteur/login créée');
    console.log('   - Services d\'authentification distincts');
    console.log('   - Logique de statut corrigée');
    console.log('');
    console.log('✅ Code frontend:');
    console.log('   - Hook use-auth.tsx mis à jour');
    console.log('   - Bibliothèque auth-distinct.ts créée');
    console.log('   - Composant connexion-apporteur.tsx corrigé');
    console.log('');

    // Instructions finales
    console.log('🎯 INSTRUCTIONS FINALES:');
    console.log('========================');
    if (response.status === 200) {
      console.log('✅ TOUT FONCTIONNE !');
      console.log('');
      console.log('Vous pouvez maintenant:');
      console.log('1. Aller sur https://www.profitum.app/connexion-apporteur');
      console.log('2. Vous connecter avec:');
      console.log('   - Email: conseilprofitum@gmail.com');
      console.log('   - Mot de passe: Berangerprofitum');
      console.log('3. Vous devriez être redirigé vers le dashboard apporteur');
    } else {
      console.log('❌ PROBLÈME PERSISTANT');
      console.log('');
      console.log('Actions recommandées:');
      console.log('1. Vérifier que le déploiement est complet');
      console.log('2. Vider le cache du navigateur');
      console.log('3. Tester en mode incognito');
    }

  } catch (error) {
    console.error('💥 Erreur lors du test:', error);
  }
}

// Exécuter le test final
testFinalAuth()
  .then(() => {
    console.log('');
    console.log('🏁 Test final terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
