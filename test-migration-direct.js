const API_BASE = 'http://localhost:5001/api';

async function testMigrationDirect() {
  console.log('🚀 Test de migration directe (sans simulateur)...\n');
  
  try {
    // Données de test pour un client
    const clientData = {
      email: 'test-migration-direct@example.com',
      password: 'TestPassword123!',
      username: 'TestMigrationDirect',
      company_name: 'Entreprise Test Migration',
      phone_number: '0123456789',
      address: '123 Rue de Test',
      city: 'Paris',
      postal_code: '75001',
      siren: '123456789',
      secteurActivite: 'transport',
      nombreEmployes: 50,
      revenuAnnuel: 2000000,
      ancienneteEntreprise: 5,
      type: 'client'
    };

    // Résultats d'éligibilité de test
    const eligibilityResults = [
      {
        produit_id: 'CEE',
        eligibility_score: 85,
        estimated_savings: 15000,
        confidence_level: 'high',
        recommendations: ['Installation de panneaux solaires', 'Rénovation énergétique']
      },
      {
        produit_id: 'Fonds Européens',
        eligibility_score: 70,
        estimated_savings: 25000,
        confidence_level: 'medium',
        recommendations: ['Formation des employés', 'Innovation technologique']
      }
    ];

    console.log('📋 Test 1: Migration directe');
    const response = await fetch(`${API_BASE}/session-migration/migrate-simple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientData,
        eligibilityResults
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur migration: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Migration réussie!');
    console.log('📊 Résultats:');
    console.log(`   - Client ID: ${result.data.clientId}`);
    console.log(`   - Produits éligibles créés: ${result.data.client_produit_eligibles.length}`);
    console.log(`   - Message: ${result.data.message}`);

    // Test 2: Vérifier que le client existe
    console.log('\n📋 Test 2: Vérification du client créé');
    const clientResponse = await fetch(`${API_BASE}/clients/${result.data.clientId}`);
    
    if (clientResponse.ok) {
      const clientData = await clientResponse.json();
      console.log('✅ Client trouvé en base:');
      console.log(`   - Email: ${clientData.email}`);
      console.log(`   - Entreprise: ${clientData.company_name}`);
      console.log(`   - Statut: ${clientData.statut}`);
    } else {
      console.log('⚠️ Client non trouvé en base');
    }

    console.log('\n🎉 Test de migration directe terminé avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testMigrationDirect(); 