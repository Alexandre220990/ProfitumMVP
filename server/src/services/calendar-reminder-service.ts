import { createClient } from '@supabase/supabase-js';
import { NotificationService, NotificationType } from './notification-service';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class CalendarReminderService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Vérifier et envoyer les rappels d'événements
   */
  async processReminders(): Promise<void> {
    try {
      const now = new Date();
      
      // Récupérer tous les rappels non envoyés
      const { data: reminders, error } = await supabase
        .from('CalendarEventReminder')
        .select(`
          *,
          CalendarEvent (
            id,
            title,
            description,
            start_date,
            end_date,
            location,
            created_by,
            client_id,
            expert_id
          )
        `)
        .eq('sent', false)
        .order('time_minutes', { ascending: true });

      if (error) {
        console.error('❌ Erreur récupération rappels:', error);
        return;
      }

      if (!reminders || reminders.length === 0) {
        return;
      }

      console.log(`📅 Traitement de ${reminders.length} rappels d'événements`);

      for (const reminder of reminders) {
        await this.processReminder(reminder, now);
      }

    } catch (error) {
      console.error('❌ Erreur traitement rappels:', error);
    }
  }

  /**
   * Traiter un rappel spécifique
   */
  private async processReminder(reminder: any, now: Date): Promise<void> {
    try {
      const event = reminder.CalendarEvent;
      if (!event) {
        console.warn('⚠️ Événement non trouvé pour le rappel:', reminder.id);
        return;
      }

      const eventStart = new Date(event.start_date);
      const reminderTime = new Date(eventStart.getTime() - (reminder.time_minutes * 60 * 1000));

      // Vérifier si c'est le moment d'envoyer le rappel
      if (now >= reminderTime && now <= eventStart) {
        await this.sendReminderNotification(reminder, event);
        
        // Marquer le rappel comme envoyé
        await supabase
          .from('CalendarEventReminder')
          .update({
            sent: true,
            sent_at: now.toISOString()
          })
          .eq('id', reminder.id);

        console.log(`✅ Rappel envoyé pour l'événement: ${event.title}`);
      }

    } catch (error) {
      console.error('❌ Erreur traitement rappel:', error);
    }
  }

  /**
   * Envoyer la notification de rappel
   */
  private async sendReminderNotification(reminder: any, event: any): Promise<void> {
    try {
      const eventStart = new Date(event.start_date);
      const now = new Date();
      const timeUntilEvent = Math.round((eventStart.getTime() - now.getTime()) / (1000 * 60));

      // Déterminer les destinataires
      const recipients = await this.getEventRecipients(event);

      for (const recipient of recipients) {
        await this.notificationService.sendNotification(
          recipient.user_id,
          recipient.user_type as 'client' | 'expert' | 'admin' | 'profitum',
          NotificationType.CLIENT_CALENDAR_EVENT_REMINDER,
          {
            event_title: event.title,
            event_date: eventStart.toLocaleDateString('fr-FR'),
            event_time: eventStart.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            event_location: event.location || 'Non spécifié',
            reminder_time: this.formatReminderTime(timeUntilEvent),
            event_url: `${process.env.FRONTEND_URL}/calendar/event/${event.id}`,
            recipient_name: recipient.name || 'Utilisateur'
          }
        );
      }

    } catch (error) {
      console.error('❌ Erreur envoi notification rappel:', error);
    }
  }

  /**
   * Récupérer les destinataires d'un événement
   */
  private async getEventRecipients(event: any): Promise<Array<{ user_id: string; user_type: string; name: string }>> {
    const recipients: Array<{ user_id: string; user_type: string; name: string }> = [];

    // Ajouter l'organisateur
    if (event.created_by) {
      const { data: organizer } = await supabase
        .from('auth.users')
        .select('id, email, raw_user_meta_data')
        .eq('id', event.created_by)
        .single();

      if (organizer) {
        recipients.push({
          user_id: organizer.id,
          user_type: 'client', // TODO: Déterminer le type dynamiquement
          name: organizer.raw_user_meta_data?.name || organizer.email
        });
      }
    }

    // Ajouter les participants
    const { data: participants } = await supabase
      .from('CalendarEventParticipant')
      .select(`
        user_id,
        user_type,
        user_name
      `)
      .eq('event_id', event.id);

    if (participants) {
      for (const participant of participants) {
        recipients.push({
          user_id: participant.user_id,
          user_type: participant.user_type,
          name: participant.user_name || 'Participant'
        });
      }
    }

    return recipients;
  }

  /**
   * Formater le temps restant avant l'événement
   */
  private formatReminderTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} jour${days > 1 ? 's' : ''}`;
    }
  }

  /**
   * Créer des rappels automatiques pour un événement
   */
  async createDefaultReminders(eventId: string): Promise<void> {
    try {
      const defaultReminders = [
        { type: 'email', time_minutes: 1440 }, // 24h avant
        { type: 'push', time_minutes: 60 },    // 1h avant
        { type: 'push', time_minutes: 15 }     // 15min avant
      ];

      for (const reminder of defaultReminders) {
        await supabase
          .from('CalendarEventReminder')
          .insert({
            event_id: eventId,
            type: reminder.type,
            time_minutes: reminder.time_minutes,
            sent: false
          });
      }

      console.log(`✅ Rappels par défaut créés pour l'événement: ${eventId}`);

    } catch (error) {
      console.error('❌ Erreur création rappels par défaut:', error);
    }
  }

  /**
   * Supprimer tous les rappels d'un événement
   */
  async deleteEventReminders(eventId: string): Promise<void> {
    try {
      await supabase
        .from('CalendarEventReminder')
        .delete()
        .eq('event_id', eventId);

      console.log(`✅ Rappels supprimés pour l'événement: ${eventId}`);

    } catch (error) {
      console.error('❌ Erreur suppression rappels:', error);
    }
  }

  /**
   * Vérifier les événements en retard
   */
  async checkOverdueEvents(): Promise<void> {
    try {
      const now = new Date();
      
      // Récupérer les événements en retard
      const { data: overdueEvents, error } = await supabase
        .from('CalendarEvent')
        .select('*')
        .lt('end_date', now.toISOString())
        .eq('status', 'pending');

      if (error) {
        console.error('❌ Erreur récupération événements en retard:', error);
        return;
      }

      if (!overdueEvents || overdueEvents.length === 0) {
        return;
      }

      console.log(`⚠️ ${overdueEvents.length} événements en retard détectés`);

      for (const event of overdueEvents) {
        await this.handleOverdueEvent(event);
      }

    } catch (error) {
      console.error('❌ Erreur vérification événements en retard:', error);
    }
  }

  /**
   * Gérer un événement en retard
   */
  private async handleOverdueEvent(event: any): Promise<void> {
    try {
      // Marquer l'événement comme terminé
      await supabase
        .from('CalendarEvent')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', event.id);

      // Envoyer une notification de fin d'événement
      const recipients = await this.getEventRecipients(event);

      for (const recipient of recipients) {
        await this.notificationService.sendNotification(
          recipient.user_id,
          recipient.user_type as 'client' | 'expert' | 'admin' | 'profitum',
          NotificationType.CLIENT_CALENDAR_EVENT_REMINDER,
          {
            event_title: event.title,
            event_date: new Date(event.start_date).toLocaleDateString('fr-FR'),
            event_time: new Date(event.start_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            event_location: event.location || 'Non spécifié',
            reminder_time: 'Événement terminé',
            event_url: `${process.env.FRONTEND_URL}/calendar/event/${event.id}`,
            recipient_name: recipient.name || 'Utilisateur'
          }
        );
      }

      console.log(`✅ Événement marqué comme terminé: ${event.title}`);

    } catch (error) {
      console.error('❌ Erreur gestion événement en retard:', error);
    }
  }
} 