import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { toast } from 'sonner';
import { 
  googleCalendarClientService, 
  GoogleCalendarIntegration, 
  GoogleCalendar,
  FreeBusyInfo,
  SyncResult,
  ConnectIntegrationData,
  UpdateIntegrationData
} from '@/services/google-calendar-service';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export interface GoogleCalendarState {
  integrations: GoogleCalendarIntegration[];
  primaryIntegration: GoogleCalendarIntegration | null;
  isConnected: boolean;
  loading: boolean;
  syncing: boolean;
}

export interface GoogleCalendarActions {
  connectIntegration: (data: ConnectIntegrationData) => Promise<string>;
  disconnectIntegration: (integrationId: string) => Promise<void>;
  updateIntegration: (integrationId: string, data: UpdateIntegrationData) => Promise<void>;
  syncCalendar: (integrationId: string, syncType?: string) => Promise<SyncResult | null>;
  getCalendars: (integrationId: string) => Promise<GoogleCalendar[]>;
  getFreeBusy: (integrationId: string, calendarIds: string[], timeMin: Date, timeMax: Date) => Promise<FreeBusyInfo | null>;
  refreshIntegrations: () => Promise<void>;
  generateAuthUrl: (state?: string) => Promise<{ authUrl: string; state: string }>;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useGoogleCalendar = (): GoogleCalendarState & GoogleCalendarActions => {
  const { user } = useAuth();
  
  const [integrations, setIntegrations] = useState<GoogleCalendarIntegration[]>([]);
  const [primaryIntegration, setPrimaryIntegration] = useState<GoogleCalendarIntegration | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Charger les intégrations au montage
  useEffect(() => {
    if (user?.id) {
      refreshIntegrations();
    }
  }, [user?.id]);

  // Mettre à jour l'état de connexion
  useEffect(() => {
    setIsConnected(integrations.length > 0);
    const primary = integrations.find(integration => integration.is_primary) || null;
    setPrimaryIntegration(primary);
  }, [integrations]);

  // Rafraîchir les intégrations
  const refreshIntegrations = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await googleCalendarClientService.getIntegrations();
      setIntegrations(data);
    } catch (error) {
      console.error('❌ Erreur chargement intégrations:', error);
      toast.error('Impossible de charger les intégrations Google Calendar');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Connecter une intégration
  const connectIntegration = useCallback(async (data: ConnectIntegrationData): Promise<string> => {
    try {
      const integrationId = await googleCalendarClientService.connectIntegration(data);
      
      toast.success('Votre compte Google Calendar a été connecté avec succès');

      await refreshIntegrations();
      return integrationId;
    } catch (error) {
      console.error('❌ Erreur connexion intégration:', error);
      toast.error(error instanceof Error ? error.message : 'Impossible de connecter l\'intégration');
      throw error;
    }
  }, [refreshIntegrations]);

  // Déconnecter une intégration
  const disconnectIntegration = useCallback(async (integrationId: string): Promise<void> => {
    try {
      await googleCalendarClientService.deleteIntegration(integrationId);
      
      toast.success('L\'intégration Google Calendar a été supprimée');

      await refreshIntegrations();
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
      toast.error('Impossible de supprimer l\'intégration');
      throw error;
    }
  }, [refreshIntegrations]);

  // Mettre à jour une intégration
  const updateIntegration = useCallback(async (integrationId: string, data: UpdateIntegrationData): Promise<void> => {
    try {
      await googleCalendarClientService.updateIntegration(integrationId, data);
      
      toast.success('L\'intégration a été mise à jour');

      await refreshIntegrations();
    } catch (error) {
      console.error('❌ Erreur mise à jour:', error);
      toast.error('Impossible de mettre à jour l\'intégration');
      throw error;
    }
  }, [refreshIntegrations]);

  // Synchroniser un calendrier
  const syncCalendar = useCallback(async (integrationId: string, syncType: string = 'full'): Promise<SyncResult | null> => {
    try {
      setSyncing(true);
      const result = await googleCalendarClientService.syncCalendar(integrationId, syncType);
      
      if (result) {
        if (result.success) {
          toast.success(`${result.eventsProcessed} événements traités`);
        } else {
          toast.error(result.errors.join(', '));
        }
      }

      await refreshIntegrations();
      return result;
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error);
      toast.error('Impossible de synchroniser le calendrier');
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [refreshIntegrations]);

  // Obtenir les calendriers
  const getCalendars = useCallback(async (integrationId: string): Promise<GoogleCalendar[]> => {
    try {
      return await googleCalendarClientService.getCalendars(integrationId);
    } catch (error) {
      console.error('❌ Erreur récupération calendriers:', error);
      toast.error('Impossible de récupérer les calendriers');
      return [];
    }
  }, []);

  // Obtenir la disponibilité
  const getFreeBusy = useCallback(async (
    integrationId: string, 
    calendarIds: string[], 
    timeMin: Date,
    timeMax: Date
  ): Promise<FreeBusyInfo | null> => {
    try {
      return await googleCalendarClientService.getFreeBusy(integrationId, calendarIds, timeMin, timeMax);
    } catch (error) {
      console.error('❌ Erreur récupération disponibilité:', error);
      toast.error('Impossible de récupérer la disponibilité');
      return null;
    }
  }, []);

  // Générer l'URL d'autorisation
  const generateAuthUrl = useCallback(async (state?: string): Promise<{ authUrl: string; state: string }> => {
    try {
      return await googleCalendarClientService.generateAuthUrl(state);
    } catch (error) {
      console.error('❌ Erreur génération URL auth:', error);
      toast.error('Impossible de générer l\'URL d\'autorisation');
      throw error;
    }
  }, []);

  return {
    // État
    integrations,
    primaryIntegration,
    isConnected,
    loading,
    syncing,

    // Actions
    connectIntegration,
    disconnectIntegration,
    updateIntegration,
    syncCalendar,
    getCalendars,
    getFreeBusy,
    refreshIntegrations,
    generateAuthUrl
  };
};

// ============================================================================
// HOOKS SPÉCIALISÉS
// ============================================================================

/**
 * Hook pour gérer une intégration spécifique
 */
export const useGoogleCalendarIntegration = (integrationId: string) => {
  const { integrations, updateIntegration, syncCalendar } = useGoogleCalendar();
  const integration = integrations.find(i => i.id === integrationId);

  const updateSyncStatus = useCallback(async (updates: UpdateIntegrationData) => {
    if (integration) {
      await updateIntegration(integrationId, updates);
    }
  }, [integration, integrationId, updateIntegration]);

  const sync = useCallback(async (syncType?: string) => {
    if (integration) {
      return await syncCalendar(integrationId, syncType);
    }
    return null;
  }, [integration, integrationId, syncCalendar]);

  return {
    integration,
    updateSyncStatus,
    sync,
    isLoading: !integration
  };
};

/**
 * Hook pour gérer la disponibilité
 */
export const useGoogleCalendarAvailability = (integrationId: string) => {
  const { getFreeBusy } = useGoogleCalendar();
  const [availability, setAvailability] = useState<FreeBusyInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAvailability = useCallback(async (
    calendarIds: string[],
    timeMin: Date,
    timeMax: Date
  ) => {
    try {
      setLoading(true);
      const data = await getFreeBusy(integrationId, calendarIds, timeMin, timeMax);
      setAvailability(data);
      return data;
    } catch (error) {
      console.error('❌ Erreur récupération disponibilité:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [integrationId, getFreeBusy]);

  const isTimeSlotAvailable = useCallback((start: Date, end: Date, calendarId: string) => {
    if (!availability || !availability.calendars[calendarId]) {
      return true; // Si pas de données, considérer comme disponible
    }

    const busySlots = availability.calendars[calendarId].busy;
    
    return !busySlots.some(slot => {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);
      return start < slotEnd && end > slotStart;
    });
  }, [availability]);

  return {
    availability,
    loading,
    fetchAvailability,
    isTimeSlotAvailable
  };
};

/**
 * Hook pour gérer les événements synchronisés Google Calendar
 */
export const useGoogleCalendarEvents = (integrationId: string) => {
  const { integration } = useGoogleCalendarIntegration(integrationId);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // fetchEvents prend timeMin et timeMax, et utilise setEvents
  const fetchEvents = useCallback(async (timeMin: Date, timeMax: Date) => {
    if (!integration) return;
    setLoading(true);
    try {
      const data = await googleCalendarClientService.getEvents(integrationId, timeMin, timeMax);
      setEvents(data);
    } catch (error) {
      console.error('❌ Erreur récupération événements:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [integration, integrationId]);

  return {
    events,
    loading,
    fetchEvents
  };
}; 