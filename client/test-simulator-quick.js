const API_BASE = 'http://localhost:5001/api/simulator';

async function testSimulator() {
  console.log('🚀 Test rapide du simulateur...\n');
  
  try {
    // 1. Créer une session
    console.log('📋 Test 1: Création de session');
    const sessionResponse = await fetch(`${API_BASE}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip_address: '127.0.0.1',
        user_agent: 'Test Agent'
      })
    });

    if (!sessionResponse.ok) {
      throw new Error(`Erreur création session: ${sessionResponse.status}`);
    }

    const sessionData = await sessionResponse.json();
    const sessionToken = sessionData.session_token;
    console.log(`✅ Session créée: ${sessionToken}`);

    // 2. Récupérer les questions
    console.log('\n📋 Test 2: Récupération des questions');
    const questionsResponse = await fetch(`${API_BASE}/questions`);
    
    if (!questionsResponse.ok) {
      throw new Error(`Erreur récupération questions: ${questionsResponse.status}`);
    }

    const questions = await questionsResponse.json();
    console.log(`✅ ${questions.length} questions récupérées`);

    // 3. Envoyer quelques réponses
    console.log('\n📋 Test 3: Envoi de réponses');
    const testResponses = [
      'Transport routier',
      '100 000€ - 500 000€',
      '6 à 20',
      'Oui',
      '5'
    ];

    for (let i = 0; i < Math.min(questions.length, testResponses.length); i++) {
      const responseData = {
        session_id: sessionToken,
        question_id: questions[i].id,
        response_value: testResponses[i]
      };

      const responseResult = await fetch(`${API_BASE}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responseData)
      });

      if (responseResult.ok) {
        console.log(`✅ Réponse ${i + 1} envoyée`);
      } else {
        console.log(`⚠️ Erreur réponse ${i + 1}: ${responseResult.status}`);
      }
    }

    // 4. Calculer l'éligibilité
    console.log('\n📋 Test 4: Calcul d\'éligibilité');
    const eligibilityResponse = await fetch(`${API_BASE}/calculate-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionToken })
    });

    if (eligibilityResponse.ok) {
      const results = await eligibilityResponse.json();
      console.log(`✅ ${results.length} résultats d'éligibilité calculés`);
      
      results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.produit_id}: ${result.eligibility_score}% - ${result.estimated_savings}€`);
      });
    } else {
      const errorText = await eligibilityResponse.text();
      console.log(`❌ Erreur calcul éligibilité: ${eligibilityResponse.status} - ${errorText}`);
    }

    console.log('\n🎉 Test terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testSimulator(); 