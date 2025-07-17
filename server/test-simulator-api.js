const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5001/api';

async function testSimulatorAPI() {
  console.log('🧪 Test de l\'API du simulateur...\n');
  
  try {
    // 1. Test de récupération des questions
    console.log('1️⃣ Test de récupération des questions...');
    const questionsResponse = await fetch(`${API_BASE}/simulator/questions`);
    
    if (!questionsResponse.ok) {
      console.error(`❌ Erreur ${questionsResponse.status}: ${questionsResponse.statusText}`);
      return;
    }
    
    const questions = await questionsResponse.json();
    console.log(`✅ ${questions.length} questions récupérées`);
    
    if (questions.length > 0) {
      console.log('📋 Première question:');
      console.log(JSON.stringify(questions[0], null, 2));
      
      // Vérifier la structure
      const firstQuestion = questions[0];
      console.log('\n🔍 Vérification de la structure:');
      console.log('- ID:', firstQuestion.id ? '✅' : '❌');
      console.log('- Texte:', firstQuestion.question_text ? '✅' : '❌');
      console.log('- Type:', firstQuestion.question_type ? '✅' : '❌');
      console.log('- Options:', firstQuestion.options ? '✅' : '❌');
      console.log('- Options.choix:', firstQuestion.options?.choix ? '✅' : '❌');
      
      if (firstQuestion.options?.choix) {
        console.log('- Nombre de choix:', firstQuestion.options.choix.length);
        console.log('- Choix disponibles:', firstQuestion.options.choix);
      }
    }
    
    // 2. Test de création de session
    console.log('\n2️⃣ Test de création de session...');
    const sessionResponse = await fetch(`${API_BASE}/simulator/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!sessionResponse.ok) {
      console.error(`❌ Erreur ${sessionResponse.status}: ${sessionResponse.statusText}`);
      return;
    }
    
    const sessionData = await sessionResponse.json();
    console.log('✅ Session créée:', sessionData.session_token);
    
    // 3. Test d'envoi de réponse
    if (questions.length > 0) {
      console.log('\n3️⃣ Test d\'envoi de réponse...');
      const firstQuestion = questions[0];
      
      const responseData = {
        session_id: sessionData.session_token,
        question_id: firstQuestion.id,
        response_value: firstQuestion.options?.choix?.[0] || 'Test'
      };
      
      const responseResponse = await fetch(`${API_BASE}/simulator/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(responseData)
      });
      
      if (!responseResponse.ok) {
        console.error(`❌ Erreur ${responseResponse.status}: ${responseResponse.statusText}`);
      } else {
        console.log('✅ Réponse envoyée avec succès');
      }
    }
    
    console.log('\n🎉 Tests terminés !');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

// Test avec des données de débogage
async function debugQuestions() {
  console.log('\n🔍 Debug des questions...');
  
  try {
    const response = await fetch(`${API_BASE}/simulator/questions`);
    const questions = await response.json();
    
    questions.forEach((q, i) => {
      console.log(`\nQuestion ${i + 1}:`);
      console.log('- ID:', q.id);
      console.log('- Texte:', q.question_text);
      console.log('- Type:', q.question_type);
      console.log('- Options type:', typeof q.options);
      console.log('- Options:', q.options);
      
      if (q.options && typeof q.options === 'string') {
        try {
          const parsed = JSON.parse(q.options);
          console.log('- Options parsées:', parsed);
        } catch (e) {
          console.log('- Erreur parsing:', e.message);
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur debug:', error);
  }
}

// Exécuter les tests
async function main() {
  await testSimulatorAPI();
  await debugQuestions();
}

main().catch(console.error); 