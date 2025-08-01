import cron from 'node-cron';
import { CalendarReminderService } from '../services/calendar-reminder-service';

const calendarReminderService = new CalendarReminderService();

/**
 * Cron job pour traiter les rappels d'événements calendrier
 * Exécuté toutes les minutes
 */
export const startCalendarRemindersCron = () => {
  console.log('🕐 Démarrage du cron job pour les rappels calendrier...');

  // Traitement des rappels toutes les minutes
  cron.schedule('* * * * *', async () => {
    try {
      console.log('📅 Vérification des rappels d\'événements...');
      await calendarReminderService.processReminders();
    } catch (error) {
      console.error('❌ Erreur cron job rappels calendrier:', error);
    }
  });

  // Vérification des événements en retard toutes les 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('⚠️ Vérification des événements en retard...');
      await calendarReminderService.checkOverdueEvents();
    } catch (error) {
      console.error('❌ Erreur cron job événements en retard:', error);
    }
  });

  console.log('✅ Cron job rappels calendrier démarré');
};

/**
 * Arrêter le cron job
 */
export const stopCalendarRemindersCron = () => {
  console.log('🛑 Arrêt du cron job rappels calendrier');
  // Les cron jobs s'arrêtent automatiquement quand le processus se termine
}; 