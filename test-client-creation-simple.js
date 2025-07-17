// Script de test simple pour la création de client
const API_URL = 'http://localhost:3000';

async function testClientCreation() {
  console.log('🧪 Test simple de création de client...\n');

  const testData = {
    clientData: {
      email: 'test-simple@example.com',
      password: 'test123',
      username: 'Test Simple',
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
    console.log('Données:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(`${API_URL}/api/session-migration/migrate-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 Réponse reçue:');
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    console.log('Body:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ Création réussie !');
    } else {
      console.log('❌ Échec de la création:', result.error);
    }

  } catch (error) {
    console.error('❌ Erreur réseau:', error.message);
  }
}

// Exécuter le test
testClientCreation(); 