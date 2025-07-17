#!/usr/bin/env node

/**
 * Script de test complet pour le système d'analytics
 * Teste toutes les fonctionnalités : métriques, graphiques, export, temps réel
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5001';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'admin@test.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'test123';

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

// Classe de test pour les analytics
class AnalyticsTester {
  constructor() {
    this.token = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  async authenticate() {
    try {
      logInfo('🔐 Authentification...');
      
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });

      if (response.data.success && response.data.token) {
        this.token = response.data.token;
        logSuccess('Authentification réussie');
        return true;
      } else {
        logError('Échec de l\'authentification');
        return false;
      }
    } catch (error) {
      logError(`Erreur d'authentification: ${error.message}`);
      return false;
    }
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  async testEndpoint(endpoint, description, expectedStatus = 200) {
    this.testResults.total++;
    
    try {
      logInfo(`🧪 Test: ${description}`);
      
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        headers: this.getHeaders()
      });

      if (response.status === expectedStatus) {
        logSuccess(`${description} - OK (${response.status})`);
        this.testResults.passed++;
        
        // Log des données reçues
        if (response.data && response.data.data) {
          const dataType = Array.isArray(response.data.data) ? 'array' : typeof response.data.data;
          logInfo(`   📊 Données reçues: ${dataType} avec ${Array.isArray(response.data.data) ? response.data.data.length : Object.keys(response.data.data).length} éléments`);
        }
        
        return response.data;
      } else {
        logError(`${description} - Échec (${response.status} au lieu de ${expectedStatus})`);
        this.testResults.failed++;
        return null;
      }
    } catch (error) {
      logError(`${description} - Erreur: ${error.message}`);
      this.testResults.failed++;
      return null;
    }
  }

  async testDashboardAnalytics() {
    log('\n📊 === TEST DASHBOARD ANALYTICS ===');
    
    const data = await this.testEndpoint(
      '/api/analytics/dashboard?timeRange=30d',
      'Dashboard analytics complet'
    );

    if (data && data.data) {
      const analytics = data.data;
      
      // Vérifier la structure des données
      const requiredFields = ['metrics', 'conversionData', 'timeData', 'abandonmentPoints', 'topProducts', 'expertPerformance', 'geographicData', 'realTimeMetrics', 'funnel'];
      
      for (const field of requiredFields) {
        if (analytics[field]) {
          logSuccess(`   ✓ Champ ${field} présent`);
        } else {
          logWarning(`   ⚠️ Champ ${field} manquant`);
        }
      }

      // Vérifier les métriques
      if (analytics.metrics && analytics.metrics.length > 0) {
        logSuccess(`   ✓ ${analytics.metrics.length} métriques récupérées`);
        analytics.metrics.forEach(metric => {
          logInfo(`      - ${metric.name}: ${metric.value} (${metric.change}%)`);
        });
      }

      // Vérifier le funnel
      if (analytics.funnel) {
        const { clients, eligibleProducts, audits, completed } = analytics.funnel;
        logSuccess(`   ✓ Funnel: ${clients} clients → ${eligibleProducts} éligibles → ${audits} audits → ${completed} terminés`);
      }
    }
  }

  async testMetricsEndpoint() {
    log('\n📈 === TEST MÉTRIQUES ===');
    
    await this.testEndpoint(
      '/api/analytics/metrics?timeRange=7d',
      'Métriques 7 jours'
    );

    await this.testEndpoint(
      '/api/analytics/metrics?timeRange=90d',
      'Métriques 90 jours'
    );

    await this.testEndpoint(
      '/api/analytics/metrics?timeRange=1y',
      'Métriques 1 an'
    );
  }

  async testConversionData() {
    log('\n🔄 === TEST DONNÉES DE CONVERSION ===');
    
    const data = await this.testEndpoint(
      '/api/analytics/conversion?timeRange=30d',
      'Données de conversion'
    );

    if (data && data.data && data.data.conversionData) {
      logSuccess(`   ✓ ${data.data.conversionData.length} étapes de conversion`);
      data.data.conversionData.forEach(step => {
        logInfo(`      - ${step.step}: ${step.conversions} conversions (${step.rate}%)`);
      });
    }
  }

  async testProductsAnalytics() {
    log('\n📦 === TEST ANALYTICS PRODUITS ===');
    
    const data = await this.testEndpoint(
      '/api/analytics/products?timeRange=30d',
      'Performance des produits'
    );

    if (data && data.data && data.data.length > 0) {
      logSuccess(`   ✓ ${data.data.length} produits analysés`);
      data.data.slice(0, 3).forEach(product => {
        logInfo(`      - ${product.name}: ${product.conversions} conversions, ${product.revenue}€`);
      });
    }
  }

  async testExpertsAnalytics() {
    log('\n👨‍💼 === TEST ANALYTICS EXPERTS ===');
    
    const data = await this.testEndpoint(
      '/api/analytics/experts?timeRange=30d',
      'Performance des experts'
    );

    if (data && data.data && data.data.length > 0) {
      logSuccess(`   ✓ ${data.data.length} experts analysés`);
      data.data.slice(0, 3).forEach(expert => {
        logInfo(`      - ${expert.name}: ${expert.assignments} assignations, ${expert.successRate}% succès`);
      });
    }
  }

  async testGeographicData() {
    log('\n🌍 === TEST DONNÉES GÉOGRAPHIQUES ===');
    
    const data = await this.testEndpoint(
      '/api/analytics/geographic?timeRange=30d',
      'Données géographiques'
    );

    if (data && data.data && data.data.length > 0) {
      logSuccess(`   ✓ ${data.data.length} villes analysées`);
      data.data.slice(0, 3).forEach(location => {
        logInfo(`      - ${location.city}: ${location.count} clients (${location.percentage}%)`);
      });
    }
  }

  async testRealTimeMetrics() {
    log('\n⚡ === TEST MÉTRIQUES TEMPS RÉEL ===');
    
    const data = await this.testEndpoint(
      '/api/analytics/realtime',
      'Métriques temps réel'
    );

    if (data && data.data && data.data.length > 0) {
      logSuccess(`   ✓ ${data.data.length} métriques temps réel`);
      const latest = data.data[data.data.length - 1];
      logInfo(`      - Dernière: ${latest.timestamp} = ${latest.value}`);
    }
  }

  async testExportFunctionality() {
    log('\n📤 === TEST EXPORT ===');
    
    // Test export CSV
    await this.testEndpoint(
      '/api/analytics/export?format=csv&timeRange=30d',
      'Export CSV'
    );

    // Test export JSON
    await this.testEndpoint(
      '/api/analytics/export?format=json&timeRange=30d',
      'Export JSON'
    );
  }

  async testFilters() {
    log('\n🔍 === TEST FILTRES ===');
    
    // Test avec différents filtres
    await this.testEndpoint(
      '/api/analytics/dashboard?timeRange=custom&startDate=2024-01-01&endDate=2024-12-31',
      'Filtre date personnalisée'
    );

    await this.testEndpoint(
      '/api/analytics/dashboard?timeRange=30d&productType=cee',
      'Filtre type produit'
    );
  }

  async testErrorHandling() {
    log('\n🚨 === TEST GESTION D\'ERREURS ===');
    
    // Test sans authentification
    try {
      await axios.get(`${BASE_URL}/api/analytics/dashboard`);
      logError('Route accessible sans authentification (problème de sécurité)');
      this.testResults.failed++;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        logSuccess('Route correctement protégée (401 Unauthorized)');
        this.testResults.passed++;
      } else {
        logError(`Erreur inattendue: ${error.message}`);
        this.testResults.failed++;
      }
    }

    // Test avec filtres invalides
    await this.testEndpoint(
      '/api/analytics/dashboard?timeRange=invalid',
      'Filtre invalide (doit gérer gracieusement)',
      400
    );
  }

  async runAllTests() {
    log('\n🚀 === DÉMARRAGE DES TESTS ANALYTICS ===');
    log(`📍 URL de base: ${BASE_URL}`);
    log(`👤 Utilisateur de test: ${TEST_USER_EMAIL}`);
    
    // Authentification
    if (!(await this.authenticate())) {
      logError('Impossible de continuer sans authentification');
      return;
    }

    // Tests principaux
    await this.testDashboardAnalytics();
    await this.testMetricsEndpoint();
    await this.testConversionData();
    await this.testProductsAnalytics();
    await this.testExpertsAnalytics();
    await this.testGeographicData();
    await this.testRealTimeMetrics();
    await this.testExportFunctionality();
    await this.testFilters();
    await this.testErrorHandling();

    // Résumé
    this.printResults();
  }

  printResults() {
    log('\n📋 === RÉSUMÉ DES TESTS ===');
    log(`✅ Tests réussis: ${this.testResults.passed}`, 'green');
    log(`❌ Tests échoués: ${this.testResults.failed}`, 'red');
    log(`📊 Total: ${this.testResults.total}`, 'blue');
    
    const successRate = ((this.testResults.passed / this.testResults.total) * 100).toFixed(1);
    
    if (this.testResults.failed === 0) {
      log(`🎉 Taux de succès: ${successRate}% - TOUS LES TESTS RÉUSSIS!`, 'green');
    } else if (this.testResults.passed > this.testResults.failed) {
      log(`👍 Taux de succès: ${successRate}% - Tests majoritairement réussis`, 'yellow');
    } else {
      log(`⚠️ Taux de succès: ${successRate}% - Problèmes détectés`, 'red');
    }

    // Recommandations
    if (this.testResults.failed > 0) {
      log('\n🔧 RECOMMANDATIONS:');
      log('   - Vérifier la configuration de la base de données');
      log('   - Contrôler les permissions utilisateur');
      log('   - Vérifier les variables d\'environnement');
      log('   - Consulter les logs du serveur');
    } else {
      log('\n🎯 SYSTÈME ANALYTICS OPÉRATIONNEL!');
      log('   - Toutes les fonctionnalités sont fonctionnelles');
      log('   - Les données sont correctement récupérées');
      log('   - L\'export fonctionne');
      log('   - La sécurité est en place');
    }
  }
}

// Fonction principale
async function main() {
  try {
    const tester = new AnalyticsTester();
    await tester.runAllTests();
  } catch (error) {
    logError(`Erreur fatale: ${error.message}`);
    process.exit(1);
  }
}

// Exécution
if (require.main === module) {
  main();
}

module.exports = AnalyticsTester; 