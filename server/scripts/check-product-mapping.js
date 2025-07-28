const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function checkProductMapping() {
  console.log('🔍 VÉRIFICATION DU MAPPING DES PRODUITS');
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
        user_agent: 'Mapping Test'
      })
    });

    const sessionData = await sessionResponse.json();
    const sessionToken = sessionData.session_token;
    console.log('✅ Session créée');

    // 3. Tester avec différents produits
    console.log('\n🧪 3. Test avec différents produits...');
    
    const testProducts = [
      'TICPE',
      'URSSAF', 
      'DFS',
      'FONCIER',
      'CIR',
      'CEE',
      'AUDIT_ENERGETIQUE'
    ];

    for (const productId of testProducts) {
      console.log(`\n📊 Test produit: ${productId}`);
      
      const migrationData = {
        sessionToken: sessionToken,
        clientData: {
          email: 'test-migration@example.com',
          username: 'TestUser',
          company_name: 'Test Company'
        },
        eligibilityResults: [
          {
            produit_id: productId,
            eligibility_score: 75,
            estimated_savings: 4388,
            confidence_level: 'high',
            recommendations: ['Test']
          }
        ]
      };

      const migrationResponse = await fetch(`${API_URL}/api/session-migration/migrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(migrationData)
      });

      console.log(`Status ${productId}:`, migrationResponse.status);
      
      if (migrationResponse.ok) {
        const result = await migrationResponse.json();
        console.log(`✅ ${productId} réussi:`, result.data?.migrated_count || 0, 'produits');
      } else {
        const errorText = await migrationResponse.text();
        console.log(`❌ ${productId} échoué:`, errorText);
      }
    }

    // 4. Tester avec un produit qui existe probablement
    console.log('\n🎯 4. Test avec produit existant...');
    
    // D'abord, récupérer les produits disponibles
    const produitsResponse = await fetch(`${API_URL}/api/produits-eligibles`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (produitsResponse.ok) {
      const produitsData = await produitsResponse.json();
      console.log('📋 Produits disponibles:', produitsData.data?.length || 0);
      
      if (produitsData.data && produitsData.data.length > 0) {
        const firstProduct = produitsData.data[0];
        console.log('🎯 Premier produit:', firstProduct.nom, '(ID:', firstProduct.id, ')');
        
        // Tester avec l'ID exact du produit
        const migrationDataExact = {
          sessionToken: sessionToken,
          clientData: {
            email: 'test-migration@example.com',
            username: 'TestUser',
            company_name: 'Test Company'
          },
          eligibilityResults: [
            {
              produit_id: firstProduct.id, // Utiliser l'ID exact
              eligibility_score: 75,
              estimated_savings: 4388,
              confidence_level: 'high',
              recommendations: ['Test avec ID exact']
            }
          ]
        };

        const migrationResponseExact = await fetch(`${API_URL}/api/session-migration/migrate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(migrationDataExact)
        });

        console.log('Status avec ID exact:', migrationResponseExact.status);
        
        if (migrationResponseExact.ok) {
          const resultExact = await migrationResponseExact.json();
          console.log('✅ Migration avec ID exact réussie:', resultExact.data?.migrated_count || 0, 'produits');
        } else {
          const errorTextExact = await migrationResponseExact.text();
          console.log('❌ Migration avec ID exact échouée:', errorTextExact);
        }
      }
    } else {
      console.log('❌ Impossible de récupérer les produits');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

checkProductMapping(); 