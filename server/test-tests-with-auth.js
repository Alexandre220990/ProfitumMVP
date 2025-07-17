#!/usr/bin/env node

/**
 * Script de test pour vérifier le système de tests avec authentification
 * Simule l'authentification d'un utilisateur admin
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

// Simuler un token d'authentification admin
const simulateAdminToken = () => {
    // Token JWT simulé pour un utilisateur admin
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(JSON.stringify({
        sub: '61797a61-edde-4816-b818-00015b627fe1',
        email: 'grandjean.alexandre5@gmail.com',
        type: 'admin',
        username: 'grandjean.alexandre5',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
    })).toString('base64');
    const signature = 'simulated_signature_for_testing';
    
    return `${header}.${payload}.${signature}`;
};

// Fonction pour faire une requête API avec authentification
const makeAuthenticatedRequest = async (method, endpoint, data = null) => {
    try {
        const url = `${BASE_URL}${API_PREFIX}${endpoint}`;
        const token = simulateAdminToken();
        
        const config = {
            method,
            url,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            timeout: 30000
        };

        if (data) {
            config.data = data;
        }

        logInfo(`Requête ${method.toUpperCase()} ${endpoint} avec authentification`);
        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data || error.message 
        };
    }
};

// Test du statut du système
const testSystemStatus = async () => {
    logTest('Test du statut du système...');
    
    const result = await makeAuthenticatedRequest('GET', '/tests/status');
    
    if (result.success) {
        logSuccess('Statut du système récupéré');
        logInfo(`Status: ${result.data?.data?.status}`);
        logInfo(`Scripts prêts: ${result.data?.data?.summary?.ready_scripts}/${result.data?.data?.summary?.total_scripts}`);
        return result.data?.data?.status === 'ready';
    } else {
        logError(`Échec du statut: ${result.error?.message || result.error}`);
        return false;
    }
};

// Test des catégories
const testCategories = async () => {
    logTest('Test des catégories disponibles...');
    
    const result = await makeAuthenticatedRequest('GET', '/tests/categories');
    
    if (result.success) {
        logSuccess('Catégories récupérées');
        const categories = result.data?.data || [];
        categories.forEach(cat => {
            logInfo(`- ${cat.name}: ${cat.tests.length} tests`);
        });
        return true;
    } else {
        logError(`Échec des catégories: ${result.error?.message || result.error}`);
        return false;
    }
};

// Test d'exécution d'une catégorie
const testCategoryExecution = async (category) => {
    logTest(`Test d'exécution de la catégorie ${category}...`);
    
    const result = await makeAuthenticatedRequest('POST', `/tests/run-category/${category}`);
    
    if (result.success) {
        logSuccess(`Exécution de ${category} réussie`);
        logInfo(`Message: ${result.data?.message}`);
        return true;
    } else {
        logError(`Échec de ${category}: ${result.error?.message || result.error}`);
        return false;
    }
};

// Test des résultats
const testResults = async () => {
    logTest('Test de récupération des résultats...');
    
    const result = await makeAuthenticatedRequest('GET', '/tests/results?hours=24');
    
    if (result.success) {
        logSuccess('Résultats récupérés');
        const reports = result.data?.data?.reports || [];
        logInfo(`${reports.length} rapports trouvés`);
        return true;
    } else {
        logError(`Échec des résultats: ${result.error?.message || result.error}`);
        return false;
    }
};

// Test d'exécution de tous les tests
const testAllTests = async () => {
    logTest('Test d\'exécution de tous les tests...');
    
    const result = await makeAuthenticatedRequest('POST', '/tests/run-all');
    
    if (result.success) {
        logSuccess('Exécution de tous les tests réussie');
        logInfo(`Message: ${result.data?.message}`);
        return true;
    } else {
        logError(`Échec de tous les tests: ${result.error?.message || result.error}`);
        return false;
    }
};

// Test de performance
const testPerformance = async () => {
    logTest('Test de performance...');
    
    const startTime = Date.now();
    const promises = [
        makeAuthenticatedRequest('GET', '/tests/status'),
        makeAuthenticatedRequest('GET', '/tests/categories'),
        makeAuthenticatedRequest('GET', '/tests/results?hours=1')
    ];
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    logInfo(`Performance: ${successCount}/${totalCount} succès en ${duration}ms`);
    
    if (duration < 5000) {
        logSuccess('Performance acceptable');
        return true;
    } else {
        logWarning('Performance lente détectée');
        return false;
    }
};

// Fonction principale
const runAuthenticatedTests = async () => {
    log('🚀 Démarrage des tests authentifiés du système de tests', 'bright');
    log('='.repeat(60), 'bright');
    
    try {
        // Test du statut
        const statusOk = await testSystemStatus();
        log('');
        
        // Test des catégories
        const categoriesOk = await testCategories();
        log('');
        
        // Test de performance
        const performanceOk = await testPerformance();
        log('');
        
        // Test des résultats
        const resultsOk = await testResults();
        log('');
        
        // Test d'exécution d'une catégorie simple
        const executionOk = await testCategoryExecution('system');
        log('');
        
        // Test d'exécution de tous les tests (optionnel)
        logInfo('Test d\'exécution de tous les tests (peut prendre du temps)...');
        const allTestsOk = await testAllTests();
        log('');
        
        // Résumé
        log('='.repeat(60), 'bright');
        log('📊 Résumé des tests authentifiés:', 'bright');
        log(`Status: ${statusOk ? '✅' : '❌'}`);
        log(`Catégories: ${categoriesOk ? '✅' : '❌'}`);
        log(`Performance: ${performanceOk ? '✅' : '❌'}`);
        log(`Résultats: ${resultsOk ? '✅' : '❌'}`);
        log(`Exécution catégorie: ${executionOk ? '✅' : '❌'}`);
        log(`Exécution tous tests: ${allTestsOk ? '✅' : '❌'}`);
        
        const totalTests = 6;
        const passedTests = [statusOk, categoriesOk, performanceOk, resultsOk, executionOk, allTestsOk].filter(Boolean).length;
        
        log('='.repeat(60), 'bright');
        log(`🎯 Score: ${passedTests}/${totalTests} tests réussis`, passedTests === totalTests ? 'green' : 'yellow');
        
        if (passedTests === totalTests) {
            log('🎉 Tous les tests authentifiés sont passés !', 'bright');
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
    runAuthenticatedTests();
}

module.exports = {
    testSystemStatus,
    testCategories,
    testCategoryExecution,
    testResults,
    testAllTests,
    testPerformance,
    runAuthenticatedTests
}; 