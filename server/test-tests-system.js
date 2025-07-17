#!/usr/bin/env node

/**
 * Script de test pour vérifier le système de tests
 * Teste la sécurité, la robustesse et l'efficacité du système
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

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

// Fonction pour faire une requête API sécurisée
const makeRequest = async (method, endpoint, data = null) => {
    try {
        const url = `${BASE_URL}${API_PREFIX}${endpoint}`;
        const config = {
            method,
            url,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 secondes de timeout
        };

        if (data) {
            config.data = data;
        }

        logInfo(`Requête ${method.toUpperCase()} ${endpoint}`);
        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data || error.message 
        };
    }
};

// Tests de sécurité
const testSecurity = async () => {
    logTest('Tests de sécurité...');
    
    const securityTests = [
        {
            name: 'Test injection de commande',
            endpoint: '/tests/run-category/security;rm -rf /',
            expected: 'error'
        },
        {
            name: 'Test catégorie invalide',
            endpoint: '/tests/run-category/INVALID_CATEGORY',
            expected: 'error'
        },
        {
            name: 'Test test invalide',
            endpoint: '/tests/run-specific/security/INVALID_TEST',
            expected: 'error'
        },
        {
            name: 'Test paramètre hours invalide',
            endpoint: '/tests/results?hours=999999',
            expected: 'error'
        }
    ];

    for (const test of securityTests) {
        const result = await makeRequest('POST', test.endpoint);
        
        if (test.expected === 'error' && !result.success) {
            logSuccess(`${test.name} - Sécurité validée`);
        } else if (test.expected === 'error' && result.success) {
            logError(`${test.name} - Vulnérabilité détectée`);
        } else {
            logWarning(`${test.name} - Résultat inattendu`);
        }
    }
};

// Tests de robustesse
const testRobustness = async () => {
    logTest('Tests de robustesse...');
    
    const robustnessTests = [
        {
            name: 'Test statut du système',
            endpoint: '/tests/status',
            method: 'GET'
        },
        {
            name: 'Test catégories disponibles',
            endpoint: '/tests/categories',
            method: 'GET'
        },
        {
            name: 'Test résultats récents',
            endpoint: '/tests/results?hours=24',
            method: 'GET'
        }
    ];

    for (const test of robustnessTests) {
        const result = await makeRequest(test.method, test.endpoint);
        
        if (result.success) {
            logSuccess(`${test.name} - Fonctionnel`);
        } else {
            logError(`${test.name} - Échec: ${result.error?.message || result.error}`);
        }
    }
};

// Tests d'efficacité
const testEfficiency = async () => {
    logTest('Tests d\'efficacité...');
    
    const startTime = Date.now();
    
    // Test de performance des endpoints GET
    const getEndpoints = [
        '/tests/status',
        '/tests/categories',
        '/tests/results?hours=1'
    ];

    const promises = getEndpoints.map(endpoint => makeRequest('GET', endpoint));
    const results = await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    logInfo(`Performance: ${successCount}/${totalCount} succès en ${duration}ms`);
    
    if (duration < 5000) { // Moins de 5 secondes
        logSuccess('Performance acceptable');
    } else {
        logWarning('Performance lente détectée');
    }
};

// Tests d'intégration
const testIntegration = async () => {
    logTest('Tests d\'intégration...');
    
    // Vérifier que les scripts existent
    const scriptsDir = path.join(__dirname, 'scripts', 'tests');
    const requiredScripts = [
        'security-tests.js',
        'performance-tests.js',
        'database-tests.js',
        'api-tests.js',
        'system-tests.js',
        'run-all-tests.js'
    ];

    for (const script of requiredScripts) {
        const scriptPath = path.join(scriptsDir, script);
        if (fs.existsSync(scriptPath)) {
            logSuccess(`Script ${script} présent`);
        } else {
            logError(`Script ${script} manquant`);
        }
    }
};

// Test de lancement d'un test simple
const testSimpleExecution = async () => {
    logTest('Test d\'exécution simple...');
    
    // Test du statut d'abord
    const statusResult = await makeRequest('GET', '/tests/status');
    
    if (statusResult.success && statusResult.data?.data?.status === 'ready') {
        logSuccess('Système de tests prêt');
        
        // Tenter de lancer un test de catégorie
        const testResult = await makeRequest('POST', '/tests/run-category/system');
        
        if (testResult.success) {
            logSuccess('Exécution de test réussie');
        } else {
            logWarning(`Exécution de test échouée: ${testResult.error?.message || testResult.error}`);
        }
    } else {
        logError('Système de tests non prêt');
    }
};

// Fonction principale
const runAllTests = async () => {
    log('🚀 Démarrage des tests du système de tests', 'bright');
    log('='.repeat(50), 'bright');
    
    try {
        await testSecurity();
        log('');
        await testRobustness();
        log('');
        await testEfficiency();
        log('');
        await testIntegration();
        log('');
        await testSimpleExecution();
        
        log('='.repeat(50), 'bright');
        log('✅ Tests du système de tests terminés', 'bright');
        
    } catch (error) {
        logError(`Erreur lors des tests: ${error.message}`);
        process.exit(1);
    }
};

// Exécution si le script est appelé directement
if (require.main === module) {
    runAllTests();
}

module.exports = {
    testSecurity,
    testRobustness,
    testEfficiency,
    testIntegration,
    testSimpleExecution,
    runAllTests
}; 