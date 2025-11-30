import cron from 'node-cron';
import { RDVSlaReminderService } from '../services/rdv-sla-reminder-service';

/**
 * Vérifier et envoyer les rappels SLA pour les RDV non traités
 */
async function checkRDVSlaReminders() {
  try {
    console.log('⏰ [CRON] Démarrage vérification rappels SLA RDV');
    await RDVSlaReminderService.checkAndSendReminders();
  } catch (error) {
    console.error('❌ [CRON] Erreur vérification rappels SLA RDV:', error);
  }
}

/**
 * Démarrer le cron job pour les rappels SLA des RDV
 * Exécution : Tous les jours à 9h (timezone Europe/Paris)
 */
export function startRDVSlaRemindersCron() {
  // Cron expression: 0 9 * * * = Tous les jours à 9h
  cron.schedule('0 9 * * *', async () => {
    await checkRDVSlaReminders();
  }, {
    timezone: 'Europe/Paris'
  });

  console.log('✅ Cron job rappels SLA RDV activé (tous les jours à 9h)');
}

/**
 * Exécution manuelle (pour tests)
 */
export async function checkRDVSlaRemindersNow() {
  console.log('🧪 Exécution manuelle checkRDVSlaReminders');
  await checkRDVSlaReminders();
}

