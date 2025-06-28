import { get, post } from '@/lib/api';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { Audit, AuditType, AuditStatus } from "@/types/audit";

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
}

interface SimulationCheckResponse {
  hasRecentSimulation: boolean;
}

interface Produit {
  nom: string;
  description: string;
  tauxMin: number;
  tauxMax: number;
  montantMin: number;
  montantMax: number;
  dureeMin: number;
  dureeMax: number;
}

interface ClientProduitEligible {
  id: string;
  client_id: string;
  produit_id: string;
  simulation_id: number;
  taux_final: number;
  montant_final: number;
  duree_finale: number;
  created_at: string;
  updated_at: string;
  produit: Produit;
  current_step: number;
  progress: number;
}

export function useAudits(clientId?: string) {
  const { user } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [hasRecentSimulation, setHasRecentSimulation] = useState(false);

  const effectiveClientId = clientId || user?.id;

  const fetchAuditsData = useCallback(async (): Promise<Audit[]> => {
    if (!effectiveClientId) {
      console.log('⚠️ Pas de clientId disponible, retour tableau vide');
      setIsLoading(false);
      return [];
    }

    console.log('🔍 Récupération des audits pour le client:', effectiveClientId);
    
    try {
      const response = await get<ApiResponse<ClientProduitEligible[]>>(
        `/api/produits-eligibles/client/${effectiveClientId}`
      );
      console.log('✅ Réponse API produits éligibles:', response);

      if (response.success && response.data !== null && Array.isArray(response.data)) {
        const auditsMapped: Audit[] = response.data.map(item => ({
          id: item.id,
          client_id: item.client_id,
          expert_id: null,
          audit_type: item.produit.nom as AuditType,
          status: item.current_step > 0 ? "en_cours" as AuditStatus : "non_démarré" as AuditStatus,
          current_step: item.current_step || 0,
          progress: item.progress || 0,
          potential_gain: item.montant_final,
          obtained_gain: 0,
          reliability: 0,
          charter_signed: item.current_step >= 1,
          created_at: item.created_at,
          updated_at: item.updated_at,
          description: item.produit.description,
          is_eligible_product: true,
          taux_final: item.taux_final,
          duree_finale: item.duree_finale
        }));

        console.log(`✅ ${auditsMapped.length} audits mappés avec succès`);
        console.log('📊 Détails des audits:', auditsMapped.map(a => ({
          id: a.id,
          audit_type: a.audit_type,
          current_step: a.current_step,
          progress: a.progress,
          charter_signed: a.charter_signed
        })));
        
        setAudits(auditsMapped);
        setError(null);
        return auditsMapped;
      } else {
        console.log('ℹ️ Aucun produit éligible trouvé - état normal');
        setAudits([]);
        setError(null);
        return [];
      }
    } catch (err) {
      console.error("❌ Erreur lors du chargement des audits:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      return [];
    } finally {
      setIsLoading(false);
      setLastRefresh(Date.now());
    }
  }, [effectiveClientId]);

  const checkRecentSimulation = useCallback(async (): Promise<boolean> => {
    if (!effectiveClientId) return false;

    try {
      const response = await get<ApiResponse<SimulationCheckResponse>>(
        `/api/simulations/check-recent/${effectiveClientId}`
      );

      const isSimulationCheckResponse = (data: unknown): data is SimulationCheckResponse => {
        return typeof data === 'object' && 
               data !== null && 
               'hasRecentSimulation' in data && 
               typeof (data as SimulationCheckResponse).hasRecentSimulation === 'boolean';
      };

      const hasRecent = response.success && 
                       response.data !== null && 
                       isSimulationCheckResponse(response.data) && 
                       response.data.hasRecentSimulation;
      
      setHasRecentSimulation(hasRecent);
      return hasRecent;
    } catch (error) {
      console.error('Erreur dans checkRecentSimulation:', error);
      return false;
    }
  }, [effectiveClientId]);

  const fetchAuditsDataAndCheckSimulation = useCallback(async (): Promise<void> => {
    try {
      const [auditsData, hasRecent] = await Promise.all([
        fetchAuditsData(),
        checkRecentSimulation()
      ]);

      setAudits(auditsData);
      setHasRecentSimulation(hasRecent);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    }
  }, [fetchAuditsData, checkRecentSimulation]);

  useEffect(() => {
    if (user) {
      fetchAuditsDataAndCheckSimulation();
    }
  }, [user, fetchAuditsDataAndCheckSimulation]);

  const signCharter = useCallback(async (auditId: string): Promise<boolean> => {
    const audit = audits.find(a => a.id === auditId);
    if (!audit) return false;

    const response = await post<ApiResponse<{ audit_id: string }>>(
      '/api/audits/sign-charter',
      {
        auditId,
        auditType: audit.audit_type
      }
    );

    if (response.success && response.data !== null) {
      setAudits(prev =>
        prev.map(a =>
          a.id === auditId
            ? { ...a, charter_signed: true, status: "en_cours" as AuditStatus, current_step: 2 }
            : a
        )
      );
      return true;
    }
    return false;
  }, [audits]);

  return {
    audits,
    isLoading,
    error,
    lastRefresh,
    refreshAudits: fetchAuditsData,
    signCharter,
    hasRecentSimulation
  };
}

// --- Hook pour récupérer un audit individuel ---
export function useAudit(id: string) {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const response = await get<ApiResponse<Audit>>(`/api/audits/${id}`);
        
        const isAudit = (data: unknown): data is Audit => {
          if (typeof data !== 'object' || data === null) return false;
          
          const requiredFields: (keyof Audit)[] = [
            'id', 'client_id', 'audit_type', 'status', 
            'current_step', 'progress', 'potential_gain', 
            'obtained_gain', 'charter_signed', 'created_at', 
            'updated_at', 'description', 'is_eligible_product'
          ];
          
          return requiredFields.every(field => field in data);
        };

        if (response.success && response.data !== null && isAudit(response.data)) {
          const validAudit: Audit = response.data;
          setAudit(validAudit);
        } else {
          setError(response.message || "Erreur lors de la récupération de l'audit");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAudit();
    }
  }, [id]);

  return { audit, loading, error };
}
