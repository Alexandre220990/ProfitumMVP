import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { toast } from 'sonner';
import { get } from '@/lib/api';
import type { 
  Expert
} from '@/types/expert';
import type { ExpertAnalytics } from '@/types/analytics';
import type {
  ExpertBusiness,
  RevenueData,
  ProductPerformance,
  ClientPerformance
} from '@/types/business';
import type { Assignment } from '@/types/assignment';
import type { AgendaEvent } from '@/types/agenda';

// Type optimisé pour ClientProduitEligible avec tous les détails
export interface ClientProduitEligible {
  id: string;
  clientId: string;
  produitId: string;
  statut: string;
  tauxFinal: number;
  montantFinal: number;
  dureeFinale: number;
  current_step: number;
  progress: number;
  expert_id?: string;

  created_at: string;
  updated_at: string;
  simulationId?: number;
  metadata?: any;
  notes?: string;
  priorite?: number;
  dateEligibilite?: string;
  
  // Relations avec les autres tables
  Client?: {
    id: string;
    name?: string;
    email: string;
    company_name?: string;
    phone?: string;
    city?: string;
    siren?: string;
  };
  ProduitEligible?: {
    id: string;
    nom: string;
    description?: string;
    category?: string;
  };
  Expert?: {
    id: string;
    name: string;
    company_name?: string;
    email: string;
  };
}

