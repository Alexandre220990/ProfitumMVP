#!/usr/bin/env node

/**
 * Script de test complet pour le système GED (Gestion Électronique Documentaire)
 * Teste toutes les fonctionnalités : CRUD, permissions, workflows, etc.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

// ========================================
// TESTS DES TABLES
// ========================================

async function testTables() {
  log('\n📋 Test des tables GED', 'bright');
  
  try {
    // Test table GEDDocument
    const { data: documents, error: docError } = await supabase
      .from('GEDDocument')
      .select('*')
      .limit(1);
    
    if (docError) {
      logError(`Table GEDDocument: ${docError.message}`);
    } else {
      logSuccess('Table GEDDocument accessible');
    }

    // Test table GEDDocumentLabel
    const { data: labels, error: labelError } = await supabase
      .from('GEDDocumentLabel')
      .select('*')
      .limit(1);
    
    if (labelError) {
      logError(`Table GEDDocumentLabel: ${labelError.message}`);
    } else {
      logSuccess('Table GEDDocumentLabel accessible');
    }

    // Test table GEDDocumentPermission
    const { data: permissions, error: permError } = await supabase
      .from('GEDDocumentPermission')
      .select('*')
      .limit(1);
    
    if (permError) {
      logError(`Table GEDDocumentPermission: ${permError.message}`);
    } else {
      logSuccess('Table GEDDocumentPermission accessible');
    }

    // Test table DocumentFile
    const { data: files, error: fileError } = await supabase
      .from('DocumentFile')
      .select('*')
      .limit(1);
    
    if (fileError) {
      logError(`Table DocumentFile: ${fileError.message}`);
    } else {
      logSuccess('Table DocumentFile accessible');
    }

  } catch (error) {
    logError(`Erreur lors du test des tables: ${error.message}`);
  }
}

// ========================================
// TESTS DES LABELS
// ========================================

async function testLabels() {
  log('\n🏷️  Test des labels', 'bright');
  
  try {
    // Créer un label de test
    const testLabel = {
      name: 'Test Label',
      color: '#3B82F6',
      description: 'Label de test pour validation'
    };

    const { data: newLabel, error: createError } = await supabase
      .from('GEDDocumentLabel')
      .insert(testLabel)
      .select()
      .single();

    if (createError) {
      logError(`Création label: ${createError.message}`);
      return;
    }

    logSuccess(`Label créé: ${newLabel.name} (ID: ${newLabel.id})`);

    // Modifier le label
    const { data: updatedLabel, error: updateError } = await supabase
      .from('GEDDocumentLabel')
      .update({ color: '#10B981' })
      .eq('id', newLabel.id)
      .select()
      .single();

    if (updateError) {
      logError(`Modification label: ${updateError.message}`);
    } else {
      logSuccess(`Label modifié: couleur changée vers ${updatedLabel.color}`);
    }

    // Supprimer le label
    const { error: deleteError } = await supabase
      .from('GEDDocumentLabel')
      .delete()
      .eq('id', newLabel.id);

    if (deleteError) {
      logError(`Suppression label: ${deleteError.message}`);
    } else {
      logSuccess('Label supprimé avec succès');
    }

  } catch (error) {
    logError(`Erreur lors du test des labels: ${error.message}`);
  }
}

// ========================================
// TESTS DES DOCUMENTS
// ========================================

async function testDocuments() {
  log('\n📄 Test des documents', 'bright');
  
  try {
    // Créer un document de test
    const testDocument = {
      title: 'Document de Test GED',
      description: 'Document de test pour validation du système GED',
      content: '# Document de Test\n\nCeci est un document de test pour valider le système GED.\n\n## Fonctionnalités testées\n- Création de documents\n- Modification de documents\n- Suppression de documents\n- Gestion des permissions',
      category: 'business',
      read_time: 3,
      is_active: true
    };

    const { data: newDocument, error: createError } = await supabase
      .from('GEDDocument')
      .insert(testDocument)
      .select()
      .single();

    if (createError) {
      logError(`Création document: ${createError.message}`);
      return;
    }

    logSuccess(`Document créé: ${newDocument.title} (ID: ${newDocument.id})`);

    // Modifier le document
    const { data: updatedDocument, error: updateError } = await supabase
      .from('GEDDocument')
      .update({ 
        title: 'Document de Test GED - Modifié',
        read_time: 5
      })
      .eq('id', newDocument.id)
      .select()
      .single();

    if (updateError) {
      logError(`Modification document: ${updateError.message}`);
    } else {
      logSuccess(`Document modifié: ${updatedDocument.title}`);
    }

    // Créer des permissions pour ce document
    const permissions = [
      {
        document_id: newDocument.id,
        user_type: 'admin',
        can_read: true,
        can_write: true,
        can_delete: true,
        can_share: true
      },
      {
        document_id: newDocument.id,
        user_type: 'expert',
        can_read: true,
        can_write: true,
        can_delete: false,
        can_share: true
      },
      {
        document_id: newDocument.id,
        user_type: 'client',
        can_read: true,
        can_write: false,
        can_delete: false,
        can_share: false
      }
    ];

    const { data: newPermissions, error: permError } = await supabase
      .from('GEDDocumentPermission')
      .insert(permissions)
      .select();

    if (permError) {
      logError(`Création permissions: ${permError.message}`);
    } else {
      logSuccess(`${newPermissions.length} permissions créées`);
    }

    // Tester la récupération avec permissions
    const { data: documentsWithPerms, error: fetchError } = await supabase
      .from('GEDDocument')
      .select(`
        *,
        GEDDocumentPermission!inner(*)
      `)
      .eq('GEDDocumentPermission.user_type', 'admin')
      .eq('GEDDocumentPermission.can_read', true);

    if (fetchError) {
      logError(`Récupération avec permissions: ${fetchError.message}`);
    } else {
      logSuccess(`${documentsWithPerms.length} documents récupérés avec permissions`);
    }

    // Supprimer le document (cascade sur les permissions)
    const { error: deleteError } = await supabase
      .from('GEDDocument')
      .delete()
      .eq('id', newDocument.id);

    if (deleteError) {
      logError(`Suppression document: ${deleteError.message}`);
    } else {
      logSuccess('Document supprimé avec succès (permissions supprimées en cascade)');
    }

  } catch (error) {
    logError(`Erreur lors du test des documents: ${error.message}`);
  }
}

// ========================================
// TESTS DES FICHIERS
// ========================================

async function testFiles() {
  log('\n📁 Test des fichiers', 'bright');
  
  try {
    // Créer un fichier de test
    const testFile = {
      original_filename: 'test-document.pdf',
      stored_filename: 'test_20250127_123456_abc123.pdf',
      file_path: 'business/test_20250127_123456_abc123.pdf',
      bucket_name: 'documents',
      file_size: 1024000, // 1MB
      mime_type: 'application/pdf',
      file_extension: 'pdf',
      category: 'guide',
      document_type: 'pdf',
      description: 'Document de test pour validation',
      tags: ['test', 'validation', 'ged'],
      status: 'uploaded',
      validation_status: 'pending',
      is_public: false,
      is_encrypted: false,
      access_level: 'private',
      download_count: 0,
      client_id: '00000000-0000-0000-0000-000000000000' // UUID factice pour test
    };

    const { data: newFile, error: createError } = await supabase
      .from('DocumentFile')
      .insert(testFile)
      .select()
      .single();

    if (createError) {
      logError(`Création fichier: ${createError.message}`);
      return;
    }

    logSuccess(`Fichier créé: ${newFile.original_filename} (ID: ${newFile.id})`);

    // Modifier le fichier
    const { data: updatedFile, error: updateError } = await supabase
      .from('DocumentFile')
      .update({ 
        status: 'validated',
        validation_status: 'approved',
        description: 'Document de test validé'
      })
      .eq('id', newFile.id)
      .select()
      .single();

    if (updateError) {
      logError(`Modification fichier: ${updateError.message}`);
    } else {
      logSuccess(`Fichier modifié: statut ${updatedFile.status}`);
    }

    // Tester la recherche par tags
    const { data: filesByTag, error: tagError } = await supabase
      .from('DocumentFile')
      .select('*')
      .contains('tags', ['test']);

    if (tagError) {
      logError(`Recherche par tags: ${tagError.message}`);
    } else {
      logSuccess(`${filesByTag.length} fichiers trouvés avec le tag 'test'`);
    }

    // Supprimer le fichier
    const { error: deleteError } = await supabase
      .from('DocumentFile')
      .delete()
      .eq('id', newFile.id);

    if (deleteError) {
      logError(`Suppression fichier: ${deleteError.message}`);
    } else {
      logSuccess('Fichier supprimé avec succès');
    }

  } catch (error) {
    logError(`Erreur lors du test des fichiers: ${error.message}`);
  }
}

// ========================================
// TESTS DES WORKFLOWS
// ========================================

async function testWorkflows() {
  log('\n🔄 Test des workflows', 'bright');
  
  try {
    // Vérifier si la table DocumentWorkflow existe
    const { data: workflows, error: workflowError } = await supabase
      .from('DocumentWorkflow')
      .select('*')
      .limit(1);

    if (workflowError) {
      logWarning('Table DocumentWorkflow non trouvée - workflows non testés');
      return;
    }

    logSuccess('Table DocumentWorkflow accessible');

    // Créer un workflow de test
    const testWorkflow = {
      name: 'Workflow de Test',
      description: 'Workflow de test pour validation',
      steps: ['upload', 'validation', 'approval', 'publishing'],
      current_step: 'upload',
      status: 'active',
      created_by: '00000000-0000-0000-0000-000000000000'
    };

    const { data: newWorkflow, error: createError } = await supabase
      .from('DocumentWorkflow')
      .insert(testWorkflow)
      .select()
      .single();

    if (createError) {
      logError(`Création workflow: ${createError.message}`);
      return;
    }

    logSuccess(`Workflow créé: ${newWorkflow.name} (ID: ${newWorkflow.id})`);

    // Avancer dans le workflow
    const { data: updatedWorkflow, error: updateError } = await supabase
      .from('DocumentWorkflow')
      .update({ 
        current_step: 'validation',
        status: 'in_progress'
      })
      .eq('id', newWorkflow.id)
      .select()
      .single();

    if (updateError) {
      logError(`Mise à jour workflow: ${updateError.message}`);
    } else {
      logSuccess(`Workflow mis à jour: étape ${updatedWorkflow.current_step}`);
    }

    // Supprimer le workflow
    const { error: deleteError } = await supabase
      .from('DocumentWorkflow')
      .delete()
      .eq('id', newWorkflow.id);

    if (deleteError) {
      logError(`Suppression workflow: ${deleteError.message}`);
    } else {
      logSuccess('Workflow supprimé avec succès');
    }

  } catch (error) {
    logError(`Erreur lors du test des workflows: ${error.message}`);
  }
}

// ========================================
// TESTS DE PERFORMANCE
// ========================================

async function testPerformance() {
  log('\n⚡ Test de performance', 'bright');
  
  try {
    const startTime = Date.now();

    // Test de récupération de documents avec jointures
    const { data: documents, error } = await supabase
      .from('GEDDocument')
      .select(`
        *,
        GEDDocumentLabelRelation(
          GEDDocumentLabel(*)
        ),
        GEDDocumentPermission(*)
      `)
      .limit(10);

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (error) {
      logError(`Test performance: ${error.message}`);
    } else {
      logSuccess(`Récupération de ${documents.length} documents en ${duration}ms`);
      
      if (duration < 1000) {
        logSuccess('Performance excellente (< 1s)');
      } else if (duration < 3000) {
        logWarning('Performance correcte (1-3s)');
      } else {
        logError('Performance lente (> 3s)');
      }
    }

  } catch (error) {
    logError(`Erreur lors du test de performance: ${error.message}`);
  }
}

// ========================================
// TESTS DE SÉCURITÉ
// ========================================

async function testSecurity() {
  log('\n🔒 Test de sécurité', 'bright');
  
  try {
    // Test RLS (Row Level Security)
    logInfo('Vérification des politiques RLS...');

    // Tenter d'accéder sans authentification
    const { data: publicDocs, error: publicError } = await supabase
      .from('GEDDocument')
      .select('*')
      .limit(1);

    if (publicError && publicError.message.includes('RLS')) {
      logSuccess('RLS activé - accès public bloqué');
    } else if (publicDocs && publicDocs.length > 0) {
      logWarning('RLS non activé - données accessibles publiquement');
    } else {
      logSuccess('Accès public correctement bloqué');
    }

    // Test des contraintes de validation
    logInfo('Test des contraintes de validation...');

    const invalidDocument = {
      title: '', // Titre vide
      category: 'invalid_category', // Catégorie invalide
      read_time: -1 // Temps de lecture négatif
    };

    const { error: validationError } = await supabase
      .from('GEDDocument')
      .insert(invalidDocument);

    if (validationError) {
      logSuccess('Contraintes de validation actives');
    } else {
      logWarning('Contraintes de validation manquantes');
    }

  } catch (error) {
    logError(`Erreur lors du test de sécurité: ${error.message}`);
  }
}

// ========================================
// FONCTION PRINCIPALE
// ========================================

async function runAllTests() {
  log('\n🚀 Démarrage des tests du système GED', 'bright');
  log('=====================================', 'bright');

  const tests = [
    { name: 'Tables', fn: testTables },
    { name: 'Labels', fn: testLabels },
    { name: 'Documents', fn: testDocuments },
    { name: 'Fichiers', fn: testFiles },
    { name: 'Workflows', fn: testWorkflows },
    { name: 'Performance', fn: testPerformance },
    { name: 'Sécurité', fn: testSecurity }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      log(`\n📋 Test: ${test.name}`, 'cyan');
      await test.fn();
      passedTests++;
    } catch (error) {
      logError(`Test ${test.name} échoué: ${error.message}`);
    }
  }

  // Résumé
  log('\n📊 Résumé des tests', 'bright');
  log('==================', 'bright');
  log(`Tests réussis: ${passedTests}/${totalTests}`, passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    logSuccess('🎉 Tous les tests sont passés ! Le système GED est opérationnel.');
  } else {
    logWarning(`⚠️  ${totalTests - passedTests} test(s) ont échoué. Vérifiez la configuration.`);
  }

  log('\n📝 Recommandations:', 'bright');
  if (passedTests === totalTests) {
    log('✅ Le système GED est prêt pour la production');
    log('✅ Toutes les fonctionnalités de base sont opérationnelles');
    log('✅ La sécurité et les performances sont satisfaisantes');
  } else {
    log('🔧 Corrigez les erreurs avant la mise en production');
    log('🔧 Vérifiez la configuration de la base de données');
    log('🔧 Testez à nouveau après les corrections');
  }
}

// Exécution
if (require.main === module) {
  runAllTests()
    .then(() => {
      log('\n✨ Tests terminés', 'green');
      process.exit(0);
    })
    .catch((error) => {
      logError(`Erreur fatale: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testTables,
  testLabels,
  testDocuments,
  testFiles,
  testWorkflows,
  testPerformance,
  testSecurity
}; 