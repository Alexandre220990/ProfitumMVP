#!/usr/bin/env node

/**
 * 🧪 Script de Test Complet - Système de Simulation
 * 
 * Ce script teste le flux complet:
 * 1. Connexion client
 * 2. Création simulation
 * 3. Réponses aux questions
 * 4. Évaluation éligibilité
 * 5. Vérification ClientProduitEligible
 * 
 * Usage: node test-simulation-complete.js
 */

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(emoji, message, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function success(message) {
  log('✅', message, colors.green);
}

function error(message) {
  log('❌', message, colors.red);
}

function info(message) {
  log('ℹ️', message, colors.blue);
}

function warning(message) {
  log('⚠️', message, colors.yellow);
}

// ==============================================================================
// 1. CONNEXION CLIENT
// ==============================================================================

async function loginClient() {
  info('Connexion du client de test...');
  
  try {
    // Utiliser un client existant ou en créer un
    const testEmail = 'test-simulation@profitum.fr';
    const testPassword = 'TestSimulation2025!';
    
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        type: 'client'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      success(`Client connecté: ${data.user.username}`);
      return {
        token: data.token,
        userId: data.user.id,
        databaseId: data.user.database_id
      };
    } else {
      error(`Échec connexion: ${data.message}`);
      return null;
    }
  } catch (err) {
    error(`Erreur connexion: ${err.message}`);
    return null;
  }
}

// ==============================================================================
// 2. CRÉATION SIMULATION
// ==============================================================================

