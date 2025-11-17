import cron from 'node-cron';
import { ActionTypeReminderService } from '../services/action-type-reminder-service';

const reminderService = new ActionTypeReminderService();

/**
 * Vérifier et envoyer les relances basées sur les actionType
 */
async function checkActionTypeReminders() {
  try {
    console.log('⏰ [CRON] Démarrage vérification relances actionType');
    await reminderService.checkAndSendReminders();
  } catch (error) {
    console.error('❌ [CRON] Erreur vérification relances actionType:', error);
  }
}

/**
 * Démarrer le cron job
 * Exécution : Tous les jours à 9h (avant les heures de bureau)
 */
export function startActionTypeRemindersCron() {
  // Cron expression: 0 9 * * * = Tous les jours à 9h
  cron.schedule('0 9 * * *', async () => {
    await checkActionTypeReminders();
  }, {
    timezone: 'Europe/Paris'
  });

  console.log('✅ Cron job relances actionType activé (tous les jours à 9h)');
}

/**
 * Exécution manuelle (pour tests)
 */
export async function checkActionTypeRemindersNow() {
  console.log('🧪 Exécution manuelle checkActionTypeReminders');
  await checkActionTypeReminders();
}

