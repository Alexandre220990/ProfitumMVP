const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function testMigrationDebug() {
  console.log('🔍 TEST DÉBOGAGE MIGRATION CLIENTPRODUITELIGIBLE');
  console.log('=' .repeat(60));

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
        user_agent: 'Test Debug Migration'
      })
    });

    if (!sessionResponse.ok) {
      console.error('❌ Échec création session:', await sessionResponse.text());
      return;
    }

    const sessionData = await sessionResponse.json();
    const sessionToken = sessionData.session_token;
    console.log('✅ Session créée:', sessionToken);

    // 3. Test avec un seul produit pour simplifier
    console.log('\n🧪 3. Test migration avec un seul produit...');
    
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

    console.log('📤 Données de migration:', JSON.stringify(migrationData, null, 2));

    const migrationResponse = await fetch(`${API_URL}/api/session-migration/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(migrationData)
    });

    console.log('📊 Status migration:', migrationResponse.status);
    console.log('📊 Headers:', Object.fromEntries(migrationResponse.headers.entries()));
    
    const responseText = await migrationResponse.text();
    console.log('📋 Réponse complète:', responseText);
    
    if (migrationResponse.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ Migration réussie!');
        console.log('📈 Produits créés:', result.data?.migrated_count || 0);
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

    // 4. Vérifier les données de session
    console.log('\n🔍 4. Vérification données de session...');
    
    const sessionDataResponse = await fetch(`${API_URL}/api/session-migration/session-data/${sessionToken}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (sessionDataResponse.ok) {
      const sessionInfo = await sessionDataResponse.json();
      console.log('✅ Données de session récupérées');
      console.log('📊 Session:', JSON.stringify(sessionInfo.data?.session, null, 2));
      console.log('📊 Réponses:', sessionInfo.data?.responses?.length || 0);
      console.log('📊 Éligibilité:', sessionInfo.data?.eligibilityResults?.length || 0);
    } else {
      console.log('⚠️ Impossible de récupérer les données de session');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('📋 Stack:', error.stack);
  }
}

async function testDatabaseConnection() {
  console.log('\n🔍 TEST CONNEXION BASE DE DONNÉES');
  console.log('=' .repeat(40));

  try {
    // Test simple de connexion via l'API
    const response = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const healthData = await response.json();
      console.log('✅ API accessible:', healthData);
    } else {
      console.log('⚠️ API non accessible');
    }

  } catch (error) {
    console.error('❌ Erreur connexion API:', error.message);
  }
}

async function testProductMapping() {
  console.log('\n🔍 TEST MAPPING DES PRODUITS');
  console.log('=' .repeat(40));

  const productMapping = {
    'TICPE': '32dd9cf8-15e2-4375-86ab-a95158d3ada1',
    'URSSAF': 'd1e8f740-7c2a-4b5e-9a91-0e15c0e7d3a2',
    'DFS': 'e2f9a830-8d3b-4c7c-b590-1d7631c0d4b5',
    'FONCIER': 'c5d2e980-4f63-44c0-b8a9-9d6e8e21c0f7',
    'CIR': '37da1c4e-3fcc-49f8-9acb-9b75e231edfd',
    'CEE': 'b7f3c891-28d9-4982-b0eb-821c9e7cbcf0',
    'AUDIT_ENERGETIQUE': 'bc2b94ec-659b-4cf5-a693-d61178b03caf'
  };

  console.log('📋 Mapping des produits:');
  Object.entries(productMapping).forEach(([name, uuid]) => {
    console.log(`  ${name}: ${uuid}`);
  });
}

// Exécuter tous les tests de débogage
async function runDebugTests() {
  await testDatabaseConnection();
  await testProductMapping();
  await testMigrationDebug();
}

runDebugTests(); 