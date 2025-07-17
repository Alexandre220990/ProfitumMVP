#!/usr/bin/env node

/**
 * 🧪 Test complet du simulateur d'éligibilité
 * ===========================================
 * 
 * Ce script teste l'ensemble du processus du simulateur :
 * 1. Création de session
 * 2. Récupération des questions
 * 3. Envoi des réponses
 * 4. Calcul d'éligibilité
 * 5. Vérification des résultats
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

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

async function testSimulator() {
    let sessionToken = '';
    let sessionId = '';
    let questions = [];
    let responses = [];

    log('🚀 Démarrage du test complet du simulateur', 'cyan');
    log('==========================================', 'cyan');

    try {
        // 1. Test de création de session
        logInfo('1. Création d\'une session temporaire...');
        const sessionResponse = await fetch(`${API_BASE}/session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ip_address: '127.0.0.1',
                user_agent: 'Test-Script'
            })
        });

        if (!sessionResponse.ok) {
            throw new Error(`Erreur création session: ${sessionResponse.status} ${sessionResponse.statusText}`);
        }

        const sessionData = await sessionResponse.json();
        sessionToken = sessionData.session_token;
        sessionId = sessionData.id;
        logSuccess(`Session créée: ${sessionToken}`);

        // 2. Test de récupération des questions
        logInfo('2. Récupération des questions...');
        const questionsResponse = await fetch(`${API_BASE}/questions`);
        
        if (!questionsResponse.ok) {
            throw new Error(`Erreur récupération questions: ${questionsResponse.status} ${questionsResponse.statusText}`);
        }

        questions = await questionsResponse.json();
        logSuccess(`${questions.length} questions récupérées`);

        // Afficher les questions
        questions.forEach((q, index) => {
            log(`   ${index + 1}. ${q.question_text} (${q.question_type})`, 'magenta');
        });

        // 3. Test d'envoi de réponses
        logInfo('3. Envoi des réponses de test...');
        
        // Réponses de test pour chaque question
        const testResponses = [
            'Transport / Logistique', // Secteur d'activité
            'Entreprise', // Statut
            'Oui, salariés', // Salariés
            '5 à 20', // Nombre d'employés
            'Heures supp', // Contrats spécifiques
            'Oui', // Véhicules professionnels
            'Oui', // Véhicules +3,5T
            'Oui' // Taxes foncières
        ];

        for (let i = 0; i < Math.min(questions.length, testResponses.length); i++) {
            const question = questions[i];
            const response = testResponses[i];

            logInfo(`   Envoi réponse ${i + 1}/${questions.length}: ${response}`);

            const responseResult = await fetch(`${API_BASE}/response`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    question_id: question.id,
                    response_value: response
                })
            });

            if (!responseResult.ok) {
                logWarning(`   ⚠️  Erreur réponse ${i + 1}: ${responseResult.status}`);
            } else {
                logSuccess(`   ✅ Réponse ${i + 1} envoyée`);
            }

            responses.push({
                question_id: question.id,
                response_value: response
            });

            // Petite pause entre les réponses
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // 4. Test de calcul d'éligibilité
        logInfo('4. Calcul de l\'éligibilité...');
        const eligibilityResponse = await fetch(`${API_BASE}/calculate-eligibility`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: sessionId
            })
        });

        if (!eligibilityResponse.ok) {
            throw new Error(`Erreur calcul éligibilité: ${eligibilityResponse.status} ${eligibilityResponse.statusText}`);
        }

        const eligibilityResults = await eligibilityResponse.json();
        logSuccess(`${eligibilityResults.length} résultats d'éligibilité calculés`);

        // 5. Affichage des résultats
        logInfo('5. Résultats de l\'éligibilité:');
        eligibilityResults.forEach((result, index) => {
            log(`   ${index + 1}. ${result.produit_id}:`, 'cyan');
            log(`      - Score: ${result.eligibility_score}%`, 'green');
            log(`      - Économies estimées: ${result.estimated_savings?.toLocaleString('fr-FR')}€`, 'green');
            log(`      - Confiance: ${result.confidence_level}`, 'yellow');
            
            if (result.recommendations && result.recommendations.length > 0) {
                log(`      - Recommandations:`, 'magenta');
                result.recommendations.forEach((rec, recIndex) => {
                    log(`        ${recIndex + 1}. ${rec}`, 'magenta');
                });
            }
        });

        // 6. Calcul du total des économies
        const totalSavings = eligibilityResults.reduce((sum, result) => sum + (result.estimated_savings || 0), 0);
        const highEligibilityCount = eligibilityResults.filter(r => r.eligibility_score >= 70).length;

        log('📊 Résumé de la simulation:', 'cyan');
        log(`   - Total des économies potentielles: ${totalSavings.toLocaleString('fr-FR')}€`, 'green');
        log(`   - Produits très éligibles (≥70%): ${highEligibilityCount}/${eligibilityResults.length}`, 'green');
        log(`   - Score moyen: ${Math.round(eligibilityResults.reduce((sum, r) => sum + r.eligibility_score, 0) / eligibilityResults.length)}%`, 'green');

        // 7. Test de récupération des résultats
        logInfo('6. Vérification de la persistance des données...');
        const resultsResponse = await fetch(`${API_BASE}/results/${sessionId}`);
        
        if (resultsResponse.ok) {
            const savedResults = await resultsResponse.json();
            logSuccess(`Données persistées: ${savedResults.length} résultats sauvegardés`);
        } else {
            logWarning('⚠️  Impossible de récupérer les résultats sauvegardés');
        }

        logSuccess('🎉 Test complet du simulateur terminé avec succès !');

    } catch (error) {
        logError(`Erreur lors du test: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// Fonction pour tester la connectivité
async function testConnectivity() {
    log('🔍 Test de connectivité...', 'cyan');
    
    try {
        const response = await fetch(`${BASE_URL}/health`);
        if (response.ok) {
            logSuccess('Serveur accessible');
            return true;
        } else {
            logError(`Serveur répond avec ${response.status}`);
            return false;
        }
    } catch (error) {
        logError(`Impossible de se connecter au serveur: ${error.message}`);
        return false;
    }
}

// Fonction principale
async function main() {
    log('🧪 Test du simulateur d\'éligibilité', 'cyan');
    log('====================================', 'cyan');
    
    // Test de connectivité
    const isConnected = await testConnectivity();
    if (!isConnected) {
        logError('❌ Impossible de se connecter au serveur. Assurez-vous qu\'il est démarré sur le port 5001.');
        process.exit(1);
    }
    
    // Test complet
    await testSimulator();
    
    log('✅ Tous les tests terminés', 'green');
}

// Exécution
if (require.main === module) {
    main().catch(error => {
        logError(`Erreur fatale: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { testSimulator, testConnectivity }; 