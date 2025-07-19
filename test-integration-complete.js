#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE TEST COMPLET - GOOGLE CALENDAR & MESSAGERIE
 * 
 * Ce script teste l'ensemble de l'intégration :
 * - Connexion à la base de données
 * - Services Google Calendar
 * - Services de messagerie
 * - Socket.IO
 * - API endpoints
 */

const { createClient } = require('@supabase/supabase-js');
const io = require('socket.io-client');

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const API_URL = process.env.API_URL || 'http://localhost:3000';
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3000';

// ============================================================================
// INITIALISATION
// ============================================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// TESTS DE BASE DE DONNÉES
// ============================================================================

async function testDatabaseConnection() {
  console.log('🔍 Test de connexion à la base de données...');
  
  try {
    const { data, error } = await supabase
      .from('Client')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Erreur connexion base de données:', error.message);
      return false;
    }
    
    console.log('✅ Connexion à la base de données réussie');
    return true;
  } catch (error) {
    console.log('❌ Erreur connexion base de données:', error.message);
    return false;
  }
}

async function testTablesExist() {
  console.log('🔍 Test de l\'existence des tables...');
  
  const requiredTables = [
    'GoogleCalendarIntegration',
    'GoogleCalendarEvent', 
    'GoogleCalendarSyncLog',
    'Conversation',
    'Message',
    'ConversationParticipant',
    'UserPresence'
  ];
  
  const results = {};
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
        results[table] = false;
      } else {
        console.log(`✅ Table ${table}: OK`);
        results[table] = true;
      }
    } catch (error) {
      console.log(`❌ Table ${table}: ${error.message}`);
      results[table] = false;
    }
  }
  
  return results;
}

// ============================================================================
// TESTS API
// ============================================================================

async function testAPIEndpoints() {
  console.log('🔍 Test des endpoints API...');
  
  const endpoints = [
    { path: '/api/health', method: 'GET', expectedStatus: 200 },
    { path: '/api/google-calendar/auth/url', method: 'GET', expectedStatus: 200 },
    { path: '/api/messaging/conversations', method: 'GET', expectedStatus: 401 }, // Non authentifié
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === endpoint.expectedStatus) {
        console.log(`✅ ${endpoint.method} ${endpoint.path}: ${response.status}`);
        results[endpoint.path] = true;
      } else {
        console.log(`⚠️  ${endpoint.method} ${endpoint.path}: ${response.status} (attendu ${endpoint.expectedStatus})`);
        results[endpoint.path] = false;
      }
    } catch (error) {
      console.log(`❌ ${endpoint.method} ${endpoint.path}: ${error.message}`);
      results[endpoint.path] = false;
    }
  }
  
  return results;
}

// ============================================================================
// TESTS SOCKET.IO
// ============================================================================

async function testSocketIO() {
  console.log('🔍 Test de Socket.IO...');
  
  return new Promise((resolve) => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
    });
    
    let connected = false;
    let authenticated = false;
    
    // Test de connexion
    socket.on('connect', () => {
      console.log('✅ Socket.IO connecté');
      connected = true;
      
      // Test d'authentification (sans token pour le test)
      socket.emit('authenticate', { token: 'test-token' });
    });
    
    socket.on('authenticated', () => {
      console.log('✅ Socket.IO authentifié');
      authenticated = true;
    });
    
    socket.on('connect_error', (error) => {
      console.log('❌ Erreur connexion Socket.IO:', error.message);
      resolve({ connected: false, authenticated: false });
    });
    
    socket.on('auth_error', (error) => {
      console.log('⚠️  Erreur authentification Socket.IO (normal sans token):', error.message);
      resolve({ connected, authenticated: false });
    });
    
    // Timeout pour le test
    setTimeout(() => {
      socket.disconnect();
      resolve({ connected, authenticated });
    }, 3000);
  });
}

// ============================================================================
// TESTS GOOGLE CALENDAR
// ============================================================================

