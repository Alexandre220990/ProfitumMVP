import { post } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import { AuditStatus } from '@/types/audit';

interface CreateAuditData {
  audit_type: string;
  potential_gain: number;
  status?: AuditStatus;
  current_step?: number;
  progress?: number;
  client_id?: string;
  expert_id?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface Audit {
  id: string;
  clientId: string;
  expertId?: string;
  audit_type: string;
  status: AuditStatus;
  current_step: number;
  progress: number;
  potential_gain: number;
  obtained_gain?: number;
  created_at: string;
  updated_at: string;
}

export function useCreateAudit() {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: CreateAuditData) => {
      // Utiliser l'ID du client fourni ou l'ID de l'utilisateur connecté
      const clientId = data.client_id || user?.id;
      
      if (!clientId) {
        throw new Error('ID client non disponible');
      }
      
      // Mapper les statuts du frontend vers les statuts du backend
      const statusMap: Record<string, string> = {
        'non_démarré': 'en_attente',
        'en_cours': 'en_cours',
        'terminé': 'terminé'
      };
      
      const status = data.status ? statusMap[data.status] || 'en_attente' : 'en_attente';
      
      console.log('Création d\'un audit avec les données:', {
        ...data,
        client_id: clientId,
        status: status,
        current_step: data.current_step || 0,
        progress: data.progress || 0
      });
      
      const response = await post<ApiResponse<Audit>>('/api/audits', {
        ...data,
        client_id: clientId,
        status: status,
        current_step: data.current_step || 0,
        progress: data.progress || 0
      });
      
      console.log('Réponse de création d\'audit:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la création de l\'audit');
      }
      
      return response.data;
    }
  });
} 