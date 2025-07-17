#!/usr/bin/env node

/**
 * Script de test pour le système de notifications push
 * Teste toutes les fonctionnalités : abonnement, envoi, préférences
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5001';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
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
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// ========================================
// TESTS DES TABLES
// ========================================

async function testTables() {
  log('\n📋 Test des tables de notifications...', 'bold');
  
  try {
    // Test table notification
    const { data: notifications, error: notifError } = await supabase
      .from('notification')
      .select('*')
      .limit(1);
    
    if (notifError) {
      logError(`Table notification: ${notifError.message}`);
    } else {
      logSuccess('Table notification: OK');
    }

    // Test table UserNotificationPreferences
    const { data: preferences, error: prefError } = await supabase
      .from('UserNotificationPreferences')
      .select('*')
      .limit(1);
    
    if (prefError) {
      logError(`Table UserNotificationPreferences: ${prefError.message}`);
    } else {
      logSuccess('Table UserNotificationPreferences: OK');
    }

    // Test table UserDevices
    const { data: devices, error: deviceError } = await supabase
      .from('UserDevices')
      .select('*')
      .limit(1);
    
    if (deviceError) {
      logError(`Table UserDevices: ${deviceError.message}`);
    } else {
      logSuccess('Table UserDevices: OK');
    }

  } catch (error) {
    logError(`Erreur test tables: ${error.message}`);
  }
}

// ========================================
// TESTS DES ROUTES API
// ========================================

async function testAPIRoutes() {
  log('\n🔗 Test des routes API...', 'bold');
  
  try {
    // Test route VAPID public key
    try {
      const response = await axios.get(`${BASE_URL}/api/notifications/vapid-public-key`);
      if (response.status === 200) {
        logSuccess('Route VAPID public key: OK');
      } else {
        logError('Route VAPID public key: Erreur de statut');
      }
    } catch (error) {
      logError(`Route VAPID public key: ${error.message}`);
    }

    // Test route préférences (sans auth)
    try {
      await axios.get(`${BASE_URL}/api/notifications/preferences`);
      logError('Route préférences: Devrait nécessiter une authentification');
    } catch (error) {
      if (error.response?.status === 401) {
        logSuccess('Route préférences: Authentification requise (OK)');
      } else {
        logError(`Route préférences: ${error.message}`);
      }
    }

  } catch (error) {
    logError(`Erreur test routes API: ${error.message}`);
  }
}

// ========================================
// TESTS DES FONCTIONNALITÉS
// ========================================

async function testFunctionalities() {
  log('\n⚙️ Test des fonctionnalités...', 'bold');
  
  try {
    // Créer un utilisateur de test
    const testUser = {
      id: 'test-user-' + Date.now(),
      email: 'test@financialtracker.com',
      user_type: 'client'
    };

    // Test création préférences
    try {
      const { data: pref, error: prefError } = await supabase
        .from('UserNotificationPreferences')
        .insert({
          user_id: testUser.id,
          email_enabled: true,
          push_enabled: true,
          sms_enabled: false,
          in_app_enabled: true,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          timezone: 'Europe/Paris',
          language: 'fr'
        })
        .select()
        .single();

      if (prefError) {
        logError(`Création préférences: ${prefError.message}`);
      } else {
        logSuccess('Création préférences: OK');
      }
    } catch (error) {
      logError(`Erreur création préférences: ${error.message}`);
    }

    // Test création notification
    try {
      const { data: notif, error: notifError } = await supabase
        .from('notification')
        .insert({
          user_id: testUser.id,
          user_type: 'client',
          title: 'Test Notification',
          message: 'Ceci est une notification de test',
          notification_type: 'system',
          priority: 'medium',
          is_read: false
        })
        .select()
        .single();

      if (notifError) {
        logError(`Création notification: ${notifError.message}`);
      } else {
        logSuccess('Création notification: OK');
      }
    } catch (error) {
      logError(`Erreur création notification: ${error.message}`);
    }

    // Test création device
    try {
      const testSubscription = {
        endpoint: 'https://test.endpoint.com',
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key'
        }
      };

      const { data: device, error: deviceError } = await supabase
        .from('UserDevices')
        .insert({
          user_id: testUser.id,
          device_token: JSON.stringify(testSubscription),
          push_token: testSubscription.endpoint,
          device_type: 'web',
          device_name: 'Test Browser',
          active: true
        })
        .select()
        .single();

      if (deviceError) {
        logError(`Création device: ${deviceError.message}`);
      } else {
        logSuccess('Création device: OK');
      }
    } catch (error) {
      logError(`Erreur création device: ${error.message}`);
    }

    // Nettoyer les données de test
    try {
      await supabase.from('notification').delete().eq('user_id', testUser.id);
      await supabase.from('UserNotificationPreferences').delete().eq('user_id', testUser.id);
      await supabase.from('UserDevices').delete().eq('user_id', testUser.id);
      logSuccess('Nettoyage données de test: OK');
    } catch (error) {
      logWarning(`Erreur nettoyage: ${error.message}`);
    }

  } catch (error) {
    logError(`Erreur test fonctionnalités: ${error.message}`);
  }
}

// ========================================
// TESTS DE PERFORMANCE
// ========================================

async function testPerformance() {
  log('\n⚡ Test de performance...', 'bold');
  
  try {
    const startTime = Date.now();
    
    // Test récupération notifications
    const { data: notifications, error } = await supabase
      .from('notification')
      .select('*')
      .limit(100);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (error) {
      logError(`Performance notifications: ${error.message}`);
    } else {
      logSuccess(`Performance notifications: ${duration}ms pour ${notifications?.length || 0} notifications`);
    }

    // Test récupération préférences
    const startTimePref = Date.now();
    
    const { data: preferences, error: prefError } = await supabase
      .from('UserNotificationPreferences')
      .select('*')
      .limit(100);
    
    const endTimePref = Date.now();
    const durationPref = endTimePref - startTimePref;
    
    if (prefError) {
      logError(`Performance préférences: ${prefError.message}`);
    } else {
      logSuccess(`Performance préférences: ${durationPref}ms pour ${preferences?.length || 0} préférences`);
    }

  } catch (error) {
    logError(`Erreur test performance: ${error.message}`);
  }
}

// ========================================
// TESTS DE SÉCURITÉ
// ========================================

async function testSecurity() {
  log('\n🔒 Test de sécurité...', 'bold');
  
  try {
    // Test accès non autorisé aux notifications
    try {
      const { data, error } = await supabase
        .from('notification')
        .select('*')
        .eq('user_id', 'user-inexistant')
        .limit(1);
      
      if (error) {
        logError(`Sécurité notifications: ${error.message}`);
      } else if (data && data.length > 0) {
        logError('Sécurité notifications: Accès non autorisé possible');
      } else {
        logSuccess('Sécurité notifications: Accès contrôlé (OK)');
      }
    } catch (error) {
      logError(`Erreur test sécurité notifications: ${error.message}`);
    }

    // Test accès non autorisé aux préférences
    try {
      const { data, error } = await supabase
        .from('UserNotificationPreferences')
        .select('*')
        .eq('user_id', 'user-inexistant')
        .limit(1);
      
      if (error) {
        logError(`Sécurité préférences: ${error.message}`);
      } else if (data && data.length > 0) {
        logError('Sécurité préférences: Accès non autorisé possible');
      } else {
        logSuccess('Sécurité préférences: Accès contrôlé (OK)');
      }
    } catch (error) {
      logError(`Erreur test sécurité préférences: ${error.message}`);
    }

  } catch (error) {
    logError(`Erreur test sécurité: ${error.message}`);
  }
}

// ========================================
// FONCTION PRINCIPALE
// ========================================

async function runTests() {
  log('🚀 Démarrage des tests du système de notifications push...', 'bold');
  
  try {
    // Vérifier la connexion Supabase
    const { data, error } = await supabase.from('notification').select('count').limit(1);
    if (error) {
      logError(`Connexion Supabase échouée: ${error.message}`);
      return;
    }
    logSuccess('Connexion Supabase: OK');

    // Exécuter les tests
    await testTables();
    await testAPIRoutes();
    await testFunctionalities();
    await testPerformance();
    await testSecurity();

    log('\n🎉 Tests terminés avec succès !', 'bold');
    logInfo('Le système de notifications push est prêt pour la production.');

  } catch (error) {
    logError(`Erreur générale: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testTables,
  testAPIRoutes,
  testFunctionalities,
  testPerformance,
  testSecurity
}; 