import { useState, useEffect, useCallback } from 'react';
import { ApporteurEnhancedService } from '../services/apporteur-enhanced-service';

/**
 * Hook pour utiliser les données enrichies du dashboard apporteur
 * Utilise les nouvelles vues SQL corrigées
 */
export function useApporteurEnhanced(apporteurId: string | null) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!apporteurId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const service = new ApporteurEnhancedService(apporteurId);
      const result = await service.getAllDashboardData();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des données';
      setError(errorMessage);
      console.error('Erreur useApporteurEnhanced:', err);
    } finally {
      setLoading(false);
    }
  }, [apporteurId]);

  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Méthodes utilitaires pour accéder facilement aux données
  const getDashboardData = () => data?.dashboard?.data || null;
  const getProspectsData = () => data?.prospects?.data || [];
  const getActivityData = () => data?.activite?.data || [];
  const getCommissionsData = () => data?.commissions?.data || [];
  const getObjectivesData = () => data?.objectifs?.data || null;
  const getPerformanceData = () => data?.performance?.data || [];

  // Statistiques calculées
  const getStats = () => {
    const dashboardData = getDashboardData();
    if (!dashboardData) {
      return {
        totalProspects: 0,
        totalClients: 0,
        nouveaux30j: 0,
        montantTotal: 0,
        tauxConversion: 0,
        dossiersAcceptes: 0
      };
    }

    return {
      totalProspects: dashboardData.total_prospects || 0,
      totalClients: dashboardData.total_active_clients || 0,
      nouveaux30j: dashboardData.nouveaux_clients_30j || 0,
      montantTotal: dashboardData.total_montant_demande || 0,
      tauxConversion: dashboardData.taux_conversion_pourcent || 0,
      dossiersAcceptes: dashboardData.dossiers_acceptes || 0
    };
  };

  // Objectifs et performance
  const getObjectives = () => {
    const objectivesData = getObjectivesData();
    if (!objectivesData) {
      return {
        objectifProspects: 0,
        objectifConversion: 0,
        objectifCommission: 0,
        realisationProspects: 0,
        realisationConversion: 0,
        realisationCommission: 0
      };
    }

    return {
      objectifProspects: objectivesData.objectif_prospects_mois || 0,
      objectifConversion: objectivesData.objectif_conversion_pourcent || 0,
      objectifCommission: objectivesData.objectif_commission_mois || 0,
      realisationProspects: objectivesData.realisation_prospects_mois || 0,
      realisationConversion: objectivesData.realisation_conversion_pourcent || 0,
      realisationCommission: objectivesData.realisation_commission_mois || 0
    };
  };

  // Performance par produit
  const getProductPerformance = () => {
    return getPerformanceData().map((product: any) => ({
      produitId: product.produit_id,
      produitNom: product.produit_nom,
      nbDossiers: product.nb_dossiers || 0,
      tauxReussite: product.taux_reussite_pourcent || 0,
      montantMoyen: product.montant_moyen || 0,
      commissionMoyenne: product.commission_moyenne || 0
    }));
  };

  // Activité récente formatée
  const getRecentActivity = () => {
    return getActivityData().map((activity: any) => ({
      id: activity.entite_id,
      type: activity.type_activite,
      nom: activity.nom_entite,
      action: activity.action,
      date: activity.date_activite,
      montant: activity.montant || 0,
      libelle: `${activity.action} - ${activity.nom_entite}${activity.montant ? ` (${activity.montant}€)` : ''}`
    }));
  };

  // Prospects avec informations enrichies
  const getEnrichedProspects = () => {
    return getProspectsData().map((prospect: any) => ({
      id: prospect.prospect_id,
      nom: prospect.prospect_name || prospect.company_name,
      email: prospect.prospect_email,
      entreprise: prospect.company_name,
      statut: prospect.prospect_status,
      nbDossiers: prospect.nb_dossiers || 0,
      montantTotal: prospect.total_montant_demande || 0,
      dateCreation: prospect.date_creation,
      anciennete: prospect.anciennete || 'Nouveau'
    }));
  };

  return {
    // État principal
    data,
    loading,
    error,
    refresh,

    // Données brutes
    getDashboardData,
    getProspectsData,
    getActivityData,
    getCommissionsData,
    getObjectivesData,
    getPerformanceData,

    // Données formatées
    stats: getStats(),
    objectives: getObjectives(),
    productPerformance: getProductPerformance(),
    recentActivity: getRecentActivity(),
    enrichedProspects: getEnrichedProspects(),

    // Utilitaires
    hasData: !!data,
    hasEnhancedData: !!(data?.dashboard?.success && data?.prospects?.success),
    isLoading: loading,
    hasError: !!error
  };
}
