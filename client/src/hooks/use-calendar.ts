import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { googleCalendarClientService } from '@/services/google-calendar-service';

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
      // TODO: Adapter l'intégration Google si besoin, ici on suppose une intégration primaire
      const integration = await googleCalendarClientService.getPrimaryIntegration();
      if (!integration) throw new Error('Aucune intégration Google Calendar trouvée');
      // Pour la démo, on prend les événements du mois courant
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const eventsData = await googleCalendarClientService.getEvents(integration.id, start, end);
      setEvents(eventsData);
    } catch (err) {
      console.error('Erreur chargement événements:', err);
      setError('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.type]);

  // Charger les étapes de dossier
  const loadDossierSteps = useCallback(async () => {
    // TODO: À implémenter selon la logique métier (non couvert par googleCalendarClientService)
    setDossierSteps([]);
    // setError(null);
    // setLoading(false);
  }, [user?.id]);

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    // TODO: À implémenter selon la logique métier (non couvert par googleCalendarClientService)
    setStats({
      eventsToday: 0,
      meetingsThisWeek: 0,
      overdueDeadlines: 0,
      documentsToValidate: 0
    });
    // setError(null);
    // setLoading(false);
  }, [user?.id]);

  // Charger les événements à venir
  const loadUpcomingEvents = useCallback(async (limit: number = 10) => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const integration = await googleCalendarClientService.getPrimaryIntegration();
      if (!integration) throw new Error('Aucune intégration Google Calendar trouvée');
      // On prend les 30 prochains jours
      const now = new Date();
      const end = new Date(now);
      end.setDate(now.getDate() + 30);
      const eventsData = await googleCalendarClientService.getEvents(integration.id, now, end);
      setUpcomingEvents(eventsData.slice(0, limit));
    } catch (err) {
      console.error('Erreur chargement événements à venir:', err);
      setError('Erreur lors du chargement des événements à venir');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Créer un événement
  const createEvent = useCallback(async () => {
    // TODO: À implémenter si besoin via googleCalendarClientService (non couvert directement)
    setError('Création d\'événement non implémentée');
    return null;
  }, [user?.id]);

  // Mettre à jour un événement
  const updateEvent = useCallback(async () => {
    // TODO: À implémenter si besoin via googleCalendarClientService (non couvert directement)
    setError('Mise à jour d\'événement non implémentée');
    return null;
  }, []);

  // Supprimer un événement
  const deleteEvent = useCallback(async () => {
    // TODO: À implémenter si besoin via googleCalendarClientService (non couvert directement)
    setError('Suppression d\'événement non implémentée');
    return null;
  }, []);

  // Créer une étape de dossier
  const createDossierStep = useCallback(async () => {
    // TODO: À implémenter selon la logique métier
    setError('Création d\'étape de dossier non implémentée');
    return null;
  }, []);

  // Mettre à jour une étape de dossier
  const updateDossierStep = useCallback(async () => {
    // TODO: À implémenter selon la logique métier
    setError('Mise à jour d\'étape de dossier non implémentée');
    return null;
  }, []);

  // Supprimer une étape de dossier
  const deleteDossierStep = useCallback(async () => {
    // TODO: À implémenter selon la logique métier
    setError('Suppression d\'étape de dossier non implémentée');
    return null;
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