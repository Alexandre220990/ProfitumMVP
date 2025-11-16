import { useCallback, useEffect, useState } from 'react';
import { CabinetContextPayload } from '@/types';
import {
  CabinetMemberInputPayload,
  CabinetMemberUpdatePayload,
  expertCabinetService
} from '@/services/cabinet-service';

interface UseCabinetContextReturn {
  context: CabinetContextPayload | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  mutationLoading: boolean;
  refresh: () => Promise<void>;
  addMember: (payload: CabinetMemberInputPayload) => Promise<void>;
  updateMember: (memberRecordId: string, payload: CabinetMemberUpdatePayload) => Promise<void>;
  removeMember: (memberRecordId: string) => Promise<void>;
  refreshStats: () => Promise<void>;
}

export const useCabinetContext = (): UseCabinetContextReturn => {
  const [context, setContext] = useState<CabinetContextPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContext = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await expertCabinetService.getContext();
      setContext(data);
      setError(null);
    } catch (err: any) {
      console.error('❌ useCabinetContext.fetchContext', err);
      setError(err?.message || 'Impossible de charger le cabinet');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const addMember = useCallback(
    async (payload: CabinetMemberInputPayload) => {
      try {
        setMutationLoading(true);
        await expertCabinetService.addMember(payload);
        await fetchContext();
      } catch (err: any) {
        console.error('❌ useCabinetContext.addMember', err);
        throw err;
      } finally {
        setMutationLoading(false);
      }
    },
    [fetchContext]
  );

  const updateMember = useCallback(
    async (memberRecordId: string, payload: CabinetMemberUpdatePayload) => {
      try {
        setMutationLoading(true);
        await expertCabinetService.updateMember(memberRecordId, payload);
        await fetchContext();
      } catch (err: any) {
        console.error('❌ useCabinetContext.updateMember', err);
        throw err;
      } finally {
        setMutationLoading(false);
      }
    },
    [fetchContext]
  );

  const removeMember = useCallback(
    async (memberRecordId: string) => {
      try {
        setMutationLoading(true);
        await expertCabinetService.removeMember(memberRecordId);
        await fetchContext();
      } catch (err: any) {
        console.error('❌ useCabinetContext.removeMember', err);
        throw err;
      } finally {
        setMutationLoading(false);
      }
    },
    [fetchContext]
  );

  const refreshStats = useCallback(async () => {
    try {
      setMutationLoading(true);
      await expertCabinetService.refreshStats();
      await fetchContext();
    } catch (err: any) {
      console.error('❌ useCabinetContext.refreshStats', err);
      throw err;
    } finally {
      setMutationLoading(false);
    }
  }, [fetchContext]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  return {
    context,
    loading,
    error,
    refreshing,
    mutationLoading,
    refresh: fetchContext,
    addMember,
    updateMember,
    removeMember,
    refreshStats
  };
};

