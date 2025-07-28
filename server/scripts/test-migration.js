// Script de test pour la migration de session
// Usage: node test-migration.js

const fetch = require('node-fetch');

const API_URL = process.env.API_URL || 'https://profitummvp-production.up.railway.app';

async function testMigration() {
  console.log('🧪 Test de migration de session...\n');

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

    // 2. Ajouter quelques réponses de test
    console.log('2. Ajout de réponses de test...');
    const testResponses = [
      { question_id: 'secteur', response_value: 'Transport routier de marchandises' },
      { question_id: 'vehicules', response_value: 'Oui' },
      { question_id: 'nombre_vehicules', response_value: '5' },
      { question_id: 'consommation', response_value: '15 000 à 50 000 litres' }
    ];

    for (const response of testResponses) {
      await fetch(`${API_URL}/api/simulator/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionToken,
          question_id: response.question_id,
          response_value: response.response_value
        })
      });
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
    console.log('✅ Résultats d\'éligibilité:', eligibilityResults);
    console.log('');

    // 4. Tester la récupération des données de session
    console.log('4. Test récupération données de session...');
    const sessionDataResponse = await fetch(`${API_URL}/api/session-migration/session-data/${sessionToken}`);
    const sessionDataResult = await sessionDataResponse.json();
    
    if (sessionDataResult.success) {
      console.log('✅ Données de session récupérées');
      console.log(`   - Réponses: ${sessionDataResult.data.responses.length}`);
      console.log(`   - Résultats éligibilité: ${sessionDataResult.data.eligibilityResults.length}`);
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

    console.log('🎉 Tests de migration terminés avec succès !');
    console.log(`📝 Session de test: ${sessionToken}`);
    console.log('💡 Pour tester la migration complète, utilisez cette session dans le simulateur web');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    process.exit(1);
  }
}

// Exécuter les tests
testMigration(); 