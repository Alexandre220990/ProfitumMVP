import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { supabase } from '../lib/supabase';
import { CalendarEvent } from '../types/calendar';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export interface GoogleAuthTokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
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
    entryPoints?: Array<{
      uri: string;
      entryPointType: string;
    }>;
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

export interface SyncResult {
  success: boolean;
  eventsProcessed: number;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  errors: string[];
  duration: number;
}

// ============================================================================
// FONCTIONS UTILITAIRES DE CONVERSION
// ============================================================================

function convertGoogleEventDateTime(dateTime: any): { dateTime?: string; date?: string; timeZone?: string } {
  if (!dateTime) return {};
  
  return {
    dateTime: dateTime.dateTime || undefined,
    date: dateTime.date || undefined,
    timeZone: dateTime.timeZone || undefined
  };
}

function convertGoogleEventAttendees(attendees: any[] | undefined): Array<{ email: string; displayName?: string; responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted' }> | undefined {
  if (!attendees) return undefined;
  
  return attendees
    .filter(attendee => attendee.email)
    .map(attendee => ({
      email: attendee.email!,
      displayName: attendee.displayName || undefined,
      responseStatus: attendee.responseStatus as any || 'needsAction'
    }));
}

function convertGoogleConferenceData(conferenceData: any): GoogleEvent['conferenceData'] | undefined {
  if (!conferenceData) return undefined;
  
  return {
    createRequest: conferenceData.createRequest ? {
      requestId: conferenceData.createRequest.requestId || '',
      conferenceSolutionKey: {
        type: conferenceData.createRequest.conferenceSolutionKey?.type || 'hangoutsMeet'
      }
    } : undefined,
    entryPoints: conferenceData.entryPoints?.map((ep: any) => ({
      uri: ep.uri || '',
      entryPointType: ep.entryPointType || 'video'
    }))
  };
}

function convertGoogleReminders(reminders: any): GoogleEvent['reminders'] | undefined {
  if (!reminders) return undefined;
  
  return {
    useDefault: reminders.useDefault || false,
    overrides: reminders.overrides?.map((override: any) => ({
      method: override.method as 'email' | 'popup',
      minutes: override.minutes || 0
    }))
  };
}

function convertGoogleExtendedProperties(extendedProperties: any): GoogleEvent['extendedProperties'] | undefined {
  if (!extendedProperties || !extendedProperties.private) return undefined;
  
  return {
    private: {
      profitumEventId: extendedProperties.private.profitumEventId || undefined,
      profitumUserId: extendedProperties.private.profitumUserId || undefined,
      profitumUserType: extendedProperties.private.profitumUserType || undefined
    }
  };
}

function convertGoogleEventToOurFormat(event: any): GoogleEvent {
  return {
    id: event.id || undefined,
    summary: event.summary || 'Événement sans titre',
    description: event.description || undefined,
    start: convertGoogleEventDateTime(event.start),
    end: convertGoogleEventDateTime(event.end),
    attendees: convertGoogleEventAttendees(event.attendees),
    location: event.location || undefined,
    conferenceData: convertGoogleConferenceData(event.conferenceData),
    reminders: convertGoogleReminders(event.reminders),
    extendedProperties: convertGoogleExtendedProperties(event.extendedProperties)
  };
}

function convertFreeBusyResponse(response: any): FreeBusyInfo {
  const calendars: { [calendarId: string]: { busy: Array<{ start: string; end: string; }> } } = {};
  
  if (response.calendars) {
    Object.keys(response.calendars).forEach(calendarId => {
      const calendar = response.calendars[calendarId];
      calendars[calendarId] = {
        busy: (calendar.busy || []).map((period: any) => ({
          start: period.start || '',
          end: period.end || ''
        }))
      };
    });
  }
  
  return {
    timeMin: response.timeMin || '',
    timeMax: response.timeMax || '',
    calendars
  };
}

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

