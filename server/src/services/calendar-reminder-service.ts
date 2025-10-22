import { createClient } from '@supabase/supabase-js';
import { NotificationService } from './NotificationService';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class CalendarReminderService {
  constructor() {
    // Initialisation simplifiée
  }

  /**
   * Vérifier et envoyer les rappels d'événements
   */
  async processReminders(): Promise<void> {
    try {
      const now = new Date();
      
      // Récupérer tous les rappels non envoyés avec leurs RDV
      const { data: reminders, error } = await supabase
        .from('RDV_Reminders')
        .select(`
          *,
          RDV!rdv_id (
            id,
            title,
            description,
            scheduled_date,
            scheduled_time,
            duration_minutes,
            location,
            created_by,
            client_id,
            expert_id
          )
        `)
        .eq('status', 'pending')
        .order('minutes_before', { ascending: true });

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
      const event = reminder.RDV;
      if (!event) {
        console.warn('⚠️ Événement non trouvé pour le rappel:', reminder.id);
        return;
      }

      const eventStart = new Date(`${event.scheduled_date}T${event.scheduled_time}`);
      const reminderTime = new Date(eventStart.getTime() - (reminder.time_minutes * 60 * 1000));

      // Vérifier si c'est le moment d'envoyer le rappel
      if (now >= reminderTime && now <= eventStart) {
        await this.sendReminderNotification(reminder, event);
        
        // Marquer le rappel comme envoyé
        await supabase
          .from('RDV_Reminders')
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
      const eventStart = new Date(`${event.scheduled_date}T${event.scheduled_time}`);
      const now = new Date();
      const timeUntilEvent = Math.round((eventStart.getTime() - now.getTime()) / (1000 * 60));

      // Déterminer les destinataires
      const recipients = await this.getEventRecipients(event);

      for (const recipient of recipients) {
        await NotificationService.sendSystemNotification({
          user_id: recipient.user_id,
          title: 'Rappel événement calendrier',
          message: `Rappel pour l'événement "${event.title}" dans ${this.formatReminderTime(timeUntilEvent)}`,
          type: 'system',
          event_title: event.title,
          event_date: eventStart.toLocaleDateString('fr-FR'),
          event_time: eventStart.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          event_location: event.location || 'Non spécifié',
          reminder_time: this.formatReminderTime(timeUntilEvent),
          event_url: `${process.env.FRONTEND_URL}/calendar/event/${event.id}`,
          recipient_name: recipient.name || 'Utilisateur'
        });
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
      // Rechercher dans Client
      const { data: clientOrganizer } = await supabase
        .from('Client')
        .select('id, email, name')
        .eq('id', event.created_by)
        .single();

      if (clientOrganizer) {
        recipients.push({
          user_id: clientOrganizer.id,
          user_type: 'client',
          name: clientOrganizer.name || clientOrganizer.email
        });
      } else {
        // Rechercher dans Expert
        const { data: expertOrganizer } = await supabase
          .from('Expert')
          .select('id, email, name')
          .eq('id', event.created_by)
          .single();

        if (expertOrganizer) {
          recipients.push({
            user_id: expertOrganizer.id,
            user_type: 'expert',
            name: expertOrganizer.name || expertOrganizer.email
          });
        }
      }
    }

    // Ajouter les participants
    const { data: participants } = await supabase
      .from('RDV_Participants')
      .select(`
        user_id,
        user_type,
        user_name
      `)
      .eq('rdv_id', event.id);

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
          .from('RDV_Reminders')
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
        .from('RDV_Reminders')
        .delete()
        .eq('rdv_id', eventId);

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
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toISOString().split('T')[1].substring(0, 8);
      
      // Récupérer les événements en retard (date passée)
      const { data: overdueEvents, error } = await supabase
        .from('RDV')
        .select('*')
        .lt('scheduled_date', currentDate)
        .eq('status', 'scheduled');

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
        .from('RDV')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', event.id);

      // Envoyer une notification de fin d'événement
      const recipients = await this.getEventRecipients(event);

      for (const recipient of recipients) {
        await NotificationService.sendSystemNotification({
          user_id: recipient.user_id,
          title: 'Événement terminé',
          message: `L'événement "${event.title}" est maintenant terminé.`,
          type: 'system',
          event_title: event.title,
          event_date: new Date(`${event.scheduled_date}T${event.scheduled_time}`).toLocaleDateString('fr-FR'),
          event_time: new Date(`${event.scheduled_date}T${event.scheduled_time}`).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          event_location: event.location || 'Non spécifié',
          reminder_time: 'Événement terminé',
          event_url: `${process.env.FRONTEND_URL}/calendar/event/${event.id}`,
          recipient_name: recipient.name || 'Utilisateur'
        });
      }

      console.log(`✅ Événement marqué comme terminé: ${event.title}`);

    } catch (error) {
      console.error('❌ Erreur gestion événement en retard:', error);
    }
  }
} 