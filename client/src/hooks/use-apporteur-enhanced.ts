import { useState, useEffect } from 'react';
import { ApporteurViewsService } from '../services/apporteur-views-service';

/**
 * Hook SIMPLIFIÉ pour les données enrichies du dashboard apporteur
 * Retourne uniquement les données brutes - les calculs sont faits dans le composant
 */
export function useApporteurEnhanced(apporteurId: string | null) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction de chargement (pas de useCallback pour éviter dépendances circulaires)
  const loadData = async () => {
    if (!apporteurId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const service = new ApporteurViewsService();
      
      // Charger les données en parallèle
      const [dashboard, prospects, objectifs, activite, performance] = await Promise.all([
        service.getDashboardPrincipal(),
        service.getProspectsDetaille(),
        service.getObjectifsPerformance(),
        service.getActiviteRecente(),
        service.getPerformanceProduits()
      ]);

      setData({
        dashboard,
        prospects,
        objectifs,
        activite,
        performance
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des données';
      setError(errorMessage);
      console.error('Erreur useApporteurEnhanced:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadData();
  };

  // useEffect avec dépendance stable (apporteurId directement, pas loadData)
  useEffect(() => {
    if (!apporteurId) {
      setData(null);
      return;
    }

    let isMounted = true; // Prévenir les mises à jour après démontage

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const service = new ApporteurViewsService();
        
        const [dashboard, prospects, objectifs, activite, performance] = await Promise.all([
          service.getDashboardPrincipal(),
          service.getProspectsDetaille(),
          service.getObjectifsPerformance(),
          service.getActiviteRecente(),
          service.getPerformanceProduits()
        ]);

        if (isMounted) {
          setData({
            dashboard,
            prospects,
            objectifs,
            activite,
            performance
          });
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des données';
          setError(errorMessage);
          console.error('Erreur useApporteurEnhanced:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false; // Cleanup pour éviter l'erreur React #310
    };
  }, [apporteurId]);

  // Retourner uniquement les données brutes - SIMPLE et STABLE
  return {
    // Données brutes
    data,
    loading,
    error,
    refresh,
    
    // Données extraites (références stables si data ne change pas)
    dashboard: data?.dashboard?.data || null,
    prospects: data?.prospects?.data || [],
    objectifs: data?.objectifs?.data || null,
    activite: data?.activite?.data || [],
    performance: data?.performance?.data || [],
    
    // Flags simples
    hasData: !!data,
    hasEnhancedData: !!(data?.dashboard?.success && data?.prospects?.success),
    isLoading: loading,
    hasError: !!error
  };
}
