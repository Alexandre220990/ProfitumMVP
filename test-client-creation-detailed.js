// Script de test détaillé pour diagnostiquer l'erreur de création de client
const API_URL = 'http://localhost:3000';

async function testClientCreationDetailed() {
  console.log('🧪 Test détaillé de création de client...\n');

  const testData = {
    clientData: {
      email: 'test-detailed@example.com',
      password: 'test123',
      username: 'Test Detailed',
      company_name: 'Test Company',
      phone_number: '0123456789',
      address: '123 Test St',
      city: 'Test City',
      postal_code: '12345',
      siren: '123456789',
      type: 'client'
    },
    eligibilityResults: [
      {
        produit_id: 'TICPE',
        eligibility_score: 85,
        estimated_savings: 15000,
        confidence_level: 'élevé',
        recommendations: ['Optimisation des flottes']
      }
    ]
  };

  try {
    console.log('📤 Envoi de la requête...');
    console.log('URL:', `${API_URL}/api/session-migration/migrate-simple`);
    
    const response = await fetch(`${API_URL}/api/session-migration/migrate-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 Réponse reçue:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);

    const result = await response.json();
    console.log('Body:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ Création réussie !');
      console.log('Client ID:', result.data.clientId);
      console.log('Produits éligibles:', result.data.client_produit_eligibles?.length || 0);
    } else {
      console.log('❌ Échec de la création:', result.error);
      
      // Si c'est une erreur 500, afficher plus de détails
      if (response.status === 500) {
        console.log('🔍 Erreur 500 détectée - Vérifiez les logs du serveur');
        console.log('💡 Suggestions de débogage:');
        console.log('   1. Vérifiez que Supabase est connecté');
        console.log('   2. Vérifiez que les tables existent');
        console.log('   3. Vérifiez les permissions Supabase');
        console.log('   4. Vérifiez les logs du serveur backend');
      }
    }

  } catch (error) {
    console.error('❌ Erreur réseau:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Exécuter le test
testClientCreationDetailed(); 