export class GoogleCalendarService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI || '';

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      console.warn('⚠️ Variables d\'environnement Google Calendar manquantes');
    }
  }

  // ===== AUTHENTIFICATION OAUTH2 =====

  /**
   * Générer l'URL d'autorisation Google OAuth2
   */
  generateAuthUrl(state?: string): string {
    const oauth2Client = new OAuth2Client(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly'
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: state || 'default'
    });
  }

  /**
   * Échanger le code d'autorisation contre des tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleAuthTokens> {
    const oauth2Client = new OAuth2Client(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );

    try {
      const { tokens } = await oauth2Client.getToken(code);
      
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Tokens incomplets reçus de Google');
      }

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope || '',
        token_type: tokens.token_type || 'Bearer',
        expiry_date: tokens.expiry_date || 0
      };
    } catch (error) {
      console.error('❌ Erreur échange code contre tokens:', error);
      throw new Error('Échec de l\'authentification Google');
    }
  }

  /**
   * Rafraîchir les tokens d'accès
   */
  async refreshTokens(refreshToken: string): Promise<GoogleAuthTokens> {
    const oauth2Client = new OAuth2Client(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      return {
        access_token: credentials.access_token!,
        refresh_token: credentials.refresh_token || refreshToken,
        scope: credentials.scope || '',
        token_type: credentials.token_type || 'Bearer',
        expiry_date: credentials.expiry_date || 0
      };
    } catch (error) {
      console.error('❌ Erreur rafraîchissement tokens:', error);
      throw new Error('Échec du rafraîchissement des tokens');
    }
  }

  // ===== GESTION DES CALENDRERS =====

  /**
   * Lister les calendriers Google disponibles
   */
  async listCalendars(accessToken: string): Promise<GoogleCalendar[]> {
    const oauth2Client = new OAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      const response = await calendar.calendarList.list();
      const calendars = response.data.items || [];

      return calendars.map(cal => ({
        id: cal.id!,
        summary: cal.summary || 'Calendrier sans nom',
        description: cal.description || undefined,
        primary: cal.primary || false,
        accessRole: cal.accessRole as any,
        selected: cal.selected || false
      }));
    } catch (error) {
      console.error('❌ Erreur récupération calendriers:', error);
      throw new Error('Impossible de récupérer les calendriers Google');
    }
  }

  /**
   * Obtenir les informations de disponibilité
   */
  async getFreeBusy(
    accessToken: string,
    calendarIds: string[],
    timeMin: Date,
    timeMax: Date
  ): Promise<FreeBusyInfo> {
    const oauth2Client = new OAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          items: calendarIds.map(id => ({ id }))
        }
      });

      return convertFreeBusyResponse(response.data);
    } catch (error) {
      console.error('❌ Erreur récupération disponibilité:', error);
      throw new Error('Impossible de récupérer la disponibilité');
    }
  }

  // ===== GESTION DES ÉVÉNEMENTS =====

  /**
   * Lister les événements d'un calendrier
   */
  async listEvents(
    accessToken: string,
    calendarId: string,
    timeMin: Date,
    timeMax: Date,
    maxResults: number = 100
  ): Promise<GoogleEvent[]> {
    const oauth2Client = new OAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      const response = await calendar.events.list({
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events = response.data.items || [];
      return events.map(event => convertGoogleEventToOurFormat(event));
    } catch (error) {
      console.error('❌ Erreur récupération événements:', error);
      throw new Error('Impossible de récupérer les événements Google');
    }
  }

  /**
   * Créer un événement Google
   */
  async createEvent(
    accessToken: string,
    calendarId: string,
    event: GoogleEvent
  ): Promise<GoogleEvent> {
    const oauth2Client = new OAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      const response = await calendar.events.insert({
        calendarId,
        requestBody: event,
        sendUpdates: 'all'
      });

      return convertGoogleEventToOurFormat(response.data);
    } catch (error) {
      console.error('❌ Erreur création événement Google:', error);
      throw new Error('Impossible de créer l\'événement Google');
    }
  }

  /**
   * Mettre à jour un événement Google
   */
  async updateEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
    event: GoogleEvent
  ): Promise<GoogleEvent> {
    const oauth2Client = new OAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      const response = await calendar.events.update({
        calendarId,
        eventId,
        requestBody: event,
        sendUpdates: 'all'
      });

      return convertGoogleEventToOurFormat(response.data);
    } catch (error) {
      console.error('❌ Erreur mise à jour événement Google:', error);
      throw new Error('Impossible de mettre à jour l\'événement Google');
    }
  }

  /**
   * Supprimer un événement Google
   */
  async deleteEvent(
    accessToken: string,
    calendarId: string,
    eventId: string
  ): Promise<boolean> {
    const oauth2Client = new OAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      await calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates: 'all'
      });

      return true;
    } catch (error) {
      console.error('❌ Erreur suppression événement Google:', error);
      throw new Error('Impossible de supprimer l\'événement Google');
    }
  }

  // ===== CONVERSION DE FORMATS =====

  /**
   * Convertir un événement Profitum vers Google
   */
  convertProfitumToGoogleEvent(profitumEvent: CalendarEvent): GoogleEvent {
    return {
      summary: profitumEvent.title,
      description: profitumEvent.description || '',
      start: {
        dateTime: profitumEvent.start_date,
        timeZone: 'Europe/Paris'
      },
      end: {
        dateTime: profitumEvent.end_date,
        timeZone: 'Europe/Paris'
      },
      location: profitumEvent.location,
      attendees: profitumEvent.participants?.map((email: string) => ({
        email,
        responseStatus: 'needsAction'
      })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 15 },
          { method: 'email', minutes: 60 }
        ]
      },
      extendedProperties: {
        private: {
          profitumEventId: profitumEvent.id,
          profitumUserId: profitumEvent.client_id || profitumEvent.expert_id,
          profitumUserType: profitumEvent.category
        }
      }
    };
  }

  /**
   * Convertir un événement Google vers Profitum
   */
  convertGoogleToProfitumEvent(
    googleEvent: GoogleEvent,
    integration: GoogleCalendarIntegration
  ): Partial<CalendarEvent> {
    const startDate = googleEvent.start?.dateTime || googleEvent.start?.date;
    const endDate = googleEvent.end?.dateTime || googleEvent.end?.date;

    return {
      title: googleEvent.summary || 'Événement sans titre',
      description: googleEvent.description || '',
      start_date: startDate || new Date().toISOString(),
      end_date: endDate || new Date().toISOString(),
      type: 'meeting',
      priority: 'medium',
      status: 'confirmed',
      category: integration.user_type as any,
      location: googleEvent.location,
      is_online: !!googleEvent.conferenceData,
      meeting_url: googleEvent.conferenceData?.entryPoints?.[0]?.uri,
      color: '#4285F4', // Couleur Google
      participants: googleEvent.attendees?.map(a => a.email) || [],
      metadata: {
        googleEventId: googleEvent.id,
        googleCalendarId: integration.calendar_id,
        source: 'google'
      }
    };
  }

  // ===== GESTION DES INTÉGRATIONS =====

  /**
   * Sauvegarder une intégration Google Calendar
   */
  async saveIntegration(integration: Omit<GoogleCalendarIntegration, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('GoogleCalendarIntegration')
        .insert({
          ...integration,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Erreur sauvegarde intégration:', error);
        throw new Error('Impossible de sauvegarder l\'intégration');
      }

      return data.id;
    } catch (error) {
      console.error('❌ Erreur sauvegarde intégration:', error);
      throw error;
    }
  }

  /**
   * Récupérer les intégrations d'un utilisateur
   */
  async getUserIntegrations(userId: string): Promise<GoogleCalendarIntegration[]> {
    try {
      const { data, error } = await supabase
        .from('GoogleCalendarIntegration')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur récupération intégrations:', error);
        throw new Error('Impossible de récupérer les intégrations');
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erreur récupération intégrations:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une intégration
   */
  async updateIntegration(
    integrationId: string,
    updates: Partial<GoogleCalendarIntegration>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('GoogleCalendarIntegration')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', integrationId);

      if (error) {
        console.error('❌ Erreur mise à jour intégration:', error);
        throw new Error('Impossible de mettre à jour l\'intégration');
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
      const { error } = await supabase
        .from('GoogleCalendarIntegration')
        .delete()
        .eq('id', integrationId);

      if (error) {
        console.error('❌ Erreur suppression intégration:', error);
        throw new Error('Impossible de supprimer l\'intégration');
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur suppression intégration:', error);
      throw error;
    }
  }

  /**
   * Vérifier si les tokens sont expirés
   */
  isTokenExpired(expiryDate: number): boolean {
    return Date.now() >= expiryDate;
  }

  /**
   * Obtenir un client OAuth2 configuré
   */
  private getOAuth2Client(accessToken: string): OAuth2Client {
    const oauth2Client = new OAuth2Client(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );
    oauth2Client.setCredentials({ access_token: accessToken });
    return oauth2Client;
  }
}

// Instance singleton
export const googleCalendarService = new GoogleCalendarService(); 