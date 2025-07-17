#!/usr/bin/env node

/**
 * Script de nettoyage des données de test de migration
 * ===================================================
 * 
 * Ce script supprime les données de test créées lors des tests de migration :
 * - Sessions temporaires
 * - Clients de test
 * - Produits éligibles de test
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5001';
const TEST_EMAIL_PATTERN = /test-migration-\d+@example\.com/;

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

class MigrationCleaner {
  constructor() {
    this.cleanedItems = {
      sessions: 0,
      clients: 0,
      clientProduitEligibles: 0,
      simulations: 0
    };
  }

  async cleanup() {
    log(`${colors.bright}${colors.magenta}🧹 NETTOYAGE DES DONNÉES DE TEST DE MIGRATION${colors.reset}`, 'magenta');
    log(`📅 ${new Date().toISOString()}`, 'cyan');

    try {
      // 1. Nettoyer les sessions temporaires
      await this.cleanupTemporarySessions();

      // 2. Nettoyer les clients de test
      await this.cleanupTestClients();

      // 3. Nettoyer les simulations de test
      await this.cleanupTestSimulations();

      // 4. Afficher le rapport de nettoyage
      this.displayCleanupReport();

    } catch (error) {
      logError(`Erreur lors du nettoyage: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  }

  async cleanupTemporarySessions() {
    log('\n🔍 Recherche des sessions temporaires de test...');

    try {
      // Récupérer toutes les sessions temporaires
      const response = await fetch(`${API_BASE_URL}/api/simulator/sessions`);
      const result = await response.json();

      if (!result.success) {
        logWarning('Impossible de récupérer les sessions temporaires');
        return;
      }

      const sessions = result.data || [];
      const testSessions = sessions.filter(session => 
        session.email && TEST_EMAIL_PATTERN.test(session.email)
      );

      logInfo(`${testSessions.length} session(s) de test trouvée(s)`);

      // Supprimer les sessions de test
      for (const session of testSessions) {
        try {
          const deleteResponse = await fetch(`${API_BASE_URL}/api/simulator/session/${session.id}`, {
            method: 'DELETE'
          });

          if (deleteResponse.ok) {
            this.cleanedItems.sessions++;
            logSuccess(`Session ${session.id} supprimée`);
          } else {
            logWarning(`Impossible de supprimer la session ${session.id}`);
          }
        } catch (error) {
          logWarning(`Erreur suppression session ${session.id}: ${error.message}`);
        }
      }

    } catch (error) {
      logError(`Erreur nettoyage sessions: ${error.message}`);
    }
  }

  async cleanupTestClients() {
    log('\n🔍 Recherche des clients de test...');

    try {
      // Récupérer tous les clients
      const response = await fetch(`${API_BASE_URL}/api/clients`);
      const result = await response.json();

      if (!result.success) {
        logWarning('Impossible de récupérer les clients');
        return;
      }

      const clients = result.data || [];
      const testClients = clients.filter(client => 
        client.email && TEST_EMAIL_PATTERN.test(client.email)
      );

      logInfo(`${testClients.length} client(s) de test trouvé(s)`);

      // Supprimer les clients de test et leurs données associées
      for (const client of testClients) {
        try {
          // 1. Supprimer les ClientProduitEligible
          const cpeResponse = await fetch(`${API_BASE_URL}/api/clients/${client.id}/produits-eligibles`);
          const cpeResult = await cpeResponse.json();

          if (cpeResult.success) {
            const produitsEligibles = cpeResult.data || [];
            for (const cpe of produitsEligibles) {
              const deleteCpeResponse = await fetch(`${API_BASE_URL}/api/client-produit-eligible/${cpe.id}`, {
                method: 'DELETE'
              });

              if (deleteCpeResponse.ok) {
                this.cleanedItems.clientProduitEligibles++;
              }
            }
            logInfo(`${produitsEligibles.length} produit(s) éligible(s) supprimé(s) pour le client ${client.id}`);
          }

          // 2. Supprimer le client
          const deleteClientResponse = await fetch(`${API_BASE_URL}/api/clients/${client.id}`, {
            method: 'DELETE'
          });

          if (deleteClientResponse.ok) {
            this.cleanedItems.clients++;
            logSuccess(`Client ${client.id} (${client.email}) supprimé`);
          } else {
            logWarning(`Impossible de supprimer le client ${client.id}`);
          }

        } catch (error) {
          logWarning(`Erreur suppression client ${client.id}: ${error.message}`);
        }
      }

    } catch (error) {
      logError(`Erreur nettoyage clients: ${error.message}`);
    }
  }

  async cleanupTestSimulations() {
    log('\n🔍 Recherche des simulations de test...');

    try {
      // Récupérer toutes les simulations
      const response = await fetch(`${API_BASE_URL}/api/simulations`);
      const result = await response.json();

      if (!result.success) {
        logWarning('Impossible de récupérer les simulations');
        return;
      }

      const simulations = result.data || [];
      const testSimulations = simulations.filter(simulation => 
        simulation.source === 'simulator_migration' || 
        simulation.metadata?.test === true
      );

      logInfo(`${testSimulations.length} simulation(s) de test trouvée(s)`);

      // Supprimer les simulations de test
      for (const simulation of testSimulations) {
        try {
          const deleteResponse = await fetch(`${API_BASE_URL}/api/simulations/${simulation.id}`, {
            method: 'DELETE'
          });

          if (deleteResponse.ok) {
            this.cleanedItems.simulations++;
            logSuccess(`Simulation ${simulation.id} supprimée`);
          } else {
            logWarning(`Impossible de supprimer la simulation ${simulation.id}`);
          }
        } catch (error) {
          logWarning(`Erreur suppression simulation ${simulation.id}: ${error.message}`);
        }
      }

    } catch (error) {
      logError(`Erreur nettoyage simulations: ${error.message}`);
    }
  }

  displayCleanupReport() {
    log(`\n${colors.bright}${colors.magenta}📊 RAPPORT DE NETTOYAGE${colors.reset}`, 'magenta');

    const totalCleaned = Object.values(this.cleanedItems).reduce((sum, count) => sum + count, 0);

    if (totalCleaned === 0) {
      log('✨ Aucune donnée de test trouvée à nettoyer', 'green');
    } else {
      log(`🧹 ${totalCleaned} élément(s) nettoyé(s):`, 'cyan');
      log(`   - Sessions temporaires: ${this.cleanedItems.sessions}`);
      log(`   - Clients: ${this.cleanedItems.clients}`);
      log(`   - Produits éligibles: ${this.cleanedItems.clientProduitEligibles}`);
      log(`   - Simulations: ${this.cleanedItems.simulations}`);
    }

    log('\n✅ Nettoyage terminé', 'green');
  }
}

// Fonction principale
async function main() {
  try {
    const cleaner = new MigrationCleaner();
    await cleaner.cleanup();
  } catch (error) {
    logError(`Erreur fatale: ${error.message}`);
    process.exit(1);
  }
}

// Exécution si le script est appelé directement
if (require.main === module) {
  main();
}

module.exports = MigrationCleaner; 