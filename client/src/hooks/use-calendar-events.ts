import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './use-auth';
import { useToast } from '@/hooks/use-toast';
import { calendarService, CalendarEvent, CreateEventData, UpdateEventData, CalendarStats } from '@/services/calendar-service';
import { messagingService } from '@/services/messaging-service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export interface UseCalendarEventsOptions {
  autoLoad?: boolean;
  filters?: {
    start_date?: string;
    end_date?: string;
    type?: string;
    category?: string;
    dossier_id?: string;
    user_id?: string;
  };
  enableRealTime?: boolean;
  enableGoogleSync?: boolean;
  view?: 'month' | 'week' | 'day' | 'agenda' | 'list';
}

export interface UseCalendarEventsReturn {
  // État principal
  events: CalendarEvent[];
  stats: CalendarStats | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  
  // Actions principales
  loadEvents: (filters?: any) => Promise<void>;
  createEvent: (eventData: CreateEventData) => Promise<CalendarEvent | null>;
  updateEvent: (eventData: UpdateEventData) => Promise<CalendarEvent | null>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  loadStats: () => Promise<void>;
  
  // Actions avancées
  createEventFromMessaging: (conversationId: string, eventData: CreateEventData) => Promise<CalendarEvent | null>;
  syncWithGoogleCalendar: () => Promise<void>;
  exportToGoogleCalendar: (eventId: string) => Promise<void>;
  
  // Utilitaires
  refresh: () => Promise<void>;
  clearError: () => void;
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsForDateRange: (startDate: Date, endDate: Date) => CalendarEvent[];
  getUpcomingEvents: (days?: number) => CalendarEvent[];
  getOverdueEvents: () => CalendarEvent[];
  
  // Vues et filtres
  filteredEvents: CalendarEvent[];
  setFilter: (filter: string) => void;
  setSearchQuery: (query: string) => void;
  currentFilter: string;
  searchQuery: string;
}

// ============================================================================
// HOOK PRINCIPAL UNIFIÉ
// ============================================================================

