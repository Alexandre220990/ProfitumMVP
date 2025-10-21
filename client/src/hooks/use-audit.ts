import { get, post } from "@/lib/api";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Audit, AuditType, AuditStatus } from "@/types/audit";
import { TOTAL_WORKFLOW_STEPS, calculateCurrentStep, formatStepDisplay } from "@/lib/workflow-constants";
import { checkRecentSimulation } from "@/api/simulations";

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
}

interface ClientProduitEligible {
  id: string;
  clientId: string;
  produitId: string;
  simulationId?: number;
  tauxFinal?: number;
  montantFinal?: number;
  dureeFinale?: number;
  created_at: string;
  updated_at: string;
  ProduitEligible: {
    id: string;
    nom: string;
    description: string;
    category?: string;
  };
  current_step?: number;
  progress?: number;
}

export function useAudits(clientId?: string) {
  const { user } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [hasRecentSimulation, setHasRecentSimulation] = useState<boolean>(false);

  // Calcul optimisé du clientId effectif - utiliser l'email pour faire le lien
  const effectiveClientId = useMemo(() => {
    if (clientId) return clientId;
    if (user?.email) return user.email; // Utiliser l'email comme identifiant
    return null;
  }, [clientId, user?.email]);

  const fetchAuditsData = useCallback(async (): Promise<Audit[]> => {
    if (!effectiveClientId) {
      console.log('⚠️ Pas de clientId disponible, retour tableau vide');
      setIsLoading(false);
      return [];
    }

    console.log('🔍 Récupération des audits pour le client: ', effectiveClientId);
    
    try {
      // Si on a un email, utiliser la route qui gère la correspondance
      const endpoint = user?.email ? 
        `/api/client/produits-eligibles` : 
        `/api/produits-eligibles/client/${effectiveClientId}`;
      
      const response = await get<ApiResponse<ClientProduitEligible[]>>(endpoint);
      console.log('✅ Réponse API produits éligibles: ', response);

      if (response.success && response.data !== null && Array.isArray(response.data)) {
        // Mapping optimisé avec validation
        const auditsMapped: Audit[] = response.data
          .filter(item => {
            if (!item.ProduitEligible || !item.ProduitEligible.nom) {
              console.warn('⚠️ ProduitEligible manquant ou incomplet pour l\'item:', item);
              return false;
            }
            return true;
          })
          .map(item => ({
            id: item.id,
            client_id: item.clientId,
            expert_id: null,
            audit_type: item.ProduitEligible!.nom as AuditType,
            status: item.current_step > 0 ? "en_cours" as AuditStatus : "non_démarré" as AuditStatus,
            current_step: item.current_step || 0,
            progress: item.progress || 0,
            potential_gain: item.montantFinal || 0,
            obtained_gain: 0,
            reliability: 0,
            charter_signed: item.current_step >= 1,
            created_at: item.created_at,
            updated_at: item.updated_at,
            description: item.ProduitEligible!.description || '',
            is_eligible_product: true,
            tauxFinal: item.tauxFinal || 0,
            dureeFinale: item.dureeFinale || 0
          }));

        console.log(`✅ ${auditsMapped.length} audits mappés avec succès`);
        console.log('📊 Détails des audits: ', auditsMapped.map(a => ({ id: a.id, audit_type: a.audit_type, current_step: a.current_step, progress: a.progress, charter_signed: a.charter_signed })));
        
        // Améliorer le calcul des étapes pour correspondre au ProductProcessWorkflow
        const auditsWithEnhancedSteps = auditsMapped.map(audit => {
          // Calculer l'étape actuelle basée sur le statut et la progression
          const currentStep = calculateCurrentStep(audit.status, audit.current_step || 0, audit.progress || 0);
          
          return {
            ...audit,
            current_step: currentStep,
            total_steps: TOTAL_WORKFLOW_STEPS,
            step_display: formatStepDisplay(currentStep, TOTAL_WORKFLOW_STEPS)
          };
        });
        
        setAudits(auditsWithEnhancedSteps);
        setError(null);
        return auditsWithEnhancedSteps;
      } else {
        console.log('ℹ️ Aucun produit éligible trouvé - état normal');
        setAudits([]);
        setError(null);
        return [];
      }
    } catch (err) {
      console.error("❌ Erreur lors du chargement des audits: ", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      return [];
    } finally {
      setIsLoading(false);
      setLastRefresh(Date.now());
    }
  }, [effectiveClientId, user?.email]);

  const checkRecentSimulationStatus = useCallback(async (): Promise<boolean> => {
    if (!effectiveClientId) return false;
    try {
      const result = await checkRecentSimulation(effectiveClientId);
      setHasRecentSimulation(result.exists);
      return result.exists;
    } catch (error) {
      console.error('Erreur dans checkRecentSimulation: ', error);
      return false;
    }
  }, [effectiveClientId]);

  const fetchAuditsDataAndCheckSimulation = useCallback(async (): Promise<void> => {
    try {
      const [auditsData, hasRecent] = await Promise.all([
        fetchAuditsData(),
        checkRecentSimulationStatus()
      ]);

      setAudits(auditsData);
      setHasRecentSimulation(hasRecent);
    } catch (error) {
      console.error('Erreur lors de la récupération des données: ', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
      { auditId, auditType: audit.audit_type }
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

  return { audits, isLoading, error, lastRefresh, refreshAudits: fetchAuditsData, signCharter, hasRecentSimulation };
}

// --- Hook pour récupérer un audit individuel ---
export function useAudit(id: string) {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const response = await get<ApiResponse<Audit>>(`/api/audits/${id}`);
        
        // Validation optimisée avec useMemo pour éviter les recalculs
        const requiredFields: (keyof Audit)[] = useMemo(() => [
          'id', 'client_id', 'audit_type', 'status', 'current_step', 'progress', 
          'potential_gain', 'obtained_gain', 'charter_signed', 'created_at', 
          'updated_at', 'description', 'is_eligible_product'
        ], []);

        const isAudit = (data: unknown): data is Audit => {
          if (typeof data !== 'object' || data === null) return false;
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
