const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function debugMigrationError() {
  console.log('🔍 DEBUG ERREUR MIGRATION 500');
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
        user_agent: 'Debug Script'
      })
    });

    const sessionData = await sessionResponse.json();
    const sessionToken = sessionData.session_token;
    console.log('✅ Session créée:', sessionToken.substring(0, 30) + '...');

    // 3. Tester différentes variantes de migration
    console.log('\n🚀 3. Test migration avec données minimales...');
    
    const testCases = [
      {
        name: 'Données minimales',
        data: {
          sessionToken: sessionToken,
          clientData: {
            email: 'test-migration@example.com'
          },
          eligibilityResults: []
        }
      },
      {
        name: 'Avec un résultat simple',
        data: {
          sessionToken: sessionToken,
          clientData: {
            email: 'test-migration@example.com',
            username: 'TestUser'
          },
          eligibilityResults: [
            {
              produit_id: 'TICPE',
              eligibility_score: 75,
              estimated_savings: 4388
            }
          ]
        }
      },
      {
        name: 'Avec données complètes',
        data: {
          sessionToken: sessionToken,
          clientData: {
            email: 'test-migration@example.com',
            username: 'TestUser',
            company_name: 'Test Company'
          },
          eligibilityResults: [
            {
              produit_id: 'TICPE',
              eligibility_score: 75,
              estimated_savings: 4388,
              confidence_level: 'high',
              recommendations: ['Test']
            }
          ]
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n📊 Test: ${testCase.name}`);
      console.log('📤 Données envoyées:', JSON.stringify(testCase.data, null, 2));
      
      const migrationResponse = await fetch(`${API_URL}/api/session-migration/migrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.data)
      });

      console.log('📡 Status:', migrationResponse.status);
      
      if (migrationResponse.ok) {
        const result = await migrationResponse.json();
        console.log('✅ Succès:', JSON.stringify(result, null, 2));
      } else {
        const errorText = await migrationResponse.text();
        console.log('❌ Erreur:', errorText);
        
        // Essayer de parser l'erreur JSON
        try {
          const errorJson = JSON.parse(errorText);
          console.log('📋 Erreur détaillée:', JSON.stringify(errorJson, null, 2));
        } catch (e) {
          console.log('📋 Erreur texte brut:', errorText);
        }
      }
    }

    // 4. Tester la route session-data pour voir si elle fonctionne
    console.log('\n🔍 4. Test route session-data...');
    const sessionDataResponse = await fetch(`${API_URL}/api/session-migration/session-data/${sessionToken}`);
    
    console.log('Status session-data:', sessionDataResponse.status);
    
    if (sessionDataResponse.ok) {
      const sessionDataResult = await sessionDataResponse.json();
      console.log('✅ Session data:', JSON.stringify(sessionDataResult, null, 2));
    } else {
      const errorText = await sessionDataResponse.text();
      console.log('❌ Erreur session-data:', errorText);
    }

    // 5. Tester la route can-migrate
    console.log('\n🔍 5. Test route can-migrate...');
    const canMigrateResponse = await fetch(`${API_URL}/api/session-migration/can-migrate/${sessionToken}`);
    
    console.log('Status can-migrate:', canMigrateResponse.status);
    
    if (canMigrateResponse.ok) {
      const canMigrateResult = await canMigrateResponse.json();
      console.log('✅ Can migrate:', JSON.stringify(canMigrateResult, null, 2));
    } else {
      const errorText = await canMigrateResponse.text();
      console.log('❌ Erreur can-migrate:', errorText);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

debugMigrationError(); 