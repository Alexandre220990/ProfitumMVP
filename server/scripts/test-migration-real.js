// Script de test pour la migration de session avec les vrais IDs de questions
// Usage: node test-migration-real.js

const fetch = require('node-fetch');

const API_URL = process.env.API_URL || 'https://profitummvp-production.up.railway.app';

async function testMigrationReal() {
  console.log('🧪 Test de migration de session avec vrais IDs...\n');

  try {
    // 1. Créer une session de test
    console.log('1. Création d\'une session de test...');
    const sessionResponse = await fetch(`${API_URL}/api/simulator/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const sessionData = await sessionResponse.json();
    if (!sessionData.session_token) {
      throw new Error('Impossible de créer une session de test');
    }
    
    const sessionToken = sessionData.session_token;
    console.log(`✅ Session créée: ${sessionToken}\n`);

    // 2. Ajouter des réponses avec les vrais IDs de questions
    console.log('2. Ajout de réponses avec vrais IDs...');
    const testResponses = [
      { 
        question_id: '4be52c28-096e-4b1b-82de-717a2fa86a52', // GENERAL_001 - Secteur
        response_value: 'Transport routier de marchandises'
      },
      { 
        question_id: 'd3f6010a-1380-4984-85c8-b538860531f5', // GENERAL_002 - CA
        response_value: '1 000 000€ - 5 000 000€'
      },
      { 
        question_id: '1b7c4717-cbe0-4945-a0dc-f856ca2630ac', // GENERAL_003 - Employés
        response_value: '6 à 20'
      },
      { 
        question_id: '3dc89ae6-d395-45a5-a662-0ca397918f98', // TICPE_001 - Véhicules pro
        response_value: 'Oui'
      },
      { 
        question_id: '4a360541-3379-47db-a7da-93e726ef06eb', // TICPE_002 - Nombre véhicules
        response_value: '4 à 10 véhicules'
      },
      { 
        question_id: '685ebbcf-40c4-4880-895e-0f1db722a101', // TICPE_003 - Types véhicules
        response_value: ['Camions de plus de 7,5 tonnes', 'Camions de 3,5 à 7,5 tonnes']
      },
      { 
        question_id: '4fb68630-cc46-4831-bf14-c907ed020779', // TICPE_005 - Consommation
        response_value: '15 000 à 50 000 litres'
      },
      { 
        question_id: 'a922d778-8acc-46a0-bb30-13f9a9c7348d', // TICPE_006 - Types carburant
        response_value: ['Gazole professionnel', 'Gazole Non Routier (GNR)']
      },
      { 
        question_id: 'fd15c08c-c72f-45a2-95a2-5e24d3c1a907', // TICPE_007 - Factures
        response_value: 'Oui, 3 dernières années complètes'
      },
      { 
        question_id: '14a9fa80-2407-4b81-9289-526d317fb5fd', // TICPE_008 - Usage pro
        response_value: '100% professionnel'
      }
    ];

    for (const response of testResponses) {
      const responseData = {
        session_id: sessionToken, // Le simulateur attend le session_token
        question_id: response.question_id,
        response_value: response.response_value
      };
      
      console.log(`   Envoi réponse: ${response.question_id} = ${JSON.stringify(response.response_value)}`);
      
      const saveResponse = await fetch(`${API_URL}/api/simulator/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responseData)
      });

      if (!saveResponse.ok) {
        console.warn(`   ⚠️ Erreur sauvegarde réponse ${response.question_id}`);
      }
    }
    console.log('✅ Réponses ajoutées\n');

    // 3. Calculer l'éligibilité
    console.log('3. Calcul de l\'éligibilité...');
    const eligibilityResponse = await fetch(`${API_URL}/api/simulator/calculate-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionToken })
    });
    
    const eligibilityResults = await eligibilityResponse.json();
    console.log('✅ Résultats d\'éligibilité:');
    eligibilityResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.produit_id}: ${result.estimated_savings}€ (score: ${result.eligibility_score}%)`);
    });
    console.log('');

    // 4. Tester la récupération des données de session
    console.log('4. Test récupération données de session...');
    const sessionDataResponse = await fetch(`${API_URL}/api/session-migration/session-data/${sessionToken}`);
    const sessionDataResult = await sessionDataResponse.json();
    
    if (sessionDataResult.success) {
      console.log('✅ Données de session récupérées');
      console.log(`   - Réponses: ${sessionDataResult.data.responses.length}`);
      console.log(`   - Résultats éligibilité: ${sessionDataResult.data.eligibilityResults.length}`);
      
      // Afficher quelques réponses pour debug
      if (sessionDataResult.data.responses.length > 0) {
        console.log('   - Exemples de réponses:');
        sessionDataResult.data.responses.slice(0, 3).forEach((resp, i) => {
          console.log(`     ${i + 1}. ${resp.question_id}: ${JSON.stringify(resp.response_value)}`);
        });
      }
    } else {
      console.log('❌ Erreur récupération données de session');
    }
    console.log('');

    // 5. Tester la vérification de migration
    console.log('5. Test vérification migration...');
    const canMigrateResponse = await fetch(`${API_URL}/api/session-migration/can-migrate/${sessionToken}`);
    const canMigrateResult = await canMigrateResponse.json();
    
    if (canMigrateResult.success && canMigrateResult.can_migrate) {
      console.log('✅ Session peut être migrée');
    } else {
      console.log('❌ Session ne peut pas être migrée:', canMigrateResult.error);
    }
    console.log('');

    console.log('🎉 Tests de migration avec vrais IDs terminés !');
    console.log(`📝 Session de test: ${sessionToken}`);
    console.log('💡 Pour tester la migration complète, utilisez cette session dans le simulateur web');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    process.exit(1);
  }
}

// Exécuter les tests
testMigrationReal(); 