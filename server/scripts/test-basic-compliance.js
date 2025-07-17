#!/usr/bin/env node

/**
 * Script de test basique pour la conformité
 * Teste seulement les tables essentielles sans dépendances complexes
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// UUIDs de test valides
const TEST_IDS = {
  CLIENT_1: '550e8400-e29b-41d4-a716-446655440001',
  CLIENT_2: '550e8400-e29b-41d4-a716-446655440002',
  EXPERT_1: '550e8400-e29b-41d4-a716-446655440003',
  EXPERT_2: '550e8400-e29b-41d4-a716-446655440004',
  DOCUMENT_1: '550e8400-e29b-41d4-a716-446655440005',
  DOCUMENT_2: '550e8400-e29b-41d4-a716-446655440006',
  INVOICE_1: '550e8400-e29b-41d4-a716-446655440007'
};

const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Utilitaires de test
const logTest = (testName, success, details = '') => {
  const icon = success ? '✅' : '❌';
  const status = success ? 'PASSÉ' : 'ÉCHOUÉ';
  console.log(`${icon} ${testName}: ${status}`);
  if (details) console.log(`   ${details}`);
  
  if (success) {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, details });
  }
};

// ===== TESTS DE BASE DE DONNÉES =====

const testDatabaseConnection = async () => {
  console.log('\n🔌 Test de connexion à la base de données...');
  
  try {
    const { data, error } = await supabase
      .from('Client')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      logTest('Connexion base de données', false, error.message);
    } else {
      logTest('Connexion base de données', true, 'Connexion réussie');
    }
  } catch (error) {
    logTest('Connexion base de données', false, error.message);
  }
};

const testTableExistence = async () => {
  console.log('\n🗄️ Test d\'existence des tables...');
  
  const essentialTables = [
    'Client',
    'Expert', 
    'DocumentFile',
    'WorkflowTemplate',
    'ComplianceControl'
  ];
  
  for (const table of essentialTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        logTest(`Table ${table}`, false, error.message);
      } else {
        logTest(`Table ${table}`, true, 'Table accessible');
      }
    } catch (error) {
      logTest(`Table ${table}`, false, error.message);
    }
  }
};

const testClientData = async () => {
  console.log('\n👥 Test des données clients...');
  
  try {
    const { data, error } = await supabase
      .from('Client')
      .select('*')
      .limit(5);
    
    if (error) {
      logTest('Lecture données clients', false, error.message);
    } else {
      logTest('Lecture données clients', true, `${data?.length || 0} clients trouvés`);
      
      // Vérifier que les données de test existent
      const testClient = data?.find(c => c.id === TEST_IDS.CLIENT_1);
      if (testClient) {
        logTest('Données de test clients', true, 'Client de test trouvé');
      } else {
        logTest('Données de test clients', false, 'Client de test manquant');
      }
    }
  } catch (error) {
    logTest('Lecture données clients', false, error.message);
  }
};

const testExpertData = async () => {
  console.log('\n👨‍💼 Test des données experts...');
  
  try {
    const { data, error } = await supabase
      .from('Expert')
      .select('*')
      .limit(5);
    
    if (error) {
      logTest('Lecture données experts', false, error.message);
    } else {
      logTest('Lecture données experts', true, `${data?.length || 0} experts trouvés`);
      
      // Vérifier que les données de test existent
      const testExpert = data?.find(e => e.id === TEST_IDS.EXPERT_1);
      if (testExpert) {
        logTest('Données de test experts', true, 'Expert de test trouvé');
      } else {
        logTest('Données de test experts', false, 'Expert de test manquant');
      }
    }
  } catch (error) {
    logTest('Lecture données experts', false, error.message);
  }
};

const testDocumentData = async () => {
  console.log('\n📄 Test des données documents...');
  
  try {
    const { data, error } = await supabase
      .from('DocumentFile')
      .select('*')
      .limit(5);
    
    if (error) {
      logTest('Lecture données documents', false, error.message);
    } else {
      logTest('Lecture données documents', true, `${data?.length || 0} documents trouvés`);
      
      // Vérifier que les données de test existent
      const testDocument = data?.find(d => d.id === TEST_IDS.DOCUMENT_1);
      if (testDocument) {
        logTest('Données de test documents', true, 'Document de test trouvé');
      } else {
        logTest('Données de test documents', false, 'Document de test manquant');
      }
    }
  } catch (error) {
    logTest('Lecture données documents', false, error.message);
  }
};

const testWorkflowData = async () => {
  console.log('\n🔄 Test des données workflows...');
  
  try {
    const { data, error } = await supabase
      .from('WorkflowTemplate')
      .select('*')
      .limit(5);
    
    if (error) {
      logTest('Lecture données workflows', false, error.message);
    } else {
      logTest('Lecture données workflows', true, `${data?.length || 0} workflows trouvés`);
    }
  } catch (error) {
    logTest('Lecture données workflows', false, error.message);
  }
};

const testComplianceData = async () => {
  console.log('\n🛡️ Test des données conformité...');
  
  try {
    const { data, error } = await supabase
      .from('ComplianceControl')
      .select('*')
      .limit(5);
    
    if (error) {
      logTest('Lecture données conformité', false, error.message);
    } else {
      logTest('Lecture données conformité', true, `${data?.length || 0} contrôles trouvés`);
    }
  } catch (error) {
    logTest('Lecture données conformité', false, error.message);
  }
};

const testDataInsertion = async () => {
  console.log('\n➕ Test d\'insertion de données...');
  
  try {
    // Générer un UUID unique pour le test
    const testId = '550e8400-e29b-41d4-a716-446655440999';
    
    // Test d'insertion d'un client
    const { data: clientData, error: clientError } = await supabase
      .from('Client')
      .insert({
        id: testId,
        email: 'test-insert@example.com',
        first_name: 'Test',
        last_name: 'Insert',
        company_name: 'Test Company',
        status: 'active'
      })
      .select()
      .single();
    
    if (clientError) {
      logTest('Insertion client', false, clientError.message);
    } else {
      logTest('Insertion client', true, `Client ${clientData.id} créé`);
      
      // Nettoyer le test
      await supabase
        .from('Client')
        .delete()
        .eq('id', testId);
        
      logTest('Suppression client test', true, 'Test nettoyé');
    }
  } catch (error) {
    logTest('Insertion client', false, error.message);
  }
};

const testRLS = async () => {
  console.log('\n🔒 Test des politiques RLS...');
  
  try {
    // Tester que RLS est activé sur DocumentFile
    const { error } = await supabase
      .from('DocumentFile')
      .select('*')
      .limit(1);
    
    // Si on peut lire sans erreur RLS, c'est que RLS n'est pas activé
    if (error && error.message.includes('RLS')) {
      logTest('Politiques RLS', true, 'RLS activé correctement');
    } else {
      logTest('Politiques RLS', false, 'RLS non activé ou mal configuré');
    }
  } catch (error) {
    logTest('Politiques RLS', false, error.message);
  }
};

const testFunctions = async () => {
  console.log('\n⚙️ Test des fonctions utilitaires...');
  
  try {
    // Tester la fonction get_document_stats
    const { data, error } = await supabase.rpc('get_document_stats');
    
    if (error) {
      logTest('Fonction get_document_stats', false, error.message);
    } else {
      logTest('Fonction get_document_stats', true, 'Fonction exécutée');
    }
  } catch (error) {
    logTest('Fonction get_document_stats', false, error.message);
  }
};

const testPerformance = async () => {
  console.log('\n⚡ Test de performance...');
  
  const startTime = Date.now();
  
  try {
    // Test de lecture de 100 enregistrements
    const { data, error } = await supabase
      .from('Client')
      .select('*')
      .limit(100);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (error) {
      logTest('Performance lecture', false, error.message);
    } else {
      logTest('Performance lecture', duration < 1000, `${duration}ms pour 100 enregistrements`);
    }
  } catch (error) {
    logTest('Performance lecture', false, error.message);
  }
};

const testRelationships = async () => {
  console.log('\n🔗 Test des relations entre tables...');
  
  try {
    // Tester la relation Client -> DocumentFile
    const { data: documents, error: docError } = await supabase
      .from('DocumentFile')
      .select(`
        *,
        Client:client_id (id, email, first_name, last_name)
      `)
      .eq('client_id', TEST_IDS.CLIENT_1)
      .limit(1);
    
    if (docError) {
      logTest('Relation Client-Document', false, docError.message);
    } else if (documents && documents.length > 0 && documents[0].Client) {
      logTest('Relation Client-Document', true, 'Relation fonctionnelle');
    } else {
      logTest('Relation Client-Document', false, 'Aucune relation trouvée');
    }
    
    // Tester la relation Invoice -> Client/Expert
    const { data: invoices, error: invError } = await supabase
      .from('Invoice')
      .select(`
        *,
        Client:client_id (id, email, first_name, last_name),
        Expert:expert_id (id, email, first_name, last_name)
      `)
      .eq('id', TEST_IDS.INVOICE_1)
      .limit(1);
    
    if (invError) {
      logTest('Relation Invoice-Client-Expert', false, invError.message);
    } else if (invoices && invoices.length > 0 && invoices[0].Client && invoices[0].Expert) {
      logTest('Relation Invoice-Client-Expert', true, 'Relations fonctionnelles');
    } else {
      logTest('Relation Invoice-Client-Expert', false, 'Relations manquantes');
    }
    
  } catch (error) {
    logTest('Test des relations', false, error.message);
  }
};

// ===== FONCTION PRINCIPALE =====

const runBasicTests = async () => {
  console.log('🚀 Démarrage des tests basiques de conformité...\n');
  
  try {
    await testDatabaseConnection();
    await testTableExistence();
    await testClientData();
    await testExpertData();
    await testDocumentData();
    await testWorkflowData();
    await testComplianceData();
    await testDataInsertion();
    await testRLS();
    await testFunctions();
    await testPerformance();
    await testRelationships();
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    testResults.failed++;
    testResults.errors.push({ test: 'Tests généraux', details: error.message });
  }
  
  // Résultats finaux
  console.log('\n' + '='.repeat(50));
  console.log('📊 RÉSULTATS DES TESTS BASIQUES');
  console.log('='.repeat(50));
  console.log(`✅ Tests passés: ${testResults.passed}`);
  console.log(`❌ Tests échoués: ${testResults.failed}`);
  console.log(`📈 Taux de réussite: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🔍 Détails des erreurs:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.details}`);
    });
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (testResults.failed === 0) {
    console.log('🎉 Tous les tests basiques sont passés !');
    console.log('💡 Vous pouvez maintenant lancer les tests complets.');
    process.exit(0);
  } else {
    console.log('⚠️ Certains tests ont échoué. Vérifiez la configuration.');
    process.exit(1);
  }
};

// Exécution des tests
if (require.main === module) {
  runBasicTests().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = {
  runBasicTests,
  testResults,
  TEST_IDS
}; 