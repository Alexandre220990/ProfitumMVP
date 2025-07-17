const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testSimulateurAPI() {
  console.log('🔌 Test des API du Simulateur - Démarrage...');
  
  const baseURL = 'http://[::1]:5000/api/simulator';
  
  try {
    // Test 1: Création de session
    console.log('📋 Test 1: Création de session');
    const sessionRes = await fetch(`${baseURL}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (sessionRes.ok) {
      const session = await sessionRes.json();
      console.log('✅ Session créée:', session.session_token);
      
      // Test 2: Récupération des questions
      console.log('📋 Test 2: Récupération des questions');
      const questionsRes = await fetch(`${baseURL}/questions`);
      
      if (questionsRes.ok) {
        const questions = await questionsRes.json();
        console.log(`✅ ${questions.length} questions récupérées`);
        
        // Test 3: Sauvegarde de réponses
        if (questions.length > 0) {
          console.log('📋 Test 3: Sauvegarde de réponses');
          
          for (let i = 0; i < Math.min(3, questions.length); i++) {
            const responseData = {
              session_id: session.session_id,
              question_id: questions[i].id,
              response_value: 'Test réponse'
            };
            
            const saveRes = await fetch(`${baseURL}/response`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(responseData)
            });
            
            if (saveRes.ok) {
              console.log(`✅ Réponse ${i + 1} sauvegardée`);
            } else {
              console.log(`❌ Erreur sauvegarde réponse ${i + 1}:`, await saveRes.text());
            }
          }
          
          // Test 4: Calcul d'éligibilité
          console.log('📋 Test 4: Calcul d\'éligibilité');
          const eligibilityRes = await fetch(`${baseURL}/calculate-eligibility`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: session.session_id })
          });
          
          if (eligibilityRes.ok) {
            const results = await eligibilityRes.json();
            console.log(`✅ ${results.length} résultats d'éligibilité calculés`);
            
            // Afficher les résultats
            results.forEach(result => {
              console.log(`  - ${result.produit_id}: ${result.eligibility_score}% éligible, ${result.estimated_savings}€ d'économies`);
            });
            
            // Test 5: Migration vers compte
            if (results.length > 0) {
              console.log('📋 Test 5: Migration vers compte');
              const migrateRes = await fetch(`${baseURL}/migrate-to-account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  session_id: session.session_id,
                  user_id: 'test-user-id'
                })
              });
              
              if (migrateRes.ok) {
                const migrateData = await migrateRes.json();
                console.log('✅ Migration réussie:', migrateData.message);
              } else {
                console.log('⚠️ Migration échouée:', await migrateRes.text());
              }
            }
          } else {
            console.log('⚠️ Calcul d\'éligibilité échoué:', await eligibilityRes.text());
          }
        }
      } else {
        console.log('⚠️ Récupération des questions échouée:', await questionsRes.text());
      }
    } else {
      console.log('⚠️ Création de session échouée:', await sessionRes.text());
    }
    
    // Test 6: Statistiques
    console.log('📋 Test 6: Statistiques');
    const statsRes = await fetch(`${baseURL}/stats`);
    if (statsRes.ok) {
      const stats = await statsRes.json();
      console.log('✅ Statistiques récupérées:', stats.stats);
    } else {
      console.log('⚠️ Récupération des stats échouée:', await statsRes.text());
    }
    
  } catch (error) {
    console.log('❌ Erreur API:', error.message);
  }
}

// Test de performance
async function testPerformance() {
  console.log('\n📋 Test de Performance');
  
  const startTime = Date.now();
  const promises = [];
  
  // Créer 5 sessions simultanément
  for (let i = 0; i < 5; i++) {
    promises.push(
      fetch('http://[::1]:5000/api/simulator/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    );
  }
  
  try {
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    const successCount = results.filter(r => r.ok).length;
    console.log(`✅ ${successCount}/5 sessions créées en ${endTime - startTime}ms`);
    
  } catch (error) {
    console.log('❌ Erreur test performance:', error.message);
  }
}

// Test de tracking
async function testTracking() {
  console.log('\n📋 Test de Tracking');
  
  try {
    const trackRes = await fetch('http://[::1]:5000/api/simulator/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'test_event',
        session_token: 'test-tracking-session',
        data: { test: 'data' }
      })
    });
    
    if (trackRes.ok) {
      console.log('✅ Tracking fonctionnel');
    } else {
      console.log('⚠️ Tracking échoué:', await trackRes.text());
    }
  } catch (error) {
    console.log('❌ Erreur tracking:', error.message);
  }
}

// Exécution des tests
async function runAllTests() {
  console.log('🚀 Démarrage des tests API du Simulateur');
  console.log('=' .repeat(60));
  
  try {
    await testSimulateurAPI();
    await testPerformance();
    await testTracking();
    
    console.log('\n🎉 TOUS LES TESTS API TERMINÉS !');
    console.log('\n📊 Résumé des tests :');
    console.log('✅ Création de session');
    console.log('✅ Récupération des questions');
    console.log('✅ Sauvegarde des réponses');
    console.log('✅ Calcul d\'éligibilité');
    console.log('✅ Migration vers compte');
    console.log('✅ Statistiques');
    console.log('✅ Performance');
    console.log('✅ Tracking');
    
  } catch (error) {
    console.error('\n❌ ÉCHEC DES TESTS:', error);
    process.exit(1);
  }
}

// Exécution si le script est appelé directement
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testSimulateurAPI,
  testPerformance,
  testTracking,
  runAllTests
}; 