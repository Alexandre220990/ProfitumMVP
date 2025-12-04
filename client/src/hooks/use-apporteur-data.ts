import { useState, useEffect, useCallback } from 'react';
import { ApporteurViewsService } from '../services/apporteur-views-service';
import { getSupabaseToken } from '@/lib/auth-helpers';
import { config } from '@/config';

export interface ApporteurData {
  dashboard: any;
  prospects: any[];
  objectifs: any;
  activite: any[];
  conversionStats: any;
  dossiers: any[];
}

interface UseApporteurDataReturn {
  data: ApporteurData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  loadDossiers: () => Promise<void>;
}

export const useApporteurData = (apporteurId: string | null): UseApporteurDataReturn => {
  const [data, setData] = useState<ApporteurData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction de chargement des données principales
  const fetchData = useCallback(async () => {
    if (!apporteurId) {
      console.log('❌ Pas d\'apporteurId dans useApporteurData');
      setLoading(false);
      return;
    }

    console.log('🔍 Chargement des données apporteur:', apporteurId);

    try {
      setLoading(true);
      setError(null);

      const service = new ApporteurViewsService();
      
      // Charger les données principales en parallèle
      const [dashboardRes, prospectsRes, objectifsRes, activiteRes, conversionRes] = await Promise.all([
        service.getDashboardPrincipal(),
        service.getProspectsDetaille(),
        service.getObjectifsPerformance(),
        service.getActiviteRecente(),
        fetch(`${config.API_URL}/api/apporteur/conversion-stats`, {
          headers: {
            'Authorization': `Bearer ${await getSupabaseToken()}`,
            'Content-Type': 'application/json'
          }
        }).then(r => r.ok ? r.json() : null)
      ]);

      const newData: ApporteurData = {
        dashboard: dashboardRes?.data || null,
        prospects: prospectsRes?.data || [],
        objectifs: objectifsRes?.data || null,
        activite: activiteRes?.data || [],
        conversionStats: conversionRes?.data || null,
        dossiers: []
      };

      setData(newData);
      console.log('✅ Données apporteur chargées avec succès');
    } catch (err: any) {
      console.error('❌ Erreur chargement données apporteur:', err);
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [apporteurId]);

  // Fonction pour charger les dossiers à la demande
  const loadDossiers = useCallback(async () => {
    if (!apporteurId || !data) return;

    try {
      const response = await fetch(`${config.API_URL}/api/apporteur/dossiers`, {
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setData(prev => prev ? { ...prev, dossiers: result.data || [] } : prev);
        console.log('✅ Dossiers chargés:', result.data?.length || 0);
      }
    } catch (err) {
      console.error('❌ Erreur chargement dossiers:', err);
    }
  }, [apporteurId, data]);

  // Fonction refresh
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Charger les données au montage et quand apporteurId change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apporteurId]);

  return {
    data,
    loading,
    error,
    refresh,
    loadDossiers
  };
};

