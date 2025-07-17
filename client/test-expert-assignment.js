const fetch = require('node-fetch');

const API_URL = 'http://localhost:5001';
const TEST_TOKEN = 'your-test-token-here'; // À remplacer par un vrai token

async function testExpertAssignment() {
  console.log('🧪 Test d\'assignation d\'expert');
  console.log('================================');

  try {
    // Test 1: Assigner un expert
    const response = await fetch(`${API_URL}/api/client/produits-eligibles/44e69788-62a2-46bb-9c1b-da74b9ff47b4/assign-expert`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify({
        expert_id: 'a26a9609-a160-47a0-9698-955876c3618d'
      })
    });

    const data = await response.json();
    
    console.log('📊 Réponse:', {
      status: response.status,
      success: data.success,
      message: data.message,
      data: data.data ? 'Données reçues' : 'Aucune donnée'
    });

    if (response.ok && data.success) {
      console.log('✅ Test réussi - Expert assigné avec succès');
    } else {
      console.log('❌ Test échoué:', data.message);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Exécuter le test
testExpertAssignment(); 