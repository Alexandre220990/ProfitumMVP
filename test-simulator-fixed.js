#!/usr/bin/env node

/**
 * Test robuste du simulateur corrigé
 * ==================================
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const API_BASE = 'http://localhost:5001/api';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Couleurs pour les logs
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'blue') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Fonction pour attendre avec timeout
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fonction pour tester une URL avec retry
async function testUrl(url, maxRetries = 5, delay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, { 
        method: 'GET',
        timeout: 5000 
      });
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Ignore les erreurs et continue
    }
    
    if (i < maxRetries - 1) {
      log(`   Tentative ${i + 1}/${maxRetries} échouée, nouvelle tentative dans ${delay/1000}s...`, 'yellow');
      await wait(delay);
    }
  }
  return false;
}

async function testServerHealth() {
  log('🔍 Test 1: Vérification de la santé du serveur...', 'blue');
  
  const isHealthy = await testUrl(`${API_BASE}/health`);
  if (isHealthy) {
    log('✅ Serveur backend en bonne santé', 'green');
    return true;
  } else {
    log('❌ Serveur backend non accessible', 'red');
    return false;
  }
}

async function testQuestions() {
  log('\n🔍 Test 2: Vérification des questions...', 'blue');
  
  try {
    const { data: questions, error } = await supabase
      .from('QuestionnaireQuestion')
      .select('*')
      .order('question_order', { ascending: true });

    if (error) {
      log(`❌ Erreur récupération questions: ${error.message}`, 'red');
      return false;
    }

    log(`✅ ${questions.length} questions trouvées`, 'green');
    
    // Vérifier la structure
    const firstQuestion = questions[0];
    if (firstQuestion) {
      log(`📋 Première question: ${firstQuestion.question_text}`, 'yellow');
      log(`   Type: ${firstQuestion.question_type}`, 'yellow');
      log(`   Produits cibles: ${firstQuestion.produits_cibles?.join(', ')}`, 'yellow');
      
      // Vérifier que les options sont correctes
      if (firstQuestion.options && firstQuestion.options.choix) {
        log(`   Options disponibles: ${firstQuestion.options.choix.length} choix`, 'yellow');
      }
    }

    return true;
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    return false;
  }
}

async function testSessionCreation() {
  log('\n🔍 Test 3: Création de session...', 'blue');
  
  try {
    const response = await fetch(`${API_BASE}/simulator/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`❌ Erreur création session: ${response.status} - ${errorText}`, 'red');
      return false;
    }

    const data = await response.json();
    log(`✅ Session créée: ${data.session_token?.substring(0, 20)}...`, 'green');
    return data.session_token;
  } catch (error) {
    log(`❌ Erreur réseau: ${error.message}`, 'red');
    return false;
  }
}

async function testResponseSaving(sessionToken) {
  log('\n🔍 Test 4: Sauvegarde de réponse...', 'blue');
  
  try {
    // Récupérer une question
    const { data: questions } = await supabase
      .from('QuestionnaireQuestion')
      .select('id')
      .limit(1);

    if (!questions || questions.length === 0) {
      log('❌ Aucune question disponible', 'red');
      return false;
    }

    const questionId = questions[0].id;
    
    const response = await fetch(`${API_BASE}/simulator/response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionToken,
        question_id: questionId,
        response_value: ['Transport routier']
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`❌ Erreur sauvegarde réponse: ${response.status} - ${errorText}`, 'red');
      return false;
    }

    log('✅ Réponse sauvegardée avec succès', 'green');
    return true;
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    return false;
  }
}

async function testEligibilityCalculation(sessionToken) {
  log('\n🔍 Test 5: Calcul d\'éligibilité...', 'blue');
  
  try {
    const response = await fetch(`${API_BASE}/simulator/calculate-eligibility`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionToken
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`❌ Erreur calcul éligibilité: ${response.status} - ${errorText}`, 'red');
      return false;
    }

    const results = await response.json();
    log(`✅ Calcul d'éligibilité réussi: ${results.length} produits analysés`, 'green');
    
    if (results.length > 0) {
      results.forEach(result => {
        log(`   - ${result.produit_id}: ${result.eligibility_score}% (${result.estimated_savings}€)`, 'yellow');
      });
    }

    return true;
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    return false;
  }
}

async function testFrontend() {
  log('\n🔍 Test 6: Vérification du frontend...', 'blue');
  
  const isAccessible = await testUrl('http://localhost:3000');
  if (isAccessible) {
    log('✅ Frontend accessible', 'green');
    return true;
  } else {
    log('⚠️ Frontend non accessible (peut être en cours de démarrage)', 'yellow');
    return false;
  }
}

async function cleanupTestData(sessionToken) {
  log('\n🧹 Nettoyage des données de test...', 'blue');
  
  try {
    // Supprimer la session de test
    const { error } = await supabase
      .from('TemporarySession')
      .delete()
      .eq('session_token', sessionToken);

    if (error) {
      log(`⚠️ Erreur nettoyage: ${error.message}`, 'yellow');
    } else {
      log('✅ Données de test nettoyées', 'green');
    }
  } catch (error) {
    log(`⚠️ Erreur nettoyage: ${error.message}`, 'yellow');
  }
}

async function main() {
  log('🧪 Test robuste du simulateur corrigé', 'blue');
  log('=====================================\n', 'blue');

  let sessionToken = null;
  let allTestsPassed = true;
  let testResults = {};

  // Test 1: Santé du serveur
  testResults.serverHealth = await testServerHealth();
  if (!testResults.serverHealth) {
    allTestsPassed = false;
  }

  // Attendre un peu avant les tests suivants
  if (testResults.serverHealth) {
    await wait(2000);
  }

  // Test 2: Questions
  testResults.questions = await testQuestions();
  if (!testResults.questions) {
    allTestsPassed = false;
  }

  // Test 3: Création de session
  sessionToken = await testSessionCreation();
  testResults.sessionCreation = !!sessionToken;
  if (!sessionToken) {
    allTestsPassed = false;
  }

  // Test 4: Sauvegarde de réponse (seulement si session créée)
  if (sessionToken) {
    testResults.responseSaving = await testResponseSaving(sessionToken);
    if (!testResults.responseSaving) {
      allTestsPassed = false;
    }
  }

  // Test 5: Calcul d'éligibilité (seulement si session créée)
  if (sessionToken) {
    testResults.eligibilityCalculation = await testEligibilityCalculation(sessionToken);
    if (!testResults.eligibilityCalculation) {
      allTestsPassed = false;
    }
  }

  // Test 6: Frontend
  testResults.frontend = await testFrontend();

  // Nettoyage
  if (sessionToken) {
    await cleanupTestData(sessionToken);
  }

  // Résumé détaillé
  console.log('\n' + '='.repeat(60));
  log('📊 RÉSUMÉ DES TESTS', 'blue');
  console.log('='.repeat(60));
  
  const testNames = {
    serverHealth: 'Santé du serveur',
    questions: 'Questions du simulateur',
    sessionCreation: 'Création de session',
    responseSaving: 'Sauvegarde de réponse',
    eligibilityCalculation: 'Calcul d\'éligibilité',
    frontend: 'Accessibilité frontend'
  };

  Object.entries(testResults).forEach(([key, passed]) => {
    const status = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`${status} ${testNames[key]}: ${passed ? 'RÉUSSI' : 'ÉCHOUÉ'}`, color);
  });

  console.log('='.repeat(60));
  
  if (allTestsPassed) {
    log('🎉 TOUS LES TESTS RÉUSSIS !', 'green');
    log('Le simulateur fonctionne correctement.', 'green');
  } else {
    log('❌ CERTAINS TESTS ONT ÉCHOUÉ', 'red');
    log('Vérifiez les erreurs ci-dessus.', 'red');
  }
  
  console.log('='.repeat(60));

  return allTestsPassed;
}

// Exécuter les tests
main()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log(`❌ Erreur fatale: ${error.message}`, 'red');
    process.exit(1);
  }); 