async function createSimulation(token, clientId) {
  info('Création de la simulation...');
  
  try {
    const response = await fetch(`${API_URL}/api/simulations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        clientId: clientId,
        statut: 'en_cours'
      })
    });
    
    const data = await response.json();
    
    if (data.success && data.data.simulation) {
      success(`Simulation créée: ID ${data.data.simulation.id}`);
      return data.data.simulation.id;
    } else {
      error(`Échec création simulation: ${data.message}`);
      return null;
    }
  } catch (err) {
    error(`Erreur création simulation: ${err.message}`);
    return null;
  }
}

// ==============================================================================
// 3. RÉCUPÉRATION DES QUESTIONS
// ==============================================================================

async function getQuestions(token) {
  info('Récupération des questions...');
  
  try {
    const response = await fetch(`${API_URL}/api/simulations/questions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (data.success && data.data) {
      success(`${data.data.length} questions récupérées`);
      return data.data;
    } else {
      error('Échec récupération questions');
      return [];
    }
  } catch (err) {
    error(`Erreur récupération questions: ${err.message}`);
    return [];
  }
}

// ==============================================================================
// 4. RÉPONSES DE TEST
// ==============================================================================

function generateTestAnswers(questions) {
  info('Génération des réponses de test...');
  
  // Réponses pour obtenir TICPE, URSSAF, DFS éligibles
  const answers = {
    // Secteur d'activité: Transport
    1: ['Transport'],
    
    // Chiffre d'affaires: Plus de 100 000€
    2: ['Plus de 500 000€'],
    
    // Contentieux fiscal: Aucun
    3: ['Aucun'],
    
    // Propriétaire locaux: Non (pour tester Foncier non éligible)
    4: ['Non'],
    
    // Factures énergétiques: Oui
    5: ['Oui'],
    
    // Véhicules professionnels: Oui
    6: ['Oui'],
    
    // Type de véhicules: Camions > 7,5T
    7: ['Camions de plus de 7,5 tonnes'],
    
    // Nombre d'employés
    8: ['10-50'],
    
    // Créances impayées: Non
    9: ['Non'],
  };
  
  success(`Réponses générées pour ${Object.keys(answers).length} questions`);
  return answers;
}

// ==============================================================================
// 5. ENVOI DES RÉPONSES
// ==============================================================================

async function saveAnswers(token, simulationId, answers) {
  info('Sauvegarde des réponses...');
  
  try {
    const response = await fetch(`${API_URL}/api/simulations/${simulationId}/answers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ answers })
    });
    
    const data = await response.json();
    
    if (data.success) {
      success('Réponses sauvegardées');
      return true;
    } else {
      error(`Échec sauvegarde réponses: ${data.message}`);
      return false;
    }
  } catch (err) {
    error(`Erreur sauvegarde réponses: ${err.message}`);
    return false;
  }
}

// ==============================================================================
// 6. TERMINER LA SIMULATION
// ==============================================================================

async function completeSimulation(token, simulationId) {
  info('Finalisation de la simulation...');
  
  try {
    const response = await fetch(`${API_URL}/api/simulations/${simulationId}/terminer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      success('Simulation terminée et traitée');
      return true;
    } else {
      error(`Échec finalisation: ${data.message}`);
      return false;
    }
  } catch (err) {
    error(`Erreur finalisation: ${err.message}`);
    return false;
  }
}

// ==============================================================================
// 7. VÉRIFICATION DES RÉSULTATS
// ==============================================================================

async function verifyResults(clientId, simulationId) {
  info('Vérification des ClientProduitEligible créés...');
  
  try {
    // Attendre 2 secondes pour laisser le temps au traitement
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: clientProduits, error: cpError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        statut,
        tauxFinal,
        montantFinal,
        dureeFinale,
        priorite,
        notes,
        metadata,
        ProduitEligible:produitId (
          nom,
          categorie
        )
      `)
      .eq('clientId', clientId)
      .eq('simulationId', simulationId)
      .order('priorite', { ascending: true });
    
    if (cpError) {
      error(`Erreur récupération résultats: ${cpError.message}`);
      return { eligible: [], nonEligible: [] };
    }
    
    const eligible = clientProduits.filter(cp => cp.statut === 'eligible');
    const nonEligible = clientProduits.filter(cp => cp.statut === 'non_eligible');
    
    console.log('\n' + '='.repeat(80));
    log('📊', 'RÉSULTATS DE LA SIMULATION', colors.bright);
    console.log('='.repeat(80));
    
    console.log(`\n${colors.green}✅ PRODUITS ÉLIGIBLES (${eligible.length})${colors.reset}`);
    console.log('-'.repeat(80));
    eligible.forEach((cp, index) => {
      console.log(`\n${index + 1}. ${colors.bright}${cp.ProduitEligible.nom}${colors.reset}`);
      console.log(`   📈 Gain estimé: ${colors.cyan}${cp.montantFinal?.toLocaleString() || 'N/A'}€${colors.reset}`);
      console.log(`   ⏱️  Durée: ${cp.dureeFinale || 'N/A'} mois`);
      console.log(`   ⭐ Priorité: ${cp.priorite}`);
      if (cp.metadata?.score) {
        console.log(`   💯 Score: ${(cp.metadata.score * 100).toFixed(1)}%`);
      }
    });
    
    console.log(`\n${colors.yellow}❌ PRODUITS NON ÉLIGIBLES (${nonEligible.length})${colors.reset}`);
    console.log('-'.repeat(80));
    nonEligible.forEach((cp, index) => {
      console.log(`${index + 1}. ${cp.ProduitEligible.nom}`);
    });
    
    console.log('\n' + '='.repeat(80));
    
    if (eligible.length > 0) {
      success(`${eligible.length} produits éligibles identifiés !`);
    } else {
      warning('Aucun produit éligible trouvé');
    }
    
    return { eligible, nonEligible };
    
  } catch (err) {
    error(`Erreur vérification résultats: ${err.message}`);
    return { eligible: [], nonEligible: [] };
  }
}

// ==============================================================================
// 8. VÉRIFICATION DE LA SIMULATION DANS LA BDD
// ==============================================================================

async function verifySimulationData(simulationId) {
  info('Vérification des données de simulation...');
  
  try {
    const { data: simulation, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', simulationId)
      .single();
    
    if (error) {
      error(`Erreur récupération simulation: ${error.message}`);
      return false;
    }
    
    console.log('\n📋 Détails de la simulation:');
    console.log(`   ID: ${simulation.id}`);
    console.log(`   Client: ${simulation.client_id}`);
    console.log(`   Status: ${simulation.status}`);
    console.log(`   Créée le: ${new Date(simulation.created_at).toLocaleString('fr-FR')}`);
    
    if (simulation.results) {
      console.log(`   Produits évalués: ${simulation.results.total_evaluated || 'N/A'}`);
      console.log(`   Produits éligibles: ${simulation.results.eligible_count || 'N/A'}`);
    }
    
    success('Données de simulation vérifiées');
    return true;
    
  } catch (err) {
    error(`Erreur vérification simulation: ${err.message}`);
    return false;
  }
}

// ==============================================================================
// FONCTION PRINCIPALE
// ==============================================================================

async function runTest() {
  console.log('\n' + '='.repeat(80));
  log('🧪', 'DÉMARRAGE DU TEST COMPLET DE SIMULATION', colors.bright);
  console.log('='.repeat(80) + '\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // 1. Connexion
    const auth = await loginClient();
    if (!auth) {
      error('Test arrêté: échec connexion');
      return;
    }
    testsPassed++;
    
    // 2. Création simulation
    const simulationId = await createSimulation(auth.token, auth.databaseId);
    if (!simulationId) {
      error('Test arrêté: échec création simulation');
      testsFailed++;
      return;
    }
    testsPassed++;
    
    // 3. Récupération questions
    const questions = await getQuestions(auth.token);
    if (questions.length === 0) {
      warning('Aucune question disponible');
    }
    testsPassed++;
    
    // 4. Génération réponses
    const answers = generateTestAnswers(questions);
    testsPassed++;
    
    // 5. Sauvegarde réponses
    const answersSaved = await saveAnswers(auth.token, simulationId, answers);
    if (!answersSaved) {
      error('Test arrêté: échec sauvegarde réponses');
      testsFailed++;
      return;
    }
    testsPassed++;
    
    // 6. Finalisation simulation
    const completed = await completeSimulation(auth.token, simulationId);
    if (!completed) {
      error('Test arrêté: échec finalisation');
      testsFailed++;
      return;
    }
    testsPassed++;
    
    // 7. Vérification données simulation
    await verifySimulationData(simulationId);
    testsPassed++;
    
    // 8. Vérification résultats
    const { eligible, nonEligible } = await verifyResults(auth.databaseId, simulationId);
    if (eligible.length > 0) {
      testsPassed++;
    } else {
      warning('Aucun produit éligible créé');
      testsFailed++;
    }
    
  } catch (err) {
    error(`Erreur inattendue: ${err.message}`);
    console.error(err);
    testsFailed++;
  }
  
  // Résumé final
  console.log('\n' + '='.repeat(80));
  log('📊', 'RÉSUMÉ DES TESTS', colors.bright);
  console.log('='.repeat(80));
  console.log(`${colors.green}✅ Tests réussis: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}❌ Tests échoués: ${testsFailed}${colors.reset}`);
  console.log('='.repeat(80) + '\n');
  
  if (testsFailed === 0) {
    success('🎉 TOUS LES TESTS SONT PASSÉS !');
  } else {
    error('⚠️  CERTAINS TESTS ONT ÉCHOUÉ');
  }
}

// Exécution
runTest()
  .then(() => {
    info('Test terminé');
    process.exit(0);
  })
  .catch(err => {
    error(`Erreur fatale: ${err.message}`);
    console.error(err);
    process.exit(1);
  });

