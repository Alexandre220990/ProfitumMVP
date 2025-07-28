const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function testMigrationDetailed() {
  console.log('🔍 TEST MIGRATION DÉTAILLÉ');
  console.log('=' .repeat(50));

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

    if (!loginResponse.ok) {
      console.error('❌ Échec connexion:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Connexion réussie');

    // 2. Créer une session
    console.log('\n🔄 2. Création session...');
    const sessionResponse = await fetch(`${API_URL}/api/simulator/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip_address: '127.0.0.1',
        user_agent: 'Test Migration Détaillé'
      })
    });

    if (!sessionResponse.ok) {
      console.error('❌ Échec création session:', await sessionResponse.text());
      return;
    }

    const sessionData = await sessionResponse.json();
    const sessionToken = sessionData.session_token;
    console.log('✅ Session créée:', sessionToken);

    // 3. Vérifier le client via la route debug
    console.log('\n🔍 3. Vérification client via debug...');
    
    const debugResponse = await fetch(`${API_URL}/api/debug/client-by-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-migration@example.com'
      })
    });

    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('✅ Client trouvé via debug:');
      console.log('📋 ID:', debugData.data.id);
      console.log('📋 Email:', debugData.data.email);
      console.log('📋 Username:', debugData.data.username);
    } else {
      console.log('❌ Client non trouvé via debug');
      const errorText = await debugResponse.text();
      console.log('📋 Erreur:', errorText);
      return;
    }

    // 4. Test migration avec données exactes
    console.log('\n🧪 4. Test migration avec données exactes...');
    
    const migrationData = {
      sessionToken: sessionToken,
      clientData: {
        email: 'test-migration@example.com',
        username: 'TestUser',
        company_name: 'Test Company'
      },
      eligibilityResults: [
        {
          produit_id: 'TICPE',
          eligibility_score: 85,
          estimated_savings: 5000,
          confidence_level: 'high',
          recommendations: ['Test TICPE']
        }
      ]
    };

    console.log('📤 Envoi migration...');

    const migrationResponse = await fetch(`${API_URL}/api/session-migration/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(migrationData)
    });

    console.log('📊 Status migration:', migrationResponse.status);
    
    const responseText = await migrationResponse.text();
    console.log('📋 Réponse complète:', responseText);
    
    if (migrationResponse.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ Migration réussie!');
        console.log('📈 Produits créés:', result.data?.migrated_count || 0);
        console.log('🆔 Session ID:', result.data?.session_id);
      } catch (e) {
        console.log('⚠️ Réponse non-JSON:', responseText);
      }
    } else {
      console.error('❌ Échec migration');
      try {
        const errorData = JSON.parse(responseText);
        console.error('📋 Détails erreur:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.error('📋 Erreur brute:', responseText);
      }
    }

    // 5. Vérifier les données en base après migration
    console.log('\n🔍 5. Vérification données après migration...');
    
    const verifyResponse = await fetch(`${API_URL}/api/session-migration/session-data/${sessionToken}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('✅ Données de session récupérées');
      console.log('📊 Session migrée:', verifyData.data?.session?.migrated_to_account);
      console.log('📅 Date migration:', verifyData.data?.session?.migrated_at);
    } else {
      console.log('⚠️ Impossible de vérifier les données de session');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('📋 Stack:', error.stack);
  }
}

testMigrationDetailed(); 