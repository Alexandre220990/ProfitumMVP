const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function testCryptoUUID() {
  console.log('🔍 TEST CRYPTO.UUID()');
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
        user_agent: 'Test Crypto UUID'
      })
    });

    const sessionData = await sessionResponse.json();
    const sessionToken = sessionData.session_token;
    console.log('✅ Session créée:', sessionToken);

    // 3. Test avec un produit simple et UUID généré côté client
    console.log('\n🧪 3. Test avec UUID généré côté client...');
    
    // Générer un UUID côté client
    const testUUID = 'test-uuid-' + Date.now();
    
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
          eligibility_score: 75,
          estimated_savings: 4388,
          confidence_level: 'high',
          recommendations: ['Test UUID'],
          test_uuid: testUUID // Ajouter un UUID de test
        }
      ]
    };

    console.log('📤 Données envoyées avec UUID de test:', testUUID);

    const migrationResponse = await fetch(`${API_URL}/api/session-migration/migrate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Test-UUID': testUUID
      },
      body: JSON.stringify(migrationData)
    });

    console.log('📥 Status:', migrationResponse.status);
    
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

    // 4. Test avec un produit qui utilise gen_random_uuid() côté base de données
    console.log('\n🔍 4. Test avec gen_random_uuid() côté base de données...');
    
    // Créer un script SQL pour tester l'insertion avec gen_random_uuid()
    const sqlTest = `
    INSERT INTO "ClientProduitEligible" (
        id,
        "clientId",
        "produitId",
        statut,
        "tauxFinal",
        "montantFinal",
        "dureeFinale",
        "created_at",
        "updated_at"
    ) VALUES (
        gen_random_uuid(),
        '74dfdf10-af1b-4c84-8828-fa5e0eed5b69',
        '32dd9cf8-15e2-4375-86ab-a95158d3ada1',
        'eligible',
        0.75,
        4388,
        12,
        NOW(),
        NOW()
    ) RETURNING id;
    `;
    
    console.log('📋 SQL de test:', sqlTest);
    console.log('📋 Exécutez ce SQL dans Supabase pour tester gen_random_uuid()');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('Stack:', error.stack);
  }
}

testCryptoUUID(); 