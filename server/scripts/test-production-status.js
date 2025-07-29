// Charger les variables d'environnement
require('dotenv').config({ path: '../.env' });

const fetch = require('node-fetch');

// Configuration
const API_URL = 'https://profitummvp-production.up.railway.app';

async function testProductionStatus() {
  console.log('🔍 TEST ÉTAT PRODUCTION');
  console.log('=' .repeat(40));

  try {
    // 1. Test de santé de l'API
    console.log('\n1️⃣ Test de santé de l\'API...');
    
    const healthResponse = await fetch(`${API_URL}/api/health`);
    const healthData = await healthResponse.json();
    
    console.log('✅ API en ligne:', healthData);

    // 2. Test d'inscription simple
    console.log('\n2️⃣ Test d\'inscription simple...');
    
    const timestamp = Date.now();
    const testUserData = {
      username: `status-test-${timestamp}`,
      email: `status-test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      company_name: 'Entreprise Test Status',
      phone_number: '0123456789',
      address: '123 Rue Test',
      city: 'Paris',
      postal_code: '75001',
      siren: `${timestamp % 1000000000}`.padStart(9, '0'),
      type: 'client'
    };

    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUserData)
    });

    if (!registerResponse.ok) {
      const errorData = await registerResponse.json();
      console.error('❌ Erreur inscription:', errorData);
      return;
    }

    const registerResult = await registerResponse.json();
    console.log('✅ Inscription réussie');

    // 3. Test de migration avec session inexistante
    console.log('\n3️⃣ Test de migration avec session inexistante...');
    
    const migrationData = {
      sessionToken: 'session-inexistante',
      sessionId: 'session-inexistante',
      clientData: testUserData
    };

    const migrationResponse = await fetch(`${API_URL}/api/session-migration/migrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${registerResult.data.token}`
      },
      body: JSON.stringify(migrationData)
    });

    const migrationResult = await migrationResponse.json();
    console.log('📡 Status migration:', migrationResponse.status);
    console.log('📥 Réponse migration:', JSON.stringify(migrationResult, null, 2));

    if (migrationResponse.status === 404) {
      console.log('✅ Migration retourne 404 pour session inexistante (comportement attendu)');
    } else if (migrationResult.error && migrationResult.error.includes('éligibilités')) {
      console.log('✅ Migration trouve la session mais pas d\'éligibilités (comportement attendu)');
    } else {
      console.log('⚠️ Comportement inattendu de la migration');
    }

    // 4. Test de l'API produits éligibles
    console.log('\n4️⃣ Test de l\'API produits éligibles...');
    
    const productsResponse = await fetch(`${API_URL}/api/client/produits-eligibles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${registerResult.data.token}`
      }
    });

    if (!productsResponse.ok) {
      const errorData = await productsResponse.json();
      console.log('📥 Réponse produits éligibles:', JSON.stringify(errorData, null, 2));
      
      if (errorData.message === 'Token invalide ou expiré') {
        console.log('⚠️ Problème de token (peut-être expiré)');
      } else {
        console.log('⚠️ Autre problème avec l\'API produits éligibles');
      }
    } else {
      const productsResult = await productsResponse.json();
      console.log('✅ API produits éligibles accessible');
      console.log('📥 Réponse:', JSON.stringify(productsResult, null, 2));
    }

    console.log('\n📊 Résumé:');
    console.log('   - API en ligne: ✅');
    console.log('   - Inscription: ✅');
    console.log('   - Migration: Testé');
    console.log('   - Produits éligibles: Testé');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testProductionStatus();