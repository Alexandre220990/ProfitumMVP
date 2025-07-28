const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function testCompleteMigration() {
  console.log('🔍 TEST COMPLET MIGRATION CLIENTPRODUITELIGIBLE');
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
    const token = loginData.data.token;
    console.log('✅ Connexion réussie');

    // 2. Créer une session
    console.log('\n🔄 2. Création session...');
    const sessionResponse = await fetch(`${API_URL}/api/simulator/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip_address: '127.0.0.1',
        user_agent: 'Test Complet Migration'
      })
    });

    if (!sessionResponse.ok) {
      console.error('❌ Échec création session:', await sessionResponse.text());
      return;
    }

    const sessionData = await sessionResponse.json();
    const sessionToken = sessionData.session_token;
    console.log('✅ Session créée:', sessionToken);

    // 3. Test avec tous les produits
    console.log('\n🧪 3. Test migration complète...');
    
    const testProducts = [
      { name: 'TICPE', score: 85, savings: 5000 },
      { name: 'URSSAF', score: 75, savings: 3200 },
      { name: 'DFS', score: 90, savings: 7800 },
      { name: 'FONCIER', score: 65, savings: 2100 },
      { name: 'CIR', score: 80, savings: 4500 },
      { name: 'CEE', score: 95, savings: 12000 },
      { name: 'AUDIT_ENERGETIQUE', score: 70, savings: 2800 }
    ];

    const migrationData = {
      sessionToken: sessionToken,
      clientData: {
        email: 'test-migration@example.com',
        username: 'TestUser',
        company_name: 'Test Company'
      },
      eligibilityResults: testProducts.map(product => ({
        produit_id: product.name,
        eligibility_score: product.score,
        estimated_savings: product.savings,
        confidence_level: product.score >= 80 ? 'high' : product.score >= 60 ? 'medium' : 'low',
        recommendations: [`Recommandation pour ${product.name}`]
      }))
    };

    console.log('📤 Envoi migration avec', migrationData.eligibilityResults.length, 'produits...');

    const migrationResponse = await fetch(`${API_URL}/api/session-migration/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(migrationData)
    });

    console.log('📊 Status migration:', migrationResponse.status);
    
    if (migrationResponse.ok) {
      const result = await migrationResponse.json();
      console.log('✅ Migration réussie!');
      console.log('📈 Produits créés:', result.data?.migrated_count || 0);
      console.log('🆔 Session ID:', result.data?.session_id);
      
      if (result.data?.client_produit_eligibles) {
        console.log('\n📋 Détails des produits créés:');
        result.data.client_produit_eligibles.forEach((produit, index) => {
          console.log(`  ${index + 1}. ${produit.produitId} - Score: ${produit.tauxFinal * 100}% - Économies: ${produit.montantFinal}€`);
        });
      }
    } else {
      const errorText = await migrationResponse.text();
      console.error('❌ Échec migration:', errorText);
      return;
    }

    // 4. Vérifier les données en base
    console.log('\n🔍 4. Vérification en base...');
    
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

    // 5. Test de vérification de migration
    console.log('\n🔍 5. Test vérification migration...');
    
    const canMigrateResponse = await fetch(`${API_URL}/api/session-migration/can-migrate/${sessionToken}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (canMigrateResponse.ok) {
      const canMigrateData = await canMigrateResponse.json();
      console.log('✅ Vérification migration:', canMigrateData.can_migrate ? 'Peut migrer' : 'Ne peut pas migrer');
      if (!canMigrateData.can_migrate) {
        console.log('📝 Raison:', canMigrateData.error);
      }
    } else {
      console.log('⚠️ Impossible de vérifier la migration');
    }

    console.log('\n🎉 TEST COMPLET TERMINÉ');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('📋 Stack:', error.stack);
  }
}

async function testIndividualProducts() {
  console.log('\n🔍 TEST PRODUITS INDIVIDUELS');
  console.log('=' .repeat(40));

  try {
    // Connexion
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-migration@example.com',
        password: 'TestPassword123!'
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Échec connexion pour test individuel');
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.token;

    // Test chaque produit individuellement
    const products = ['TICPE', 'URSSAF', 'DFS', 'FONCIER', 'CIR', 'CEE', 'AUDIT_ENERGETIQUE'];
    
    for (const productName of products) {
      console.log(`\n🧪 Test ${productName}...`);
      
      // Créer une nouvelle session pour chaque produit
      const sessionResponse = await fetch(`${API_URL}/api/simulator/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip_address: '127.0.0.1',
          user_agent: `Test ${productName}`
        })
      });

      if (!sessionResponse.ok) {
        console.log(`❌ Échec création session pour ${productName}`);
        continue;
      }

      const sessionData = await sessionResponse.json();
      const sessionToken = sessionData.session_token;

      const migrationData = {
        sessionToken: sessionToken,
        clientData: {
          email: 'test-migration@example.com',
          username: 'TestUser',
          company_name: 'Test Company'
        },
        eligibilityResults: [
          {
            produit_id: productName,
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

      if (migrationResponse.ok) {
        const result = await migrationResponse.json();
        console.log(`✅ ${productName} réussi: ${result.data?.migrated_count || 0} produits`);
      } else {
        const errorText = await migrationResponse.text();
        console.log(`❌ ${productName} échoué:`, errorText.substring(0, 100));
      }
    }

  } catch (error) {
    console.error('❌ Erreur test individuel:', error.message);
  }
}

// Exécuter les tests
async function runAllTests() {
  await testCompleteMigration();
  await testIndividualProducts();
}

runAllTests(); 