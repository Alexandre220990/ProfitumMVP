// Test simple du simulateur d'éligibilité
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testSimulateurSimple() {
  console.log('🧪 Test Simple du Simulateur d\'Éligibilité');
  console.log('===========================================');
  
  const baseUrl = 'http://localhost:5000';
  
  try {
    // Test 1: Vérifier que le serveur répond
    console.log('\n📋 Test 1: Vérification du serveur');
    try {
      const healthResponse = await fetch(`${baseUrl}/health`);
      if (healthResponse.ok) {
        console.log('✅ Serveur backend accessible');
      } else {
        console.log('❌ Serveur backend non accessible');
        return;
      }
    } catch (error) {
      console.log('❌ Impossible de se connecter au serveur backend');
      console.log('   Assurez-vous que le serveur backend est démarré sur le port 5000');
      return;
    }
    
    // Test 2: Créer une session de simulation
    console.log('\n📋 Test 2: Création d\'une session de simulation');
    try {
      const sessionResponse = await fetch(`${baseUrl}/api/simulator/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productType: 'TICPE',
          clientInfo: {
            companyType: 'TRANSPORT',
            employeeCount: 10,
            annualRevenue: 500000
          }
        })
      });
      
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        console.log('✅ Session créée avec succès');
        console.log(`   Session ID: ${sessionData.sessionId}`);
        console.log(`   Produit: ${sessionData.productType}`);
        return sessionData.sessionId;
      } else {
        console.log('❌ Échec de création de session');
        const errorText = await sessionResponse.text();
        console.log(`   Erreur: ${errorText}`);
        return null;
      }
    } catch (error) {
      console.log('❌ Erreur lors de la création de session:', error.message);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Fonction pour tester les questions
async function testQuestions(sessionId) {
  if (!sessionId) return;
  
  console.log('\n📋 Test 3: Récupération des questions');
  
  try {
    const questionsResponse = await fetch(`http://localhost:5000/api/simulator/questions/${sessionId}`);
    
    if (questionsResponse.ok) {
      const questions = await questionsResponse.json();
      console.log('✅ Questions récupérées avec succès');
      console.log(`   Nombre de questions: ${questions.length}`);
      
      // Afficher la première question
      if (questions.length > 0) {
        console.log(`   Première question: ${questions[0].question}`);
      }
      
      return questions;
    } else {
      console.log('❌ Échec de récupération des questions');
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur lors de la récupération des questions:', error.message);
    return null;
  }
}

// Fonction pour tester les réponses
async function testAnswers(sessionId, questions) {
  if (!sessionId || !questions) return;
  
  console.log('\n📋 Test 4: Envoi des réponses');
  
  try {
    const answers = questions.map((q, index) => ({
      questionId: q.id,
      answer: index % 2 === 0 ? 'yes' : 'no',
      value: index % 2 === 0 ? '1000' : '500'
    }));
    
    const answersResponse = await fetch(`http://localhost:5000/api/simulator/answers/${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers })
    });
    
    if (answersResponse.ok) {
      console.log('✅ Réponses envoyées avec succès');
      return true;
    } else {
      console.log('❌ Échec d\'envoi des réponses');
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur lors de l\'envoi des réponses:', error.message);
    return false;
  }
}

// Fonction pour tester le calcul d'éligibilité
async function testEligibility(sessionId) {
  if (!sessionId) return;
  
  console.log('\n📋 Test 5: Calcul d\'éligibilité');
  
  try {
    const eligibilityResponse = await fetch(`http://localhost:5000/api/simulator/eligibility/${sessionId}`);
    
    if (eligibilityResponse.ok) {
      const eligibility = await eligibilityResponse.json();
      console.log('✅ Calcul d\'éligibilité réussi');
      console.log(`   Éligibilité: ${eligibility.eligibility}%`);
      console.log(`   Gain estimé: ${eligibility.estimatedGain}€`);
      console.log(`   Recommandations: ${eligibility.recommendations.length}`);
      return eligibility;
    } else {
      console.log('❌ Échec du calcul d\'éligibilité');
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur lors du calcul d\'éligibilité:', error.message);
    return null;
  }
}

// Fonction principale
async function runAllTests() {
  console.log('🚀 Démarrage des tests du simulateur...\n');
  
  const sessionId = await testSimulateurSimple();
  const questions = await testQuestions(sessionId);
  const answersSent = await testAnswers(sessionId, questions);
  const eligibility = await testEligibility(sessionId);
  
  console.log('\n🎉 Résumé des tests:');
  console.log('===================');
  console.log(`✅ Serveur: ${sessionId ? 'OK' : 'ÉCHEC'}`);
  console.log(`✅ Questions: ${questions ? 'OK' : 'ÉCHEC'}`);
  console.log(`✅ Réponses: ${answersSent ? 'OK' : 'ÉCHEC'}`);
  console.log(`✅ Éligibilité: ${eligibility ? 'OK' : 'ÉCHEC'}`);
  
  if (eligibility) {
    console.log('\n💰 Résultats de simulation:');
    console.log(`   Éligibilité: ${eligibility.eligibility}%`);
    console.log(`   Gain potentiel: ${eligibility.estimatedGain}€`);
    console.log(`   Produit: ${eligibility.productType}`);
  }
  
  console.log('\n✨ Test terminé !');
}

// Lancer les tests
runAllTests().catch(console.error); 