

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  is_online: boolean;
  meeting_url?: string;
  color: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  type: 'meeting' | 'appointment' | 'reminder' | 'deadline' | 'consultation' | 'audit' | 'presentation' | 'follow_up';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'client' | 'expert' | 'admin' | 'system' | 'collaborative';
  dossier_id?: string;
  client_id?: string;
  expert_id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: any;
}

export interface CreateEventData {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  is_online?: boolean;
  meeting_url?: string;
  type: CalendarEvent['type'];
  priority?: CalendarEvent['priority'];
  category?: CalendarEvent['category'];
  dossier_id?: string;
  color?: string;
  metadata?: any;
}

export interface UpdateEventData extends Partial<CreateEventData> {
  id: string;
}

export interface CalendarStats {
  eventsToday: number;
  meetingsThisWeek: number;
  overdueDeadlines: number;
  documentsToValidate: number;
}

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

class CalendarService {
  private baseUrl = '/api/calendar';

  // ===== GESTION DES ÉVÉNEMENTS =====

  /**
   * Récupérer tous les événements
   */
  async getEvents(filters: {
    start_date?: string;
    end_date?: string;
    type?: string;
    category?: string;
    dossier_id?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<CalendarEvent[]> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}/events?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('❌ Erreur récupération événements:', error);
      throw error;
    }
  }

  /**
   * Créer un nouvel événement
   */
  async createEvent(eventData: CreateEventData): Promise<CalendarEvent> {
    try {
      const response = await fetch(`${this.baseUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création de l\'événement');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Erreur création événement:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un événement
   */
  async updateEvent(eventData: UpdateEventData): Promise<CalendarEvent> {
    try {
      const { id, ...updateData } = eventData;
      
      const response = await fetch(`${this.baseUrl}/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la mise à jour de l\'événement');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Erreur mise à jour événement:', error);
      throw error;
    }
  }

  /**
   * Supprimer un événement
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression de l\'événement');
      }
    } catch (error) {
      console.error('❌ Erreur suppression événement:', error);
      throw error;
    }
  }

  // ===== STATISTIQUES =====

  /**
   * Récupérer les statistiques du calendrier
   */
  async getStats(filters: {
    start_date?: string;
    end_date?: string;
  } = {}): Promise<CalendarStats> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}/stats?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Erreur récupération statistiques:', error);
      throw error;
    }
  }

  // ===== ÉTAPES DE DOSSIER =====

  /**
   * Récupérer les étapes de dossier
   */
  async getDossierSteps(filters: {
    dossier_id?: string;
    status?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}/steps?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('❌ Erreur récupération étapes:', error);
      throw error;
    }
  }

  /**
   * Créer une étape de dossier
   */
  async createDossierStep(stepData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/steps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(stepData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création de l\'étape');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Erreur création étape:', error);
      throw error;
    }
  }

  // ===== RAPPELS =====

  /**
   * Récupérer les rappels d'un événement
   */
  async getEventReminders(eventId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/events/${eventId}/reminders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('❌ Erreur récupération rappels:', error);
      throw error;
    }
  }

  /**
   * Créer un rappel pour un événement
   */
  async createReminder(reminderData: {
    event_id: string;
    type: string;
    time_before_event: number;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reminderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du rappel');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Erreur création rappel:', error);
      throw error;
    }
  }
}

// ============================================================================
// INSTANCE EXPORTÉE
// ============================================================================

export const calendarService = new CalendarService(); 