/**
 * Hook React pour gérer les RDV
 * Remplace et unifie les anciens hooks pour ClientRDV et CalendarEvent
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from './use-auth';
import { rdvService, RDV, CreateRDVData, UpdateRDVData, RDVFilters } from '@/services/rdv-service';

// ============================================================================
// TYPES
// ============================================================================

export interface UseRDVOptions {
  autoLoad?: boolean;
  filters?: RDVFilters;
  enableRealTime?: boolean;
}

export interface UseRDVReturn {
  // État
  rdvs: RDV[];
  loading: boolean;
  error: string | null;
  
  // Actions principales
  createRDV: (data: CreateRDVData) => Promise<RDV | null>;
  updateRDV: (id: string, data: UpdateRDVData) => Promise<RDV | null>;
  deleteRDV: (id: string) => Promise<boolean>;
  validateRDV: (id: string, action: 'accept' | 'propose_alternative', options?: any) => Promise<RDV | null>;
  confirmRDV: (id: string) => Promise<RDV | null>;
  cancelRDV: (id: string, notes?: string) => Promise<RDV | null>;
  completeRDV: (id: string, notes?: string) => Promise<RDV | null>;
  
  // Utilitaires
  refresh: () => Promise<void>;
  getRDVById: (id: string) => RDV | undefined;
  getUpcomingRDVs: (days?: number) => RDV[];
  getTodayRDVs: () => RDV[];
  getRDVsByStatus: (status: string) => RDV[];
  getRDVsByDate: (date: Date) => RDV[];
  clearError: () => void;
  
  // Filtres
  setFilters: (filters: RDVFilters) => void;
  currentFilters: RDVFilters;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useRDV = (options: UseRDVOptions = {}): UseRDVReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<RDVFilters>(options.filters || {});

  const { 
    autoLoad = true, 
    enableRealTime = true
  } = options;

  // ========================================
  // QUERY REACT QUERY
  // ========================================

  const {
    data: rdvs = [],
    isLoading: loading,
    refetch: refresh
  } = useQuery({
    queryKey: ['rdvs', user?.id, currentFilters],
    queryFn: async () => {
      if (!user?.id) return [];
      return await rdvService.getRDVs(currentFilters);
    },
    enabled: autoLoad && !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // ========================================
  // MUTATIONS
  // ========================================

  // Mutation créer RDV
  const createMutation = useMutation({
    mutationFn: async (data: CreateRDVData) => {
      return await rdvService.createRDV(data);
    },
    onSuccess: (newRDV) => {
      queryClient.invalidateQueries({ queryKey: ['rdvs'] });
      toast.success(`RDV créé : ${newRDV.title}`);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Erreur lors de la création');
      toast.error('Impossible de créer le RDV');
    }
  });

  // Mutation mettre à jour RDV
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRDVData }) => {
      return await rdvService.updateRDV(id, data);
    },
    onSuccess: (updatedRDV) => {
      queryClient.invalidateQueries({ queryKey: ['rdvs'] });
      toast.success(`RDV mis à jour : ${updatedRDV.title}`);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
      toast.error('Impossible de mettre à jour le RDV');
    }
  });

  // Mutation supprimer RDV
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await rdvService.deleteRDV(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdvs'] });
      toast.success('RDV supprimé');
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Erreur lors de la suppression');
      toast.error('Impossible de supprimer le RDV');
    }
  });

  // Mutation valider RDV (expert)
  const validateMutation = useMutation({
    mutationFn: async ({ 
      id, 
      action, 
      options 
    }: { 
      id: string; 
      action: 'accept' | 'propose_alternative'; 
      options?: any 
    }) => {
      return await rdvService.validateRDV(id, action, options);
    },
    onSuccess: (validatedRDV, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rdvs'] });
      const message = variables.action === 'accept' 
        ? 'RDV confirmé' 
        : 'Date alternative proposée';
      toast.success(message);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Erreur lors de la validation');
      toast.error('Impossible de valider le RDV');
    }
  });

  // ========================================
  // FONCTIONS UTILITAIRES
  // ========================================

  const getRDVById = useCallback((id: string): RDV | undefined => {
    return rdvs.find(rdv => rdv.id === id);
  }, [rdvs]);

  const getUpcomingRDVs = useCallback((days: number = 7): RDV[] => {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return rdvs
      .filter(rdv => {
        const rdvDate = new Date(`${rdv.scheduled_date}T${rdv.scheduled_time}`);
        return rdvDate >= now && rdvDate <= future;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.scheduled_date}T${a.scheduled_time}`);
        const dateB = new Date(`${b.scheduled_date}T${b.scheduled_time}`);
        return dateA.getTime() - dateB.getTime();
      });
  }, [rdvs]);

  const getTodayRDVs = useCallback((): RDV[] => {
    const today = new Date().toISOString().split('T')[0];
    return rdvs.filter(rdv => rdv.scheduled_date === today);
  }, [rdvs]);

  const getRDVsByStatus = useCallback((status: string): RDV[] => {
    return rdvs.filter(rdv => rdv.status === status);
  }, [rdvs]);

  const getRDVsByDate = useCallback((date: Date): RDV[] => {
    const dateString = date.toISOString().split('T')[0];
    return rdvs.filter(rdv => rdv.scheduled_date === dateString);
  }, [rdvs]);

  // ========================================
  // FONCTIONS D'ACTION
  // ========================================

  const createRDV = useCallback(async (data: CreateRDVData): Promise<RDV | null> => {
    try {
      return await createMutation.mutateAsync(data);
    } catch (error) {
      console.error('Erreur création RDV:', error);
      return null;
    }
  }, [createMutation]);

  const updateRDV = useCallback(async (id: string, data: UpdateRDVData): Promise<RDV | null> => {
    try {
      return await updateMutation.mutateAsync({ id, data });
    } catch (error) {
      console.error('Erreur mise à jour RDV:', error);
      return null;
    }
  }, [updateMutation]);

  const deleteRDV = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (error) {
      console.error('Erreur suppression RDV:', error);
      return false;
    }
  }, [deleteMutation]);

  const validateRDV = useCallback(async (
    id: string, 
    action: 'accept' | 'propose_alternative',
    options?: any
  ): Promise<RDV | null> => {
    try {
      return await validateMutation.mutateAsync({ id, action, options });
    } catch (error) {
      console.error('Erreur validation RDV:', error);
      return null;
    }
  }, [validateMutation]);

  const confirmRDV = useCallback(async (id: string): Promise<RDV | null> => {
    return updateRDV(id, { status: 'confirmed' });
  }, [updateRDV]);

  const cancelRDV = useCallback(async (id: string, notes?: string): Promise<RDV | null> => {
    return updateRDV(id, { status: 'cancelled', notes });
  }, [updateRDV]);

  const completeRDV = useCallback(async (id: string, notes?: string): Promise<RDV | null> => {
    return updateRDV(id, { status: 'completed', expert_notes: notes });
  }, [updateRDV]);

  // ========================================
  // REAL-TIME (optionnel)
  // ========================================

  useEffect(() => {
    if (enableRealTime && user?.id) {
      // TODO: Implémenter la synchronisation temps réel avec Supabase Realtime
      console.log('🔄 Mode temps réel activé pour RDV');
    }
  }, [enableRealTime, user?.id]);

  // ========================================
  // RETOUR DU HOOK
  // ========================================

  return {
    // État
    rdvs,
    loading,
    error,
    
    // Actions principales
    createRDV,
    updateRDV,
    deleteRDV,
    validateRDV,
    confirmRDV,
    cancelRDV,
    completeRDV,
    
    // Utilitaires
    refresh: async () => { await refresh(); },
    getRDVById,
    getUpcomingRDVs,
    getTodayRDVs,
    getRDVsByStatus,
    getRDVsByDate,
    clearError: () => setError(null),
    
    // Filtres
    setFilters: setCurrentFilters,
    currentFilters
  };
};

// ============================================================================
// HOOK SPÉCIALISÉ - RDV EN ATTENTE (pour experts)
// ============================================================================

export const usePendingRDVs = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pendingRDVs = [], isLoading, refetch } = useQuery({
    queryKey: ['rdvs', 'pending', user?.id],
    queryFn: async () => {
      if (!user?.id || user.type !== 'expert') return [];
      return await rdvService.getPendingRDVs();
    },
    enabled: !!user?.id && user.type === 'expert',
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const refresh = useCallback(async () => {
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['rdvs'] });
  }, [refetch, queryClient]);

  return {
    pendingRDVs,
    loading: isLoading,
    refresh,
    count: pendingRDVs.length
  };
};

// ============================================================================
// HOOK SPÉCIALISÉ - RDV DU JOUR
// ============================================================================

export const useTodayRDVs = () => {
  const { rdvs, loading } = useRDV({
    autoLoad: true,
    filters: {
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0]
    }
  });

  return {
    todayRDVs: rdvs,
    loading,
    count: rdvs.length
  };
};

// ============================================================================
// HOOK SPÉCIALISÉ - RDV À VENIR
// ============================================================================

export const useUpcomingRDVs = (days: number = 7) => {
  const today = new Date();
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

  const { rdvs, loading } = useRDV({
    autoLoad: true,
    filters: {
      start_date: today.toISOString().split('T')[0],
      end_date: futureDate.toISOString().split('T')[0]
    }
  });

  return {
    upcomingRDVs: rdvs,
    loading,
    count: rdvs.length
  };
};

