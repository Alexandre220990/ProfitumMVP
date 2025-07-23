import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './use-auth';
import { useToast } from '@/components/ui/toast-notifications';
import { calendarService, CalendarEvent, CreateEventData, UpdateEventData, CalendarStats } from '@/services/calendar-service';

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
  };
}

export interface UseCalendarEventsReturn {
  // État
  events: CalendarEvent[];
  stats: CalendarStats | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadEvents: (filters?: any) => Promise<void>;
  createEvent: (eventData: CreateEventData) => Promise<CalendarEvent | null>;
  updateEvent: (eventData: UpdateEventData) => Promise<CalendarEvent | null>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  loadStats: () => Promise<void>;
  
  // Utilitaires
  refresh: () => Promise<void>;
  clearError: () => void;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useCalendarEvents = (options: UseCalendarEventsOptions = {}): UseCalendarEventsReturn => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { autoLoad = true, filters = {} } = options;

  // ===== CHARGEMENT DES ÉVÉNEMENTS =====

  const loadEvents = useCallback(async (customFilters?: any) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const mergedFilters = { ...filters, ...customFilters };
      const eventsData = await calendarService.getEvents(mergedFilters);
      setEvents(eventsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des événements';
      setError(errorMessage);
      
      // Ne pas afficher de toast pour les erreurs de calendrier non critique
      console.warn('⚠️ Erreur chargement événements calendrier:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id, filters]);

  // ===== CRÉATION D'ÉVÉNEMENT =====

  const createEvent = useCallback(async (eventData: CreateEventData): Promise<CalendarEvent | null> => {
    if (!user?.id) return null;

    setLoading(true);
    setError(null);

    try {
      // Ajouter la catégorie par défaut selon le type d'utilisateur
      const enrichedEventData = {
        ...eventData,
        category: eventData.category || (user.type === 'client' ? 'client' : user.type === 'expert' ? 'expert' : 'admin'),
        color: eventData.color || '#3B82F6'
      };

      const newEvent = await calendarService.createEvent(enrichedEventData);
      
      // Mettre à jour l'état local
      setEvents(prev => [...prev, newEvent]);
      
      addToast({
        type: 'success',
        title: 'Succès',
        message: 'Événement créé avec succès',
        duration: 3000
      });

      return newEvent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de l\'événement';
      setError(errorMessage);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: errorMessage,
        duration: 5000
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.type, addToast]);

  // ===== MISE À JOUR D'ÉVÉNEMENT =====

  const updateEvent = useCallback(async (eventData: UpdateEventData): Promise<CalendarEvent | null> => {
    if (!user?.id) return null;

    setLoading(true);
    setError(null);

    try {
      const updatedEvent = await calendarService.updateEvent(eventData);
      
      // Mettre à jour l'état local
      setEvents(prev => prev.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      ));
      
      addToast({
        type: 'success',
        title: 'Succès',
        message: 'Événement mis à jour avec succès',
        duration: 3000
      });

      return updatedEvent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'événement';
      setError(errorMessage);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: errorMessage,
        duration: 5000
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, addToast]);

  // ===== SUPPRESSION D'ÉVÉNEMENT =====

  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    if (!user?.id) return false;

    setLoading(true);
    setError(null);

    try {
      await calendarService.deleteEvent(eventId);
      
      // Mettre à jour l'état local
      setEvents(prev => prev.filter(event => event.id !== eventId));
      
      addToast({
        type: 'success',
        title: 'Succès',
        message: 'Événement supprimé avec succès',
        duration: 3000
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'événement';
      setError(errorMessage);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: errorMessage,
        duration: 5000
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, addToast]);

  // ===== CHARGEMENT DES STATISTIQUES =====

  const loadStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const statsData = await calendarService.getStats(filters);
      setStats(statsData);
    } catch (err) {
      console.warn('⚠️ Erreur chargement statistiques calendrier:', err);
      // Ne pas afficher de toast pour les stats, c'est moins critique
      // Définir des stats par défaut
      setStats({
        eventsToday: 0,
        meetingsThisWeek: 0,
        overdueDeadlines: 0,
        documentsToValidate: 0
      });
    }
  }, [user?.id, filters]);

  // ===== RAFRAÎCHISSEMENT =====

  const refresh = useCallback(async () => {
    await Promise.all([
      loadEvents(),
      loadStats()
    ]);
  }, [loadEvents, loadStats]);

  // ===== UTILITAIRES =====

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ===== CHARGEMENT AUTOMATIQUE =====

  useEffect(() => {
    if (autoLoad && user?.id) {
      // Éviter la boucle infinie en ne dépendant que des valeurs stables
      const loadData = async () => {
        try {
          await Promise.all([
            loadEvents(),
            loadStats()
          ]);
        } catch (error) {
          console.error('❌ Erreur chargement automatique calendrier:', error);
          // Ne pas relancer automatiquement en cas d'erreur
        }
      };
      
      loadData();
    }
  }, [autoLoad, user?.id]); // Retirer refresh des dépendances

  // ===== MÉMOISATION DES DONNÉES =====

  const memoizedEvents = useMemo(() => events, [events]);
  const memoizedStats = useMemo(() => stats, [stats]);

  return {
    // État
    events: memoizedEvents,
    stats: memoizedStats,
    loading,
    error,
    
    // Actions
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    loadStats,
    
    // Utilitaires
    refresh,
    clearError
  };
}; 