/**
 * Service de synchronisation des notifications d'événements
 * Crée et met à jour automatiquement les notifications pour les événements dans les 24h
 */

import { createClient } from '@supabase/supabase-js';
import { NotificationService } from './notification-service';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export interface EventRecipient {
  user_id: string;
  user_type: 'client' | 'expert' | 'admin' | 'apporteur';
  name?: string;
}

export class EventNotificationSync {
  /**
   * Synchroniser les notifications pour un événement (créer ou mettre à jour)
   */
  static async syncEventNotifications(rdv: any): Promise<void> {
    try {
      // Ignorer les événements annulés ou proposés
      if (rdv.status === 'cancelled' || rdv.status === 'proposed') {
        await this.deleteEventNotifications(rdv.id);
        return;
      }

      // Calculer si l'événement est dans les 24 prochaines heures
      const now = new Date();
      const eventStart = new Date(`${rdv.scheduled_date}T${rdv.scheduled_time}`);
      const eventEnd = new Date(eventStart.getTime() + (rdv.duration_minutes || 60) * 60000);
      
      const hoursUntilStart = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);
      const hoursSinceEnd = (now.getTime() - eventEnd.getTime()) / (1000 * 60 * 60);

      // Ne créer des notifications que pour les événements dans les 24h ou terminés depuis moins d'1h
      if (hoursUntilStart > 24 && hoursSinceEnd > 1) {
        await this.deleteEventNotifications(rdv.id);
        return;
      }

      // Déterminer le statut de l'événement
      let eventStatus: 'upcoming' | 'in_progress' | 'completed';
      if (rdv.status === 'completed') {
        eventStatus = 'completed';
      } else if (now >= eventEnd) {
        eventStatus = 'completed';
      } else if (now >= eventStart && now < eventEnd) {
        eventStatus = 'in_progress';
      } else {
        eventStatus = 'upcoming';
      }

      // Récupérer les destinataires
      const recipients = await this.getEventRecipients(rdv);

      // Synchroniser les notifications pour chaque destinataire
      for (const recipient of recipients) {
        await this.syncNotificationForRecipient(rdv, recipient, eventStatus, eventStart, eventEnd);
      }

      console.log(`✅ Notifications synchronisées pour l'événement ${rdv.id}`);
    } catch (error) {
      console.error('❌ Erreur synchronisation notifications événement:', error);
    }
  }

  /**
   * Synchroniser une notification pour un destinataire spécifique
   */
  private static async syncNotificationForRecipient(
    rdv: any,
    recipient: EventRecipient,
    eventStatus: 'upcoming' | 'in_progress' | 'completed',
    eventStart: Date,
    eventEnd: Date
  ): Promise<void> {
    try {
      // Chercher si une notification existe déjà pour cet événement et ce destinataire
      const { data: existingNotifications } = await supabase
        .from('notification')
        .select('id, notification_type')
        .eq('user_id', recipient.user_id)
        .eq('user_type', recipient.user_type)
        .or(`notification_type.eq.event_upcoming,notification_type.eq.event_in_progress,notification_type.eq.event_completed`)
        .filter('metadata->>event_id', 'eq', rdv.id)
        .limit(1);

      const notificationType = `event_${eventStatus}`;
      const now = new Date();

      // Calculer le temps restant
      let timeRemaining = 0;
      if (eventStatus === 'upcoming') {
        timeRemaining = eventStart.getTime() - now.getTime();
      } else if (eventStatus === 'in_progress') {
        timeRemaining = eventEnd.getTime() - now.getTime();
      }

      // Formater le message selon le statut
      let title = '';
      let message = '';

      if (eventStatus === 'upcoming') {
        title = 'Événement à venir';
        const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) {
          message = `${rdv.title || 'Événement'} - Dans ${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
        } else {
          message = `${rdv.title || 'Événement'} - Dans ${minutes}min`;
        }
      } else if (eventStatus === 'in_progress') {
        title = 'Événement en cours';
        const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        message = `${rdv.title || 'Événement'} - Se termine dans ${hours > 0 ? `${hours}h ` : ''}${minutes}min`;
      } else {
        title = 'Événement terminé';
        message = `${rdv.title || 'Événement'} - Terminé`;
      }

      const metadata = {
        event_id: rdv.id,
        event_title: rdv.title,
        event_status: eventStatus,
        scheduled_date: rdv.scheduled_date,
        scheduled_time: rdv.scheduled_time,
        duration_minutes: rdv.duration_minutes || 60,
        location: rdv.location,
        meeting_url: rdv.meeting_url,
        meeting_type: rdv.meeting_type,
      };

      const actionUrl = `/agenda-client?event=${rdv.id}`;

      if (existingNotifications && existingNotifications.length > 0) {
        // Mettre à jour la notification existante
        const existingId = existingNotifications[0].id;
        await supabase
          .from('notification')
          .update({
            title,
            message,
            notification_type: notificationType,
            metadata,
            action_url: actionUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingId);
      } else {
        // Créer une nouvelle notification
        await supabase
          .from('notification')
          .insert({
            user_id: recipient.user_id,
            user_type: recipient.user_type,
            title,
            message,
            notification_type: notificationType,
            priority: eventStatus === 'in_progress' ? 'high' : 'medium',
            status: 'unread',
            is_read: false,
            metadata,
            action_url: actionUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error(`❌ Erreur synchronisation notification pour ${recipient.user_id}:`, error);
    }
  }

  /**
   * Supprimer les notifications d'un événement
   */
  private static async deleteEventNotifications(eventId: string): Promise<void> {
    try {
      await supabase
        .from('notification')
        .delete()
        .or(`notification_type.eq.event_upcoming,notification_type.eq.event_in_progress,notification_type.eq.event_completed`)
        .filter('metadata->>event_id', 'eq', eventId);
    } catch (error) {
      console.error('❌ Erreur suppression notifications événement:', error);
    }
  }

  /**
   * Récupérer les destinataires d'un événement
   */
  private static async getEventRecipients(rdv: any): Promise<EventRecipient[]> {
    const recipients: EventRecipient[] = [];

    // Récupérer les participants depuis la table RDV_Participants
    const { data: participants } = await supabase
      .from('RDV_Participants')
      .select('user_id, user_type, user_name')
      .eq('rdv_id', rdv.id);

    if (participants && participants.length > 0) {
      participants.forEach((p: any) => {
        if (p.user_id) {
          recipients.push({
            user_id: p.user_id,
            user_type: p.user_type as any,
            name: p.user_name,
          });
        }
      });
    } else {
      // Fallback: utiliser les IDs directement du RDV
      if (rdv.client_id) {
        // Récupérer l'auth_user_id du client
        const { data: client } = await supabase
          .from('Client')
          .select('auth_user_id, first_name, last_name')
          .eq('id', rdv.client_id)
          .single();
        
        if (client?.auth_user_id) {
          recipients.push({
            user_id: client.auth_user_id,
            user_type: 'client',
            name: `${client.first_name || ''} ${client.last_name || ''}`.trim(),
          });
        }
      }

      if (rdv.expert_id) {
        const { data: expert } = await supabase
          .from('Expert')
          .select('auth_user_id, first_name, last_name')
          .eq('id', rdv.expert_id)
          .single();
        
        if (expert?.auth_user_id) {
          recipients.push({
            user_id: expert.auth_user_id,
            user_type: 'expert',
            name: `${expert.first_name || ''} ${expert.last_name || ''}`.trim(),
          });
        }
      }

      if (rdv.apporteur_id) {
        const { data: apporteur } = await supabase
          .from('ApporteurAffaires')
          .select('auth_user_id, first_name, last_name')
          .eq('id', rdv.apporteur_id)
          .single();
        
        if (apporteur?.auth_user_id) {
          recipients.push({
            user_id: apporteur.auth_user_id,
            user_type: 'apporteur',
            name: `${apporteur.first_name || ''} ${apporteur.last_name || ''}`.trim(),
          });
        }
      }
    }

    return recipients;
  }
}

