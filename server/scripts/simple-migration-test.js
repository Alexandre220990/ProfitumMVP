const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function simpleMigrationTest() {
  console.log('🔍 TEST SIMPLE DE MIGRATION');
  console.log('=' .repeat(40));

  try {
    // 1. Se connecter avec le compte existant
    console.log('\n🔐 1. Connexion...');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-migration@example.com',
        password: 'TestPassword123!'
      })
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('❌ Erreur connexion:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ Connexion réussie');

    // 2. Tester l'accès aux produits éligibles
    console.log('\n📊 2. Test produits éligibles...');
    const produitsResponse = await fetch(`${API_URL}/api/client/produits-eligibles`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', produitsResponse.status);
    
    if (produitsResponse.ok) {
      const produitsData = await produitsResponse.json();
      console.log('✅ Produits éligibles accessibles');
      console.log('📊 Nombre de produits:', produitsData.data?.length || 0);
    } else {
      const errorText = await produitsResponse.text();
      console.log('❌ Erreur produits:', errorText);
    }

    // 3. Créer une session de simulation
    console.log('\n🔄 3. Création session...');
    const sessionResponse = await fetch(`${API_URL}/api/simulator/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip_address: '127.0.0.1',
        user_agent: 'Test Script'
      })
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.log('❌ Erreur session:', errorText);
      return;
    }

    const sessionData = await sessionResponse.json();
    console.log('✅ Session créée');
    console.log('📊 Données session:', JSON.stringify(sessionData, null, 2));

    if (!sessionData.success || !sessionData.session_token) {
      console.log('❌ Token de session manquant');
      return;
    }

    const sessionToken = sessionData.session_token;
    console.log('🔑 Session token:', sessionToken.substring(0, 30) + '...');

    // 4. Tester la migration directement
    console.log('\n🚀 4. Test migration...');
    const migrationData = {
      sessionToken: sessionToken,
      clientData: {
        email: 'test-migration@example.com',
        username: 'TestMigrationUser',
        company_name: 'Test Migration Company'
      },
      eligibilityResults: [
        {
          produit_id: 'TICPE',
          eligibility_score: 75,
          estimated_savings: 4388,
          confidence_level: 'high',
          recommendations: ['Optimisation recommandée']
        }
      ]
    };

    const migrationResponse = await fetch(`${API_URL}/api/session-migration/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(migrationData)
    });

    console.log('Status migration:', migrationResponse.status);
    
    if (migrationResponse.ok) {
      const migrationResult = await migrationResponse.json();
      console.log('✅ Migration réussie!');
      console.log('📊 Résultat:', JSON.stringify(migrationResult, null, 2));
    } else {
      const errorText = await migrationResponse.text();
      console.log('❌ Erreur migration:', errorText);
    }

    // 5. Vérifier les produits après migration
    console.log('\n🔍 5. Vérification finale...');
    const finalResponse = await fetch(`${API_URL}/api/client/produits-eligibles`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (finalResponse.ok) {
      const finalData = await finalResponse.json();
      console.log('✅ Vérification finale OK');
      console.log('📊 Produits après migration:', finalData.data?.length || 0);
    } else {
      const errorText = await finalResponse.text();
      console.log('❌ Erreur vérification finale:', errorText);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

simpleMigrationTest(); 