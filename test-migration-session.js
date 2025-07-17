#!/usr/bin/env node

/**
 * Script de test du process de migration session temporaire → compte client
 * ========================================================================
 * 
 * Ce script teste l'ensemble du processus de migration :
 * 1. Création d'une session temporaire
 * 2. Ajout de réponses au simulateur
 * 3. Calcul d'éligibilité
 * 4. Migration vers un compte client
 * 5. Vérification des données migrées
 */

const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5001';
const TEST_EMAIL = `test-migration-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

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

function logStep(step, description) {
  log(`\n${colors.bright}${colors.blue}=== ÉTAPE ${step} ===${colors.reset}`);
  log(`${colors.cyan}${description}${colors.reset}`);
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

class MigrationTester {
  constructor() {
    this.sessionToken = null;
    this.sessionId = null;
    this.clientId = null;
    this.testResults = {
      sessionCreated: false,
      responsesAdded: false,
      eligibilityCalculated: false,
      migrationCompleted: false,
      dataVerified: false
    };
  }

  async runTests() {
    log(`${colors.bright}${colors.magenta}🚀 DÉBUT DES TESTS DE MIGRATION SESSION → CLIENT${colors.reset}`, 'magenta');
    log(`📅 ${new Date().toISOString()}`, 'cyan');
    log(`🎯 Email de test: ${TEST_EMAIL}`, 'cyan');

    try {
      // Étape 1: Créer une session temporaire
      await this.createTemporarySession();

      // Étape 2: Ajouter des réponses au simulateur
      await this.addSimulatorResponses();

      // Étape 3: Calculer l'éligibilité
      await this.calculateEligibility();

      // Étape 4: Vérifier que la session peut être migrée
      await this.checkMigrationEligibility();

      // Étape 5: Récupérer les données de session
      await this.getSessionData();

      // Étape 6: Effectuer la migration
      await this.performMigration();

      // Étape 7: Vérifier les données migrées
      await this.verifyMigratedData();

      // Étape 8: Afficher le rapport final
      this.displayFinalReport();

    } catch (error) {
      logError(`Erreur lors des tests: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  }

  async createTemporarySession() {
    logStep(1, 'Création d\'une session temporaire');

    const sessionData = {
      email: TEST_EMAIL,
      company_name: 'Entreprise Test Migration',
      secteurActivite: 'Transport',
      nombreEmployes: 15,
      revenuAnnuel: 1200000,
      ancienneteEntreprise: 8
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/simulator/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(`Erreur création session: ${result.error}`);
      }

      this.sessionToken = result.data.session_token;
      this.sessionId = result.data.session_id;

      logSuccess(`Session créée avec succès`);
      logInfo(`Token: ${this.sessionToken.substring(0, 20)}...`);
      logInfo(`ID: ${this.sessionId}`);

      this.testResults.sessionCreated = true;

    } catch (error) {
      logError(`Échec création session: ${error.message}`);
      throw error;
    }
  }

  async addSimulatorResponses() {
    logStep(2, 'Ajout de réponses au simulateur');

    // Récupérer les questions disponibles
    try {
      const questionsResponse = await fetch(`${API_BASE_URL}/api/simulator/questions`);
      const questionsResult = await questionsResponse.json();

      if (!questionsResult.success) {
        throw new Error(`Erreur récupération questions: ${questionsResult.error}`);
      }

      const questions = questionsResult.data;
      logInfo(`${questions.length} questions récupérées`);

      // Réponses de test pour un transporteur
      const testResponses = [
        { question_id: 'secteur_activite', response_value: 'Transport de marchandises' },
        { question_id: 'nombre_employes', response_value: '5 à 20 employés' },
        { question_id: 'chiffre_affaires', response_value: 'Entre 500k€ et 2M€' },
        { question_id: 'vehicules_lourds', response_value: 'Oui, véhicules lourds' },
        { question_id: 'carburant_consommation', response_value: 'Plus de 50 000L/an' },
        { question_id: 'contrats_urssaf', response_value: 'Oui' },
        { question_id: 'exonerations_sociales', response_value: 'Oui (exonérations ZFU, JEI, CIR, etc.)' },
        { question_id: 'locaux_proprietaire', response_value: 'Oui' },
        { question_id: 'contrats_speciaux', response_value: 'Oui' }
      ];

      // Envoyer les réponses
      for (const response of testResponses) {
        const responseData = {
          session_token: this.sessionToken,
          question_id: response.question_id,
          response_value: response.response_value
        };

        const responseResult = await fetch(`${API_BASE_URL}/api/simulator/response`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(responseData)
        });

        const result = await responseResult.json();

        if (!result.success) {
          logWarning(`Réponse ${response.question_id} non traitée: ${result.error}`);
        }
      }

      logSuccess(`${testResponses.length} réponses ajoutées`);
      this.testResults.responsesAdded = true;

    } catch (error) {
      logError(`Échec ajout réponses: ${error.message}`);
      throw error;
    }
  }

  async calculateEligibility() {
    logStep(3, 'Calcul de l\'éligibilité');

    try {
      const response = await fetch(`${API_BASE_URL}/api/simulator/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_token: this.sessionToken
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(`Erreur calcul éligibilité: ${result.error}`);
      }

      const eligibilityResults = result.data.eligibility_results;
      const totalSavings = eligibilityResults.reduce((sum, r) => sum + r.estimated_savings, 0);

      logSuccess(`Éligibilité calculée avec succès`);
      logInfo(`${eligibilityResults.length} produits analysés`);
      logInfo(`Économies totales: ${totalSavings.toLocaleString('fr-FR')}€`);
      
      // Afficher les résultats détaillés
      eligibilityResults.forEach(result => {
        const status = result.eligibility_score >= 70 ? '🟢' : result.eligibility_score >= 50 ? '🟡' : '🔴';
        log(`${status} ${result.produit_id}: ${result.eligibility_score}% - ${result.estimated_savings.toLocaleString('fr-FR')}€`);
      });

      this.testResults.eligibilityCalculated = true;

    } catch (error) {
      logError(`Échec calcul éligibilité: ${error.message}`);
      throw error;
    }
  }

  async checkMigrationEligibility() {
    logStep(4, 'Vérification de l\'éligibilité à la migration');

    try {
      const response = await fetch(`${API_BASE_URL}/api/session-migration/can-migrate/${this.sessionToken}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(`Erreur vérification migration: ${result.error}`);
      }

      if (result.can_migrate) {
        logSuccess('Session éligible à la migration');
      } else {
        throw new Error('Session non éligible à la migration');
      }

    } catch (error) {
      logError(`Échec vérification migration: ${error.message}`);
      throw error;
    }
  }

  async getSessionData() {
    logStep(5, 'Récupération des données de session');

    try {
      const response = await fetch(`${API_BASE_URL}/api/session-migration/session-data/${this.sessionToken}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(`Erreur récupération données: ${result.error}`);
      }

      const data = result.data;
      logSuccess('Données de session récupérées');
      logInfo(`Réponses: ${data.responses.length}`);
      logInfo(`Résultats éligibilité: ${data.eligibility_results.length}`);
      logInfo(`Données client extraites: ${Object.keys(data.extracted_client_data).length} champs`);

      // Afficher les données extraites
      log('📋 Données client extraites:');
      Object.entries(data.extracted_client_data).forEach(([key, value]) => {
        log(`   - ${key}: ${value}`);
      });

    } catch (error) {
      logError(`Échec récupération données: ${error.message}`);
      throw error;
    }
  }

  async performMigration() {
    logStep(6, 'Migration vers compte client');

    const migrationData = {
      sessionToken: this.sessionToken,
      sessionId: this.sessionToken,
      clientData: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        username: 'TestMigration',
        company_name: 'Entreprise Test Migration',
        phone_number: '0123456789',
        address: '123 Rue de Test',
        city: 'Paris',
        postal_code: '75001',
        siren: '123456789'
      }
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/session-migration/migrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(migrationData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(`Erreur migration: ${result.error}`);
      }

      this.clientId = result.data.client_id;
      const clientProduitEligibles = result.data.client_produit_eligibles;

      logSuccess('Migration réussie');
      logInfo(`Client ID: ${this.clientId}`);
      logInfo(`Produits éligibles créés: ${clientProduitEligibles?.length || 0}`);

      // Afficher les détails de migration
      const details = result.data.migration_details;
      log('📊 Détails de migration:');
      Object.entries(details).forEach(([key, value]) => {
        const status = value ? '✅' : '❌';
        log(`   ${status} ${key}: ${value}`);
      });

      this.testResults.migrationCompleted = true;

    } catch (error) {
      logError(`Échec migration: ${error.message}`);
      throw error;
    }
  }

  async verifyMigratedData() {
    logStep(7, 'Vérification des données migrées');

    try {
      // Vérifier que le client existe
      const clientResponse = await fetch(`${API_BASE_URL}/api/clients/${this.clientId}`);
      const clientResult = await clientResponse.json();

      if (!clientResult.success) {
        throw new Error(`Client non trouvé: ${clientResult.error}`);
      }

      const client = clientResult.data;
      logSuccess('Client vérifié');
      logInfo(`Email: ${client.email}`);
      logInfo(`Entreprise: ${client.company_name}`);
      logInfo(`SIREN: ${client.siren}`);

      // Vérifier les produits éligibles
      const cpeResponse = await fetch(`${API_BASE_URL}/api/clients/${this.clientId}/produits-eligibles`);
      const cpeResult = await cpeResponse.json();

      if (cpeResult.success) {
        const produitsEligibles = cpeResult.data;
        logSuccess('Produits éligibles vérifiés');
        logInfo(`${produitsEligibles.length} produits éligibles trouvés`);

        produitsEligibles.forEach(cpe => {
          const status = cpe.statut === 'eligible' ? '🟢' : '🟡';
          log(`${status} ${cpe.produit_nom}: ${cpe.statut} - ${cpe.montantFinal?.toLocaleString('fr-FR') || 0}€`);
        });
      }

      // Vérifier les sessions migrées
      const migrationsResponse = await fetch(`${API_BASE_URL}/api/session-migration/client/${this.clientId}/migrations`);
      const migrationsResult = await migrationsResponse.json();

      if (migrationsResult.success) {
        const migrations = migrationsResult.data.migrated_sessions;
        logSuccess('Sessions migrées vérifiées');
        logInfo(`${migrations.length} session(s) migrée(s)`);
      }

      this.testResults.dataVerified = true;

    } catch (error) {
      logError(`Échec vérification données: ${error.message}`);
      throw error;
    }
  }

  displayFinalReport() {
    logStep(8, 'Rapport final');

    const totalSteps = Object.keys(this.testResults).length;
    const successfulSteps = Object.values(this.testResults).filter(Boolean).length;
    const successRate = (successfulSteps / totalSteps) * 100;

    log(`${colors.bright}${colors.magenta}📊 RÉSULTATS DES TESTS${colors.reset}`, 'magenta');
    log(`🎯 Taux de réussite: ${successRate.toFixed(1)}% (${successfulSteps}/${totalSteps})`, successRate === 100 ? 'green' : 'yellow');

    log('\n📋 Détail des étapes:');
    Object.entries(this.testResults).forEach(([step, success]) => {
      const status = success ? '✅' : '❌';
      const color = success ? 'green' : 'red';
      log(`   ${status} ${step}: ${success ? 'Succès' : 'Échec'}`, color);
    });

    if (successRate === 100) {
      log('\n🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !', 'green');
      log('✅ Le process de migration session → client fonctionne parfaitement', 'green');
    } else {
      log('\n⚠️ CERTAINS TESTS ONT ÉCHOUÉ', 'yellow');
      log('🔧 Vérifiez les erreurs ci-dessus et corrigez les problèmes', 'yellow');
    }

    log('\n📈 Statistiques:');
    log(`   - Session créée: ${this.sessionToken ? 'Oui' : 'Non'}`);
    log(`   - Client créé: ${this.clientId ? 'Oui' : 'Non'}`);
    log(`   - Email de test: ${TEST_EMAIL}`);
    log(`   - Client ID: ${this.clientId || 'N/A'}`);

    log('\n🧹 Nettoyage:');
    log('   Pour nettoyer les données de test, supprimez le client créé dans l\'interface admin');
  }
}

// Fonction principale
async function main() {
  try {
    const tester = new MigrationTester();
    await tester.runTests();
  } catch (error) {
    logError(`Erreur fatale: ${error.message}`);
    process.exit(1);
  }
}

// Exécution si le script est appelé directement
if (require.main === module) {
  main();
}

module.exports = MigrationTester; 