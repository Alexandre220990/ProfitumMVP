#!/usr/bin/env node

/**
 * 🧪 TEST API TICPE RÉELLE
 * Test du calculateur via l'API avec des données réelles
 */

const API_BASE = 'http://localhost:5001/api/simulator';

async function testAPITICPE() {
  console.log('🧪 TEST API TICPE RÉELLE');
  console.log('=' .repeat(50));

  try {
    // 1. Créer une session
    console.log('\n📋 Étape 1: Création de session');
    const sessionResponse = await fetch(`${API_BASE}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip_address: '127.0.0.1',
        user_agent: 'Test TICPE'
      })
    });

    if (!sessionResponse.ok) {
      throw new Error(`Erreur création session: ${sessionResponse.status}`);
    }

    const sessionData = await sessionResponse.json();
    const sessionToken = sessionData.session_token;
    console.log(`✅ Session créée: ${sessionToken}`);

    // 2. Récupérer les questions
    console.log('\n📋 Étape 2: Récupération des questions');
    const questionsResponse = await fetch(`${API_BASE}/questions`);
    
    if (!questionsResponse.ok) {
      throw new Error(`Erreur récupération questions: ${questionsResponse.status}`);
    }

    const questions = await questionsResponse.json();
    console.log(`✅ ${questions.length} questions récupérées`);

    // 3. Envoyer des réponses TICPE
    console.log('\n📋 Étape 3: Envoi des réponses TICPE');
    
    const ticpeResponses = [
      'Transport / Logistique',  // Secteur
      'Oui',                     // Véhicules professionnels
      '11 à 25 véhicules',       // Nombre véhicules
      'Camions de plus de 7,5 tonnes', // Types véhicules
      'Plus de 50 000 litres',   // Consommation
      'Gazole professionnel',    // Types carburant
      'Oui, 3 dernières années complètes', // Factures
      '100% professionnel',      // Usage professionnel
      'Oui, toutes les stations', // Cartes carburant
      'Oui, systématiquement',   // Factures nominatives
      'Oui, 100%',               // Immatriculation société
      'Oui, régulièrement'       // Déclarations TICPE
    ];

    let responsesSent = 0;
    for (let i = 0; i < Math.min(questions.length, ticpeResponses.length); i++) {
      const responseData = {
        session_id: sessionToken,
        question_id: questions[i].id,
        response_value: ticpeResponses[i]
      };

      const responseResult = await fetch(`${API_BASE}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responseData)
      });

      if (responseResult.ok) {
        responsesSent++;
        console.log(`✅ Réponse ${i + 1} envoyée: ${questions[i].question_text.substring(0, 50)}...`);
      } else {
        console.log(`⚠️ Erreur réponse ${i + 1}: ${responseResult.status}`);
      }
    }

    console.log(`📊 ${responsesSent} réponses envoyées`);

    // 4. Calculer l'éligibilité
    console.log('\n📋 Étape 4: Calcul d\'éligibilité');
    const eligibilityResponse = await fetch(`${API_BASE}/calculate-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionToken })
    });

    if (!eligibilityResponse.ok) {
      const errorText = await eligibilityResponse.text();
      throw new Error(`Erreur calcul éligibilité: ${eligibilityResponse.status} - ${errorText}`);
    }

    const results = await eligibilityResponse.json();
    console.log(`✅ ${results.length} résultats d'éligibilité calculés`);

    // 5. Afficher les résultats
    console.log('\n📊 RÉSULTATS:');
    console.log('─'.repeat(40));
    
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.produit_id}:`);
      console.log(`   - Score: ${result.eligibility_score}%`);
      console.log(`   - Économies: ${result.estimated_savings.toLocaleString('fr-FR')}€`);
      console.log(`   - Confiance: ${result.confidence_level}`);
      
      if (result.recommendations && result.recommendations.length > 0) {
        console.log(`   - Recommandations:`);
        result.recommendations.forEach(rec => console.log(`     • ${rec}`));
      }
    });

    // 6. Vérifier spécifiquement TICPE
    const ticpeResult = results.find(r => r.produit_id === 'TICPE');
    if (ticpeResult) {
      console.log('\n🎯 RÉSULTAT TICPE SPÉCIFIQUE:');
      console.log(`   - Score: ${ticpeResult.eligibility_score}%`);
      console.log(`   - Économies: ${ticpeResult.estimated_savings.toLocaleString('fr-FR')}€`);
      console.log(`   - Confiance: ${ticpeResult.confidence_level}`);
      
      if (ticpeResult.estimated_savings === 0) {
        console.log('❌ PROBLÈME: TICPE retourne 0€ malgré les données valides');
      } else {
        console.log('✅ SUCCÈS: TICPE calcule correctement');
      }
    } else {
      console.log('❌ PROBLÈME: Aucun résultat TICPE trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Exécution
if (require.main === module) {
  testAPITICPE().catch(console.error);
}

module.exports = { testAPITICPE }; 