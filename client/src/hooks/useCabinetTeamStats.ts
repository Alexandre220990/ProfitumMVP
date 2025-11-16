import { useCallback, useEffect, useState } from 'react';
import { CabinetTeamKPIs, CabinetTeamStatsRow } from '@/types';
import { expertCabinetService } from '@/services/cabinet-service';

export const useCabinetTeamStats = (autoFetch = true) => {
  const [stats, setStats] = useState<CabinetTeamStatsRow[]>([]);
  const [kpis, setKpis] = useState<CabinetTeamKPIs>({
    dossiers_total: 0,
    dossiers_en_cours: 0,
    dossiers_signes: 0
  });
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await expertCabinetService.getTeamStats();
      setStats(data?.stats || []);
      setKpis(
        data?.kpis || {
          dossiers_total: 0,
          dossiers_en_cours: 0,
          dossiers_signes: 0
        }
      );
      setError(null);
    } catch (err: any) {
      console.error('❌ useCabinetTeamStats.fetchStats', err);
      setError(err?.message || 'Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchStats();
    }
  }, [autoFetch, fetchStats]);

  return {
    stats,
    kpis,
    loading,
    error,
    refresh: fetchStats
  };
};

