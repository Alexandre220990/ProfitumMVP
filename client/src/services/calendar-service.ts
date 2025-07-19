import { supabase } from '@/lib/supabase';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  type: 'appointment' | 'deadline' | 'meeting' | 'task' | 'reminder';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  category: 'client' | 'expert' | 'admin' | 'system' | 'collaborative';
  dossier_id?: string;
  dossier_name?: string;
  client_id?: string;
  expert_id?: string;
  location?: string;
  is_online?: boolean;
  meeting_url?: string;
  phone_number?: string;
  color: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
  reminders?: Array<{ type: 'email' | 'push' | 'sms', time: number }>;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface DossierStep {
  id: string;
  dossier_id: string;
  dossier_name: string;
  step_name: string;
  step_type: 'validation' | 'documentation' | 'expertise' | 'approval' | 'payment';
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  estimated_duration?: number;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarStats {
  eventsToday: number;
  meetingsThisWeek: number;
  overdueDeadlines: number;
  documentsToValidate: number;
}

export interface CalendarFilters {
  start_date?: string;
  end_date?: string;
  type?: string;
  category?: string;
  client_id?: string;
  expert_id?: string;
  dossier_id?: string;
  status?: string;
  priority?: string;
}

export interface ValidatedExpert {
  id: string;
  email: string;
  name: string;
  specializations: string[];
  validated: boolean;
}

export interface ClientDossier {
  id: string;
  name: string;
  product_type: string;
  status: string;
  created_at: string;
}

// Configuration API
const API_BASE_URL = 'http://[::1]:5004/api';

class CalendarService {
  /**
   * Récupérer les événements du calendrier via l'API backend
   */
  async getEvents(filters: CalendarFilters = {}): Promise<CalendarEvent[]> {
    try {
      const token = await this.getAuthToken();
      const queryParams = new URLSearchParams();
      
      // Ajouter les filtres à l'URL
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`${API_BASE_URL}/calendar/events?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Erreur récupération événements:', error);
      return [];
    }
  }

  /**
   * Obtenir l'ID client à partir de l'ID auth
   */
  private async getClientIdFromAuthId(authId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('Client')
        .select('id')
        .eq('auth_id', authId)
        .single();

      if (error) {
        console.error('Erreur récupération client ID:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Erreur récupération client ID:', error);
      return null;
    }
  }

  /**
   * Obtenir l'ID expert à partir de l'ID auth
   */
  private async getExpertIdFromAuthId(authId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('Expert')
        .select('id')
        .eq('auth_id', authId)
        .single();

      if (error) {
        console.error('Erreur récupération expert ID:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Erreur récupération expert ID:', error);
      return null;
    }
  }

  /**
   * Créer un événement via l'API backend avec gestion automatique des IDs
   */
  async createEvent(eventData: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    try {
      const token = await this.getAuthToken();
      
      // Récupérer l'utilisateur actuel pour déterminer le bon ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Préparer les données avec les bons IDs
      const finalEventData = { ...eventData };

      // S'assurer qu'une description est fournie (requis par le serveur)
      if (!finalEventData.description || finalEventData.description.trim() === '') {
        finalEventData.description = `Événement ${finalEventData.type} - ${finalEventData.title}`;
      }

      // Valider que end_date > start_date
      const startDate = new Date(finalEventData.start_date);
      const endDate = new Date(finalEventData.end_date);
      if (endDate <= startDate) {
        // Ajuster automatiquement la date de fin (1 heure après le début)
        const adjustedEndDate = new Date(startDate);
        adjustedEndDate.setHours(adjustedEndDate.getHours() + 1);
        finalEventData.end_date = adjustedEndDate.toISOString();
        console.log('⚠️ Date de fin ajustée automatiquement:', finalEventData.end_date);
      }

      // Nettoyer les champs vides pour éviter les erreurs de validation
      if (!finalEventData.dossier_id || finalEventData.dossier_id.trim() === '') {
        delete finalEventData.dossier_id;
      }
      if (!finalEventData.dossier_name || finalEventData.dossier_name.trim() === '') {
        delete finalEventData.dossier_name;
      }
      if (!finalEventData.expert_id || finalEventData.expert_id.trim() === '') {
        delete finalEventData.expert_id;
      }
      if (!finalEventData.location || finalEventData.location.trim() === '') {
        delete finalEventData.location;
      }
      if (!finalEventData.meeting_url || finalEventData.meeting_url.trim() === '') {
        delete finalEventData.meeting_url;
      }
      if (!finalEventData.phone_number || finalEventData.phone_number.trim() === '') {
        delete finalEventData.phone_number;
      }

      // Si c'est un client, récupérer l'ID client
      if (user.user_metadata?.type === 'client' || eventData.category === 'client') {
        const clientId = await this.getClientIdFromAuthId(user.id);
        if (clientId) {
          finalEventData.client_id = clientId;
        } else {
          throw new Error('ID client non trouvé pour cet utilisateur');
        }
      }

      // Si c'est un expert, récupérer l'ID expert
      if (user.user_metadata?.type === 'expert' || eventData.category === 'expert') {
        const expertId = await this.getExpertIdFromAuthId(user.id);
        if (expertId) {
          finalEventData.expert_id = expertId;
        } else {
          throw new Error('ID expert non trouvé pour cet utilisateur');
        }
      }

      console.log('Données événement finales:', finalEventData);
      
      const response = await fetch(`${API_BASE_URL}/calendar/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(finalEventData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data?.id || null;
    } catch (error) {
      console.error('Erreur création événement:', error);
      return null;
    }
  }

  /**
   * Mettre à jour un événement via l'API backend
   */
  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/calendar/events/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Erreur mise à jour événement:', error);
      return null;
    }
  }

  /**
   * Supprimer un événement via l'API backend
   */
  async deleteEvent(id: string): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/calendar/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Erreur suppression événement:', error);
      return false;
    }
  }

  /**
   * Récupérer les étapes de dossier via l'API backend
   */
  async getDossierSteps(dossierId?: string): Promise<DossierStep[]> {
    try {
      const token = await this.getAuthToken();
      const queryParams = new URLSearchParams();
      
      if (dossierId) {
        queryParams.append('dossier_id', dossierId);
      }

      const response = await fetch(`${API_BASE_URL}/calendar/steps?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Erreur récupération étapes:', error);
      return [];
    }
  }

  /**
   * Créer une étape de dossier via l'API backend
   */
  async createDossierStep(stepData: Omit<DossierStep, 'id' | 'created_at' | 'updated_at'>): Promise<DossierStep | null> {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/calendar/steps`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stepData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Erreur création étape:', error);
      return null;
    }
  }

  /**
   * Mettre à jour une étape de dossier via l'API backend
   */
  async updateDossierStep(id: string, updates: Partial<DossierStep>): Promise<DossierStep | null> {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/calendar/steps/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Erreur mise à jour étape:', error);
      return null;
    }
  }

  /**
   * Supprimer une étape de dossier via l'API backend
   */
  async deleteDossierStep(id: string): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/calendar/steps/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Erreur suppression étape:', error);
      return false;
    }
  }

  /**
   * Récupérer les statistiques du calendrier via l'API backend
   */
  async getCalendarStats(clientId: string): Promise<CalendarStats> {
    try {
      const token = await this.getAuthToken();
      const queryParams = new URLSearchParams();
      
      if (clientId) {
        queryParams.append('client_id', clientId);
      }

      const response = await fetch(`${API_BASE_URL}/calendar/stats?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || {
        eventsToday: 0,
        meetingsThisWeek: 0,
        overdueDeadlines: 0,
        documentsToValidate: 0
      };
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
      return {
        eventsToday: 0,
        meetingsThisWeek: 0,
        overdueDeadlines: 0,
        documentsToValidate: 0
      };
    }
  }

  /**
   * Récupérer les événements à venir via l'API backend
   */
  async getUpcomingEvents(limit: number = 10): Promise<CalendarEvent[]> {
    try {
      const token = await this.getAuthToken();
      const queryParams = new URLSearchParams();
      
      queryParams.append('start_date', new Date().toISOString());
      queryParams.append('limit', limit.toString());

      const response = await fetch(`${API_BASE_URL}/calendar/events?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Erreur récupération événements à venir:', error);
      return [];
    }
  }

  /**
   * Récupérer les rappels en attente (fallback vers Supabase)
   */
  async getPendingReminders(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('CalendarEventReminder')
        .select(`
          *,
          CalendarEvent (
            id,
            title,
            start_date,
            end_date,
            type,
            priority,
            status,
            category,
            client_id,
            expert_id
          )
        `)
        .eq('sent', false)
        .order('time_minutes', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération rappels:', error);
      return [];
    }
  }

  /**
   * Marquer un rappel comme envoyé (fallback vers Supabase)
   */
  async markReminderAsSent(reminderId: string): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/calendar/reminders/${reminderId}/mark-sent`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Erreur marquage rappel:', error);
      return false;
    }
  }

  /**
   * Créer une notification d'événement (fallback vers Supabase)
   */
  async createEventNotification(
    userId: string,
    userType: string,
    eventId: string,
    eventTitle: string,
    type: 'confirmation' | 'reminder' | 'update' | 'cancellation'
  ): Promise<string | null> {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          user_type: userType,
          event_id: eventId,
          event_title: eventTitle,
          type,
          message: this.getNotificationMessage(type, eventTitle)
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data?.id || null;
    } catch (error) {
      console.error('Erreur création notification:', error);
      return null;
    }
  }

  /**
   * Programmer les rappels d'événement (fallback vers Supabase)
   */
  async scheduleEventReminders(
    event: CalendarEvent,
    _userId: string,
    _userType: 'client' | 'expert' | 'admin'
  ): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      
      // Programmer les rappels automatiques (15 min, 1h, 1 jour avant)
      const reminderTimes = [15, 60, 1440]; // minutes
      
      for (const time of reminderTimes) {
        await fetch(`${API_BASE_URL}/calendar/reminders`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            event_id: event.id,
            type: 'email',
            time_before_event: time
          })
        });
      }

      return true;
    } catch (error) {
      console.error('Erreur programmation rappels:', error);
      return false;
    }
  }

  /**
   * Notifier les participants d'un événement (fallback vers Supabase)
   */
  async notifyEventParticipants(
    eventId: string,
    eventTitle: string,
    participantIds: string[],
    type: 'invitation' | 'update' | 'cancellation'
  ): Promise<boolean> {
    try {
      for (const participantId of participantIds) {
        await this.createEventNotification(
          participantId,
          'client', // À améliorer avec le vrai type
          eventId,
          eventTitle,
          type === 'invitation' ? 'confirmation' : type
        );
      }
      return true;
    } catch (error) {
      console.error('Erreur notification participants:', error);
      return false;
    }
  }

  /**
   * Récupérer les experts validés (fallback vers Supabase)
   */
  async getValidatedExperts(): Promise<ValidatedExpert[]> {
    try {
      const { data, error } = await supabase
        .from('Expert')
        .select('id, email, name, specializations')
        .eq('status', 'validé')
        .order('name');

      if (error) throw error;
      return (data || []).map((expert: any) => ({
        id: expert.id,
        email: expert.email,
        name: expert.name,
        specializations: expert.specializations || [],
        validated: true
      }));
    } catch (error) {
      console.error('Erreur récupération experts:', error);
      return [];
    }
  }

  /**
   * Récupérer les dossiers du client (fallback vers Supabase)
   */
  async getClientDossiers(clientId: string): Promise<ClientDossier[]> {
    try {
      const { data, error } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          clientId,
          produitId,
          statut,
          created_at
        `)
        .eq('clientId', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((dossier: any) => ({
        id: dossier.id,
        name: `Dossier ${dossier.id}`,
        product_type: `Produit ${dossier.produitId}`,
        status: dossier.statut,
        created_at: dossier.created_at
      }));
    } catch (error) {
      console.error('Erreur récupération dossiers:', error);
      return [];
    }
  }

  /**
   * Obtenir le token d'authentification
   */
  private async getAuthToken(): Promise<string> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.access_token) {
      throw new Error('Token d\'authentification non disponible');
    }
    return session.access_token;
  }

  /**
   * Génère un message de notification selon le type et le titre de l'événement
   */
  private getNotificationMessage(type: 'confirmation' | 'reminder' | 'update' | 'cancellation', eventTitle: string): string {
    switch (type) {
      case 'confirmation':
        return `Votre événement "${eventTitle}" a bien été confirmé.`;
      case 'reminder':
        return `Rappel : l'événement "${eventTitle}" approche.`;
      case 'update':
        return `L'événement "${eventTitle}" a été mis à jour.`;
      case 'cancellation':
        return `L'événement "${eventTitle}" a été annulé.`;
      default:
        return `Notification concernant l'événement "${eventTitle}".`;
    }
  }
}

export const calendarService = new CalendarService(); 