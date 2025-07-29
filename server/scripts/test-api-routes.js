// Charger les variables d'environnement
require('dotenv').config({ path: '../../.env' });

const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_URL || 'https://profitummvp-production.up.railway.app';

async function testAPIRoutes() {
  console.log('🧪 Test des routes d\'API\n');

  try {
    // 1. Test de la route de santé
    console.log('1️⃣ Test route de santé...');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
    console.log(`   Status: ${healthResponse.status}`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`   ✅ API fonctionne: ${healthData.message}`);
    } else {
      console.log('   ❌ API ne répond pas');
    }

    // 2. Test de la route session-migration (diagnostic)
    console.log('\n2️⃣ Test route session-migration/diagnose...');
    const testSessionToken = 'test-session-token';
    const diagnoseResponse = await fetch(`${API_BASE_URL}/api/session-migration/diagnose/${testSessionToken}`);
    console.log(`   Status: ${diagnoseResponse.status}`);
    if (diagnoseResponse.ok) {
      const diagnoseData = await diagnoseResponse.json();
      console.log(`   ✅ Route fonctionne: ${diagnoseData.success}`);
    } else {
      const errorData = await diagnoseResponse.json();
      console.log(`   ⚠️ Route accessible mais session non trouvée: ${errorData.error}`);
    }

    // 3. Test de la route produits-eligibles (sans authentification)
    console.log('\n3️⃣ Test route client/produits-eligibles (sans auth)...');
    const produitsResponse = await fetch(`${API_BASE_URL}/api/client/produits-eligibles`);
    console.log(`   Status: ${produitsResponse.status}`);
    if (produitsResponse.status === 401 || produitsResponse.status === 403) {
      console.log('   ✅ Route protégée correctement (authentification requise)');
    } else {
      console.log('   ⚠️ Route accessible sans authentification');
    }

    // 4. Test de la route session-migration/migrate (POST)
    console.log('\n4️⃣ Test route session-migration/migrate (POST)...');
    const migrateResponse = await fetch(`${API_BASE_URL}/api/session-migration/migrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionToken: 'test-token',
        clientData: { email: 'test@example.com' },
        eligibilityResults: []
      })
    });
    console.log(`   Status: ${migrateResponse.status}`);
    if (migrateResponse.ok) {
      console.log('   ✅ Route POST accessible');
    } else {
      const errorData = await migrateResponse.json();
      console.log(`   ⚠️ Route accessible mais données invalides: ${errorData.error}`);
    }

    console.log('\n🎉 Tests terminés !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
testAPIRoutes();