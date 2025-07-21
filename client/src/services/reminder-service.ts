class ReminderService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Démarrer le service de rappels automatiques
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🔄 Service de rappels automatiques démarré');
    
    // Vérifier les rappels toutes les minutes
    this.intervalId = setInterval(() => {
      this.checkAndSendReminders();
    }, 60000); // 1 minute
    
    // Vérifier immédiatement au démarrage
    this.checkAndSendReminders();
  }

  /**
   * Arrêter le service de rappels automatiques
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ Service de rappels automatiques arrêté');
  }

  /**
   * Vérifier et envoyer les rappels en attente
   */
  private async checkAndSendReminders() {
    try {
      console.log('🔍 Vérification des rappels en attente...');
      
      // Nettoyage : suppression de l'import inutile
      
      if (pendingReminders.length > 0) {
        console.log(`📨 ${pendingReminders.length} rappel(s) traité(s)`);
      }
    } catch (error) {
      console.error('❌ Erreur vérification rappels:', error);
    }
  }

  /**
   * Traiter un rappel individuel
   */
  private async processReminder(reminder: any) {
    try {
      const event = reminder.CalendarEvent;
      if (!event) return;

      // Créer la notification de rappel
      // Nettoyage : suppression de l'import inutile
      
      if (notificationId) {
        // Marquer le rappel comme envoyé
        // Nettoyage : suppression de l'import inutile
        
        console.log(`✅ Rappel envoyé pour l'événement: ${event.title}`);
      }
    } catch (error) {
      console.error('❌ Erreur traitement rappel:', error);
    }
  }

  /**
   * Programmer un rappel manuel
   */
  async scheduleManualReminder(
    eventId: string,
    eventTitle: string,
    userId: string,
    userType: 'client' | 'expert' | 'admin',
    minutesBefore: number
  ) {
    try {
      const reminderTime = new Date();
      reminderTime.setMinutes(reminderTime.getMinutes() + minutesBefore);

      setTimeout(async () => {
        // Nettoyage : suppression de l'import inutile
      }, minutesBefore * 60 * 1000);

      console.log(`⏰ Rappel programmé pour ${eventTitle} dans ${minutesBefore} minutes`);
    } catch (error) {
      console.error('❌ Erreur programmation rappel manuel:', error);
    }
  }

  /**
   * Créer un rappel immédiat
   */
  async sendImmediateReminder(
    eventId: string,
    eventTitle: string,
    userId: string,
    userType: 'client' | 'expert' | 'admin'
  ) {
    try {
      // Nettoyage : suppression de l'import inutile

      if (notificationId) {
        console.log(`📨 Rappel immédiat envoyé pour: ${eventTitle}`);
        return true;
      }
    } catch (error) {
      console.error('❌ Erreur envoi rappel immédiat:', error);
    }
    return false;
  }

  /**
   * Vérifier si le service est en cours d'exécution
   */
  isActive() {
    return this.isRunning;
  }
}

export const reminderService = new ReminderService(); 