/**
 * Cron job pour vérifier et envoyer les rappels SLA
 * pour les documents en attente de validation
 * Exécution : Toutes les heures à la minute 30
 */

import cron from 'node-cron';
import { DocumentValidationReminderService } from '../services/document-validation-reminder-service';

/**
 * Exécuter la vérification des rappels SLA documents
 */
async function checkDocumentValidationReminders() {
  try {
    console.log('⏰ [CRON] Démarrage vérification rappels SLA documents à valider');
    await DocumentValidationReminderService.checkAndSendReminders();
  } catch (error) {
    console.error('❌ [CRON] Erreur vérification rappels SLA documents:', error);
  }
}

/**
 * Démarrer le cron job
 * Exécution : Toutes les heures à la minute 30 (timezone Europe/Paris)
 */
export function startDocumentValidationRemindersCron() {
  // Cron expression: 30 * * * * = Toutes les heures à :30
  cron.schedule('30 * * * *', async () => {
    console.log('⏰ [CRON] Trigger vérification rappels SLA documents à valider');
    await checkDocumentValidationReminders();
  }, {
    timezone: 'Europe/Paris'
  });

  console.log('✅ Cron job rappels SLA documents activé (toutes les heures à :30)');

  // Vérifier si on doit exécuter immédiatement (si redémarrage et on est à une minute proche de :30)
  const now = new Date();
  const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const currentMinute = parisTime.getMinutes();

  // Si on démarre entre :25 et :35, exécuter immédiatement (rattrapage)
  if (currentMinute >= 25 && currentMinute <= 35) {
    console.log('🔄 [CRON] Redémarrage détecté proche de :30 - Exécution immédiate du check documents');
    // Exécuter avec un petit délai pour laisser le serveur finir de démarrer
    setTimeout(async () => {
      await checkDocumentValidationReminders();
    }, 5000); // 5 secondes de délai
  }
}

/**
 * Exécution manuelle (pour tests)
 */
export async function checkDocumentValidationRemindersNow() {
  console.log('🧪 Exécution manuelle checkDocumentValidationReminders');
  await checkDocumentValidationReminders();
}

