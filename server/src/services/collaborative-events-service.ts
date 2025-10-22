import { supabase } from '../lib/supabase';
import { CalendarEvent } from '../types/calendar';
import { googleCalendarService } from './google-calendar-service';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export interface CollaborativeEventParticipant {
  user_id: string;
  user_type: 'client' | 'expert' | 'admin';
  email: string;
  name: string;
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
  response_date?: string;
}

export interface CollaborativeEventOrganizer {
  user_id: string;
  user_type: 'client' | 'expert' | 'admin';
  email: string;
  name: string;
}

export interface CollaborativeEvent extends Omit<CalendarEvent, 'participants'> {
  participants: CollaborativeEventParticipant[];
  organizer: CollaborativeEventOrganizer;
  meeting_details?: {
    platform: 'google_meet' | 'zoom' | 'teams' | 'other';
    meeting_url?: string;
    meeting_id?: string;
    password?: string;
    dial_in_numbers?: string[];
  };
  agenda_items?: Array<{
    id: string;
    title: string;
    description?: string;
    duration_minutes: number;
    presenter?: string;
  }>;
  documents?: Array<{
    id: string;
    name: string;
    url: string;
    type: 'presentation' | 'document' | 'spreadsheet' | 'other';
  }>;
}

export interface EventInvitation {
  id: string;
  event_id: string;
  user_id: string;
  user_type: 'client' | 'expert' | 'admin';
  email: string;
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
  sent_at: string;
  responded_at?: string;
  response_notes?: string;
}

export interface EventReminder {
  id: string;
  event_id: string;
  user_id: string;
  type: 'email' | 'push' | 'sms';
  time_minutes: number;
  sent: boolean;
  sent_at?: string;
}

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

export class CollaborativeEventsService {
  
  /**
   * Créer un événement collaboratif
   */
  async createCollaborativeEvent(eventData: Partial<CollaborativeEvent>): Promise<string> {
    try {
      // Valider les données
      if (!eventData.title || !eventData.start_date || !eventData.end_date) {
        throw new Error('Données d\'événement incomplètes');
      }

      if (!eventData.organizer || !eventData.participants) {
        throw new Error('Organisateur et participants requis');
      }

      // Créer l'événement principal  
      const startDate = new Date(eventData.start_date!);
      const endDate = new Date(eventData.end_date!);
      const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
      
      const { data: event, error: eventError } = await supabase
        .from('RDV')
        .insert({
          title: eventData.title,
          description: eventData.description,
          scheduled_date: startDate.toISOString().split('T')[0],
          scheduled_time: startDate.toISOString().split('T')[1].substring(0, 8),
          duration_minutes: durationMinutes,
          meeting_type: eventData.is_online ? 'video' : 'physical',
          type: 'meeting',
          priority: eventData.priority || 'medium',
          status: 'pending',
          category: 'collaborative',
          location: eventData.location,
          is_online: eventData.is_online || false,
          meeting_url: eventData.meeting_details?.meeting_url,
          color: eventData.color || '#3B82F6',
          metadata: {
            organizer: eventData.organizer,
            meeting_details: eventData.meeting_details,
            agenda_items: eventData.agenda_items,
            documents: eventData.documents
          }
        })
        .select('id')
        .single();

      if (eventError) throw eventError;

      // Créer les participants
      await this.createEventParticipants(event.id, eventData.participants || []);

      // Créer les invitations
      await this.createEventInvitations(event.id, eventData.participants || []);

      // Créer les rappels
      await this.createEventReminders(event.id, eventData.participants || []);

      // Synchroniser avec Google Calendar si configuré
      await this.syncToGoogleCalendar(event.id, eventData.organizer.user_id);

      return event.id;

    } catch (error) {
      console.error('❌ Erreur création événement collaboratif:', error);
      throw error;
    }
  }

