import cron from 'node-cron';
import { NotificationEscalationService } from '../services/NotificationEscalationService';
import { ContactLeadReminderService } from '../services/contact-lead-reminder-service';

/**
 * Vérifier et envoyer les escalades de notifications
 */
async function checkNotificationEscalation() {
  try {
    console.log('⏰ [CRON] Démarrage vérification escalade notifications');
    
    // Vérifier les escalades générales (pour tous les types de notifications)
    await NotificationEscalationService.run();
    
    // Vérifier spécifiquement les rappels contact/lead (logique dédiée)
    await ContactLeadReminderService.checkAndSendReminders();
    
  } catch (error) {
    console.error('❌ [CRON] Erreur vérification escalade notifications:', error);
  }
}

/**
 * Démarrer le cron job pour l'escalade des notifications
 * Exécution : Tous les jours à 9h (avant les heures de bureau)
 */
export function startNotificationEscalationCron() {
  // Cron expression: 0 9 * * * = Tous les jours à 9h
  cron.schedule('0 9 * * *', async () => {
    await checkNotificationEscalation();
  }, {
    timezone: 'Europe/Paris'
  });

  console.log('✅ Cron job escalade notifications activé (tous les jours à 9h)');
}

/**
 * Exécution manuelle (pour tests)
 */
export async function checkNotificationEscalationNow() {
  console.log('🧪 Exécution manuelle checkNotificationEscalation');
  await checkNotificationEscalation();
}

