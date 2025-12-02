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
 * Exécution : Toutes les 5 minutes (timezone Europe/Paris)
 * Permet de détecter les RDV qui démarrent à n'importe quelle heure
 */
export function startRDVSlaRemindersCron() {
  // Cron expression: */5 * * * * = Toutes les 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    await checkRDVSlaReminders();
  }, {
    timezone: 'Europe/Paris'
  });

  console.log('✅ Cron job rappels SLA RDV activé (toutes les 5 minutes)');
}

/**
 * Exécution manuelle (pour tests)
 */
export async function checkRDVSlaRemindersNow() {
  console.log('🧪 Exécution manuelle checkRDVSlaReminders');
  await checkRDVSlaReminders();
}

