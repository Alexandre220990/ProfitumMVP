import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { get } from "@/lib/api";
import { CharteDocument, AuditDocument, SimulationDocument, GuideDocument, DocumentStats } from "@/types/client-documents";

interface ClientDocuments { 
  chartes: CharteDocument[];
  audits: AuditDocument[];
  simulations: SimulationDocument[];
  guides: GuideDocument[];
  stats: DocumentStats 
}

// Hook principal
export const useClientDocuments = () => { 
  const { user } = useAuth();

  return useQuery({ 
    queryKey: ['client-documents', user?.id], 
    queryFn: async (): Promise<ClientDocuments> => {
      if (!user?.id) {
        throw new Error('Utilisateur non authentifié'); 
      }

      // Utiliser la nouvelle API unifiée
      const response = await get(`/api/client-documents/client/${user.id}`);
      
      if (!response.success) { 
        throw new Error(response.message || 'Erreur lors de la récupération des documents'); 
      }

      return response.data as ClientDocuments;
    },
    enabled: !!user?.id && user.type === 'client',
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (remplace cacheTime)
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook pour les statistiques uniquement
export const useDocumentStats = () => { 
  const { data } = useClientDocuments();
  return data?.stats;
}; 