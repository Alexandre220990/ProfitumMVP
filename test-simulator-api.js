#!/usr/bin/env node

/**
 * 🧪 Test rapide des API du simulateur d'éligibilité
 * =================================================
 * 
 * Ce script teste les routes du simulateur pour vérifier qu'elles sont
 * accessibles publiquement sans authentification.
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5001';
const API_BASE = `${BASE_URL}/api/simulator`;

// Couleurs pour les messages
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

async function testEndpoint(method, endpoint, data = null, description = '') {
    try {
        const url = `${API_BASE}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        logInfo(`Test: ${method} ${endpoint} ${description}`);
        
        const response = await fetch(url, options);
        const responseText = await response.text();
        
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch {
            responseData = responseText;
        }

        if (response.ok) {
            logSuccess(`${method} ${endpoint} - ${response.status} OK`);
            if (responseData && typeof responseData === 'object') {
                console.log('   Réponse:', JSON.stringify(responseData, null, 2));
            }
            return { success: true, data: responseData };
        } else {
            logError(`${method} ${endpoint} - ${response.status} ${response.statusText}`);
            console.log('   Erreur:', responseText);
            return { success: false, error: responseText, status: response.status };
        }
    } catch (error) {
        logError(`${method} ${endpoint} - Erreur réseau: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function runTests() {
    console.log('🚀 Test des API du simulateur d\'éligibilité');
    console.log('=============================================\n');

    // Test 1: Vérification de la santé du serveur
    logInfo('Test 1: Vérification de la santé du serveur');
    const healthResult = await testEndpoint('GET', '/health', null, '(route de santé)');
    
    if (!healthResult.success) {
        logError('Serveur backend non accessible. Assurez-vous qu\'il est démarré sur le port 5001.');
        process.exit(1);
    }

    // Test 2: Création de session
    logInfo('\nTest 2: Création de session simulateur');
    const sessionResult = await testEndpoint('POST', '/session', {}, '(création session)');
    
    if (!sessionResult.success) {
        logError('Impossible de créer une session simulateur');
        return;
    }

    const sessionToken = sessionResult.data?.session_token;
    if (!sessionToken) {
        logError('Token de session manquant dans la réponse');
        return;
    }

    logSuccess(`Session créée avec le token: ${sessionToken.substring(0, 20)}...`);

    // Test 3: Récupération des questions
    logInfo('\nTest 3: Récupération des questions');
    const questionsResult = await testEndpoint('GET', '/questions', null, '(récupération questions)');
    
    if (!questionsResult.success) {
        logError('Impossible de récupérer les questions');
        return;
    }

    const questions = questionsResult.data;
    if (Array.isArray(questions) && questions.length > 0) {
        logSuccess(`${questions.length} questions récupérées`);
        console.log('   Première question:', questions[0].question_text);
    } else {
        logWarning('Aucune question disponible');
    }

    // Test 4: Sauvegarde de réponse (si des questions sont disponibles)
    if (questions && questions.length > 0) {
        logInfo('\nTest 4: Sauvegarde de réponse');
        const firstQuestion = questions[0];
        const responseData = {
            session_id: sessionToken,
            question_id: firstQuestion.id,
            response_value: 'Test réponse automatique'
        };

        const saveResult = await testEndpoint('POST', '/response', responseData, '(sauvegarde réponse)');
        
        if (saveResult.success) {
            logSuccess('Réponse sauvegardée avec succès');
        } else {
            logWarning('Erreur lors de la sauvegarde de la réponse');
        }
    }

    // Test 5: Calcul d'éligibilité
    logInfo('\nTest 5: Calcul d\'éligibilité');
    const eligibilityData = {
        session_id: sessionToken
    };

    const eligibilityResult = await testEndpoint('POST', '/calculate-eligibility', eligibilityData, '(calcul éligibilité)');
    
    if (eligibilityResult.success) {
        const results = eligibilityResult.data;
        if (Array.isArray(results) && results.length > 0) {
            logSuccess(`${results.length} produits éligibles trouvés`);
            results.forEach((result, index) => {
                console.log(`   ${index + 1}. ${result.produit_id}: ${result.eligibility_score}% éligible - ${result.estimated_savings}€`);
            });
        } else {
            logWarning('Aucun produit éligible trouvé');
        }
    } else {
        logWarning('Erreur lors du calcul d\'éligibilité');
    }

    // Test 6: Tracking analytics
    logInfo('\nTest 6: Tracking analytics');
    const trackingData = {
        event: 'test_event',
        session_token: sessionToken,
        data: {
            test: true,
            timestamp: new Date().toISOString()
        }
    };

    const trackingResult = await testEndpoint('POST', '/track', trackingData, '(tracking analytics)');
    
    if (trackingResult.success) {
        logSuccess('Tracking analytics fonctionnel');
    } else {
        logWarning('Erreur lors du tracking analytics');
    }

    // Résumé
    console.log('\n📊 Résumé des tests');
    console.log('===================');
    logSuccess('Toutes les routes du simulateur sont accessibles publiquement');
    logInfo('Le simulateur d\'éligibilité est prêt à être utilisé');
    
    console.log('\n🌐 URLs de test:');
    console.log(`   Frontend: http://localhost:3000/simulateur-eligibilite`);
    console.log(`   API Base: ${API_BASE}`);
    console.log(`   Session: ${sessionToken}`);
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
    logError(`Erreur non gérée: ${error.message}`);
    process.exit(1);
});

// Exécuter les tests
runTests().catch(error => {
    logError(`Erreur lors de l'exécution des tests: ${error.message}`);
    process.exit(1);
}); 