  /**
   * Créer les participants d'un événement
   */
  private async createEventParticipants(eventId: string, participants: CollaborativeEventParticipant[]): Promise<void> {
    const participantData = participants.map(participant => ({
      event_id: eventId,
      user_id: participant.user_id,
      user_type: participant.user_type,
      status: participant.status || 'pending'
    }));

    const { error } = await supabase
      .from('RDV_Participants')
      .insert(participantData);

    if (error) throw error;
  }

  /**
   * Créer les invitations d'un événement
   */
  private async createEventInvitations(eventId: string, participants: CollaborativeEventParticipant[]): Promise<void> {
    const invitationData = participants.map(participant => ({
      event_id: eventId,
      user_id: participant.user_id,
      user_type: participant.user_type,
      email: participant.email,
      status: 'pending',
      sent_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('EventInvitation')
      .insert(invitationData);

    if (error) throw error;
  }

  /**
   * Créer les rappels d'un événement
   */
  private async createEventReminders(eventId: string, participants: CollaborativeEventParticipant[]): Promise<void> {
    const reminderData = participants.flatMap(participant => [
      {
        event_id: eventId,
        user_id: participant.user_id,
        type: 'email',
        time_minutes: 60,
        sent: false
      },
      {
        event_id: eventId,
        user_id: participant.user_id,
        type: 'push',
        time_minutes: 15,
        sent: false
      }
    ]);

    const { error } = await supabase
      .from('CalendarEventReminder')
      .insert(reminderData);

    if (error) throw error;
  }

  /**
   * Synchroniser avec Google Calendar
   */
  private async syncToGoogleCalendar(eventId: string, organizerId: string): Promise<void> {
    try {
      // Récupérer l'intégration Google de l'organisateur
      const integrations = await googleCalendarService.getUserIntegrations(organizerId);
      const primaryIntegration = integrations.find(integration => integration.is_primary);

      if (!primaryIntegration) {
        console.log('⚠️ Aucune intégration Google Calendar trouvée pour l\'organisateur');
        return;
      }

      // Récupérer l'événement complet
      const { data: event, error: fetchError } = await supabase
        .from('RDV')
        .select('*')
        .eq('id', eventId)
        .single();

      if (fetchError || !event) {
        throw new Error('Événement non trouvé');
      }

      // Convertir et créer dans Google Calendar
      const googleEvent = googleCalendarService.convertProfitumToGoogleEvent(event);
      await googleCalendarService.createEvent(
        primaryIntegration.access_token,
        primaryIntegration.calendar_id,
        googleEvent
      );

    } catch (error) {
      console.error('❌ Erreur synchronisation Google Calendar:', error);
      // Ne pas faire échouer la création de l'événement si la sync échoue
    }
  }

  /**
   * Répondre à une invitation
   */
  async respondToInvitation(
    invitationId: string,
    userId: string,
    response: 'accepted' | 'declined' | 'tentative',
    notes?: string
  ): Promise<void> {
    try {
      // Mettre à jour l'invitation
      const { error: invitationError } = await supabase
        .from('EventInvitation')
        .update({
          status: response,
          responded_at: new Date().toISOString(),
          response_notes: notes
        })
        .eq('id', invitationId)
        .eq('user_id', userId);

      if (invitationError) throw invitationError;

      // Mettre à jour le statut du participant
      const { error: participantError } = await supabase
        .from('RDV_Participants')
        .update({
          status: response
        })
        .eq('event_id', (await this.getInvitationEventId(invitationId)))
        .eq('user_id', userId);

      if (participantError) throw participantError;

      // Envoyer une notification à l'organisateur
      await this.notifyOrganizerOfResponse(invitationId, response);

    } catch (error) {
      console.error('❌ Erreur réponse invitation:', error);
      throw error;
    }
  }

  /**
   * Obtenir l'ID de l'événement d'une invitation
   */
  private async getInvitationEventId(invitationId: string): Promise<string> {
    const { data, error } = await supabase
      .from('EventInvitation')
      .select('event_id')
      .eq('id', invitationId)
      .single();

    if (error || !data) {
      throw new Error('Invitation non trouvée');
    }

    return data.event_id;
  }

  /**
   * Notifier l'organisateur d'une réponse
   */
  private async notifyOrganizerOfResponse(invitationId: string, response: string): Promise<void> {
    // TODO: Implémenter la notification à l'organisateur
    console.log(`📧 Notification: Réponse ${response} reçue pour l'invitation ${invitationId}`);
  }

  /**
   * Obtenir les événements collaboratifs d'un utilisateur
   */
  async getUserCollaborativeEvents(userId: string, userType: string): Promise<CollaborativeEvent[]> {
    try {
      const { data: events, error } = await supabase
        .from('RDV')
        .select(`
          *,
          RDV_Participants!inner(user_id, user_type, status)
        `)
        .eq('category', 'collaborative')
        .eq('RDV_Participants.user_id', userId)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true});

      if (error) throw error;

      // Enrichir les événements avec les données collaboratives
      const enrichedEvents = await Promise.all(
        (events || []).map(event => this.enrichEventWithCollaborativeData(event))
      );

      return enrichedEvents;

    } catch (error) {
      console.error('❌ Erreur récupération événements collaboratifs:', error);
      throw error;
    }
  }

  /**
   * Enrichir un événement avec les données collaboratives
   */
  private async enrichEventWithCollaborativeData(event: any): Promise<CollaborativeEvent> {
    // Récupérer les participants
    const { data: participants, error: participantsError } = await supabase
      .from('RDV_Participants')
      .select(`
        user_id,
        user_type,
        status
      `)
      .eq('event_id', event.id);

    if (participantsError) {
      console.error('❌ Erreur récupération participants:', participantsError);
    }

    // Récupérer les informations utilisateur pour chaque participant
    const enrichedParticipants: CollaborativeEventParticipant[] = [];
    
    if (participants) {
      for (const participant of participants) {
        try {
          // Récupérer les informations utilisateur depuis Client/Expert
          const { data: clientData } = await supabase
            .from('Client')
            .select('email, name')
            .eq('id', participant.user_id)
            .single();

          if (clientData) {
            enrichedParticipants.push({
              user_id: participant.user_id,
              user_type: participant.user_type,
              email: clientData.email || '',
              name: clientData.name || 'Utilisateur',
              status: participant.status
            });
          } else {
            // Essayer Expert
            const { data: expertData } = await supabase
              .from('Expert')
              .select('email, name')
              .eq('id', participant.user_id)
              .single();

            if (expertData) {
              enrichedParticipants.push({
                user_id: participant.user_id,
                user_type: participant.user_type,
                email: expertData.email || '',
                name: expertData.name || 'Utilisateur',
                status: participant.status
              });
            }
          }
        } catch (error) {
          console.error('❌ Erreur récupération utilisateur:', error);
        }
      }
    }

    // Récupérer l'organisateur depuis les métadonnées
    const organizer = event.metadata?.organizer || null;

    return {
      ...event,
      participants: enrichedParticipants,
      organizer: organizer,
      meeting_details: event.metadata?.meeting_details,
      agenda_items: event.metadata?.agenda_items,
      documents: event.metadata?.documents
    };
  }

  /**
   * Mettre à jour un événement collaboratif
   */
  async updateCollaborativeEvent(
    eventId: string,
    updates: Partial<CollaborativeEvent>,
    userId: string
  ): Promise<void> {
    try {
      // Vérifier que l'utilisateur est l'organisateur
      const { data: event, error: fetchError } = await supabase
        .from('RDV')
        .select('metadata')
        .eq('id', eventId)
        .single();

      if (fetchError || !event) {
        throw new Error('Événement non trouvé');
      }

      if (event.metadata?.organizer?.user_id !== userId) {
        throw new Error('Seul l\'organisateur peut modifier l\'événement');
      }

      // Mettre à jour l'événement principal
      const { error: updateError } = await supabase
        .from('RDV')
        .update({
          title: updates.title,
          description: updates.description,
          start_date: updates.start_date,
          end_date: updates.end_date,
          location: updates.location,
          meeting_url: updates.meeting_details?.meeting_url,
          metadata: {
            ...event.metadata,
            meeting_details: updates.meeting_details,
            agenda_items: updates.agenda_items,
            documents: updates.documents
          }
        })
        .eq('id', eventId);

      if (updateError) throw updateError;

      // Mettre à jour les participants si fournis
      if (updates.participants) {
        await this.updateEventParticipants(eventId, updates.participants);
      }

    } catch (error) {
      console.error('❌ Erreur mise à jour événement collaboratif:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les participants d'un événement
   */
  private async updateEventParticipants(eventId: string, participants: CollaborativeEventParticipant[]): Promise<void> {
    // Supprimer les participants existants
    await supabase
      .from('RDV_Participants')
      .delete()
      .eq('event_id', eventId);

    // Ajouter les nouveaux participants
    await this.createEventParticipants(eventId, participants);
  }

  /**
   * Annuler un événement collaboratif
   */
  async cancelCollaborativeEvent(eventId: string, userId: string): Promise<void> {
    try {
      // Vérifier que l'utilisateur est l'organisateur
      const { data: event, error: fetchError } = await supabase
        .from('RDV')
        .select('metadata')
        .eq('id', eventId)
        .single();

      if (fetchError || !event) {
        throw new Error('Événement non trouvé');
      }

      if (event.metadata?.organizer?.user_id !== userId) {
        throw new Error('Seul l\'organisateur peut annuler l\'événement');
      }

      // Mettre à jour le statut de l'événement
      const { error: updateError } = await supabase
        .from('RDV')
        .update({
          status: 'cancelled'
        })
        .eq('id', eventId);

      if (updateError) throw updateError;

      // Notifier tous les participants
      await this.notifyParticipantsOfCancellation(eventId);

    } catch (error) {
      console.error('❌ Erreur annulation événement:', error);
      throw error;
    }
  }

  /**
   * Notifier les participants d'une annulation
   */
  private async notifyParticipantsOfCancellation(eventId: string): Promise<void> {
    // TODO: Implémenter la notification des participants
    console.log(`📧 Notification: Événement ${eventId} annulé`);
  }

  /**
   * Obtenir les statistiques des événements collaboratifs
   */
  async getCollaborativeEventStats(userId: string): Promise<{
    totalEvents: number;
    upcomingEvents: number;
    pendingResponses: number;
    acceptedEvents: number;
    declinedEvents: number;
  }> {
    try {
      const { data: events, error } = await supabase
        .from('RDV')
        .select(`
          id,
          start_date,
          CalendarEventParticipant!inner(user_id, status)
        `)
        .eq('category', 'collaborative')
        .eq('CalendarEventParticipant.user_id', userId);

      if (error) throw error;

      const now = new Date();
      const upcomingEvents = events?.filter(e => new Date(e.start_date) > now) || [];
      
      // Compter les différents statuts
      const pendingResponses = events?.filter(e => 
        e.CalendarEventParticipant?.some((p: any) => p.status === 'pending')
      ) || [];
      
      const acceptedEvents = events?.filter(e => 
        e.CalendarEventParticipant?.some((p: any) => p.status === 'accepted')
      ) || [];
      
      const declinedEvents = events?.filter(e => 
        e.CalendarEventParticipant?.some((p: any) => p.status === 'declined')
      ) || [];

      return {
        totalEvents: events?.length || 0,
        upcomingEvents: upcomingEvents.length,
        pendingResponses: pendingResponses.length,
        acceptedEvents: acceptedEvents.length,
        declinedEvents: declinedEvents.length
      };

    } catch (error) {
      console.error('❌ Erreur statistiques événements:', error);
      throw error;
    }
  }
}

// Instance singleton
export const collaborativeEventsService = new CollaborativeEventsService(); 