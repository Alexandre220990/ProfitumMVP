#!/usr/bin/env node

/**
 * Script de test pour vérifier l'authentification frontend
 * Simule les requêtes du navigateur avec les tokens Supabase
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5001';
const API_PREFIX = '/api';

// Couleurs pour les logs
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logError = (message) => log(`❌ ${message}`, 'red');
const logWarning = (message) => log(`⚠️ ${message}`, 'yellow');
const logInfo = (message) => log(`ℹ️ ${message}`, 'blue');
const logTest = (message) => log(`🧪 ${message}`, 'cyan');

// Test sans authentification (doit échouer)
const testWithoutAuth = async () => {
    logTest('Test sans authentification (doit échouer)...');
    
    try {
        const response = await axios.get(`${BASE_URL}${API_PREFIX}/tests/status`, {
            timeout: 5000
        });
        
        logError('❌ Test sans auth a réussi (ne devrait pas)');
        return false;
    } catch (error) {
        if (error.response?.status === 401) {
            logSuccess('Test sans auth a échoué correctement (401 Unauthorized)');
            return true;
        } else {
            logError(`❌ Erreur inattendue: ${error.message}`);
            return false;
        }
    }
};

// Test avec token invalide (doit échouer)
const testWithInvalidToken = async () => {
    logTest('Test avec token invalide (doit échouer)...');
    
    try {
        const response = await axios.get(`${BASE_URL}${API_PREFIX}/tests/status`, {
            headers: {
                'Authorization': 'Bearer invalid_token_123'
            },
            timeout: 5000
        });
        
        logError('❌ Test avec token invalide a réussi (ne devrait pas)');
        return false;
    } catch (error) {
        if (error.response?.status === 401) {
            logSuccess('Test avec token invalide a échoué correctement (401 Unauthorized)');
            return true;
        } else {
            logError(`❌ Erreur inattendue: ${error.message}`);
            return false;
        }
    }
};

// Test de la structure de réponse d'erreur
const testErrorStructure = async () => {
    logTest('Test de la structure de réponse d\'erreur...');
    
    try {
        const response = await axios.get(`${BASE_URL}${API_PREFIX}/tests/status`, {
            timeout: 5000
        });
        
        logError('❌ Test de structure a réussi (ne devrait pas)');
        return false;
    } catch (error) {
        if (error.response?.data) {
            const errorData = error.response.data;
            
            if (errorData.success === false && errorData.message) {
                logSuccess('Structure de réponse d\'erreur correcte');
                logInfo(`Message: ${errorData.message}`);
                return true;
            } else {
                logError('❌ Structure de réponse d\'erreur incorrecte');
                return false;
            }
        } else {
            logError('❌ Pas de données de réponse d\'erreur');
            return false;
        }
    }
};

// Test de performance des erreurs
const testErrorPerformance = async () => {
    logTest('Test de performance des erreurs...');
    
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < 5; i++) {
        promises.push(
            axios.get(`${BASE_URL}${API_PREFIX}/tests/status`, {
                timeout: 5000
            }).catch(() => ({ status: 'error' }))
        );
    }
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const errorCount = results.filter(r => r.status === 'error').length;
    
    logInfo(`Performance: ${errorCount}/5 erreurs en ${duration}ms`);
    
    if (duration < 3000) {
        logSuccess('Performance des erreurs acceptable');
        return true;
    } else {
        logWarning('Performance des erreurs lente');
        return false;
    }
};

// Test de validation des paramètres
const testParameterValidation = async () => {
    logTest('Test de validation des paramètres...');
    
    const tests = [
        {
            name: 'Catégorie invalide',
            url: '/tests/run-category/INVALID_CATEGORY',
            method: 'POST'
        },
        {
            name: 'Paramètre hours invalide',
            url: '/tests/results?hours=999999',
            method: 'GET'
        }
    ];
    
    let successCount = 0;
    
    for (const test of tests) {
        try {
            const response = await axios({
                method: test.method,
                url: `${BASE_URL}${API_PREFIX}${test.url}`,
                timeout: 5000
            });
            
            logError(`❌ ${test.name} a réussi (ne devrait pas)`);
        } catch (error) {
            if (error.response?.status === 400) {
                logSuccess(`${test.name} a échoué correctement (400 Bad Request)`);
                successCount++;
            } else if (error.response?.status === 401) {
                logSuccess(`${test.name} a échoué correctement (401 Unauthorized)`);
                successCount++;
            } else {
                logError(`❌ ${test.name}: erreur inattendue ${error.response?.status}`);
            }
        }
    }
    
    return successCount === tests.length;
};

// Test de sécurité des routes
const testRouteSecurity = async () => {
    logTest('Test de sécurité des routes...');
    
    const routes = [
        '/tests/status',
        '/tests/categories',
        '/tests/results',
        '/tests/run-all',
        '/tests/run-category/security',
        '/tests/run-specific/security/test'
    ];
    
    let protectedCount = 0;
    
    for (const route of routes) {
        try {
            const response = await axios.get(`${BASE_URL}${API_PREFIX}${route}`, {
                timeout: 5000
            });
            
            logError(`❌ Route ${route} accessible sans auth`);
        } catch (error) {
            if (error.response?.status === 401) {
                logSuccess(`Route ${route} protégée correctement`);
                protectedCount++;
            } else {
                logWarning(`Route ${route}: statut ${error.response?.status}`);
            }
        }
    }
    
    return protectedCount === routes.length;
};

// Fonction principale
const runFrontendAuthTests = async () => {
    log('🚀 Démarrage des tests d\'authentification frontend', 'bright');
    log('='.repeat(60), 'bright');
    
    try {
        // Test sans authentification
        const noAuthOk = await testWithoutAuth();
        log('');
        
        // Test avec token invalide
        const invalidTokenOk = await testWithInvalidToken();
        log('');
        
        // Test de structure d'erreur
        const errorStructureOk = await testErrorStructure();
        log('');
        
        // Test de performance
        const performanceOk = await testErrorPerformance();
        log('');
        
        // Test de validation des paramètres
        const validationOk = await testParameterValidation();
        log('');
        
        // Test de sécurité des routes
        const securityOk = await testRouteSecurity();
        log('');
        
        // Résumé
        log('='.repeat(60), 'bright');
        log('📊 Résumé des tests d\'authentification frontend:', 'bright');
        log(`Sans auth: ${noAuthOk ? '✅' : '❌'}`);
        log(`Token invalide: ${invalidTokenOk ? '✅' : '❌'}`);
        log(`Structure erreur: ${errorStructureOk ? '✅' : '❌'}`);
        log(`Performance: ${performanceOk ? '✅' : '❌'}`);
        log(`Validation: ${validationOk ? '✅' : '❌'}`);
        log(`Sécurité routes: ${securityOk ? '✅' : '❌'}`);
        
        const totalTests = 6;
        const passedTests = [noAuthOk, invalidTokenOk, errorStructureOk, performanceOk, validationOk, securityOk].filter(Boolean).length;
        
        log('='.repeat(60), 'bright');
        log(`🎯 Score: ${passedTests}/${totalTests} tests réussis`, passedTests === totalTests ? 'green' : 'yellow');
        
        if (passedTests === totalTests) {
            log('🎉 Tous les tests d\'authentification frontend sont passés !', 'bright');
            log('💡 Le système est prêt pour l\'authentification réelle', 'bright');
        } else {
            log('⚠️ Certains tests ont échoué', 'yellow');
        }
        
    } catch (error) {
        logError(`Erreur lors des tests: ${error.message}`);
        process.exit(1);
    }
};

// Exécution si le script est appelé directement
if (require.main === module) {
    runFrontendAuthTests();
}

module.exports = {
    testWithoutAuth,
    testWithInvalidToken,
    testErrorStructure,
    testErrorPerformance,
    testParameterValidation,
    testRouteSecurity,
    runFrontendAuthTests
}; 