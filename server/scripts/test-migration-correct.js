const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function testMigrationCorrect() {
  console.log('🔍 TEST MIGRATION AVEC NOMS DE PRODUITS CORRECTS');
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
        user_agent: 'Test Correct'
      })
    });

    const sessionData = await sessionResponse.json();
    const sessionToken = sessionData.session_token;
    console.log('✅ Session créée:', sessionToken);

    // 3. Tester avec les noms de produits corrects
    console.log('\n🧪 3. Test avec noms de produits...');
    
    const testProducts = [
      'TICPE',
      'URSSAF', 
      'DFS',
      'FONCIER',
      'CIR',
      'CEE',
      'AUDIT_ENERGETIQUE'
    ];

    for (const productName of testProducts) {
      console.log(`\n📊 Test produit: ${productName}`);
      
      const migrationData = {
        sessionToken: sessionToken,
        clientData: {
          email: 'test-migration@example.com',
          username: 'TestUser',
          company_name: 'Test Company'
        },
        eligibilityResults: [
          {
            produit_id: productName, // Nom du produit, pas UUID
            eligibility_score: 75,
            estimated_savings: 4388,
            confidence_level: 'high',
            recommendations: [`Test ${productName}`]
          }
        ]
      };

      const migrationResponse = await fetch(`${API_URL}/api/session-migration/migrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(migrationData)
      });

      console.log(`Status ${productName}:`, migrationResponse.status);
      
      if (migrationResponse.ok) {
        const result = await migrationResponse.json();
        console.log(`✅ ${productName} réussi:`, result.data?.migrated_count || 0, 'produits');
        
        if (result.data?.migrated_count > 0) {
          console.log(`🎉 SUCCÈS ! ${productName} a créé ${result.data.migrated_count} produits`);
        }
      } else {
        const errorText = await migrationResponse.text();
        console.log(`❌ ${productName} échoué:`, errorText);
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testMigrationCorrect(); 