async function testGoogleCalendarService() {
  console.log('🔍 Test du service Google Calendar...');
  
  try {
    // Test de l'URL d'authentification
    const response = await fetch(`${API_URL}/api/google-calendar/auth/url`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.authUrl && data.authUrl.includes('accounts.google.com')) {
        console.log('✅ Service Google Calendar: URL d\'authentification générée');
        return true;
      } else {
        console.log('❌ Service Google Calendar: URL d\'authentification invalide');
        return false;
      }
    } else {
      console.log('❌ Service Google Calendar: Erreur API');
      return false;
    }
  } catch (error) {
    console.log('❌ Service Google Calendar:', error.message);
    return false;
  }
}

// ============================================================================
// TESTS MESSAGERIE
// ============================================================================

async function testMessagingService() {
  console.log('🔍 Test du service de messagerie...');
  
  try {
    // Test de l'endpoint des conversations (sans authentification)
    const response = await fetch(`${API_URL}/api/messaging/conversations`);
    
    if (response.status === 401) {
      console.log('✅ Service Messagerie: Protection d\'authentification active');
      return true;
    } else {
      console.log('⚠️  Service Messagerie: Endpoint accessible sans authentification');
      return false;
    }
  } catch (error) {
    console.log('❌ Service Messagerie:', error.message);
    return false;
  }
}

// ============================================================================
// RAPPORT FINAL
// ============================================================================

async function generateReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RAPPORT DE TEST COMPLET');
  console.log('='.repeat(60));
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log(`\n🎯 Résultats globaux:`);
  console.log(`   • Tests effectués: ${totalTests}`);
  console.log(`   • Tests réussis: ${passedTests}`);
  console.log(`   • Taux de succès: ${successRate}%`);
  
  console.log(`\n📋 Détail des tests:`);
  for (const [test, result] of Object.entries(results)) {
    const status = result ? '✅' : '❌';
    console.log(`   ${status} ${test}`);
  }
  
  console.log(`\n🔧 Recommandations:`);
  if (successRate >= 90) {
    console.log('   • Excellent ! Le système est prêt pour la production.');
  } else if (successRate >= 70) {
    console.log('   • Bon ! Quelques ajustements mineurs nécessaires.');
  } else {
    console.log('   • Attention ! Des corrections importantes sont nécessaires.');
  }
  
  console.log('\n' + '='.repeat(60));
}

// ============================================================================
// EXÉCUTION PRINCIPALE
// ============================================================================

async function runAllTests() {
  console.log('🚀 DÉMARRAGE DES TESTS COMPLETS');
  console.log('='.repeat(60));
  
  const results = {};
  
  // Tests de base de données
  results['Connexion Base de données'] = await testDatabaseConnection();
  const tableResults = await testTablesExist();
  results['Tables requises'] = Object.values(tableResults).every(Boolean);
  
  // Tests API
  const apiResults = await testAPIEndpoints();
  results['Endpoints API'] = Object.values(apiResults).every(Boolean);
  
  // Tests Socket.IO
  const socketResults = await testSocketIO();
  results['Socket.IO'] = socketResults.connected;
  
  // Tests services
  results['Service Google Calendar'] = await testGoogleCalendarService();
  results['Service Messagerie'] = await testMessagingService();
  
  // Générer le rapport
  await generateReport(results);
  
  // Code de sortie
  const allPassed = Object.values(results).every(Boolean);
  process.exit(allPassed ? 0 : 1);
}

// ============================================================================
// GESTION DES ERREURS
// ============================================================================

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Erreur non gérée:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Exception non capturée:', error);
  process.exit(1);
});

// ============================================================================
// DÉMARRAGE
// ============================================================================

if (require.main === module) {
  runAllTests();
}

module.exports = {
  testDatabaseConnection,
  testTablesExist,
  testAPIEndpoints,
  testSocketIO,
  testGoogleCalendarService,
  testMessagingService,
  runAllTests
}; 