const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function debugMigrationDetailed() {
  console.log('🔍 DEBUG DÉTAILLÉ DE LA MIGRATION');
  console.log('=' .repeat(40));

  try {
    // 1. Se connecter
    console.log('\n🔐 1. Connexion...');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-migration@example.com',
        password: 'TestPassword123!'
      })
    });

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ Connexion réussie');

    // 2. Créer une session
    console.log('\n🔄 2. Création session...');
    const sessionResponse = await fetch(`${API_URL}/api/simulator/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip_address: '127.0.0.1',
        user_agent: 'Debug Test'
      })
    });

    const sessionData = await sessionResponse.json();
    const sessionToken = sessionData.session_token;
    console.log('✅ Session créée:', sessionToken);

    // 3. Tester avec un produit simple (TICPE avec ID exact)
    console.log('\n🧪 3. Test détaillé avec TICPE...');
    
    const migrationData = {
      sessionToken: sessionToken,
      clientData: {
        email: 'test-migration@example.com',
        username: 'TestUser',
        company_name: 'Test Company'
      },
      eligibilityResults: [
        {
          produit_id: '32dd9cf8-15e2-4375-86ab-a95158d3ada1', // ID exact de TICPE
          eligibility_score: 75,
          estimated_savings: 4388,
          confidence_level: 'high',
          recommendations: ['Test détaillé']
        }
      ]
    };

    console.log('📤 Données envoyées:', JSON.stringify(migrationData, null, 2));

    const migrationResponse = await fetch(`${API_URL}/api/session-migration/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(migrationData)
    });

    console.log('📥 Status:', migrationResponse.status);
    console.log('📥 Headers:', Object.fromEntries(migrationResponse.headers.entries()));

    const responseText = await migrationResponse.text();
    console.log('📥 Réponse complète:', responseText);

    if (migrationResponse.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ Migration réussie:', result);
      } catch (e) {
        console.log('⚠️ Réponse non-JSON:', responseText);
      }
    } else {
      console.log('❌ Migration échouée');
      
      // Essayer de parser l'erreur
      try {
        const errorData = JSON.parse(responseText);
        console.log('📋 Détails erreur:', errorData);
      } catch (e) {
        console.log('📋 Erreur brute:', responseText);
      }
    }

    // 4. Vérifier les logs du serveur en testant une route simple
    console.log('\n🔍 4. Test route simple...');
    
    const simpleResponse = await fetch(`${API_URL}/api/session-migration/can-migrate/${sessionToken}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('📥 Status route simple:', simpleResponse.status);
    const simpleText = await simpleResponse.text();
    console.log('📥 Réponse route simple:', simpleText);

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugMigrationDetailed(); 