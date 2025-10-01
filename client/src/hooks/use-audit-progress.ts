import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { get, post } from "@/lib/api";
import { toast } from "sonner";

interface AuditProgress { current_step: number;
  progress: Record<string, any>;
  signed_charters: Record<string, boolean>;
  selected_experts: Record<string, any>;
  documents: Record<string, any>; }

interface ApiResponse<T> { success: boolean;
  data: T;
  message?: string; }

export function useAuditProgress(requestId: string = 'default') { const { user } = useAuth();
  const [progress, setProgress] = useState<AuditProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { const fetchProgress = async () => {
      if (!user?.id) return;

      try {
        const response = await get<ApiResponse<AuditProgress>>(`/api/audit-progress/${requestId }`);
        if (response.success && response.data?.data) { setProgress(response.data.data); } else { throw new Error(response.message || "Erreur lors de la récupération de la progression"); }
      } catch (err) { console.error("Erreur: ", err);
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
        toast.error("Impossible de charger la progression de l'audit");
      } finally { setLoading(false); }
    };

    fetchProgress();
  }, [user?.id, requestId]);

  const updateProgress = async (updates: Partial<AuditProgress>) => { if (!user?.id) return;

    try {
      const response = await post<ApiResponse<AuditProgress>>(`/api/audit-progress/${requestId }`, updates);
      if (response.success && response.data?.data) { setProgress(response.data.data);
        toast.success("Progression mise à jour avec succès");
      } else { throw new Error(response.message || "Erreur lors de la mise à jour de la progression"); }
    } catch (err) { console.error("Erreur: ", err);
      toast.error("Impossible de mettre à jour la progression");
      throw err;
    }
  };

  const updateStep = async (step: number) => { await updateProgress({ current_step: step });
  };

  const updateSignedCharters = async (charters: Record<string, boolean>) => { await updateProgress({ signed_charters: charters });
  };

  const updateSelectedExperts = async (experts: Record<string, any>) => { await updateProgress({ selected_experts: experts });
  };

  const updateDocuments = async (documents: Record<string, any>) => { await updateProgress({ documents });
  };

  return { progress, loading, error, updateProgress, updateStep, updateSignedCharters, updateSelectedExperts, updateDocuments };
} 