// @ts-ignore
import { google } from 'googleapis';
// @ts-ignore
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
      profitumDossierId?: string;
      profitumStepId?: string;
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

// Types pour les réponses Google API
interface GoogleTokenInfo {
  audience: string;
  expires_in: number;
  scope: string;
  user_id: string;
}

interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
}

export interface SyncOptions {
  syncDirection: 'import' | 'export' | 'bidirectional';
  timeRange: {
    start: Date;
    end: Date;
  };
  resolveConflicts: boolean;
  createMissingEvents: boolean;
  updateExistingEvents: boolean;
  deleteOrphanedEvents: boolean;
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

export interface SyncProgress {
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  startTime: number;
  endTime?: number;
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function convertGoogleEventDateTime(dateTime: any): { dateTime?: string; date?: string; timeZone?: string } {
  if (!dateTime) return {};
  
  if (dateTime.dateTime) {
    return {
      dateTime: dateTime.dateTime,
      timeZone: dateTime.timeZone || 'Europe/Paris'
    };
  }
  
  if (dateTime.date) {
    return {
      date: dateTime.date,
      timeZone: dateTime.timeZone || 'Europe/Paris'
    };
  }
  
  return {};
}

function convertGoogleEventAttendees(attendees: any[] | undefined): Array<{ email: string; displayName?: string; responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted' }> | undefined {
  if (!attendees || !Array.isArray(attendees)) return undefined;
  
  return attendees.map(attendee => ({
    email: attendee.email,
    displayName: attendee.displayName,
    responseStatus: attendee.responseStatus || 'needsAction'
  }));
}

function convertGoogleConferenceData(conferenceData: any): GoogleEvent['conferenceData'] | undefined {
  if (!conferenceData) return undefined;
  
  if (conferenceData.createRequest) {
    return {
      createRequest: {
        requestId: conferenceData.createRequest.requestId,
        conferenceSolutionKey: {
          type: conferenceData.createRequest.conferenceSolutionKey?.type || 'hangoutsMeet'
        }
      }
    };
  }
  
  if (conferenceData.entryPoints) {
    return {
      entryPoints: conferenceData.entryPoints.map((entry: any) => ({
        uri: entry.uri,
        entryPointType: entry.entryPointType
      }))
    };
  }
  
  return undefined;
}

function convertGoogleReminders(reminders: any): GoogleEvent['reminders'] | undefined {
  if (!reminders) return undefined;
  
  return {
    useDefault: reminders.useDefault || false,
    overrides: reminders.overrides?.map((override: any) => ({
      method: override.method,
      minutes: override.minutes
    }))
  };
}

function convertGoogleExtendedProperties(extendedProperties: any): GoogleEvent['extendedProperties'] | undefined {
  if (!extendedProperties) return undefined;
  
  return {
    private: {
      profitumEventId: extendedProperties.private?.profitumEventId,
      profitumUserId: extendedProperties.private?.profitumUserId,
      profitumUserType: extendedProperties.private?.profitumUserType,
      profitumDossierId: extendedProperties.private?.profitumDossierId,
      profitumStepId: extendedProperties.private?.profitumStepId
    }
  };
}

function convertGoogleEventToOurFormat(event: any): GoogleEvent {
  return {
    id: event.id,
    summary: event.summary,
    description: event.description,
    start: convertGoogleEventDateTime(event.start),
    end: convertGoogleEventDateTime(event.end),
    attendees: convertGoogleEventAttendees(event.attendees),
    location: event.location,
    conferenceData: convertGoogleConferenceData(event.conferenceData),
    reminders: convertGoogleReminders(event.reminders),
    extendedProperties: convertGoogleExtendedProperties(event.extendedProperties)
  };
}

function convertFreeBusyResponse(response: any): FreeBusyInfo {
  return {
    timeMin: response.timeMin,
    timeMax: response.timeMax,
    calendars: response.calendars || {}
  };
}

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

export class GoogleCalendarService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly defaultTimezone: string;
  private readonly defaultReminderMinutes: number;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI || '';
    this.defaultTimezone = process.env.GOOGLE_CALENDAR_TIMEZONE_DEFAULT || 'Europe/Paris';
    this.defaultReminderMinutes = parseInt(process.env.GOOGLE_CALENDAR_DEFAULT_REMINDER_MINUTES || '15');

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      console.warn('⚠️ Variables d\'environnement Google Calendar manquantes');
    }
  }

  // ===== AUTHENTIFICATION OAuth2 =====

  /**
   * Générer l'URL d'autorisation OAuth2
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
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: state
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
      throw new Error('Échec de l\'échange de tokens');
    }
  }

  /**
   * Rafraîchir les tokens expirés
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
   * Lister les calendriers disponibles
   */
  async listCalendars(accessToken: string): Promise<GoogleCalendar[]> {
    const oauth2Client = this.getOAuth2Client(accessToken);
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
      console.error('❌ Erreur liste calendriers:', error);
      throw new Error('Impossible de récupérer les calendriers');
    }
  }

  /**
   * Vérifier la disponibilité des calendriers
   */
  async getFreeBusy(
    accessToken: string,
    calendarIds: string[],
    timeMin: Date,
    timeMax: Date
  ): Promise<FreeBusyInfo> {
    const oauth2Client = this.getOAuth2Client(accessToken);
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
      console.error('❌ Erreur vérification disponibilité:', error);
      throw new Error('Impossible de vérifier la disponibilité');
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
    const oauth2Client = this.getOAuth2Client(accessToken);
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
      return events.map(convertGoogleEventToOurFormat);
    } catch (error) {
      console.error('❌ Erreur liste événements:', error);
      throw new Error('Impossible de récupérer les événements');
    }
  }

  /**
   * Créer un événement
   */
  async createEvent(
    accessToken: string,
    calendarId: string,
    event: GoogleEvent
  ): Promise<GoogleEvent> {
    const oauth2Client = this.getOAuth2Client(accessToken);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      const response = await calendar.events.insert({
        calendarId,
        requestBody: event,
        sendUpdates: 'all',
        conferenceDataVersion: event.conferenceData ? 1 : 0
      });

      return convertGoogleEventToOurFormat(response.data);
    } catch (error) {
      console.error('❌ Erreur création événement:', error);
      throw new Error('Impossible de créer l\'événement');
    }
  }

  /**
   * Mettre à jour un événement
   */
  async updateEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
    event: GoogleEvent
  ): Promise<GoogleEvent> {
    const oauth2Client = this.getOAuth2Client(accessToken);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      const response = await calendar.events.update({
        calendarId,
        eventId,
        requestBody: event,
        sendUpdates: 'all',
        conferenceDataVersion: event.conferenceData ? 1 : 0
      });

      return convertGoogleEventToOurFormat(response.data);
    } catch (error) {
      console.error('❌ Erreur mise à jour événement:', error);
      throw new Error('Impossible de mettre à jour l\'événement');
    }
  }

  /**
   * Supprimer un événement
   */
  async deleteEvent(
    accessToken: string,
    calendarId: string,
    eventId: string
  ): Promise<boolean> {
    const oauth2Client = this.getOAuth2Client(accessToken);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      await calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates: 'all'
      });

      return true;
    } catch (error) {
      console.error('❌ Erreur suppression événement:', error);
      throw new Error('Impossible de supprimer l\'événement');
    }
  }

  // ===== CONVERSION DE FORMATS =====

  /**
   * Convertir un événement Profitum vers Google
   */
  convertProfitumToGoogleEvent(profitumEvent: CalendarEvent): GoogleEvent {
    const isOnline = profitumEvent.is_online || false;
    
    return {
      summary: profitumEvent.title,
      description: profitumEvent.description || '',
      start: {
        dateTime: profitumEvent.start_date,
        timeZone: this.defaultTimezone
      },
      end: {
        dateTime: profitumEvent.end_date,
        timeZone: this.defaultTimezone
      },
      location: profitumEvent.location,
      attendees: profitumEvent.participants?.map((email: string) => ({
        email,
        responseStatus: 'needsAction'
      })),
      conferenceData: isOnline ? {
        createRequest: {
          requestId: `profitum-${profitumEvent.id}-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      } : undefined,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: this.defaultReminderMinutes },
          { method: 'email', minutes: this.defaultReminderMinutes * 4 }
        ]
      },
      extendedProperties: {
        private: {
          profitumEventId: profitumEvent.id,
          profitumUserId: profitumEvent.client_id || profitumEvent.expert_id,
          profitumUserType: profitumEvent.category,
          profitumDossierId: profitumEvent.dossier_id,
          profitumStepId: profitumEvent.metadata?.stepId
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
        source: 'google',
        stepId: googleEvent.extendedProperties?.private?.profitumStepId,
        dossierId: googleEvent.extendedProperties?.private?.profitumDossierId
      }
    };
  }

  // ===== GESTION DES INTÉGRATIONS =====

  /**
   * Sauvegarder une intégration
   */
  async saveIntegration(integration: Omit<GoogleCalendarIntegration, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('GoogleCalendarIntegration')
        .insert(integration)
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('❌ Erreur sauvegarde intégration:', error);
      throw new Error('Impossible de sauvegarder l\'intégration');
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

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Erreur récupération intégrations:', error);
      throw new Error('Impossible de récupérer les intégrations');
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

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('❌ Erreur mise à jour intégration:', error);
      throw new Error('Impossible de mettre à jour l\'intégration');
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

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('❌ Erreur suppression intégration:', error);
      throw new Error('Impossible de supprimer l\'intégration');
    }
  }

  // ===== UTILITAIRES =====

  /**
   * Vérifier si un token est expiré
   */
  isTokenExpired(expiryDate: number): boolean {
    const now = Date.now();
    const buffer = 5 * 60 * 1000; // 5 minutes de marge
    return now >= (expiryDate - buffer);
  }

  /**
   * Créer un client OAuth2
   */
  private getOAuth2Client(accessToken: string): OAuth2Client {
    const oauth2Client = new OAuth2Client(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );
    
    oauth2Client.setCredentials({
      access_token: accessToken
    });
    
    return oauth2Client;
  }

  /**
   * Valider les tokens Google
   * ✅ Validation côté serveur sécurisée
   */
  async validateTokens(accessToken: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
      
      if (!response.ok) {
        return { valid: false, error: 'Token invalide' };
      }

      const tokenInfo = await response.json() as GoogleTokenInfo;
      
      // Vérifier que le token appartient à notre application
      if (tokenInfo.audience !== this.clientId) {
        return { valid: false, error: 'Token ne correspond pas à notre application' };
      }

      // Vérifier que le token n'a pas expiré
      if (tokenInfo.expires_in <= 0) {
        return { valid: false, error: 'Token expiré' };
      }

      return { valid: true };
    } catch (error) {
      console.error('❌ Erreur validation tokens:', error);
      return { valid: false, error: 'Erreur lors de la validation' };
    }
  }

  /**
   * Récupérer les informations utilisateur depuis Google
   * ✅ Validation des données reçues
   */
  async getUserInfo(accessToken: string): Promise<{ email: string; name: string; picture?: string } | null> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Impossible de récupérer les informations utilisateur');
      }

      const userInfo = await response.json() as GoogleUserInfo;
      
      // Validation des données requises
      if (!userInfo.email || !userInfo.name) {
        throw new Error('Informations utilisateur incomplètes');
      }

      return {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      };
    } catch (error) {
      console.error('❌ Erreur récupération infos utilisateur:', error);
      return null;
    }
  }

  /**
   * Configurer l'intégration Google Calendar pour un utilisateur
   * ✅ Validation des permissions
   * ✅ Sécurisation des données
   */
  async setupUserIntegration(userId: string, tokens: GoogleAuthTokens): Promise<void> {
    try {
      // Vérifier que l'utilisateur existe
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier les permissions Google Calendar
      const hasCalendarScope = tokens.scope?.includes('https://www.googleapis.com/auth/calendar');
      if (!hasCalendarScope) {
        throw new Error('Permissions Google Calendar insuffisantes');
      }

      // Créer ou mettre à jour l'intégration
      const { error: integrationError } = await supabase
        .from('GoogleCalendarIntegration')
        .upsert({
          user_id: userId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date,
          scope: tokens.scope,
          is_primary: true,
          sync_status: 'idle',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (integrationError) {
        throw integrationError;
      }

      console.log(`✅ Intégration Google Calendar configurée pour l'utilisateur ${userId}`);
    } catch (error) {
      console.error('❌ Erreur configuration intégration:', error);
      throw error;
    }
  }

  /**
   * Révoquer les tokens Google d'un utilisateur
   * ✅ Sécurisation de la révocation
   */
  async revokeUserTokens(userId: string): Promise<void> {
    try {
      // Récupérer les tokens de l'utilisateur
      const { data: integration, error } = await supabase
        .from('GoogleCalendarIntegration')
        .select('access_token, refresh_token')
        .eq('user_id', userId)
        .single();

      if (error || !integration) {
        console.log(`ℹ️ Aucune intégration trouvée pour l'utilisateur ${userId}`);
        return;
      }

      // Révoquer le token d'accès
      if (integration.access_token) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${integration.access_token}`, {
          method: 'POST'
        });
      }

      // Révoquer le refresh token
      if (integration.refresh_token) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${integration.refresh_token}`, {
          method: 'POST'
        });
      }

      console.log(`✅ Tokens révoqués pour l'utilisateur ${userId}`);
    } catch (error) {
      console.error('❌ Erreur révocation tokens:', error);
      // Ne pas faire échouer la déconnexion si la révocation échoue
    }
  }
}

// Instance singleton
export const googleCalendarService = new GoogleCalendarService(); 