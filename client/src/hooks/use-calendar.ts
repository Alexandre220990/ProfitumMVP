import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';

export const useCalendar = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [dossierSteps, setDossierSteps] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    eventsToday: 0,
    meetingsThisWeek: 0,
    overdueDeadlines: 0,
    documentsToValidate: 0
  });
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les événements
  const loadEvents = useCallback(async (filters: any = {}) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Ajouter le filtre client_id si l'utilisateur est un client
      const clientFilters = { ...filters };
      if (user.type === 'client') {
        clientFilters.client_id = user.id;
      }

      const eventsData = await calendarService.getEvents(clientFilters);
      setEvents(eventsData);
    } catch (err) {
      console.error('Erreur chargement événements:', err);
      setError('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.type]);

  // Charger les étapes de dossier
  const loadDossierSteps = useCallback(async (dossierId?: string) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const stepsData = await calendarService.getDossierSteps(dossierId);
      setDossierSteps(stepsData);
    } catch (err) {
      console.error('Erreur chargement étapes:', err);
      setError('Erreur lors du chargement des étapes');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const statsData = await calendarService.getCalendarStats(user.id);
      setStats(statsData);
    } catch (err) {
      console.error('Erreur chargement statistiques:', err);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Charger les événements à venir
  const loadUpcomingEvents = useCallback(async (limit: number = 10) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const upcomingData = await calendarService.getUpcomingEvents(limit);
      setUpcomingEvents(upcomingData);
    } catch (err) {
      console.error('Erreur chargement événements à venir:', err);
      setError('Erreur lors du chargement des événements à venir');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Créer un événement
  const createEvent = useCallback(async (eventData: Omit<any, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Laisser le service gérer automatiquement le mapping des IDs
      const newEvent = await calendarService.createEvent(eventData);

      if (newEvent) {
        setEvents(prev => [...prev, newEvent].filter((e): e is any => !!e && typeof e === 'object'));
      }
      return newEvent;
    } catch (err) {
      console.error('Erreur création événement:', err);
      setError('Erreur lors de la création de l\'événement');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Mettre à jour un événement
  const updateEvent = useCallback(async (id: string, updates: Partial<any>) => {
    setLoading(true);
    setError(null);

    try {
      const updatedEvent = await calendarService.updateEvent(id, updates);
      setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event).filter((e): e is any => !!e && typeof e === 'object'));
      return updatedEvent;
    } catch (err) {
      console.error('Erreur mise à jour événement:', err);
      setError('Erreur lors de la mise à jour de l\'événement');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Supprimer un événement
  const deleteEvent = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await calendarService.deleteEvent(id);
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (err) {
      console.error('Erreur suppression événement:', err);
      setError('Erreur lors de la suppression de l\'événement');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer une étape de dossier
  const createDossierStep = useCallback(async (stepData: Omit<any, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);

    try {
      const newStep = await calendarService.createDossierStep(stepData);
      if (newStep) {
        setDossierSteps(prev => [...prev, newStep]);
      }
      return newStep;
    } catch (err) {
      console.error('Erreur création étape:', err);
      setError('Erreur lors de la création de l\'étape');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour une étape de dossier
  const updateDossierStep = useCallback(async (id: string, updates: Partial<any>) => {
    setLoading(true);
    setError(null);

    try {
      const updatedStep = await calendarService.updateDossierStep(id, updates);
      if (updatedStep) {
        setDossierSteps(prev => prev.map(step => 
          step.id === id ? updatedStep : step
        ));
      }
      return updatedStep;
    } catch (err) {
      console.error('Erreur mise à jour étape:', err);
      setError('Erreur lors de la mise à jour de l\'étape');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Supprimer une étape de dossier
  const deleteDossierStep = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await calendarService.deleteDossierStep(id);
      setDossierSteps(prev => prev.filter(step => step.id !== id));
    } catch (err) {
      console.error('Erreur suppression étape:', err);
      setError('Erreur lors de la suppression de l\'étape');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Rafraîchir toutes les données
  const refreshAll = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadEvents(),
        loadDossierSteps(),
        loadStats(),
        loadUpcomingEvents()
      ]);
    } catch (err) {
      console.error('Erreur rafraîchissement données:', err);
      setError('Erreur lors du rafraîchissement des données');
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadEvents, loadDossierSteps, loadStats, loadUpcomingEvents]);

  // Charger les données initiales
  useEffect(() => {
    if (user?.id) {
      refreshAll();
    }
  }, [user?.id, refreshAll]);

  return {
    // État
    events,
    dossierSteps,
    stats,
    upcomingEvents,
    loading,
    error,
    
    // Actions
    loadEvents,
    loadDossierSteps,
    loadStats,
    loadUpcomingEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    createDossierStep,
    updateDossierStep,
    deleteDossierStep,
    refreshAll,
    
    // Utilitaires
    clearError: () => setError(null)
  };
}; 