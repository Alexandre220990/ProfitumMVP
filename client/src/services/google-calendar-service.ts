import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export interface GoogleCalendarIntegration {
  id: string;
  user_id: string;
  user_type: 'client' | 'expert' | 'admin';
  google_account_email: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  calendar_id: string;
  is_primary: boolean;
  sync_enabled: boolean;
  sync_direction: 'import' | 'export' | 'bidirectional';
  last_sync_at?: string;
  sync_status: 'idle' | 'syncing' | 'error';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole: 'owner' | 'writer' | 'reader' | 'freeBusyReader';
  selected?: boolean;
}

export interface GoogleEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  location?: string;
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
    };
  };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  extendedProperties?: {
    private?: {
      profitumEventId?: string;
      profitumUserId?: string;
      profitumUserType?: string;
    };
  };
}

export interface FreeBusyInfo {
  timeMin: string;
  timeMax: string;
  calendars: {
    [calendarId: string]: {
      busy: Array<{
        start: string;
        end: string;
      }>;
    };
  };
}

export interface SyncResult {
  success: boolean;
  eventsProcessed: number;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  errors: string[];
  duration: number;
}

export interface ConnectIntegrationData {
  google_account_email: string;
  calendar_id?: string;
  is_primary?: boolean;
  sync_enabled?: boolean;
  sync_direction?: 'import' | 'export' | 'bidirectional';
  tokens?: string;
}

export interface UpdateIntegrationData {
  calendar_id?: string;
  is_primary?: boolean;
  sync_enabled?: boolean;
  sync_direction?: 'import' | 'export' | 'bidirectional';
}

// ============================================================================
// CONFIGURATION API
// ============================================================================

const API_BASE_URL = 'http://[::1]:5004/api';

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

class GoogleCalendarClientService {
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

  // ===== AUTHENTIFICATION OAUTH2 =====

  /**
   * Générer l'URL d'autorisation Google
   */
  async generateAuthUrl(state?: string): Promise<{ authUrl: string; state: string }> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/google-calendar/auth/url?state=${state || ''}`, {
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
      return result.data;
    } catch (error) {
      console.error('❌ Erreur génération URL auth:', error);
      throw new Error('Impossible de générer l\'URL d\'autorisation');
    }
  }

  // ===== GESTION DES INTÉGRATIONS =====

  /**
   * Connecter un compte Google Calendar
   */
  async connectIntegration(data: ConnectIntegrationData): Promise<string> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/google-calendar/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data.integrationId;
    } catch (error) {
      console.error('❌ Erreur connexion intégration:', error);
      throw error;
    }
  }

  /**
   * Lister les intégrations de l'utilisateur
   */
  async getIntegrations(): Promise<GoogleCalendarIntegration[]> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/google-calendar/integrations`, {
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
      console.error('❌ Erreur récupération intégrations:', error);
      return [];
    }
  }

  /**
   * Récupérer une intégration spécifique
   */
  async getIntegration(integrationId: string): Promise<GoogleCalendarIntegration | null> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/google-calendar/integrations/${integrationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Erreur récupération intégration:', error);
      return null;
    }
  }

  /**
   * Mettre à jour une intégration
   */
  async updateIntegration(integrationId: string, data: UpdateIntegrationData): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/google-calendar/integrations/${integrationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur mise à jour intégration:', error);
      throw error;
    }
  }

  /**
   * Supprimer une intégration
   */
  async deleteIntegration(integrationId: string): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/google-calendar/integrations/${integrationId}`, {
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
      console.error('❌ Erreur suppression intégration:', error);
      throw error;
    }
  }

  // ===== GESTION DES CALENDRERS =====

  /**
   * Lister les calendriers Google disponibles
   */
  async getCalendars(integrationId: string): Promise<GoogleCalendar[]> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/google-calendar/calendars?integration_id=${integrationId}`, {
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
      console.error('❌ Erreur récupération calendriers:', error);
      return [];
    }
  }

  /**
   * Obtenir la disponibilité
   */
  async getFreeBusy(
    integrationId: string,
    calendarIds: string[],
    timeMin: Date,
    timeMax: Date
  ): Promise<FreeBusyInfo | null> {
    try {
      const token = await this.getAuthToken();
      const params = new URLSearchParams({
        integration_id: integrationId,
        calendar_ids: calendarIds.join(','),
        time_min: timeMin.toISOString(),
        time_max: timeMax.toISOString()
      });

      const response = await fetch(`${API_BASE_URL}/google-calendar/free-busy?${params}`, {
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
      return result.data;
    } catch (error) {
      console.error('❌ Erreur récupération disponibilité:', error);
      return null;
    }
  }

  // ===== SYNCHRONISATION =====

  /**
   * Déclencher une synchronisation
   */
  async syncCalendar(integrationId: string, syncType: string = 'full'): Promise<SyncResult | null> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/google-calendar/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          integration_id: integrationId,
          sync_type: syncType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error);
      throw error;
    }
  }

  // ===== UTILITAIRES =====

  /**
   * Vérifier si une intégration est connectée
   */
  async isConnected(): Promise<boolean> {
    try {
      const integrations = await this.getIntegrations();
      return integrations.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtenir l'intégration primaire
   */
  async getPrimaryIntegration(): Promise<GoogleCalendarIntegration | null> {
    try {
      const integrations = await this.getIntegrations();
      return integrations.find(integration => integration.is_primary) || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Vérifier le statut de synchronisation
   */
  async getSyncStatus(integrationId: string): Promise<'idle' | 'syncing' | 'error' | null> {
    try {
      const integration = await this.getIntegration(integrationId);
      return integration?.sync_status || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Formater une date pour l'affichage
   */
  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formater une durée
   */
  formatDuration(start: string | Date, end: string | Date): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h${diffMinutes > 0 ? ` ${diffMinutes}min` : ''}`;
    } else {
      return `${diffMinutes}min`;
    }
  }

  /**
   * Obtenir la couleur pour un type d'événement
   */
  getEventColor(type: string): string {
    const colors = {
      meeting: '#3B82F6',
      appointment: '#10B981',
      deadline: '#F59E0B',
      task: '#8B5CF6',
      reminder: '#EF4444',
      default: '#6B7280'
    };
    return colors[type as keyof typeof colors] || colors.default;
  }

  /**
   * Obtenir l'icône pour un type d'événement
   */
  getEventIcon(type: string): string {
    const icons = {
      meeting: 'users',
      appointment: 'calendar',
      deadline: 'clock',
      task: 'check-square',
      reminder: 'bell',
      default: 'calendar'
    };
    return icons[type as keyof typeof icons] || icons.default;
  }
}

// Instance singleton
export const googleCalendarClientService = new GoogleCalendarClientService(); 