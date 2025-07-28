const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function testApiInsert() {
  console.log('🔍 TEST INSERTION VIA API');
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
        user_agent: 'Test API Insert'
      })
    });

    const sessionData = await sessionResponse.json();
    const sessionToken = sessionData.session_token;
    console.log('✅ Session créée:', sessionToken);

    // 3. Test avec données identiques à l'insertion manuelle qui fonctionne
    console.log('\n🧪 3. Test insertion API...');
    
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
          recommendations: ['Test API']
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

    // 4. Test direct d'insertion via une route admin (si disponible)
    console.log('\n🔍 4. Test insertion directe via API...');
    
    const directInsertData = {
      clientId: '74dfdf10-af1b-4c84-8828-fa5e0eed5b69',
      produitId: '32dd9cf8-15e2-4375-86ab-a95158d3ada1',
      statut: 'eligible',
      tauxFinal: 0.75,
      montantFinal: 4388,
      dureeFinale: 12
    };

    console.log('📤 Test insertion directe:', JSON.stringify(directInsertData, null, 2));
    
    // Essayer différentes routes possibles
    const possibleRoutes = [
      '/api/admin/client-produit-eligible',
      '/api/client-produit-eligible',
      '/api/produits-eligibles/client',
      '/api/experts/client-produit-eligible'
    ];

    for (const route of possibleRoutes) {
      console.log(`\n🔄 Test route: ${route}`);
      
      const directInsertResponse = await fetch(`${API_URL}${route}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(directInsertData)
      });

      console.log(`📥 Status ${route}:`, directInsertResponse.status);
      
      if (directInsertResponse.status !== 404) {
        const directInsertText = await directInsertResponse.text();
        console.log(`📥 Réponse ${route}:`, directInsertText);
      } else {
        console.log(`📥 Route ${route}: Non trouvée (404)`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('Stack:', error.stack);
  }
}

testApiInsert(); 