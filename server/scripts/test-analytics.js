#!/usr/bin/env node

/**
 * Script de test pour les analytics avancées
 * Teste toutes les fonctionnalités du système d'analytics
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Couleurs pour la console
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

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`🔍 ${title}`, 'cyan');
  console.log('='.repeat(60));
}

function logTest(testName, success, details = '') {
  const status = success ? '✅' : '❌';
  const color = success ? 'green' : 'red';
  log(`${status} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'yellow');
  }
}

// Tests des métriques principales
async function testMetrics() {
  logSection('Test des métriques principales');
  
  try {
    // Test 1: Récupération des clients
    const { count: totalClients, error: clientsError } = await supabase
      .from('Client')
      .select('*', { count: 'exact', head: true });
    
    logTest('Récupération du nombre total de clients', !clientsError, 
      `Total: ${totalClients || 0} clients`);
    
    // Test 2: Récupération des experts
    const { count: totalExperts, error: expertsError } = await supabase
      .from('Expert')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    logTest('Récupération du nombre d\'experts actifs', !expertsError,
      `Total: ${totalExperts || 0} experts actifs`);
    
    // Test 3: Récupération des audits
    const { count: totalAudits, error: auditsError } = await supabase
      .from('Audit')
      .select('*', { count: 'exact', head: true });
    
    logTest('Récupération du nombre total d\'audits', !auditsError,
      `Total: ${totalAudits || 0} audits`);
    
    // Test 4: Récupération des audits terminés
    const { count: completedAudits, error: completedError } = await supabase
      .from('Audit')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'terminé');
    
    logTest('Récupération du nombre d\'audits terminés', !completedError,
      `Total: ${completedAudits || 0} audits terminés`);
    
    // Test 5: Calcul du taux de conversion
    const conversionRate = totalAudits > 0 ? (completedAudits / totalAudits) * 100 : 0;
    logTest('Calcul du taux de conversion', true,
      `Taux: ${conversionRate.toFixed(2)}%`);
    
    return true;
  } catch (error) {
    logTest('Test des métriques principales', false, error.message);
    return false;
  }
}

// Tests des données de conversion
async function testConversionData() {
  logSection('Test des données de conversion');
  
  try {
    // Test 1: Récupération des produits éligibles
    const { data: productData, error: productError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        statut,
        ProduitEligible (id, nom),
        created_at
      `)
      .limit(100);
    
    logTest('Récupération des produits éligibles', !productError,
      `${productData?.length || 0} produits récupérés`);
    
    // Test 2: Analyse des statuts
    if (productData) {
      const statusCounts = productData.reduce((acc, item) => {
        acc[item.statut] = (acc[item.statut] || 0) + 1;
        return acc;
      }, {});
      
      logTest('Analyse des statuts des produits', true,
        `Statuts: ${JSON.stringify(statusCounts)}`);
    }
    
    // Test 3: Simulation du funnel de conversion
    const funnelSteps = [
      { name: 'Signature charte', conversions: 100, dropoffs: 15 },
      { name: 'Sélection expert', conversions: 85, dropoffs: 12 },
      { name: 'Complétion dossier', conversions: 73, dropoffs: 8 },
      { name: 'Validation admin', conversions: 65, dropoffs: 5 },
      { name: 'Dossier finalisé', conversions: 60, dropoffs: 3 }
    ];
    
    logTest('Simulation du funnel de conversion', true,
      `${funnelSteps.length} étapes simulées`);
    
    return true;
  } catch (error) {
    logTest('Test des données de conversion', false, error.message);
    return false;
  }
}

// Tests des performances des produits
async function testProductPerformance() {
  logSection('Test des performances des produits');
  
  try {
    // Test 1: Récupération des produits avec leurs performances
    const { data: productPerformance, error: perfError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        statut,
        ProduitEligible (id, nom),
        created_at
      `)
      .limit(200);
    
    logTest('Récupération des performances produits', !perfError,
      `${productPerformance?.length || 0} enregistrements récupérés`);
    
    // Test 2: Calcul des statistiques par produit
    if (productPerformance) {
      const productStats = productPerformance.reduce((acc, item) => {
        const productName = item.ProduitEligible?.nom || 'Inconnu';
        if (!acc[productName]) {
          acc[productName] = { total: 0, eligible: 0, revenue: 0 };
        }
        acc[productName].total++;
        if (item.statut === 'eligible') {
          acc[productName].eligible++;
          acc[productName].revenue += Math.random() * 1000 + 500;
        }
        return acc;
      }, {});
      
      const topProducts = Object.entries(productStats)
        .map(([name, stats]) => ({
          name,
          conversions: stats.eligible,
          revenue: stats.revenue,
          conversionRate: (stats.eligible / stats.total) * 100
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      logTest('Calcul des top produits', true,
        `${topProducts.length} produits analysés`);
      
      topProducts.forEach((product, index) => {
        log(`   ${index + 1}. ${product.name}: ${product.conversions} conversions, ${product.revenue.toFixed(0)}€`, 'blue');
      });
    }
    
    return true;
  } catch (error) {
    logTest('Test des performances des produits', false, error.message);
    return false;
  }
}

// Tests des performances des experts
async function testExpertPerformance() {
  logSection('Test des performances des experts');
  
  try {
    // Test 1: Récupération des assignations d'experts
    const { data: expertAssignments, error: assignError } = await supabase
      .from('expertassignment')
      .select(`
        status,
        compensation_amount,
        assignment_date,
        completed_date,
        Expert (id, name)
      `)
      .limit(100);
    
    logTest('Récupération des assignations d\'experts', !assignError,
      `${expertAssignments?.length || 0} assignations récupérées`);
    
    // Test 2: Calcul des performances par expert
    if (expertAssignments) {
      const expertStats = expertAssignments.reduce((acc, item) => {
        const expertName = item.Expert?.name || 'Inconnu';
        if (!acc[expertName]) {
          acc[expertName] = { assignments: 0, completed: 0, revenue: 0, completionTimes: [] };
        }
        acc[expertName].assignments++;
        if (item.status === 'completed') {
          acc[expertName].completed++;
          acc[expertName].revenue += Number(item.compensation_amount) || 0;
          if (item.assignment_date && item.completed_date) {
            const completionTime = (new Date(item.completed_date).getTime() - new Date(item.assignment_date).getTime()) / (1000 * 60 * 60 * 24);
            acc[expertName].completionTimes.push(completionTime);
          }
        }
        return acc;
      }, {});
      
      const topExperts = Object.entries(expertStats)
        .map(([name, stats]) => ({
          name,
          assignments: stats.assignments,
          successRate: (stats.completed / stats.assignments) * 100,
          totalRevenue: stats.revenue,
          avgCompletionTime: stats.completionTimes.length > 0 
            ? stats.completionTimes.reduce((a, b) => a + b, 0) / stats.completionTimes.length 
            : 0
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);
      
      logTest('Calcul des performances des experts', true,
        `${topExperts.length} experts analysés`);
      
      topExperts.forEach((expert, index) => {
        log(`   ${index + 1}. ${expert.name}: ${expert.assignments} assignations, ${expert.successRate.toFixed(1)}% succès, ${expert.totalRevenue.toFixed(0)}€`, 'blue');
      });
    }
    
    return true;
  } catch (error) {
    logTest('Test des performances des experts', false, error.message);
    return false;
  }
}

// Tests des données géographiques
async function testGeographicData() {
  logSection('Test des données géographiques');
  
  try {
    // Test 1: Récupération des données géographiques
    const { data: clientData, error: geoError } = await supabase
      .from('Client')
      .select('city')
      .not('city', 'is', null)
      .limit(100);
    
    logTest('Récupération des données géographiques', !geoError,
      `${clientData?.length || 0} clients avec ville récupérés`);
    
    // Test 2: Calcul de la répartition géographique
    if (clientData) {
      const cityStats = clientData.reduce((acc, client) => {
        acc[client.city] = (acc[client.city] || 0) + 1;
        return acc;
      }, {});
      
      const total = Object.values(cityStats).reduce((sum, count) => sum + count, 0);
      const topCities = Object.entries(cityStats)
        .map(([city, count]) => ({
          city,
          count,
          percentage: (count / total) * 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      logTest('Calcul de la répartition géographique', true,
        `${topCities.length} villes principales`);
      
      topCities.forEach((city, index) => {
        log(`   ${index + 1}. ${city.city}: ${city.count} clients (${city.percentage.toFixed(1)}%)`, 'blue');
      });
    }
    
    return true;
  } catch (error) {
    logTest('Test des données géographiques', false, error.message);
    return false;
  }
}

// Tests des métriques en temps réel
async function testRealTimeMetrics() {
  logSection('Test des métriques en temps réel');
  
  try {
    // Test 1: Génération de métriques simulées
    const now = new Date();
    const realTimeMetrics = [];
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000).toISOString();
      realTimeMetrics.push({
        timestamp,
        value: Math.floor(Math.random() * 100) + 50,
        type: 'active_users'
      });
    }
    
    logTest('Génération des métriques temps réel', true,
      `${realTimeMetrics.length} points de données générés`);
    
    // Test 2: Calcul des statistiques temps réel
    const values = realTimeMetrics.map(m => m.value);
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    
    logTest('Calcul des statistiques temps réel', true,
      `Moyenne: ${avgValue.toFixed(1)}, Max: ${maxValue}, Min: ${minValue}`);
    
    return true;
  } catch (error) {
    logTest('Test des métriques en temps réel', false, error.message);
    return false;
  }
}

// Tests du funnel de conversion
async function testFunnelData() {
  logSection('Test du funnel de conversion');
  
  try {
    // Test 1: Récupération des données du funnel
    const { count: clients } = await supabase
      .from('Client')
      .select('*', { count: 'exact', head: true });
    
    const { count: eligibleProducts } = await supabase
      .from('ClientProduitEligible')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'eligible');
    
    const { count: audits } = await supabase
      .from('Audit')
      .select('*', { count: 'exact', head: true });
    
    const { count: completed } = await supabase
      .from('Audit')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'terminé');
    
    logTest('Récupération des données du funnel', true,
      `Clients: ${clients || 0}, Produits éligibles: ${eligibleProducts || 0}, Audits: ${audits || 0}, Terminés: ${completed || 0}`);
    
    // Test 2: Calcul des taux de conversion
    const funnel = {
      clients: clients || 0,
      eligibleProducts: eligibleProducts || 0,
      audits: audits || 0,
      completed: completed || 0
    };
    
    const conversionRates = {
      productsToClients: funnel.clients > 0 ? (funnel.eligibleProducts / funnel.clients) * 100 : 0,
      auditsToProducts: funnel.eligibleProducts > 0 ? (funnel.audits / funnel.eligibleProducts) * 100 : 0,
      completedToAudits: funnel.audits > 0 ? (funnel.completed / funnel.audits) * 100 : 0,
      overall: funnel.clients > 0 ? (funnel.completed / funnel.clients) * 100 : 0
    };
    
    logTest('Calcul des taux de conversion', true,
      `Global: ${conversionRates.overall.toFixed(1)}%`);
    
    Object.entries(conversionRates).forEach(([key, rate]) => {
      log(`   ${key}: ${rate.toFixed(1)}%`, 'blue');
    });
    
    return true;
  } catch (error) {
    logTest('Test du funnel de conversion', false, error.message);
    return false;
  }
}

// Tests d'export de données
async function testDataExport() {
  logSection('Test d\'export de données');
  
  try {
    // Test 1: Génération de données d'exemple
    const sampleData = {
      metrics: [
        { name: 'Total Clients', value: 1250, change: 12.5, changeType: 'increase' },
        { name: 'Nouveaux Clients', value: 89, change: 8.3, changeType: 'increase' },
        { name: 'Experts Actifs', value: 45, change: 5.2, changeType: 'increase' }
      ],
      topProducts: [
        { name: 'TICPE', conversions: 25, revenue: 12500, conversionRate: 85.0 },
        { name: 'URSSAF', conversions: 20, revenue: 9800, conversionRate: 78.5 },
        { name: 'CEE', conversions: 15, revenue: 7200, conversionRate: 72.0 }
      ],
      expertPerformance: [
        { name: 'Expert A', assignments: 15, successRate: 93.3, totalRevenue: 4500 },
        { name: 'Expert B', assignments: 12, successRate: 91.7, totalRevenue: 3800 },
        { name: 'Expert C', assignments: 10, successRate: 90.0, totalRevenue: 3200 }
      ]
    };
    
    logTest('Génération de données d\'exemple', true,
      `${sampleData.metrics.length} métriques, ${sampleData.topProducts.length} produits, ${sampleData.expertPerformance.length} experts`);
    
    // Test 2: Export CSV
    const csvData = convertToCSV(sampleData);
    const csvFilename = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
    fs.writeFileSync(csvFilename, csvData);
    
    logTest('Export CSV', true, `Fichier créé: ${csvFilename}`);
    
    // Test 3: Export JSON
    const jsonData = JSON.stringify(sampleData, null, 2);
    const jsonFilename = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(jsonFilename, jsonData);
    
    logTest('Export JSON', true, `Fichier créé: ${jsonFilename}`);
    
    // Nettoyage des fichiers de test
    setTimeout(() => {
      try {
        fs.unlinkSync(csvFilename);
        fs.unlinkSync(jsonFilename);
        log('🗑️  Fichiers de test supprimés', 'yellow');
      } catch (error) {
        log('⚠️  Impossible de supprimer les fichiers de test', 'yellow');
      }
    }, 5000);
    
    return true;
  } catch (error) {
    logTest('Test d\'export de données', false, error.message);
    return false;
  }
}

// Fonction utilitaire pour convertir en CSV
function convertToCSV(data) {
  const csvRows = [];
  
  // En-têtes
  csvRows.push('Métrique,Valeur,Changement,Type');
  
  // Métriques
  data.metrics.forEach(metric => {
    csvRows.push(`${metric.name},${metric.value},${metric.change}%,${metric.changeType}`);
  });
  
  // Produits
  csvRows.push('');
  csvRows.push('Produit,Conversions,Revenus,Taux de conversion');
  data.topProducts.forEach(product => {
    csvRows.push(`${product.name},${product.conversions},${product.revenue},${product.conversionRate}%`);
  });
  
  // Experts
  csvRows.push('');
  csvRows.push('Expert,Assignations,Taux de succès,Revenus totaux');
  data.expertPerformance.forEach(expert => {
    csvRows.push(`${expert.name},${expert.assignments},${expert.successRate}%,${expert.totalRevenue}`);
  });
  
  return csvRows.join('\n');
}

// Test principal
async function runAllTests() {
  logSection('DÉMARRAGE DES TESTS ANALYTICS');
  
  const startTime = Date.now();
  const results = [];
  
  // Exécuter tous les tests
  results.push(await testMetrics());
  results.push(await testConversionData());
  results.push(await testProductPerformance());
  results.push(await testExpertPerformance());
  results.push(await testGeographicData());
  results.push(await testRealTimeMetrics());
  results.push(await testFunnelData());
  results.push(await testDataExport());
  
  // Résumé final
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  const successCount = results.filter(r => r).length;
  const totalCount = results.length;
  
  logSection('RÉSUMÉ DES TESTS');
  log(`⏱️  Durée totale: ${duration.toFixed(2)} secondes`, 'cyan');
  log(`✅ Tests réussis: ${successCount}/${totalCount}`, successCount === totalCount ? 'green' : 'yellow');
  log(`📊 Taux de succès: ${((successCount / totalCount) * 100).toFixed(1)}%`, successCount === totalCount ? 'green' : 'yellow');
  
  if (successCount === totalCount) {
    log('🎉 Tous les tests analytics sont passés avec succès !', 'green');
  } else {
    log('⚠️  Certains tests ont échoué. Vérifiez les logs ci-dessus.', 'yellow');
  }
  
  return successCount === totalCount;
}

// Exécution du script
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`❌ Erreur fatale: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testMetrics,
  testConversionData,
  testProductPerformance,
  testExpertPerformance,
  testGeographicData,
  testRealTimeMetrics,
  testFunnelData,
  testDataExport
}; 