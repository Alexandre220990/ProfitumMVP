const API_BASE = 'http://localhost:5001/api';

async function testSimulatorMigrationFixed() {
  console.log('🚀 Test de la migration simulateur corrigée...\n');
  
  let sessionToken = '';
  let sessionId = '';
  
  try {
    // 1. Créer une session
    console.log('📋 Test 1: Création de session');
    const sessionResponse = await fetch(`${API_BASE}/simulator/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip_address: '127.0.0.1',
        user_agent: 'Test Migration Fixed'
      })
    });

    if (!sessionResponse.ok) {
      throw new Error(`Erreur création session: ${sessionResponse.status}`);
    }

    const sessionData = await sessionResponse.json();
    sessionToken = sessionData.session_token;
    sessionId = sessionData.session_id;
    console.log(`✅ Session créée: ${sessionToken}`);
    console.log(`✅ Session ID: ${sessionId}`);

    // 2. Récupérer les questions
    console.log('\n📋 Test 2: Récupération des questions');
    const questionsResponse = await fetch(`${API_BASE}/simulator/questions`);
    
    if (!questionsResponse.ok) {
      throw new Error(`Erreur récupération questions: ${questionsResponse.status}`);
    }

    const questions = await questionsResponse.json();
    console.log(`✅ ${questions.length} questions récupérées`);

    // 3. Envoyer des réponses complètes
    console.log('\n📋 Test 3: Envoi de réponses complètes');
    const testResponses = [
      'Transport de marchandises',
      'Conducteurs routiers',
      '5-10 véhicules',
      'Diesel',
      'Oui',
      '100 000€ - 500 000€',
      '2 000€ - 3 000€/mois'
    ];

    for (let i = 0; i < Math.min(questions.length, testResponses.length); i++) {
      const question = questions[i];
      const response = testResponses[i];
      
      const responseRes = await fetch(`${API_BASE}/simulator/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionToken,
          question_id: question.id,
          response_value: response
        })
      });

      if (responseRes.ok) {
        console.log(`✅ Question ${i + 1}: ${response}`);
      } else {
        console.log(`⚠️ Question ${i + 1} échouée`);
      }
    }

    // 4. Calculer l'éligibilité
    console.log('\n📋 Test 4: Calcul de l\'éligibilité');
    const eligibilityRes = await fetch(`${API_BASE}/simulator/calculate-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_token: sessionToken
      })
    });

    if (eligibilityRes.ok) {
      const results = await eligibilityRes.json();
      console.log(`✅ ${results.length} résultats d'éligibilité calculés`);
      
      results.forEach(result => {
        console.log(`  - ${result.produit_id}: ${result.eligibility_score}% éligible, ${result.estimated_savings}€ d'économies`);
      });
    } else {
      throw new Error(`Erreur calcul éligibilité: ${eligibilityRes.status}`);
    }

    // 5. Vérifier que la session peut être migrée
    console.log('\n📋 Test 5: Vérification migration');
    const canMigrateRes = await fetch(`${API_BASE}/session-migration/can-migrate/${sessionToken}`);
    
    if (canMigrateRes.ok) {
      const canMigrateData = await canMigrateRes.json();
      console.log(`✅ Session peut être migrée: ${canMigrateData.can_migrate}`);
      
      if (!canMigrateData.can_migrate) {
        console.log('⚠️ La session ne peut pas être migrée, vérification des données...');
        
        // Vérifier les données de session
        const sessionDataRes = await fetch(`${API_BASE}/session-migration/session-data/${sessionToken}`);
        if (sessionDataRes.ok) {
          const sessionData = await sessionDataRes.json();
          console.log('📊 Données de session:', sessionData);
        }
      }
    } else {
      console.log('⚠️ Impossible de vérifier la migration');
    }

    // 6. Test de migration complète
    console.log('\n📋 Test 6: Migration complète');
    const migrationData = {
      sessionToken: sessionToken,
      sessionId: sessionToken,
      clientData: {
        email: 'test-migration-fixed@example.com',
        password: 'password123',
        username: 'Test Migration Fixed',
        company_name: 'Entreprise Test Migration Fixed',
        phone_number: '0123456789',
        address: '123 Rue Test',
        city: 'Paris',
        postal_code: '75001',
        siren: '123456789',
        type: 'client'
      }
    };

    const migrationRes = await fetch(`${API_BASE}/session-migration/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(migrationData)
    });

    if (migrationRes.ok) {
      const migrationResult = await migrationRes.json();
      console.log('✅ Migration réussie:', migrationResult.success);
      
      if (migrationResult.success) {
        console.log(`  - Client créé: ${migrationResult.clientId}`);
        console.log(`  - Produits éligibles: ${migrationResult.clientProduitEligibles?.length || 0}`);
        console.log(`  - Détails:`, migrationResult.details);
      } else {
        console.log('❌ Migration échouée:', migrationResult.error);
      }
    } else {
      console.log('❌ Erreur migration:', await migrationRes.text());
    }

    console.log('\n🎉 Test terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error(error);
  }
}

// Exécuter le test
testSimulatorMigrationFixed(); 