export const useExpert = () => {
  const { user } = useAuth();
  
  const [expert, setExpert] = useState<Expert | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [clientProduitsEligibles, setClientProduitsEligibles] = useState<ClientProduitEligible[]>([]);
  const [analytics, setAnalytics] = useState<ExpertAnalytics | null>(null);
  const [businessData, setBusinessData] = useState<ExpertBusiness | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
  const [clientPerformance, setClientPerformance] = useState<ClientPerformance[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger toutes les données expert
  const loadExpertData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Charger le profil expert
      const expertResponse = await get<Expert>(`/api/expert/profile`);
      if (expertResponse.success && expertResponse.data) {
        setExpert(expertResponse.data);
      }

      // Charger les assignations
      const assignmentsResponse = await get<Assignment[]>(`/api/expert/assignments`);
      if (assignmentsResponse.success && assignmentsResponse.data) {
        setAssignments(assignmentsResponse.data);
      }

      // Charger les ClientProduitEligible assignés à l'expert
      const clientProduitsResponse = await get<ClientProduitEligible[]>(`/api/expert/client-produits-eligibles`);
      if (clientProduitsResponse.success && clientProduitsResponse.data) {
        setClientProduitsEligibles(clientProduitsResponse.data);
      }

      // Charger les analytics
      const analyticsResponse = await get<ExpertAnalytics>(`/api/expert/analytics`);
      if (analyticsResponse.success && analyticsResponse.data) {
        setAnalytics(analyticsResponse.data);
      }

      // Charger les données business
      const businessResponse = await get<ExpertBusiness>(`/api/expert/business`);
      if (businessResponse.success && businessResponse.data) {
        setBusinessData(businessResponse.data);
      }

      // Charger l'historique des revenus
      const revenueResponse = await get<RevenueData[]>(`/api/expert/revenue-history`);
      if (revenueResponse.success && revenueResponse.data) {
        setRevenueData(revenueResponse.data);
      }

      // Charger les performances par produit
      const productResponse = await get<ProductPerformance[]>(`/api/expert/product-performance`);
      if (productResponse.success && productResponse.data) {
        setProductPerformance(productResponse.data);
      }

      // Charger les performances par client
      const clientResponse = await get<ClientPerformance[]>(`/api/expert/client-performance`);
      if (clientResponse.success && clientResponse.data) {
        setClientPerformance(clientResponse.data);
      }

      // Charger les événements agenda
      const agendaResponse = await get<AgendaEvent[]>(`/api/expert/agenda`);
      if (agendaResponse.success && agendaResponse.data) {
        setAgendaEvents(agendaResponse.data);
      }

      toast.success('Données chargées ! Vos informations ont été récupérées avec succès');

    } catch (error) {
      console.error('Erreur chargement données expert:', error);
      setError('Erreur lors de la récupération des données');
      toast.error('Erreur lors de la récupération des données');
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // Réduire les dépendances au minimum

  // Recharger les données
  const refreshData = useCallback(() => {
    loadExpertData();
  }, [loadExpertData]);

  // Filtrer les assignations par statut
  const getAssignmentsByStatus = useCallback((status: string) => {
    return assignments.filter(assignment => assignment.status === status);
  }, [assignments]);

  // Filtrer les ClientProduitEligible par statut
  const getClientProduitsByStatus = useCallback((status: string) => {
    return clientProduitsEligibles.filter(cpe => cpe.statut === status);
  }, [clientProduitsEligibles]);

  // Calculer les métriques rapides optimisées
  const getQuickMetrics = useCallback(() => {
    const pending = getAssignmentsByStatus('pending').length;
    const inProgress = getAssignmentsByStatus('in_progress').length + getAssignmentsByStatus('accepted').length;
    const completed = getAssignmentsByStatus('completed').length;
    
    // Calculer les revenus totaux depuis les ClientProduitEligible terminés
    const totalRevenue = clientProduitsEligibles
      .filter(cpe => cpe.statut === 'termine')
      .reduce((sum, cpe) => sum + (cpe.montantFinal || 0), 0);

    // Calculer les opportunités depuis les ClientProduitEligible en cours
    const opportunities = clientProduitsEligibles.filter(cpe => 
      cpe.statut === 'en_cours' && cpe.expert_id === user?.id
    ).length;

    return {
      pending,
      inProgress,
      completed,
      totalRevenue,
      opportunities,
      totalAssignments: assignments.length,
      totalClientProduits: clientProduitsEligibles.length
    };
  }, [assignments, clientProduitsEligibles, getAssignmentsByStatus, user?.id]);

  // Obtenir les événements du jour
  const getTodayEvents = useCallback(() => {
    const today = new Date().toDateString();
    return agendaEvents.filter(event => 
      new Date(event.date).toDateString() === today
    );
  }, [agendaEvents]);

  // Obtenir les événements à venir
  const getUpcomingEvents = useCallback(() => {
    const now = new Date();
    return agendaEvents
      .filter(event => new Date(event.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [agendaEvents]);

  // Obtenir les dossiers prioritaires
  const getPriorityDossiers = useCallback(() => {
    return clientProduitsEligibles
      .filter(cpe => cpe.expert_id === user?.id)
      .sort((a, b) => (b.priorite || 0) - (a.priorite || 0))
      .slice(0, 5);
  }, [clientProduitsEligibles, user?.id]);

  // Obtenir les dossiers en retard
  const getOverdueDossiers = useCallback(() => {
    const now = new Date();
    return clientProduitsEligibles
      .filter(cpe => {
        if (cpe.expert_id !== user?.id) return false;
        if (cpe.statut !== 'en_cours') return false;
        
        // Vérifier si le dossier est en retard (plus de 30 jours)
        const createdDate = new Date(cpe.created_at);
        const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
        return daysDiff > 30;
      });
  }, [clientProduitsEligibles, user?.id]);

  // Charger les données au montage
  useEffect(() => {
    // Éviter les rechargements inutiles
    const controller = new AbortController();
    
    const loadDataSafely = async () => {
      if (controller.signal.aborted) return;
      await loadExpertData();
    };
    
    loadDataSafely();
    
    return () => {
      controller.abort();
    };
  }, [loadExpertData]);

  return {
    // Données
    expert,
    assignments,
    clientProduitsEligibles,
    analytics,
    businessData,
    revenueData,
    productPerformance,
    clientPerformance,
    agendaEvents,
    
    // États
    loading,
    error,
    
    // Actions
    loadExpertData,
    refreshData,
    getAssignmentsByStatus,
    getClientProduitsByStatus,
    getQuickMetrics,
    getTodayEvents,
    getUpcomingEvents,
    getPriorityDossiers,
    getOverdueDossiers
  };
}; 