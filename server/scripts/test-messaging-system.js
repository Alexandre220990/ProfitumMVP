#!/usr/bin/env node

/**
 * Script de test pour le système de messagerie unifié
 * Teste toutes les routes de messagerie avec des données réelles
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration API
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

// Tokens de test (à remplacer par de vrais tokens)
const TEST_TOKENS = {
  client: process.env.TEST_CLIENT_TOKEN || 'test-client-token',
  expert: process.env.TEST_EXPERT_TOKEN || 'test-expert-token',
  admin: process.env.TEST_ADMIN_TOKEN || 'test-admin-token'
};

// Données de test
const TEST_DATA = {
  clientId: null,
  expertId: null,
  assignmentId: null,
  messageId: null
};

// Utilitaires
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${emoji} [${timestamp}] ${message}`);
};

const makeRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_TOKENS.client}`
    }
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.message || 'Erreur inconnue'}`);
    }
    
    return data;
  } catch (error) {
    log(`Erreur requête ${endpoint}: ${error.message}`, 'error');
    throw error;
  }
};

// Tests
const tests = {
  // Test 1: Vérifier la structure de la base de données
  async testDatabaseStructure() {
    log('Test 1: Vérification de la structure de la base de données');
    
    try {
      // Vérifier la table Message
      const { data: messageColumns, error: messageError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'Message')
        .eq('table_schema', 'public');

      if (messageError) throw messageError;

      const requiredColumns = [
        'id', 'assignment_id', 'sender_type', 'sender_id', 
        'recipient_type', 'recipient_id', 'content', 'message_type',
        'is_read', 'created_at', 'updated_at'
      ];

      const existingColumns = messageColumns.map(col => col.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

      if (missingColumns.length > 0) {
        throw new Error(`Colonnes manquantes: ${missingColumns.join(', ')}`);
      }

      log(`✅ Table Message: ${messageColumns.length} colonnes trouvées`, 'success');

      // Vérifier la table expertassignment
      const { data: assignmentColumns, error: assignmentError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'expertassignment')
        .eq('table_schema', 'public');

      if (assignmentError) throw assignmentError;

      log(`✅ Table expertassignment: ${assignmentColumns.length} colonnes trouvées`, 'success');

      return true;
    } catch (error) {
      log(`❌ Erreur structure DB: ${error.message}`, 'error');
      return false;
    }
  },

  // Test 2: Créer des données de test
  async createTestData() {
    log('Test 2: Création des données de test');
    
    try {
      // Créer un client de test
      const { data: client, error: clientError } = await supabase
        .from('Client')
        .insert({
          email: 'test-client-messaging@example.com',
          company_name: 'Entreprise Test Messaging',
          name: 'Jean Test',
          phone_number: '0123456789',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (clientError) throw clientError;
      TEST_DATA.clientId = client.id;
      log(`✅ Client créé: ${client.id}`, 'success');

      // Créer un expert de test
      const { data: expert, error: expertError } = await supabase
        .from('Expert')
        .insert({
          email: 'test-expert-messaging@example.com',
          name: 'Marie Test Expert',
          company_name: 'Cabinet Test Expert',
          specializations: ['TICPE', 'CEE'],
          status: 'active',
          approval_status: 'approved',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (expertError) throw expertError;
      TEST_DATA.expertId = expert.id;
      log(`✅ Expert créé: ${expert.id}`, 'success');

      // Créer un produit éligible de test
      const { data: produit, error: produitError } = await supabase
        .from('ProduitEligible')
        .insert({
          nom: 'Test TICPE Messaging',
          description: 'Produit de test pour la messagerie',
          categorie: 'TICPE',
          montant_min: 1000,
          montant_max: 50000,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (produitError) throw produitError;
      log(`✅ Produit créé: ${produit.id}`, 'success');

      // Créer un ClientProduitEligible de test
      const { data: clientProduit, error: clientProduitError } = await supabase
        .from('ClientProduitEligible')
        .insert({
          clientId: TEST_DATA.clientId,
          produitId: produit.id,
          statut: 'en_cours',
          montantFinal: 15000,
          tauxFinal: 2.5,
          dureeFinale: 60,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (clientProduitError) throw clientProduitError;
      log(`✅ ClientProduitEligible créé: ${clientProduit.id}`, 'success');

      // Créer une assignation de test
      const { data: assignment, error: assignmentError } = await supabase
        .from('expertassignment')
        .insert({
          expert_id: TEST_DATA.expertId,
          client_produit_eligible_id: clientProduit.id,
          status: 'active',
          assignment_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (assignmentError) throw assignmentError;
      TEST_DATA.assignmentId = assignment.id;
      log(`✅ Assignation créée: ${assignment.id}`, 'success');

      return true;
    } catch (error) {
      log(`❌ Erreur création données test: ${error.message}`, 'error');
      return false;
    }
  },

  // Test 3: Tester les routes de messagerie
  async testMessagingRoutes() {
    log('Test 3: Test des routes de messagerie');
    
    try {
      // Test 3.1: Récupérer les conversations
      log('Test 3.1: Récupération des conversations');
      const conversationsResponse = await makeRequest('/messaging/conversations');
      
      if (!conversationsResponse.success) {
        throw new Error('Échec récupération conversations');
      }
      
      log(`✅ Conversations récupérées: ${conversationsResponse.data.conversations.length}`, 'success');

      // Test 3.2: Envoyer un message
      log('Test 3.2: Envoi d\'un message');
      const messageResponse = await makeRequest(`/messaging/conversations/${TEST_DATA.assignmentId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: 'Bonjour, ceci est un message de test !',
          message_type: 'text'
        })
      });

      if (!messageResponse.success) {
        throw new Error('Échec envoi message');
      }

      TEST_DATA.messageId = messageResponse.data.id;
      log(`✅ Message envoyé: ${messageResponse.data.id}`, 'success');

      // Test 3.3: Récupérer les messages
      log('Test 3.3: Récupération des messages');
      const messagesResponse = await makeRequest(`/messaging/conversations/${TEST_DATA.assignmentId}/messages`);
      
      if (!messagesResponse.success) {
        throw new Error('Échec récupération messages');
      }
      
      log(`✅ Messages récupérés: ${messagesResponse.data.messages.length}`, 'success');

      // Test 3.4: Marquer un message comme lu
      log('Test 3.4: Marquage message comme lu');
      const readResponse = await makeRequest(`/messaging/messages/${TEST_DATA.messageId}/read`, {
        method: 'PUT'
      });

      if (!readResponse.success) {
        throw new Error('Échec marquage message');
      }
      
      log(`✅ Message marqué comme lu: ${readResponse.data.id}`, 'success');

      // Test 3.5: Compter les messages non lus
      log('Test 3.5: Comptage messages non lus');
      const unreadResponse = await makeRequest('/messaging/unread-count');
      
      if (!unreadResponse.success) {
        throw new Error('Échec comptage messages non lus');
      }
      
      log(`✅ Messages non lus: ${unreadResponse.data.unreadCount}`, 'success');

      return true;
    } catch (error) {
      log(`❌ Erreur routes messagerie: ${error.message}`, 'error');
      return false;
    }
  },

  // Test 4: Tester les permissions
  async testPermissions() {
    log('Test 4: Test des permissions');
    
    try {
      // Test 4.1: Tentative d'accès sans token
      log('Test 4.1: Accès sans authentification');
      try {
        await makeRequest('/messaging/conversations', {
          headers: { 'Authorization': '' }
        });
        throw new Error('Accès autorisé sans token (inattendu)');
      } catch (error) {
        if (error.message.includes('401')) {
          log('✅ Accès refusé sans token (correct)', 'success');
        } else {
          throw error;
        }
      }

      // Test 4.2: Tentative d'accès à une conversation d'un autre utilisateur
      log('Test 4.2: Accès à conversation d\'un autre utilisateur');
      try {
        await makeRequest(`/messaging/conversations/invalid-assignment-id/messages`);
        throw new Error('Accès autorisé à conversation invalide (inattendu)');
      } catch (error) {
        if (error.message.includes('404') || error.message.includes('403')) {
          log('✅ Accès refusé à conversation invalide (correct)', 'success');
        } else {
          throw error;
        }
      }

      return true;
    } catch (error) {
      log(`❌ Erreur permissions: ${error.message}`, 'error');
      return false;
    }
  },

  // Test 5: Nettoyer les données de test
  async cleanupTestData() {
    log('Test 5: Nettoyage des données de test');
    
    try {
      // Supprimer les messages de test
      if (TEST_DATA.assignmentId) {
        await supabase
          .from('Message')
          .delete()
          .eq('assignment_id', TEST_DATA.assignmentId);
        log('✅ Messages supprimés', 'success');
      }

      // Supprimer l'assignation de test
      if (TEST_DATA.assignmentId) {
        await supabase
          .from('expertassignment')
          .delete()
          .eq('id', TEST_DATA.assignmentId);
        log('✅ Assignation supprimée', 'success');
      }

      // Supprimer le ClientProduitEligible de test
      if (TEST_DATA.clientId) {
        await supabase
          .from('ClientProduitEligible')
          .delete()
          .eq('clientId', TEST_DATA.clientId);
        log('✅ ClientProduitEligible supprimé', 'success');
      }

      // Supprimer le produit de test
      await supabase
        .from('ProduitEligible')
        .delete()
        .eq('nom', 'Test TICPE Messaging');
      log('✅ Produit supprimé', 'success');

      // Supprimer l'expert de test
      if (TEST_DATA.expertId) {
        await supabase
          .from('Expert')
          .delete()
          .eq('id', TEST_DATA.expertId);
        log('✅ Expert supprimé', 'success');
      }

      // Supprimer le client de test
      if (TEST_DATA.clientId) {
        await supabase
          .from('Client')
          .delete()
          .eq('id', TEST_DATA.clientId);
        log('✅ Client supprimé', 'success');
      }

      return true;
    } catch (error) {
      log(`❌ Erreur nettoyage: ${error.message}`, 'error');
      return false;
    }
  }
};

// Fonction principale
async function runTests() {
  log('🚀 Démarrage des tests du système de messagerie', 'info');
  log('================================================', 'info');

  const results = {
    databaseStructure: false,
    testData: false,
    messagingRoutes: false,
    permissions: false,
    cleanup: false
  };

  try {
    // Exécuter les tests
    results.databaseStructure = await tests.testDatabaseStructure();
    if (!results.databaseStructure) {
      log('❌ Test structure DB échoué, arrêt des tests', 'error');
      return;
    }

    results.testData = await tests.createTestData();
    if (!results.testData) {
      log('❌ Test création données échoué, arrêt des tests', 'error');
      return;
    }

    results.messagingRoutes = await tests.testMessagingRoutes();
    results.permissions = await tests.testPermissions();
    results.cleanup = await tests.cleanupTestData();

    // Résumé
    log('================================================', 'info');
    log('📊 RÉSUMÉ DES TESTS', 'info');
    log('================================================', 'info');
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASSÉ' : '❌ ÉCHOUÉ';
      log(`${test}: ${status}`, passed ? 'success' : 'error');
    });

    const allPassed = Object.values(results).every(result => result);
    
    if (allPassed) {
      log('🎉 TOUS LES TESTS SONT PASSÉS !', 'success');
      log('✅ Le système de messagerie est fonctionnel', 'success');
    } else {
      log('❌ CERTAINS TESTS ONT ÉCHOUÉ', 'error');
      log('⚠️ Vérifiez les erreurs ci-dessus', 'warning');
    }

  } catch (error) {
    log(`❌ Erreur critique: ${error.message}`, 'error');
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { tests, runTests }; 