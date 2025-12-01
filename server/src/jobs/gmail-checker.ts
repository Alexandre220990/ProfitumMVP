/**
 * Job automatique pour vérifier les réponses Gmail
 * Exécuté toutes les heures
 */

import cron from 'node-cron';
import { GmailService } from '../services/GmailService';

let isRunning = false;

/**
 * Vérifier les réponses Gmail
 */
async function checkGmailReplies() {
  if (isRunning) {
    console.log('⏭️  Vérification Gmail déjà en cours, skip...');
    return;
  }

  try {
    isRunning = true;
    console.log('🔍 [CRON] Vérification automatique des réponses Gmail...');
    
    // Vérifier les réponses des dernières 24h
    const sinceDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const result = await GmailService.fetchNewReplies(sinceDate);
    
    console.log(`✅ [CRON] Vérification terminée:`);
    console.log(`   - ${result.processed} email(s) traité(s)`);
    console.log(`   - ${result.updated} réponse(s) détectée(s) et mise(s) à jour`);
    
    if (result.errors.length > 0) {
      console.error(`   - ${result.errors.length} erreur(s):`);
      result.errors.forEach((error, index) => {
        console.error(`     ${index + 1}. ${error}`);
      });
    }
  } catch (error: any) {
    console.error('❌ [CRON] Erreur lors de la vérification Gmail:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Démarrer le job automatique
 */
export function startGmailCheckerJob() {
  // Vérifier toutes les heures à la minute 0
  // Format: minute heure jour mois jour-semaine
  // '0 * * * *' = toutes les heures à la minute 0
  const cronExpression = process.env.GMAIL_CHECK_CRON || '0 * * * *';
  
  console.log(`📅 [CRON] Job vérification Gmail programmé: ${cronExpression}`);
  console.log('   (Exécution toutes les heures)');
  
  // Exécuter immédiatement au démarrage (optionnel)
  if (process.env.GMAIL_CHECK_ON_STARTUP === 'true') {
    console.log('🚀 [CRON] Exécution immédiate au démarrage...');
    checkGmailReplies();
  }
  
  // Programmer l'exécution récurrente
  cron.schedule(cronExpression, checkGmailReplies, {
    timezone: 'Europe/Paris'
  });
  
  console.log('✅ [CRON] Job vérification Gmail démarré');
}

/**
 * Arrêter le job automatique
 */
export function stopGmailCheckerJob() {
  // Les jobs cron ne peuvent pas être arrêtés individuellement
  // Cette fonction est là pour la cohérence de l'API
  console.log('⏹️  [CRON] Arrêt du job vérification Gmail demandé');
}

