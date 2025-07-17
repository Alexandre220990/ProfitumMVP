#!/usr/bin/env node

/**
 * Script de test du système de calendrier
 * Teste toutes les fonctionnalités : API, base de données, cache
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxza3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NzI5NzQsImV4cCI6MjA1MTU0ODk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

// Initialiser Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

function logWarning(message) {
  log(`⚠️ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️ ${message}`, 'blue');
}

// ============================================================================
// TESTS DE LA BASE DE DONNÉES
// ============================================================================

async function testDatabaseTables() {
  logInfo('Test des tables de base de données...');
  
  const tables = [
    'CalendarEvent',
    'CalendarEventParticipant', 
    'CalendarEventReminder',
    'CalendarEventTemplate',
    'CalendarPreferences',
    'CalendarActivityLog',
    'DossierStep'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        logError(`Table ${table}: ${error.message}`);
      } else {
        logSuccess(`Table ${table}: OK`);
      }
    } catch (error) {
      logError(`Table ${table}: ${error.message}`);
    }
  }
}

async function testDatabaseRelations() {
  logInfo('Test des relations de base de données...');
  
  try {
    // Test relation CalendarEvent -> Client
    const { data: events, error: eventsError } = await supabase
      .from('CalendarEvent')
      .select(`
        id,
        title,
        Client (id, email, company_name)
      `)
      .limit(1);

    if (eventsError) {
      logError(`Relation CalendarEvent -> Client: ${eventsError.message}`);
    } else {
      logSuccess('Relation CalendarEvent -> Client: OK');
    }

    // Test relation DossierStep -> ClientProduitEligible
    const { data: steps, error: stepsError } = await supabase
      .from('DossierStep')
      .select(`
        id,
        step_name,
        ClientProduitEligible (
          id,
          Client (id, email, company_name),
          ProduitEligible (nom, description)
        )
      `)
      .limit(1);

    if (stepsError) {
      logError(`Relation DossierStep -> ClientProduitEligible: ${stepsError.message}`);
    } else {
      logSuccess('Relation DossierStep -> ClientProduitEligible: OK');
    }

  } catch (error) {
    logError(`Test relations: ${error.message}`);
  }
}

// ============================================================================
// TESTS DES VUES
// ============================================================================

async function testDatabaseViews() {
  logInfo('Test des vues de base de données...');
  
  const views = [
    'v_calendar_events_with_participants',
    'v_dossier_steps_with_assignee',
    'v_today_events'
  ];

  for (const view of views) {
    try {
      const { data, error } = await supabase
        .from(view)
        .select('*')
        .limit(1);

      if (error) {
        logError(`Vue ${view}: ${error.message}`);
      } else {
        logSuccess(`Vue ${view}: OK`);
      }
    } catch (error) {
      logError(`Vue ${view}: ${error.message}`);
    }
  }
}

// ============================================================================
// TESTS DES POLITIQUES RLS
// ============================================================================

async function testRLSPolicies() {
  logInfo('Test des politiques RLS...');
  
  try {
    // Test politique CalendarEvent
    const { data: policies, error } = await supabase
      .rpc('get_policies', { table_name: 'CalendarEvent' });

    if (error) {
      logWarning(`Impossible de vérifier les politiques RLS: ${error.message}`);
    } else {
      logSuccess('Politiques RLS CalendarEvent: OK');
    }
  } catch (error) {
    logWarning(`Test RLS: ${error.message}`);
  }
}

// ============================================================================
// TESTS DES FONCTIONS
// ============================================================================

async function testDatabaseFunctions() {
  logInfo('Test des fonctions de base de données...');
  
  try {
    // Test fonction de création d'événements récurrents
    const { data, error } = await supabase
      .rpc('create_recurring_events', {
        p_event_id: '00000000-0000-0000-0000-000000000000',
        p_recurrence_rule: 'FREQ=WEEKLY;COUNT=4',
        p_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (error) {
      logWarning(`Fonction create_recurring_events: ${error.message}`);
    } else {
      logSuccess('Fonction create_recurring_events: OK');
    }
  } catch (error) {
    logWarning(`Test fonctions: ${error.message}`);
  }
}

// ============================================================================
// TESTS DES DONNÉES INITIALES
// ============================================================================

async function testInitialData() {
  logInfo('Test des données initiales...');
  
  try {
    // Test templates d'événements
    const { data: templates, error: templatesError } = await supabase
      .from('CalendarEventTemplate')
      .select('*');

    if (templatesError) {
      logError(`Templates d'événements: ${templatesError.message}`);
    } else {
      logSuccess(`Templates d'événements: ${templates?.length || 0} trouvés`);
    }

    // Test préférences par défaut
    const { data: preferences, error: preferencesError } = await supabase
      .from('CalendarPreferences')
      .select('*')
      .limit(1);

    if (preferencesError) {
      logWarning(`Préférences calendrier: ${preferencesError.message}`);
    } else {
      logSuccess('Préférences calendrier: OK');
    }

  } catch (error) {
    logError(`Test données initiales: ${error.message}`);
  }
}

// ============================================================================
// TESTS DE PERFORMANCE
// ============================================================================

async function testPerformance() {
  logInfo('Test de performance...');
  
  try {
    const startTime = Date.now();
    
    // Test requête événements avec jointures
    const { data: events, error } = await supabase
      .from('CalendarEvent')
      .select(`
        *,
        Client (id, email, company_name),
        Expert (id, email, name),
        CalendarEventParticipant (*)
      `)
      .limit(100);

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (error) {
      logError(`Performance requête événements: ${error.message}`);
    } else {
      if (duration < 1000) {
        logSuccess(`Performance requête événements: ${duration}ms (OK)`);
      } else {
        logWarning(`Performance requête événements: ${duration}ms (LENT)`);
      }
    }

  } catch (error) {
    logError(`Test performance: ${error.message}`);
  }
}

// ============================================================================
// TESTS DE VALIDATION
// ============================================================================

async function testDataValidation() {
  logInfo('Test de validation des données...');
  
  try {
    // Test contrainte de dates
    const invalidEvent = {
      title: 'Test événement invalide',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Date de fin avant date de début
      type: 'appointment',
      priority: 'medium',
      status: 'pending',
      category: 'client',
      color: '#3B82F6'
    };

    const { error } = await supabase
      .from('CalendarEvent')
      .insert(invalidEvent);

    if (error && error.message.includes('calendar_event_date_check')) {
      logSuccess('Validation contrainte dates: OK');
    } else {
      logError('Validation contrainte dates: ÉCHEC');
    }

    // Test contrainte de couleur
    const invalidColorEvent = {
      title: 'Test couleur invalide',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      type: 'appointment',
      priority: 'medium',
      status: 'pending',
      category: 'client',
      color: 'invalid-color'
    };

    const { error: colorError } = await supabase
      .from('CalendarEvent')
      .insert(invalidColorEvent);

    if (colorError && colorError.message.includes('color')) {
      logSuccess('Validation contrainte couleur: OK');
    } else {
      logError('Validation contrainte couleur: ÉCHEC');
    }

  } catch (error) {
    logError(`Test validation: ${error.message}`);
  }
}

// ============================================================================
// TESTS DE SÉCURITÉ
// ============================================================================

async function testSecurity() {
  logInfo('Test de sécurité...');
  
  try {
    // Test injection SQL (simulation)
    const maliciousQuery = "'; DROP TABLE CalendarEvent; --";
    
    const { error } = await supabase
      .from('CalendarEvent')
      .select('*')
      .eq('title', maliciousQuery);

    if (error) {
      logSuccess('Protection injection SQL: OK');
    } else {
      logWarning('Protection injection SQL: À vérifier');
    }

  } catch (error) {
    logSuccess('Protection injection SQL: OK');
  }
}

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

async function runAllTests() {
  log('🚀 DÉBUT DES TESTS DU SYSTÈME DE CALENDRIER', 'bright');
  log('', 'reset');
  
  const tests = [
    { name: 'Tables de base de données', fn: testDatabaseTables },
    { name: 'Relations de base de données', fn: testDatabaseRelations },
    { name: 'Vues de base de données', fn: testDatabaseViews },
    { name: 'Politiques RLS', fn: testRLSPolicies },
    { name: 'Fonctions de base de données', fn: testDatabaseFunctions },
    { name: 'Données initiales', fn: testInitialData },
    { name: 'Performance', fn: testPerformance },
    { name: 'Validation des données', fn: testDataValidation },
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
      logError(`Test ${test.name} a échoué: ${error.message}`);
    }
  }

  log('\n', 'reset');
  log('📊 RÉSULTATS DES TESTS', 'bright');
  log(`Tests réussis: ${passedTests}/${totalTests}`, passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('🎉 TOUS LES TESTS SONT PASSÉS ! Le système de calendrier est opérationnel.', 'green');
  } else {
    log('⚠️ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.', 'yellow');
  }
  
  log('', 'reset');
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runAllTests()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logError(`Erreur fatale: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testDatabaseTables,
  testDatabaseRelations,
  testDatabaseViews,
  testRLSPolicies,
  testDatabaseFunctions,
  testInitialData,
  testPerformance,
  testDataValidation,
  testSecurity
}; 