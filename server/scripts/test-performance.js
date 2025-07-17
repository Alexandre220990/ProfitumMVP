const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Erreur: SUPABASE_SERVICE_ROLE_KEY manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('⚡ Démarrage des tests de performance...');
console.log(`📡 Connexion à: ${supabaseUrl}`);

// Configuration des tests
const testConfig = {
  iterations: 10, // Nombre d'itérations par test
  timeout: 5000, // Timeout par requête
  warmup: 3 // Nombre de requêtes de warmup
};

// Classe de test de performance
class PerformanceTester {
  constructor() {
    this.results = {
      tests: [],
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity
      }
    };
  }

  // Mesurer le temps de réponse d'une requête
  async measureResponseTime(testName, queryFn) {
    const times = [];
    
    // Warmup
    for (let i = 0; i < testConfig.warmup; i++) {
      try {
        await queryFn();
      } catch (error) {
        // Ignorer les erreurs de warmup
      }
    }
    
    // Tests réels
    for (let i = 0; i < testConfig.iterations; i++) {
      const startTime = Date.now();
      try {
        const { data, error } = await queryFn();
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (error) {
          throw error;
        }
        
        times.push(duration);
      } catch (error) {
        console.log(`❌ ${testName} - Itération ${i + 1}: ${error.message}`);
        times.push(null); // Marquer comme échec
      }
      
      // Pause courte entre les tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Calculer les statistiques
    const validTimes = times.filter(t => t !== null);
    const avgTime = validTimes.length > 0 ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length : 0;
    const maxTime = validTimes.length > 0 ? Math.max(...validTimes) : 0;
    const minTime = validTimes.length > 0 ? Math.min(...validTimes) : 0;
    const successRate = (validTimes.length / times.length) * 100;
    
    return {
      testName,
      averageTime: avgTime,
      maxTime,
      minTime,
      successRate,
      iterations: times.length,
      validIterations: validTimes.length,
      times: validTimes
    };
  }

  // Test 1: Récupération des experts actifs
  async testExpertsRetrieval() {
    console.log('\n👨‍💼 Test: Récupération des experts actifs...');
    
    const result = await this.measureResponseTime(
      'Récupération Experts Actifs',
      () => supabase
        .from('Expert')
        .select('id, name, email, status, specializations')
        .eq('status', 'active')
        .limit(20)
    );
    
    this.results.tests.push(result);
    this.printTestResult(result, 100); // Seuil: 100ms
  }

  // Test 2: Récupération des assignations
  async testAssignmentsRetrieval() {
    console.log('\n📋 Test: Récupération des assignations...');
    
    const result = await this.measureResponseTime(
      'Récupération Assignations',
      () => supabase
        .from('expertassignment')
        .select('id, statut, created_at')
        .limit(20)
    );
    
    this.results.tests.push(result);
    this.printTestResult(result, 100); // Seuil: 100ms
  }

  // Test 3: Récupération des messages
  async testMessagesRetrieval() {
    console.log('\n💬 Test: Récupération des messages...');
    
    const result = await this.measureResponseTime(
      'Récupération Messages',
      () => supabase
        .from('message')
        .select('id, content, created_at, sender_type')
        .order('created_at', { ascending: false })
        .limit(20)
    );
    
    this.results.tests.push(result);
    this.printTestResult(result, 100); // Seuil: 100ms
  }

  // Test 4: Récupération des produits éligibles
  async testProductsRetrieval() {
    console.log('\n🏪 Test: Récupération des produits éligibles...');
    
    const result = await this.measureResponseTime(
      'Récupération Produits Éligibles',
      () => supabase
        .from('ProduitEligible')
        .select('id, nom, description')
        .limit(20)
    );
    
    this.results.tests.push(result);
    this.printTestResult(result, 80); // Seuil: 80ms
  }

  // Test 5: Récupération des clients
  async testClientsRetrieval() {
    console.log('\n👤 Test: Récupération des clients...');
    
    const result = await this.measureResponseTime(
      'Récupération Clients',
      () => supabase
        .from('Client')
        .select('id, company_name, email, created_at')
        .limit(20)
    );
    
    this.results.tests.push(result);
    this.printTestResult(result, 100); // Seuil: 100ms
  }

  // Test 6: Recherche complexe avec JOIN
  async testComplexQuery() {
    console.log('\n🔍 Test: Recherche complexe avec JOIN...');
    
    const result = await this.measureResponseTime(
      'Recherche Complexe',
      () => supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          statut,
          created_at,
          Client (company_name, email),
          ProduitEligible (nom)
        `)
        .limit(10)
    );
    
    this.results.tests.push(result);
    this.printTestResult(result, 200); // Seuil: 200ms
  }

  // Test 7: Comptage des enregistrements
  async testCountQueries() {
    console.log('\n📊 Test: Comptage des enregistrements...');
    
    const result = await this.measureResponseTime(
      'Comptage Enregistrements',
      async () => {
        const [clients, experts, assignments] = await Promise.all([
          supabase.from('Client').select('*', { count: 'exact', head: true }),
          supabase.from('Expert').select('*', { count: 'exact', head: true }),
          supabase.from('expertassignment').select('*', { count: 'exact', head: true })
        ]);
        return { clients, experts, assignments };
      }
    );
    
    this.results.tests.push(result);
    this.printTestResult(result, 150); // Seuil: 150ms
  }

  // Test 8: Requêtes avec filtres
  async testFilteredQueries() {
    console.log('\n🔧 Test: Requêtes avec filtres...');
    
    const result = await this.measureResponseTime(
      'Requêtes Filtrées',
      () => supabase
        .from('Expert')
        .select('id, name, email, status')
        .eq('status', 'active')
        .not('email', 'is', null)
        .limit(10)
    );
    
    this.results.tests.push(result);
    this.printTestResult(result, 120); // Seuil: 120ms
  }

  // Test 9: Requêtes avec tri
  async testSortedQueries() {
    console.log('\n📈 Test: Requêtes avec tri...');
    
    const result = await this.measureResponseTime(
      'Requêtes Triées',
      () => supabase
        .from('message')
        .select('id, content, created_at')
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .limit(20)
    );
    
    this.results.tests.push(result);
    this.printTestResult(result, 120); // Seuil: 120ms
  }

  // Test 10: Requêtes avec pagination
  async testPaginationQueries() {
    console.log('\n📄 Test: Requêtes avec pagination...');
    
    const result = await this.measureResponseTime(
      'Requêtes Pagination',
      () => supabase
        .from('Client')
        .select('id, company_name, created_at')
        .range(0, 9) // Première page
        .order('created_at', { ascending: false })
    );
    
    this.results.tests.push(result);
    this.printTestResult(result, 100); // Seuil: 100ms
  }

  // Afficher le résultat d'un test
  printTestResult(result, threshold) {
    const status = result.averageTime <= threshold ? '✅' : '⚠️';
    const performance = result.averageTime <= threshold * 0.5 ? '🚀' : 
                       result.averageTime <= threshold * 0.8 ? '⚡' : '🐌';
    
    console.log(`${status} ${result.testName}:`);
    console.log(`   ${performance} Temps moyen: ${result.averageTime.toFixed(1)}ms`);
    console.log(`   📊 Min/Max: ${result.minTime}ms / ${result.maxTime}ms`);
    console.log(`   📈 Taux de réussite: ${result.successRate.toFixed(1)}%`);
    console.log(`   🔄 Itérations: ${result.validIterations}/${result.iterations}`);
    
    if (result.averageTime > threshold) {
      console.log(`   ⚠️  Dépassement du seuil de ${threshold}ms`);
    }
  }

  // Calculer les statistiques globales
  calculateSummary() {
    const validTests = this.results.tests.filter(t => t.validIterations > 0);
    
    this.results.summary = {
      totalTests: this.results.tests.length,
      passedTests: validTests.length,
      failedTests: this.results.tests.length - validTests.length,
      averageResponseTime: validTests.length > 0 ? 
        validTests.reduce((sum, t) => sum + t.averageTime, 0) / validTests.length : 0,
      maxResponseTime: validTests.length > 0 ? 
        Math.max(...validTests.map(t => t.maxTime)) : 0,
      minResponseTime: validTests.length > 0 ? 
        Math.min(...validTests.map(t => t.minTime)) : Infinity
    };
  }

  // Afficher le résumé final
  printSummary() {
    console.log('\n📊 RÉSUMÉ DES TESTS DE PERFORMANCE');
    console.log('=' .repeat(50));
    console.log(`📈 Tests réussis: ${this.results.summary.passedTests}/${this.results.summary.totalTests}`);
    console.log(`⚡ Temps de réponse moyen: ${this.results.summary.averageResponseTime.toFixed(1)}ms`);
    console.log(`🚀 Temps de réponse min: ${this.results.summary.minResponseTime}ms`);
    console.log(`🐌 Temps de réponse max: ${this.results.summary.maxResponseTime}ms`);
    
    // Recommandations
    console.log('\n💡 Recommandations:');
    
    if (this.results.summary.averageResponseTime <= 100) {
      console.log('✅ Excellentes performances ! Le système est optimisé.');
    } else if (this.results.summary.averageResponseTime <= 200) {
      console.log('⚠️  Performances correctes. Quelques optimisations possibles.');
    } else {
      console.log('❌ Performances insuffisantes. Optimisations nécessaires.');
    }
    
    // Tests les plus lents
    const slowTests = this.results.tests
      .filter(t => t.validIterations > 0)
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 3);
    
    if (slowTests.length > 0) {
      console.log('\n🐌 Tests les plus lents:');
      slowTests.forEach((test, index) => {
        console.log(`   ${index + 1}. ${test.testName}: ${test.averageTime.toFixed(1)}ms`);
      });
    }
    
    // Tests les plus rapides
    const fastTests = this.results.tests
      .filter(t => t.validIterations > 0)
      .sort((a, b) => a.averageTime - b.averageTime)
      .slice(0, 3);
    
    if (fastTests.length > 0) {
      console.log('\n🚀 Tests les plus rapides:');
      fastTests.forEach((test, index) => {
        console.log(`   ${index + 1}. ${test.testName}: ${test.averageTime.toFixed(1)}ms`);
      });
    }
  }

  // Exécuter tous les tests
  async runAllTests() {
    console.log('⚡ Démarrage des tests de performance complets...\n');
    
    // Tests de base
    await this.testExpertsRetrieval();
    await this.testAssignmentsRetrieval();
    await this.testMessagesRetrieval();
    await this.testProductsRetrieval();
    await this.testClientsRetrieval();
    
    // Tests avancés
    await this.testComplexQuery();
    await this.testCountQueries();
    await this.testFilteredQueries();
    await this.testSortedQueries();
    await this.testPaginationQueries();
    
    // Résumé final
    this.calculateSummary();
    this.printSummary();
  }
}

// Fonction principale
async function main() {
  try {
    const tester = new PerformanceTester();
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Erreur lors des tests de performance:', error);
    process.exit(1);
  }
}

// Exécuter les tests
main(); 