export const useCalendarEvents = (options: UseCalendarEventsOptions = {}): UseCalendarEventsReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  const { 
    autoLoad = true, 
    filters = {}, 
    enableRealTime = true,
    enableGoogleSync = false,
    view = 'month'
  } = options;

  // ========================================
  // QUERIES REACT QUERY OPTIMISÉES
  // ========================================

  // Query pour les événements
  const {
    data: events = [],
    isLoading: loading,
    refetch: refresh
  } = useQuery({
    queryKey: ['calendar-events', user?.id, filters, view],
    queryFn: async () => {
      if (!user?.id) return [];
      const mergedFilters = { 
        ...filters, 
        user_id: user.id,
        user_type: user.type 
      };
      return await calendarService.getEvents(mergedFilters);
    },
    enabled: autoLoad && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Query pour les statistiques
  const { data: stats } = useQuery({
    queryKey: ['calendar-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await calendarService.getStats({ user_id: user.id });
    },
    enabled: autoLoad && !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // ========================================
  // MUTATIONS OPTIMISÉES
  // ========================================

  // Mutation pour créer un événement
  const createEventMutation = useMutation({
    mutationFn: async (eventData: CreateEventData) => {
      const enrichedEventData = {
        ...eventData,
        category: eventData.category || (user?.type === 'client' ? 'client' : user?.type === 'expert' ? 'expert' : 'admin'),
        color: eventData.color || '#3B82F6'
        // created_by est géré automatiquement par l'API backend
      };

      const newEvent = await calendarService.createEvent(enrichedEventData);
      
      // Synchronisation Google Calendar si activée
      if (enableGoogleSync) {
        try {
          await messagingService.syncToGoogleCalendar(newEvent);
        } catch (googleError) {
          console.warn('⚠️ Synchronisation Google Calendar échouée:', googleError);
        }
      }

      return newEvent;
    },
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-stats'] });
      
      toast({
        title: 'Événement créé',
        description: `${newEvent.title} a été ajouté à votre calendrier`,
        variant: 'default'
      });
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Erreur lors de la création');
      toast({
        title: 'Erreur',
        description: 'Impossible de créer l\'événement',
        variant: 'destructive'
      });
    }
  });

  // Mutation pour mettre à jour un événement
  const updateEventMutation = useMutation({
    mutationFn: async (eventData: UpdateEventData) => {
      return await calendarService.updateEvent(eventData);
    },
    onSuccess: (updatedEvent) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-stats'] });
      
      toast({
        title: 'Événement mis à jour',
        description: `${updatedEvent.title} a été modifié`,
        variant: 'default'
      });
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'événement',
        variant: 'destructive'
      });
    }
  });

  // Mutation pour supprimer un événement
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return await calendarService.deleteEvent(eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-stats'] });
      
      toast({
        title: 'Événement supprimé',
        description: 'L\'événement a été supprimé de votre calendrier',
        variant: 'default'
      });
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Erreur lors de la suppression');
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'événement',
        variant: 'destructive'
      });
    }
  });

  // ========================================
  // FONCTIONS UTILITAIRES
  // ========================================

  const getEventsForDate = useCallback((date: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate.toDateString() === date.toDateString();
    });
  }, [events]);

  const getEventsForDateRange = useCallback((startDate: Date, endDate: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate >= startDate && eventDate <= endDate;
    });
  }, [events]);

  const getUpcomingEvents = useCallback((days: number = 7): CalendarEvent[] => {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate >= now && eventDate <= future;
    }).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  }, [events]);

  const getOverdueEvents = useCallback((): CalendarEvent[] => {
    const now = new Date();
    
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate < now && event.status !== 'completed';
    });
  }, [events]);

  // ========================================
  // FILTRAGE ET RECHERCHE
  // ========================================

  const filteredEvents = useMemo(() => {
    let filtered = events;
    
    // Filtre par type
    if (currentFilter !== 'all') {
      filtered = filtered.filter(event => event.type === currentFilter);
    }
    
    // Recherche textuelle
    if (searchQuery) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [events, currentFilter, searchQuery]);

  // ========================================
  // FONCTIONS D'ACTION
  // ========================================

  const createEventFromMessaging = useCallback(async (conversationId: string, eventData: CreateEventData): Promise<CalendarEvent | null> => {
    try {
      const enrichedEventData = {
        ...eventData,
        metadata: {
          ...eventData.metadata,
          conversation_id: conversationId,
          source: 'messaging'
        }
      };
      
      return await createEventMutation.mutateAsync(enrichedEventData);
    } catch (error) {
      console.error('Erreur création événement depuis messagerie:', error);
      return null;
    }
  }, [createEventMutation]);

  const syncWithGoogleCalendar = useCallback(async (): Promise<void> => {
    if (!enableGoogleSync) return;
    
    try {
      // Logique de synchronisation Google Calendar
      toast({
        title: 'Synchronisation',
        description: 'Synchronisation avec Google Calendar en cours...',
        variant: 'default'
      });
      
      // TODO: Implémenter la synchronisation complète
      
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la synchronisation Google Calendar',
        variant: 'destructive'
      });
    }
  }, [enableGoogleSync, toast]);

  const exportToGoogleCalendar = useCallback(async (eventId: string): Promise<void> => {
    if (!enableGoogleSync) return;
    
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) throw new Error('Événement non trouvé');
      
      await messagingService.syncToGoogleCalendar(event);
      
      toast({
        title: 'Export réussi',
        description: 'Événement exporté vers Google Calendar',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'export vers Google Calendar',
        variant: 'destructive'
      });
    }
  }, [enableGoogleSync, events, toast]);

  // ========================================
  // REAL-TIME ET CONNEXION
  // ========================================

  useEffect(() => {
    if (enableRealTime && user?.id) {
      // Initialiser la connexion real-time
      messagingService.initialize(user.id, user.type as 'client' | 'expert' | 'admin');
      setIsConnected(true);
    }
  }, [enableRealTime, user?.id, user?.type]);

  // ========================================
  // RETOUR DU HOOK
  // ========================================

  return {
    // État principal
    events,
    stats,
    loading,
    error,
    isConnected,
    
    // Actions principales
    loadEvents: refresh,
    createEvent: createEventMutation.mutateAsync,
    updateEvent: updateEventMutation.mutateAsync,
    deleteEvent: deleteEventMutation.mutateAsync,
    loadStats: () => queryClient.invalidateQueries({ queryKey: ['calendar-stats'] }),
    
    // Actions avancées
    createEventFromMessaging,
    syncWithGoogleCalendar,
    exportToGoogleCalendar,
    
    // Utilitaires
    refresh,
    clearError: () => setError(null),
    getEventsForDate,
    getEventsForDateRange,
    getUpcomingEvents,
    getOverdueEvents,
    
    // Vues et filtres
    filteredEvents,
    setFilter: setCurrentFilter,
    setSearchQuery,
    currentFilter,
    searchQuery
  };
}; 