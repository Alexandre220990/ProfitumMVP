import { useState, useEffect } from 'react';
import { ApporteurSimpleService } from '../services/apporteur-simple-service';

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

interface ApporteurAnalytics {
  kpis: ApporteurKPIs | null;
  activity: ActivityItem[];
  prospects: ProspectDetail[];
  alerts: AlertItem[];
  products: any[];
  sessions: any[];
}

export function useApporteurSimple(apporteurId: string) {
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

        const service = new ApporteurSimpleService(apporteurId);

        // Charger les données disponibles
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

        // Vérifier les erreurs critiques
        if (!prospectsResult.success) {
          throw new Error(prospectsResult.error);
        }

        // Mettre à jour les données (accepter les erreurs non-critiques)
        setAnalytics({
          kpis: kpisResult.success ? kpisResult.data || null : null,
          activity: activityResult.success ? activityResult.data || [] : [],
          prospects: prospectsResult.data || [],
          alerts: alertsResult.success ? alertsResult.data || [] : [],
          products: productsResult.success ? productsResult.data || [] : [],
          sessions: sessionsResult.success ? sessionsResult.data || [] : []
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
      const service = new ApporteurSimpleService(apporteurId);
      
      const [kpisResult, activityResult, prospectsResult, alertsResult] = await Promise.all([
        service.getPersonalKPIs(),
        service.getPersonalActivity(),
        service.getPersonalProspects(),
        service.getPersonalAlerts()
      ]);

      if (!prospectsResult.success) throw new Error(prospectsResult.error);

      setAnalytics(prev => ({
        ...prev,
        kpis: kpisResult.success ? kpisResult.data || null : prev.kpis,
        activity: activityResult.success ? activityResult.data || [] : prev.activity,
        prospects: prospectsResult.data || [],
        alerts: alertsResult.success ? alertsResult.data || [] : prev.alerts
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
