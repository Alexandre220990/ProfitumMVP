const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function testMinimalInsert() {
  console.log('🔍 TEST INSERTION MINIMALE ClientProduitEligible');
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
        user_agent: 'Test Minimal'
      })
    });

    const sessionData = await sessionResponse.json();
    const sessionToken = sessionData.session_token;
    console.log('✅ Session créée:', sessionToken);

    // 3. Tester avec un seul produit et des données minimales
    console.log('\n🧪 3. Test insertion minimale...');
    
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
          recommendations: ['Test minimal']
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
    
    const responseText = await migrationResponse.text();
    console.log('📥 Réponse complète:', responseText);

    if (migrationResponse.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ Migration réussie:', result);
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

    // 4. Tester une insertion directe via une route admin (si disponible)
    console.log('\n🔍 4. Test insertion directe...');
    
    // Récupérer d'abord les données du client
    const clientResponse = await fetch(`${API_URL}/api/clients/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (clientResponse.ok) {
      const clientData = await clientResponse.json();
      console.log('📋 Données client:', clientData);
      
      // Tester l'insertion directe d'un ClientProduitEligible
      const testInsertData = {
        clientId: clientData.data?.id,
        produitId: '32dd9cf8-15e2-4375-86ab-a95158d3ada1', // TICPE
        statut: 'eligible',
        tauxFinal: 0.75,
        montantFinal: 4388,
        dureeFinale: 12,
        notes: 'Test insertion directe'
      };

      console.log('📤 Test insertion directe:', JSON.stringify(testInsertData, null, 2));
      
      // Note: Cette route n'existe probablement pas, mais on peut voir l'erreur
      const directInsertResponse = await fetch(`${API_URL}/api/admin/client-produit-eligible`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testInsertData)
      });

      console.log('📥 Status insertion directe:', directInsertResponse.status);
      const directInsertText = await directInsertResponse.text();
      console.log('📥 Réponse insertion directe:', directInsertText);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('Stack:', error.stack);
  }
}

testMinimalInsert(); 