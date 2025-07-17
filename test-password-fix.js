// Script de test pour vérifier la correction du mot de passe
const API_URL = 'http://localhost:5001';

async function testPasswordFix() {
  console.log('🧪 Test de la correction du mot de passe...\n');

  const testClientData = {
    email: 'test-password-fix@profitum.fr',
    password: 'profitum', // Mot de passe simple comme dans l'erreur
    username: 'Test Password Fix',
    company_name: 'Profitum Test',
    phone_number: '0658072445',
    address: '134 av foch',
    city: 'St Maur des Fosses',
    postal_code: '94100',
    siren: '982762478',
    type: 'client'
  };

  const testEligibilityResults = [
    {
      produit_id: 'TICPE',
      eligibility_score: 85,
      estimated_savings: 15000,
      confidence_level: 'élevé',
      recommendations: ['Optimisation des flottes', 'Formation des conducteurs']
    }
  ];

  try {
    console.log('1️⃣ Test de la migration simplifiée avec mot de passe corrigé...');
    
    const response = await fetch(`${API_URL}/api/session-migration/migrate-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientData: testClientData,
        eligibilityResults: testEligibilityResults
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Migration réussie !');
      console.log(`   - Client ID: ${result.data.clientId}`);
      console.log(`   - Produits éligibles: ${result.data.client_produit_eligibles?.length || 0}`);
      
      // Test de connexion avec le mot de passe
      console.log('\n2️⃣ Test de connexion avec le mot de passe...');
      
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testClientData.email,
          password: testClientData.password
        })
      });

      const loginResult = await loginResponse.json();

      if (loginResult.success) {
        console.log('✅ Connexion réussie !');
        console.log(`   - Token: ${loginResult.data.token.substring(0, 20)}...`);
        console.log(`   - User ID: ${loginResult.data.user.id}`);
      } else {
        console.log('❌ Échec de la connexion:', loginResult.message);
      }

    } else {
      console.log('❌ Échec de la migration:', result.error);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Exécuter le test
testPasswordFix(); 