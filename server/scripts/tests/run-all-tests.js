const { createClient } = require('@supabase/supabase-js');
const SecurityTests = require('./security-tests');
const PerformanceTests = require('./performance-tests');
const DatabaseTests = require('./database-tests');
const APITests = require('./api-tests');
const SystemTests = require('./system-tests');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class TestRunner {
  constructor() {
    this.results = {};
    this.startTime = Date.now();
    this.categories = {
      security: SecurityTests,
      performance: PerformanceTests,
      database: DatabaseTests,
      api: APITests,
      system: SystemTests
    };
  }

  async runAllTests() {
    console.log('🚀 Démarrage de la suite complète de tests...\n');
    
    try {
      // Lancer tous les tests par catégorie
      for (const [category, TestClass] of Object.entries(this.categories)) {
        console.log(`📋 Catégorie: ${category.toUpperCase()}`);
        console.log('='.repeat(50));
        
        const testInstance = new TestClass();
        const result = await testInstance.runAllTests();
        
        this.results[category] = result;
        
        console.log(`✅ ${category}: ${result.success ? 'SUCCÈS' : 'ÉCHEC'}`);
        console.log(`⏱️  Durée: ${result.duration}ms`);
        console.log(`📊 Tests: ${result.results.length}\n`);
      }
      
      const totalDuration = Date.now() - this.startTime;
      const summary = this.generateSummary();
      
      // Enregistrer le rapport global
      await this.saveGlobalReport(totalDuration, summary);
      
      // Afficher le résumé final
      this.displayFinalSummary(summary, totalDuration);
      
      return {
        success: summary.overall_status === 'success',
        duration: totalDuration,
        results: this.results,
        summary
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'exécution des tests:', error);
      return {
        success: false,
        error: error.message,
        results: this.results
      };
    }
  }

  generateSummary() {
    const categories = Object.keys(this.results);
    const totalTests = categories.reduce((sum, cat) => {
      return sum + (this.results[cat].results?.length || 0);
    }, 0);
    
    const successful = categories.reduce((sum, cat) => {
      return sum + (this.results[cat].results?.filter(r => r.status === 'success').length || 0);
    }, 0);
    
    const warnings = categories.reduce((sum, cat) => {
      return sum + (this.results[cat].results?.filter(r => r.status === 'warning').length || 0);
    }, 0);
    
    const errors = categories.reduce((sum, cat) => {
      return sum + (this.results[cat].results?.filter(r => r.status === 'error').length || 0);
    }, 0);
    
    const categoryStatuses = {};
    categories.forEach(cat => {
      const categoryResults = this.results[cat].results || [];
      const categoryErrors = categoryResults.filter(r => r.status === 'error').length;
      const categoryWarnings = categoryResults.filter(r => r.status === 'warning').length;
      
      categoryStatuses[cat] = categoryErrors > 0 ? 'error' : categoryWarnings > 0 ? 'warning' : 'success';
    });
    
    const overallStatus = errors > 0 ? 'error' : warnings > 0 ? 'warning' : 'success';
    
    return {
      total_tests: totalTests,
      successful,
      warnings,
      errors,
      success_rate: totalTests > 0 ? Math.round((successful / totalTests) * 100) : 0,
      overall_status: overallStatus,
      category_statuses: categoryStatuses,
      categories: categories
    };
  }

  displayFinalSummary(summary, totalDuration) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPPORT FINAL DES TESTS');
    console.log('='.repeat(60));
    
    console.log(`⏱️  Durée totale: ${Math.round(totalDuration / 1000)}s`);
    console.log(`📋 Tests totaux: ${summary.total_tests}`);
    console.log(`✅ Succès: ${summary.successful}`);
    console.log(`⚠️  Avertissements: ${summary.warnings}`);
    console.log(`❌ Erreurs: ${summary.errors}`);
    console.log(`📈 Taux de succès: ${summary.success_rate}%`);
    console.log(`🎯 Statut global: ${summary.overall_status.toUpperCase()}`);
    
    console.log('\n📋 Statut par catégorie:');
    Object.entries(summary.category_statuses).forEach(([category, status]) => {
      const emoji = status === 'success' ? '✅' : status === 'warning' ? '⚠️' : '❌';
      console.log(`  ${emoji} ${category.toUpperCase()}: ${status.toUpperCase()}`);
    });
    
    console.log('\n' + '='.repeat(60));
    
    if (summary.overall_status === 'success') {
      console.log('🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !');
    } else if (summary.overall_status === 'warning') {
      console.log('⚠️  TESTS TERMINÉS AVEC DES AVERTISSEMENTS');
    } else {
      console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ');
    }
    
    console.log('='.repeat(60) + '\n');
  }

  async saveGlobalReport(duration, summary) {
    try {
      const report = {
        script_name: 'COMPLETE_TEST_SUITE',
        status: summary.overall_status,
        duration_ms: duration,
        output: JSON.stringify({
          summary,
          results: this.results
        }, null, 2),
        exit_code: summary.overall_status === 'error' ? 1 : 0,
        metadata: {
          category: 'complete_suite',
          tests_count: summary.total_tests,
          categories_count: summary.categories.length,
          summary
        }
      };

      const { error } = await supabase
        .from('iso_reports')
        .insert(report);

      if (error) {
        console.error('Erreur sauvegarde rapport global:', error);
      } else {
        console.log('✅ Rapport global sauvegardé');
      }
    } catch (error) {
      console.error('Erreur sauvegarde rapport global:', error);
    }
  }

  async runCategoryTests(category) {
    if (!this.categories[category]) {
      throw new Error(`Catégorie de tests inconnue: ${category}`);
    }
    
    console.log(`🚀 Lancement des tests ${category}...`);
    
    const TestClass = this.categories[category];
    const testInstance = new TestClass();
    const result = await testInstance.runAllTests();
    
    this.results[category] = result;
    
    return result;
  }

  async runSpecificTest(category, testName) {
    if (!this.categories[category]) {
      throw new Error(`Catégorie de tests inconnue: ${category}`);
    }
    
    console.log(`🚀 Lancement du test ${testName} dans la catégorie ${category}...`);
    
    const TestClass = this.categories[category];
    const testInstance = new TestClass();
    
    // Exécuter un test spécifique si la méthode existe
    if (testInstance[testName]) {
      const result = await testInstance[testName]();
      return result;
    } else {
      throw new Error(`Test ${testName} non trouvé dans la catégorie ${category}`);
    }
  }
}

