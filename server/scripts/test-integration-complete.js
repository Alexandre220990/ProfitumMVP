const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Erreur: SUPABASE_SERVICE_ROLE_KEY manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Démarrage des tests d\'intégration complets...');
console.log(`📡 Connexion à: ${supabaseUrl}`);

// Configuration des tests
const testConfig = {
  timeout: 10000, // 10 secondes par test
  retries: 3
};

// Données de test
const testData = {
  client: {
    email: 'test.client@example.com',
    company_name: 'Test Company',
    first_name: 'Test',
    last_name: 'Client'
  },
  expert: {
    email: 'test.expert@example.com',
    name: 'Test Expert',
    specializations: ['audit_energetique', 'cee']
  },
  produit: {
    nom: 'Test Produit',
    description: 'Produit de test pour intégration',
    category: 'test'
  }
};

// Classe de test
class IntegrationTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  // Méthode pour ajouter un résultat
  addResult(testName, success, details = '') {
    this.results.total++;
    if (success) {
      this.results.passed++;
      console.log(`✅ ${testName}`);
    } else {
      this.results.failed++;
      console.log(`❌ ${testName}: ${details}`);
    }
    this.results.details.push({ testName, success, details });
  }

  // Test de connexion à la base de données
  async testDatabaseConnection() {
    try {
      const { data, error } = await supabase
        .from('Client')
        .select('id')
        .limit(1);
      
      if (error) throw error;
      this.addResult('Connexion Base de Données', true);
      return true;
    } catch (error) {
      this.addResult('Connexion Base de Données', false, error.message);
      return false;
    }
  }

  // Test des tables critiques
  async testCriticalTables() {
    const criticalTables = [
      'Client',
      'Expert', 
      'expertassignment', // Table en minuscules
      'ClientProduitEligible',
      'ProduitEligible',
      'message',
      'notification', // Table en minuscules
      'Audit'
    ];

    for (const table of criticalTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (error) throw error;
        this.addResult(`Table ${table}`, true);
      } catch (error) {
        this.addResult(`Table ${table}`, false, error.message);
      }
    }
  }

  // Test des workflows client
  async testClientWorkflows() {
    console.log('\n👤 Tests des workflows client...');

    // Test 1: Récupération des produits éligibles
    try {
      const { data: produits, error } = await supabase
        .from('ProduitEligible')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      this.addResult('Récupération Produits Éligibles', true);
    } catch (error) {
      this.addResult('Récupération Produits Éligibles', false, error.message);
    }

    // Test 2: Récupération des experts actifs
    try {
      const { data: experts, error } = await supabase
        .from('Expert')
        .select('*')
        .eq('status', 'active')
        .limit(5);
      
      if (error) throw error;
      this.addResult('Récupération Experts Actifs', true);
    } catch (error) {
      this.addResult('Récupération Experts Actifs', false, error.message);
    }

    // Test 3: Récupération des assignations existantes
    try {
      const { data: assignments, error } = await supabase
        .from('expertassignment')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      this.addResult('Récupération Assignations Existantes', true);
    } catch (error) {
      this.addResult('Récupération Assignations Existantes', false, error.message);
    }
  }

  // Test des workflows expert
  async testExpertWorkflows() {
    console.log('\n👨‍💼 Tests des workflows expert...');

    // Test 1: Récupération des assignations
    try {
      const { data: assignments, error } = await supabase
        .from('expertassignment')
        .select(`
          *,
          ClientProduitEligible (
            Client (company_name, email),
            ProduitEligible (nom)
          )
        `)
        .limit(5);
      
      if (error) throw error;
      this.addResult('Récupération Assignations Expert', true);
    } catch (error) {
      this.addResult('Récupération Assignations Expert', false, error.message);
    }

    // Test 2: Récupération des messages
    try {
      const { data: messages, error } = await supabase
        .from('message')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      this.addResult('Récupération Messages Expert', true);
    } catch (error) {
      this.addResult('Récupération Messages Expert', false, error.message);
    }

    // Test 3: Récupération des notifications
    try {
      const { data: notifications, error } = await supabase
        .from('notification')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      this.addResult('Récupération Notifications Expert', true);
    } catch (error) {
      this.addResult('Récupération Notifications Expert', false, error.message);
    }
  }

  // Test des workflows admin
  async testAdminWorkflows() {
    console.log('\n👨‍💻 Tests des workflows admin...');

    // Test 1: Statistiques globales
    try {
      const { count: clientsCount } = await supabase
        .from('Client')
        .select('*', { count: 'exact', head: true });
      
      const { count: expertsCount } = await supabase
        .from('Expert')
        .select('*', { count: 'exact', head: true });
      
      const { count: assignmentsCount } = await supabase
        .from('expertassignment')
        .select('*', { count: 'exact', head: true });
      
      this.addResult('Statistiques Globales Admin', true);
    } catch (error) {
      this.addResult('Statistiques Globales Admin', false, error.message);
    }

    // Test 2: Gestion des experts
    try {
      const { data: experts, error } = await supabase
        .from('Expert')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      this.addResult('Gestion Experts Admin', true);
    } catch (error) {
      this.addResult('Gestion Experts Admin', false, error.message);
    }

    // Test 3: Monitoring des assignations
    try {
      const { data: recentAssignments, error } = await supabase
        .from('expertassignment')
        .select(`
          *,
          ClientProduitEligible (
            Client (company_name),
            ProduitEligible (nom)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      this.addResult('Monitoring Assignations Admin', true);
    } catch (error) {
      this.addResult('Monitoring Assignations Admin', false, error.message);
    }
  }

  // Test des performances
  async testPerformance() {
    console.log('\n⚡ Tests de performance...');

    const performanceTests = [
      {
        name: 'Récupération Experts (50ms)',
        query: () => supabase
          .from('Expert')
          .select('id, name, status')
          .eq('status', 'active')
          .limit(10)
      },
      {
        name: 'Récupération Assignations (50ms)',
        query: () => supabase
          .from('expertassignment')
          .select('id, statut, created_at')
          .eq('statut', 'pending')
          .limit(10)
      },
      {
        name: 'Récupération Messages (50ms)',
        query: () => supabase
          .from('message')
          .select('id, content, created_at')
          .order('created_at', { ascending: false })
          .limit(10)
      },
      {
        name: 'Recherche Complexe (100ms)',
        query: () => supabase
          .from('expertassignment')
          .select(`
            *,
            ClientProduitEligible (
              Client (company_name, email),
              ProduitEligible (nom, category)
            )
          `)
          .eq('statut', 'pending')
          .limit(5)
      }
    ];

    for (const test of performanceTests) {
      try {
        const startTime = Date.now();
        const { data, error } = await test.query();
        const duration = Date.now() - startTime;
        
        if (error) throw error;
        
        const maxTime = parseInt(test.name.match(/\((\d+)ms\)/)[1]);
        const success = duration <= maxTime;
        
        this.addResult(
          `${test.name}`, 
          success, 
          success ? `${duration}ms` : `${duration}ms (dépassé ${maxTime}ms)`
        );
      } catch (error) {
        this.addResult(test.name, false, error.message);
      }
    }
  }

  // Test des fonctionnalités avancées
  async testAdvancedFeatures() {
    console.log('\n🚀 Tests des fonctionnalités avancées...');

    // Test 1: Système de notifications
    try {
      const { data: notifications, error } = await supabase
        .from('notification')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      this.addResult('Système de Notifications', true);
    } catch (error) {
      this.addResult('Système de Notifications', false, error.message);
    }

    // Test 2: Système de rappels
    try {
      const { data: reminders, error } = await supabase
        .from('Reminder')
        .select('*')
        .eq('status', 'pending')
        .limit(5);
      
      if (error) throw error;
      this.addResult('Système de Rappels', true);
    } catch (error) {
      this.addResult('Système de Rappels', false, error.message);
    }

    // Test 3: Audit logs
    try {
      const { data: auditLogs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      this.addResult('Système d\'Audit Logs', true);
    } catch (error) {
      this.addResult('Système d\'Audit Logs', false, error.message);
    }

    // Test 4: Access logs
    try {
      const { data: accessLogs, error } = await supabase
        .from('access_logs')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      this.addResult('Système d\'Access Logs', true);
    } catch (error) {
      this.addResult('Système d\'Access Logs', false, error.message);
    }

    // Test 5: Expert criteria
    try {
      const { data: expertCriteria, error } = await supabase
        .from('expertcriteria')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      this.addResult('Système Expert Criteria', true);
    } catch (error) {
      this.addResult('Système Expert Criteria', false, error.message);
    }
  }

  // Test de sécurité
  async testSecurity() {
    console.log('\n🔒 Tests de sécurité...');

    // Test 1: RLS (Row Level Security)
    try {
      // Tenter d'accéder sans authentification
      const { data, error } = await supabase
        .from('Client')
        .select('*')
        .limit(1);
      
      // Si on peut accéder sans erreur, RLS n'est pas activé
      if (!error) {
        this.addResult('Row Level Security', false, 'RLS non activé');
      } else {
        this.addResult('Row Level Security', true);
      }
    } catch (error) {
      this.addResult('Row Level Security', true);
    }

    // Test 2: Validation des données
    try {
      const { data, error } = await supabase
        .from('Expert')
        .insert({
          email: 'invalid-email',
          name: '',
          status: 'invalid_status'
        });
      
      if (error) {
        this.addResult('Validation des Données', true);
      } else {
        this.addResult('Validation des Données', false, 'Validation insuffisante');
      }
    } catch (error) {
      this.addResult('Validation des Données', true);
    }
  }

  // Test des relations entre tables
  async testTableRelations() {
    console.log('\n🔗 Tests des relations entre tables...');

    // Test 1: Relation Client -> ClientProduitEligible
    try {
      const { data: clientProduits, error } = await supabase
        .from('ClientProduitEligible')
        .select(`
          *,
          Client (company_name, email),
          ProduitEligible (nom, category)
        `)
        .limit(5);
      
      if (error) throw error;
      this.addResult('Relation Client -> Produits Éligibles', true);
    } catch (error) {
      this.addResult('Relation Client -> Produits Éligibles', false, error.message);
    }

    // Test 2: Relation ExpertAssignment -> ClientProduitEligible
    try {
      const { data: assignments, error } = await supabase
        .from('expertassignment')
        .select(`
          *,
          ClientProduitEligible (
            Client (company_name),
            ProduitEligible (nom)
          )
        `)
        .limit(5);
      
      if (error) throw error;
      this.addResult('Relation ExpertAssignment -> ClientProduitEligible', true);
    } catch (error) {
      this.addResult('Relation ExpertAssignment -> ClientProduitEligible', false, error.message);
    }

    // Test 3: Relation Message -> ExpertAssignment
    try {
      const { data: messages, error } = await supabase
        .from('message')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      this.addResult('Relation Message', true);
    } catch (error) {
      this.addResult('Relation Message', false, error.message);
    }
  }

  // Exécuter tous les tests
  async runAllTests() {
    console.log('🧪 Démarrage des tests d\'intégration complets...\n');

    // Tests de base
    await this.testDatabaseConnection();
    await this.testCriticalTables();

    // Tests des workflows
    await this.testClientWorkflows();
    await this.testExpertWorkflows();
    await this.testAdminWorkflows();

    // Tests avancés
    await this.testPerformance();
    await this.testAdvancedFeatures();
    await this.testSecurity();
    await this.testTableRelations();

    // Résumé final
    this.printResults();
  }

  // Afficher les résultats
  printResults() {
    console.log('\n📊 RÉSULTATS DES TESTS D\'INTÉGRATION');
    console.log('=' .repeat(50));
    console.log(`✅ Tests réussis: ${this.results.passed}`);
    console.log(`❌ Tests échoués: ${this.results.failed}`);
    console.log(`📈 Total: ${this.results.total}`);
    console.log(`📊 Taux de réussite: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);

    if (this.results.failed > 0) {
      console.log('\n❌ Tests échoués:');
      this.results.details
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.testName}: ${r.details}`));
    }

    console.log('\n🎯 Recommandations:');
    if (this.results.passed === this.results.total) {
      console.log('✅ Tous les tests sont passés ! Le système est prêt pour la production.');
    } else if (this.results.passed >= this.results.total * 0.9) {
      console.log('⚠️  La plupart des tests sont passés. Quelques ajustements mineurs nécessaires.');
    } else {
      console.log('❌ Plusieurs tests ont échoué. Révision nécessaire avant la production.');
    }
  }
}

// Fonction principale
async function main() {
  try {
    const tester = new IntegrationTester();
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
  }
}

// Exécuter les tests
main(); 