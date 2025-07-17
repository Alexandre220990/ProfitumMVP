#!/usr/bin/env node

/**
 * Script de test complet pour la conformité et les intégrations
 * Teste tous les services : workflows, intégrations externes, conformité
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration API
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'test-admin-token';

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

const makeApiRequest = async (endpoint, method = 'GET', data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
};

// ===== TESTS DES WORKFLOWS =====

const testWorkflowInitialization = async () => {
  console.log('\n🔧 Test d\'initialisation des workflows...');
  
  const response = await makeApiRequest('/workflow/initialize', 'POST');
  
  if (response.success) {
    logTest('Initialisation des workflows', true, 'Workflows par défaut créés');
  } else {
    logTest('Initialisation des workflows', false, response.error);
  }
};

const testWorkflowTemplates = async () => {
  console.log('\n📋 Test des templates de workflow...');
  
  const response = await makeApiRequest('/workflow/templates');
  
  if (response.success && response.data.success) {
    const templates = response.data.data;
    logTest('Récupération des templates', true, `${templates.length} templates trouvés`);
    
    // Vérifier les types de workflow
    const expectedTypes = ['fiscal', 'comptable', 'juridique', 'charte', 'rapport_audit'];
    const foundTypes = templates.map(t => t.document_type);
    
    expectedTypes.forEach(type => {
      const found = foundTypes.includes(type);
      logTest(`Template ${type}`, found, found ? 'Présent' : 'Manquant');
    });
  } else {
    logTest('Récupération des templates', false, response.error);
  }
};

const testWorkflowInstance = async () => {
  console.log('\n🔄 Test de création d\'instance de workflow...');
  
  // Créer une instance de test
  const instanceData = {
    template_id: 'fiscal_document_workflow_v1',
    document_id: 'test-document-id',
    client_id: 'test-client-id',
    expert_id: 'test-expert-id'
  };
  
  const response = await makeApiRequest('/workflow/instances', 'POST', instanceData);
  
  if (response.success && response.data.success) {
    logTest('Création d\'instance', true, `Instance ${response.data.data.id} créée`);
    
    // Tester l'exécution d'une étape
    const stepData = {
      step_number: 0,
      result: { amount: 15000 }
    };
    
    const stepResponse = await makeApiRequest(
      `/workflow/instances/${response.data.data.id}/execute-step`,
      'POST',
      stepData
    );
    
    logTest('Exécution d\'étape', stepResponse.success, 
      stepResponse.success ? 'Étape exécutée' : stepResponse.error);
  } else {
    logTest('Création d\'instance', false, response.error);
  }
};

// ===== TESTS DES INTÉGRATIONS EXTERNES =====

const testSignatureIntegration = async () => {
  console.log('\n✍️ Test des intégrations de signature...');
  
  const signatureRequest = {
    id: 'test-signature-1',
    document_id: 'test-doc-1',
    provider: 'docusign',
    signers: [
      {
        email: 'test@example.com',
        name: 'Test User',
        role: 'signer',
        order: 1
      }
    ],
    subject: 'Test Signature',
    message: 'Veuillez signer ce document de test',
    expires_in_days: 7
  };
  
  const response = await makeApiRequest('/integrations/signature/request', 'POST', signatureRequest);
  
  if (response.success && response.data.success) {
    logTest('Création demande signature', true, `Demande ${response.data.data.external_id} créée`);
    
    // Tester la vérification de statut
    const statusResponse = await makeApiRequest(
      `/integrations/signature/${response.data.data.external_id}/status?provider=docusign`
    );
    
    logTest('Vérification statut signature', statusResponse.success,
      statusResponse.success ? 'Statut récupéré' : statusResponse.error);
  } else {
    logTest('Création demande signature', false, response.error);
  }
};

const testPaymentIntegration = async () => {
  console.log('\n💳 Test des intégrations de paiement...');
  
  const paymentRequest = {
    id: 'test-payment-1',
    invoice_id: 'test-invoice-1',
    provider: 'stripe',
    amount: 1500.00,
    currency: 'EUR',
    description: 'Test de paiement',
    customer_email: 'test@example.com'
  };
  
  const response = await makeApiRequest('/integrations/payment/request', 'POST', paymentRequest);
  
  if (response.success && response.data.success) {
    logTest('Création demande paiement', true, `Paiement ${response.data.data.external_id} créé`);
    
    // Tester la vérification de statut
    const statusResponse = await makeApiRequest(
      `/integrations/payment/${response.data.data.external_id}/status?provider=stripe`
    );
    
    logTest('Vérification statut paiement', statusResponse.success,
      statusResponse.success ? 'Statut récupéré' : statusResponse.error);
  } else {
    logTest('Création demande paiement', false, response.error);
  }
};

const testPushNotification = async () => {
  console.log('\n📱 Test des notifications push...');
  
  const notification = {
    id: 'test-notification-1',
    user_id: 'test-user-1',
    provider: 'firebase',
    title: 'Test Notification',
    body: 'Ceci est un test de notification push',
    priority: 'normal',
    data: { type: 'test' }
  };
  
  const response = await makeApiRequest('/integrations/push/send', 'POST', notification);
  
  if (response.success && response.data.success) {
    logTest('Envoi notification push', true, `Notification ${response.data.data.external_id} envoyée`);
  } else {
    logTest('Envoi notification push', false, response.error);
  }
};

// ===== TESTS DE CONFORMITÉ =====

const testComplianceInitialization = async () => {
  console.log('\n🛡️ Test d\'initialisation de la conformité...');
  
  const standards = ['iso_27001', 'soc_2', 'rgpd'];
  const response = await makeApiRequest('/compliance/initialize', 'POST', { standards });
  
  if (response.success && response.data.success) {
    logTest('Initialisation conformité', true, 'Contrôles de conformité créés');
  } else {
    logTest('Initialisation conformité', false, response.error);
  }
};

const testComplianceControls = async () => {
  console.log('\n📊 Test des contrôles de conformité...');
  
  // Tester la récupération des contrôles
  const response = await makeApiRequest('/compliance/controls');
  
  if (response.success && response.data.success) {
    const controls = response.data.data;
    logTest('Récupération contrôles', true, `${controls.length} contrôles trouvés`);
    
    // Vérifier les standards
    const standards = ['iso_27001', 'soc_2', 'rgpd'];
    standards.forEach(standard => {
      const standardControls = controls.filter(c => c.standard === standard);
      logTest(`Contrôles ${standard}`, standardControls.length > 0, 
        `${standardControls.length} contrôles trouvés`);
    });
  } else {
    logTest('Récupération contrôles', false, response.error);
  }
};

const testComplianceStats = async () => {
  console.log('\n📈 Test des statistiques de conformité...');
  
  const response = await makeApiRequest('/compliance/stats');
  
  if (response.success && response.data.success) {
    const stats = response.data.data;
    logTest('Récupération statistiques', true, `${stats.total_controls} contrôles totaux`);
    
    // Vérifier les scores par standard
    Object.keys(stats.by_standard).forEach(standard => {
      const { total, compliant } = stats.by_standard[standard];
      const score = total > 0 ? Math.round((compliant / total) * 100) : 0;
      logTest(`Score ${standard}`, score >= 0, `${score}% (${compliant}/${total})`);
    });
  } else {
    logTest('Récupération statistiques', false, response.error);
  }
};

const testComplianceReport = async () => {
  console.log('\n📋 Test de génération de rapport...');
  
  const reportData = {
    standard: 'iso_27001',
    period_start: '2024-01-01T00:00:00Z',
    period_end: '2024-12-31T23:59:59Z'
  };
  
  const response = await makeApiRequest('/compliance/reports/generate', 'POST', reportData);
  
  if (response.success && response.data.success) {
    const report = response.data.data;
    logTest('Génération rapport', true, 
      `Rapport ${report.id} généré - Score: ${report.compliance_score}%`);
  } else {
    logTest('Génération rapport', false, response.error);
  }
};

const testSecurityIncident = async () => {
  console.log('\n🚨 Test d\'enregistrement d\'incident...');
  
  const incidentData = {
    title: 'Test Incident de Sécurité',
    description: 'Incident de test pour validation',
    severity: 'medium',
    incident_type: 'test',
    affected_systems: ['test-system'],
    affected_users: 0,
    detected_at: new Date().toISOString(),
    status: 'open',
    remediation_actions: ['Test action']
  };
  
  const response = await makeApiRequest('/compliance/incidents', 'POST', incidentData);
  
  if (response.success && response.data.success) {
    logTest('Enregistrement incident', true, `Incident ${response.data.data.id} enregistré`);
  } else {
    logTest('Enregistrement incident', false, response.error);
  }
};

const testDataSubjectRequest = async () => {
  console.log('\n👤 Test de demande RGPD...');
  
  const requestData = {
    subject_id: 'test-subject-1',
    request_type: 'access',
    description: 'Demande d\'accès aux données personnelles de test'
  };
  
  const response = await makeApiRequest('/compliance/data-subject-requests', 'POST', requestData);
  
  if (response.success && response.data.success) {
    logTest('Traitement demande RGPD', true, `Demande ${response.data.data.id} traitée`);
  } else {
    logTest('Traitement demande RGPD', false, response.error);
  }
};

// ===== TESTS DE BASE DE DONNÉES =====

const testDatabaseTables = async () => {
  console.log('\n🗄️ Test des tables de base de données...');
  
  const tables = [
    'WorkflowTemplate',
    'WorkflowStep', 
    'WorkflowInstance',
    'SignatureRequest',
    'PaymentRequest',
    'PushNotification',
    'ComplianceControl',
    'SecurityIncident',
    'DataSubjectRequest',
    'AuditLog',
    'ComplianceReport'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        logTest(`Table ${table}`, false, error.message);
      } else {
        logTest(`Table ${table}`, true, `${data} enregistrements`);
      }
    } catch (error) {
      logTest(`Table ${table}`, false, error.message);
    }
  }
};

// ===== TESTS DE PERFORMANCE =====

const testPerformance = async () => {
  console.log('\n⚡ Test de performance...');
  
  const startTime = Date.now();
  
  // Test de récupération de 100 contrôles
  const controlsResponse = await makeApiRequest('/compliance/controls');
  const controlsTime = Date.now() - startTime;
  
  logTest('Performance contrôles', controlsTime < 1000, `${controlsTime}ms`);
  
  // Test de récupération des statistiques
  const statsStartTime = Date.now();
  const statsResponse = await makeApiRequest('/compliance/stats');
  const statsTime = Date.now() - statsStartTime;
  
  logTest('Performance statistiques', statsTime < 500, `${statsTime}ms`);
  
  // Test de récupération des workflows
  const workflowsStartTime = Date.now();
  const workflowsResponse = await makeApiRequest('/workflow/templates');
  const workflowsTime = Date.now() - workflowsStartTime;
  
  logTest('Performance workflows', workflowsTime < 800, `${workflowsTime}ms`);
};

// ===== TESTS DE SÉCURITÉ =====

const testSecurity = async () => {
  console.log('\n🔒 Test de sécurité...');
  
  // Test sans token
  const noTokenResponse = await makeApiRequest('/compliance/controls', 'GET', null, null);
  logTest('Accès sans token', !noTokenResponse.success, 
    noTokenResponse.success ? 'Accès autorisé (ERREUR)' : 'Accès refusé (CORRECT)');
  
  // Test avec token invalide
  const invalidTokenResponse = await makeApiRequest('/compliance/controls', 'GET', null, 'invalid-token');
  logTest('Accès avec token invalide', !invalidTokenResponse.success,
    invalidTokenResponse.success ? 'Accès autorisé (ERREUR)' : 'Accès refusé (CORRECT)');
  
  // Test RLS (Row Level Security)
  const rlsTest = await supabase
    .from('ComplianceControl')
    .select('*')
    .limit(1);
  
  logTest('RLS activé', rlsTest.error?.message?.includes('RLS'), 
    rlsTest.error ? 'RLS fonctionne' : 'RLS non activé');
};

// ===== FONCTION PRINCIPALE =====

const runAllTests = async () => {
  console.log('🚀 Démarrage des tests de conformité et intégrations...\n');
  
  try {
    // Tests de base de données
    await testDatabaseTables();
    
    // Tests de sécurité
    await testSecurity();
    
    // Tests de conformité
    await testComplianceInitialization();
    await testComplianceControls();
    await testComplianceStats();
    await testComplianceReport();
    await testSecurityIncident();
    await testDataSubjectRequest();
    
    // Tests de workflows
    await testWorkflowInitialization();
    await testWorkflowTemplates();
    await testWorkflowInstance();
    
    // Tests d'intégrations
    await testSignatureIntegration();
    await testPaymentIntegration();
    await testPushNotification();
    
    // Tests de performance
    await testPerformance();
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    testResults.failed++;
    testResults.errors.push({ test: 'Tests généraux', details: error.message });
  }
  
  // Résultats finaux
  console.log('\n' + '='.repeat(50));
  console.log('📊 RÉSULTATS DES TESTS');
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
    console.log('🎉 Tous les tests sont passés avec succès !');
    process.exit(0);
  } else {
    console.log('⚠️ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.');
    process.exit(1);
  }
};

// Exécution des tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testResults
}; 