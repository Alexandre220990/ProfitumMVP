import { useState, useEffect } from "react";
import { get } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Expert { id: number;
  name: string;
  email: string;
  company: string;
  specializations: string[];
  experience: string;
  location: string;
  rating: number;
  compensation: number;
  description: string;
  siren: string;
  status: string;
  niveauExpertise?: string;
  tarifHoraire?: number;
  disponibilite?: string; }

interface ApiResponse<T> { success: boolean;
  data: T;
  message?: string; }

export function useExperts(options?: { specialization?: string; produitId?: string }) { const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { const fetchExperts = async () => {
      try {
        let url = '/api/experts';
        const params = new URLSearchParams();
        
        if (options?.specialization) {
          params.append('specialization', options.specialization); }
        
        if (options?.produitId) { params.append('produitId', options.produitId); }
        
        if (params.toString()) { url += `?${params.toString() }`;
        }

        const response = await get<ApiResponse<{ experts: Expert[], pagination: any }>>(url);
        setExperts(response.data?.data?.experts || []);
      } catch (err) { const message = err instanceof Error ? err.message : 'Erreur lors de la récupération des experts';
        setError(message);
        toast({
          title: "Erreur", description: message, variant: "destructive" });
      } finally { setLoading(false); }
    };

    fetchExperts();
  }, [options?.specialization, options?.produitId, toast]);

  return { experts, loading, error };
} 