// Exécution si appelé directement
if (require.main === module) {
  const testRunner = new TestRunner();
  
  // Vérifier les arguments de ligne de commande
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Lancer tous les tests
    testRunner.runAllTests()
      .then(result => {
        process.exit(result.success ? 0 : 1);
      })
      .catch(error => {
        console.error('❌ Erreur:', error);
        process.exit(1);
      });
  } else if (args.length === 1) {
    // Lancer une catégorie spécifique
    const category = args[0];
    testRunner.runCategoryTests(category)
      .then(result => {
        console.log(`📊 Résultats des tests ${category}:`, result);
        process.exit(result.success ? 0 : 1);
      })
      .catch(error => {
        console.error('❌ Erreur:', error);
        process.exit(1);
      });
  } else if (args.length === 2) {
    // Lancer un test spécifique
    const [category, testName] = args;
    testRunner.runSpecificTest(category, testName)
      .then(result => {
        console.log(`📊 Résultat du test ${testName}:`, result);
        process.exit(result.status === 'success' ? 0 : 1);
      })
      .catch(error => {
        console.error('❌ Erreur:', error);
        process.exit(1);
      });
  } else {
    console.log('Usage:');
    console.log('  node run-all-tests.js                    # Lancer tous les tests');
    console.log('  node run-all-tests.js security           # Lancer les tests de sécurité');
    console.log('  node run-all-tests.js security testName  # Lancer un test spécifique');
    process.exit(1);
  }
}

module.exports = TestRunner; 