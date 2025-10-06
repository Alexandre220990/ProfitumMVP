import { useState, useEffect } from 'react';
import { ApporteurAnalyticsService } from '../services/apporteur-analytics-service';

interface ApporteurKPIs {
  mesProspects: number;
  prospectsQualifies: number;
  nouveauxProspects30j: number;
  mesClientsActifs: number;
  nouveauxClients30j: number;
  dossiersMesClients: number;
  dossiersTerminesMesClients: number;
  montantTotalMesClients: number;
  montantRealiseMesClients: number;
  commissionsTotales: number;
  commissionsPayees: number;
  tauxConversionProspects: number;
}

interface ActivityItem {
  typeEntite: string;
  entiteId: string;
  reference: string;
  nom: string;
  statut: string;
  dateAction: string;
  action: string;
  montant: number | null;
}

interface ProspectDetail {
  id: string;
  email: string;
  name: string;
  companyName: string;
  createdAt: string;
  derniereConnexion: string | null;
  statutActivite: string;
  anciennete: string;
  nbDossiers: number;
  montantTotalDossiers: number;
}

interface AlertItem {
  typeAlerte: string;
  severity: string;
  nombre: number;
  message: string;
  entitesConcernees: string[];
}

interface ProductStats {
  id: string;
  nom: string;
  categorie: string;
  montantMin: number | null;
  montantMax: number | null;
  active: boolean;
  totalDossiers: number;
  dossiersTermines: number;
  montantTotal: number;
  montantMoyen: number;
  clientsUniques: number;
  expertsAssignes: number;
  tauxCompletion: number;
}

interface SessionData {
  userType: string;
  sessionsActives: number;
  utilisateursUniques: number;
}

interface ApporteurAnalytics {
  kpis: ApporteurKPIs | null;
  activity: ActivityItem[];
  prospects: ProspectDetail[];
  alerts: AlertItem[];
  products: ProductStats[];
  sessions: SessionData[];
}

export function useApporteurAnalytics(apporteurId: string) {
  const [analytics, setAnalytics] = useState<ApporteurAnalytics>({
    kpis: null,
    activity: [],
    prospects: [],
    alerts: [],
    products: [],
    sessions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apporteurId) {
      setError('ID apporteur requis');
      setLoading(false);
      return;
    }

    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const service = new ApporteurAnalyticsService(apporteurId);

        // Charger toutes les données en parallèle
        const [
          kpisResult,
          activityResult,
          prospectsResult,
          alertsResult,
          productsResult,
          sessionsResult
        ] = await Promise.all([
          service.getPersonalKPIs(),
          service.getPersonalActivity(),
          service.getPersonalProspects(),
          service.getPersonalAlerts(),
          service.getProductStats(),
          service.getActiveSessions()
        ]);

        // Vérifier les erreurs
        if (!kpisResult.success) throw new Error(kpisResult.error);
        if (!activityResult.success) throw new Error(activityResult.error);
        if (!prospectsResult.success) throw new Error(prospectsResult.error);
        if (!alertsResult.success) throw new Error(alertsResult.error);
        if (!productsResult.success) throw new Error(productsResult.error);
        if (!sessionsResult.success) throw new Error(sessionsResult.error);

        setAnalytics({
          kpis: kpisResult.data || null,
          activity: activityResult.data || [],
          prospects: prospectsResult.data || [],
          alerts: alertsResult.data || [],
          products: productsResult.data || [],
          sessions: sessionsResult.data || []
        });

      } catch (err) {
        console.error('Erreur chargement analytics apporteur:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [apporteurId]);

  const refresh = async () => {
    if (!apporteurId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const service = new ApporteurAnalyticsService(apporteurId);
      
      const [kpisResult, activityResult, prospectsResult, alertsResult] = await Promise.all([
        service.getPersonalKPIs(),
        service.getPersonalActivity(),
        service.getPersonalProspects(),
        service.getPersonalAlerts()
      ]);

      if (!kpisResult.success) throw new Error(kpisResult.error);
      if (!activityResult.success) throw new Error(activityResult.error);
      if (!prospectsResult.success) throw new Error(prospectsResult.error);
      if (!alertsResult.success) throw new Error(alertsResult.error);

      setAnalytics(prev => ({
        ...prev,
        kpis: kpisResult.data || null,
        activity: activityResult.data || [],
        prospects: prospectsResult.data || [],
        alerts: alertsResult.data || []
      }));

    } catch (err) {
      console.error('Erreur refresh analytics apporteur:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const getProspectsByStatus = (status: string) => {
    return analytics.prospects.filter(prospect => prospect.statutActivite === status);
  };

  const getProspectsByAnciennete = (anciennete: string) => {
    return analytics.prospects.filter(prospect => prospect.anciennete === anciennete);
  };

  const getAlertsBySeverity = (severity: string) => {
    return analytics.alerts.filter(alert => alert.severity === severity);
  };

  return {
    analytics,
    loading,
    error,
    refresh,
    getProspectsByStatus,
    getProspectsByAnciennete,
    getAlertsBySeverity
  };
}
