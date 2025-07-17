// Script de test détaillé pour identifier l'erreur de migration
const API_URL = 'http://localhost:5001';

async function testMigrationDetailed() {
  console.log('🧪 Test détaillé de la migration...\n');

  const testClientData = {
    email: 'test-detailed@profitum.fr',
    password: 'profitum',
    username: 'Test Detailed',
    company_name: 'Profitum Test Detailed',
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
    console.log('1️⃣ Test de la route migrate-simple...');
    console.log('📤 Données envoyées:', JSON.stringify({
      clientData: { ...testClientData, password: '[HIDDEN]' },
      eligibilityResults: testEligibilityResults
    }, null, 2));
    
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

    console.log(`📥 Status: ${response.status} ${response.statusText}`);
    
    const result = await response.json();
    console.log('📥 Réponse:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ Migration réussie !');
      console.log(`   - Client ID: ${result.data.clientId}`);
      console.log(`   - Produits éligibles: ${result.data.client_produit_eligibles?.length || 0}`);
    } else {
      console.log('❌ Échec de la migration:', result.error);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Exécuter le test
testMigrationDetailed(); 