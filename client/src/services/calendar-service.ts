import { getSupabaseToken } from '@/lib/auth-helpers';

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
  type: 'appointment' | 'deadline' | 'meeting' | 'task' | 'reminder';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'client' | 'expert' | 'admin' | 'system' | 'collaborative';
  dossier_id?: string;
  client_id?: string;
  expert_id?: string;
  participants?: any[];
  client_info?: {
    id: string;
    first_name: string;
    last_name: string;
    company_name: string;
    full_name: string;
  };
  expert_info?: {
    id: string;
    first_name: string;
    last_name: string;
    company_name: string;
    full_name: string;
  };
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
  client_id?: string;
  expert_id?: string;
  apporteur_id?: string;
  participants?: Array<{
    id: string;
    name?: string;
    email?: string;
    type?: string;
  }>;
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

export class CalendarServiceError extends Error {
  field?: string;
  status?: number;

  constructor(message: string, options?: { field?: string; status?: number }) {
    super(message);
    this.name = 'CalendarServiceError';
    this.field = options?.field;
    this.status = options?.status;
  }
}

class CalendarService {
  private baseUrl = `${import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app'}/api/calendar`;

  // ===== GESTION DES ÉVÉNEMENTS =====

  /**
   * Récupérer tous les événements (CalendarEvent + RDV unifiés)
   */
  async getEvents(filters: {
    start_date?: string;
    end_date?: string;
    type?: string;
    status?: string;
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

      // 1. Récupérer les événements CalendarEvent classiques
      const calendarResponse = await fetch(`${this.baseUrl}/events?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getSupabaseToken()}`
        }
      });

      let calendarEvents: CalendarEvent[] = [];
      if (calendarResponse.ok) {
        const calendarResult = await calendarResponse.json();
        calendarEvents = calendarResult.data || [];
      }

      // 2. Récupérer les RDV et les transformer en CalendarEvent
      try {
        const rdvBaseUrl = `${import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app'}/api/rdv`;
        const rdvParams = new URLSearchParams();
        rdvParams.append('format', 'calendar'); // Demander format CalendarEvent
        if (filters.start_date) rdvParams.append('start_date', filters.start_date);
        if (filters.end_date) rdvParams.append('end_date', filters.end_date);
        if (filters.status) rdvParams.append('status', filters.status);
        if (filters.category) rdvParams.append('category', filters.category);
        
        const rdvResponse = await fetch(`${rdvBaseUrl}?${rdvParams}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getSupabaseToken()}`
          }
        });

        if (rdvResponse.ok) {
          const rdvResult = await rdvResponse.json();
          const rdvEvents = rdvResult.data || [];
          
          // Transformer les RDV en format CalendarEvent
          const transformedRDVs = rdvEvents.map((rdv: any) => this.transformRDVToCalendarEvent(rdv));
          
          // 3. Fusionner et trier
          const allEvents = [...calendarEvents, ...transformedRDVs]
            .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
          
          return allEvents;
        }
      } catch (rdvError) {
        console.warn('⚠️ Erreur récupération RDV, retour CalendarEvent uniquement:', rdvError);
      }

      // Retourner au moins les CalendarEvent si RDV échoue
      return calendarEvents;
      
    } catch (error) {
      console.error('❌ Erreur récupération événements calendrier:', error);
      return [];
    }
  }

  /**
   * Transformer un RDV en CalendarEvent
   */
  private transformRDVToCalendarEvent(rdv: any): CalendarEvent {
    const startDateTime = `${rdv.scheduled_date}T${rdv.scheduled_time}`;
    const endDateTime = new Date(
      new Date(startDateTime).getTime() + (rdv.duration_minutes || 60) * 60000
    ).toISOString();

    return {
      id: rdv.id,
      title: rdv.title || 'RDV',
      description: rdv.description || rdv.notes,
      start_date: startDateTime,
      end_date: endDateTime,
      location: rdv.location,
      is_online: rdv.meeting_type === 'video',
      meeting_url: rdv.meeting_url,
      color: rdv.metadata?.color || this.getStatusColor(rdv.status),
      status: rdv.status,
      type: 'appointment',
      priority: this.getPriorityFromNumber(rdv.priority),
      category: rdv.category || 'client_rdv',
      client_id: rdv.client_id,
      expert_id: rdv.expert_id,
      created_by: rdv.created_by,
      created_at: rdv.created_at,
      updated_at: rdv.updated_at,
      metadata: {
        ...rdv.metadata,
        source: 'RDV',
        rdv_id: rdv.id,
        meeting_type: rdv.meeting_type,
        apporteur_id: rdv.apporteur_id,
        products: rdv.RDV_Produits || []
      }
    };
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'proposed': '#F59E0B',
      'confirmed': '#10B981',
      'completed': '#3B82F6',
      'cancelled': '#EF4444',
      'rescheduled': '#8B5CF6'
    };
    return colors[status] || '#6B7280';
  }

  private getPriorityFromNumber(priority?: number): 'low' | 'medium' | 'high' | 'critical' {
    if (!priority) return 'medium';
    if (priority >= 4) return 'critical';
    if (priority === 3) return 'high';
    if (priority === 2) return 'medium';
    return 'low';
  }

  /**
   * Créer un nouvel événement
   */
  async createEvent(eventData: CreateEventData): Promise<CalendarEvent> {
    try {
      console.log('🔍 Service calendar - Données envoyées:', eventData);
      
      const response = await fetch(`${this.baseUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getSupabaseToken()}`
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        let errorData: any = null;
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.warn('⚠️ Impossible de parser la réponse erreur calendrier:', parseError);
        }
        throw new CalendarServiceError(
          errorData?.message || 'Erreur lors de la création de l\'événement',
          { field: errorData?.field, status: response.status }
        );
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
          'Authorization': `Bearer ${await getSupabaseToken()}`
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
          'Authorization': `Bearer ${await getSupabaseToken()}`
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
          'Authorization': `Bearer ${await getSupabaseToken()}`
        }
      });

      if (!response.ok) {
        // Gestion spécifique des erreurs
        if (response.status === 404) {
          console.warn('⚠️ Endpoint stats calendrier non trouvé - retourner stats par défaut');
          return {
            eventsToday: 0,
            meetingsThisWeek: 0,
            overdueDeadlines: 0,
            documentsToValidate: 0
          };
        }
        if (response.status === 401) {
          console.warn('⚠️ Non authentifié pour les stats calendrier - retourner stats par défaut');
          return {
            eventsToday: 0,
            meetingsThisWeek: 0,
            overdueDeadlines: 0,
            documentsToValidate: 0
          };
        }
        throw new Error(`Erreur stats calendrier: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || {
        eventsToday: 0,
        meetingsThisWeek: 0,
        overdueDeadlines: 0,
        documentsToValidate: 0
      };
    } catch (error) {
      console.error('❌ Erreur récupération stats calendrier:', error);
      // Retourner des stats par défaut au lieu de lancer une exception
      return {
        eventsToday: 0,
        meetingsThisWeek: 0,
        overdueDeadlines: 0,
        documentsToValidate: 0
      };
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
          'Authorization': `Bearer ${await getSupabaseToken()}`
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
          'Authorization': `Bearer ${await getSupabaseToken()}`
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
          'Authorization': `Bearer ${await getSupabaseToken()}`
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
          'Authorization': `Bearer ${await getSupabaseToken()}`
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