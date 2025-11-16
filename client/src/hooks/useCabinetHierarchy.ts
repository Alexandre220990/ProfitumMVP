import { useCallback, useEffect, useState } from 'react';
import { CabinetHierarchyNode } from '@/types';
import { expertCabinetService } from '@/services/cabinet-service';

interface UseCabinetHierarchyOptions {
  autoFetch?: boolean;
}

export const useCabinetHierarchy = (options: UseCabinetHierarchyOptions = {}) => {
  const { autoFetch = true } = options;
  const [hierarchy, setHierarchy] = useState<CabinetHierarchyNode[]>([]);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchHierarchy = useCallback(async () => {
    try {
      setLoading(true);
      const data = await expertCabinetService.getHierarchy();
      setHierarchy(data || []);
      setError(null);
    } catch (err: any) {
      console.error('❌ useCabinetHierarchy.fetchHierarchy', err);
      setError(err?.message || 'Impossible de charger la hiérarchie');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchHierarchy();
    }
  }, [autoFetch, fetchHierarchy]);

  return {
    hierarchy,
    loading,
    error,
    refresh: fetchHierarchy
  };
};

