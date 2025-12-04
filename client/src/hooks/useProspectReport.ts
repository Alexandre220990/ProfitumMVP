/**
 * Hooks pour la gestion des rapports prospects
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ProspectReport, ReportEnrichmentResult } from '@/types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Récupérer le rapport d'un prospect
 */
export function useProspectReport(prospectId: string) {
  return useQuery({
    queryKey: ['prospect-report', prospectId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/api/prospects/${prospectId}/report`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du rapport');
      }

      const result = await response.json();
      return result.data as ProspectReport | null;
    },
    enabled: !!prospectId
  });
}

/**
 * Créer ou mettre à jour un rapport
 */
export function useCreateOrUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      prospectId,
      data
    }: {
      prospectId: string;
      data: {
        report_content: string;
        report_html?: string;
        tags?: string[];
      };
    }) => {
      const response = await fetch(
        `${API_URL}/api/prospects/${prospectId}/report`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde du rapport');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['prospect-report', variables.prospectId] 
      });
    }
  });
}

/**
 * Enrichir le rapport avec l'IA
 */
export function useEnrichReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prospectId: string) => {
      const response = await fetch(
        `${API_URL}/api/prospects/${prospectId}/report/enrich`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'enrichissement');
      }

      const result = await response.json();
      return result.data as ReportEnrichmentResult;
    },
    onSuccess: (_, prospectId) => {
      queryClient.invalidateQueries({ 
        queryKey: ['prospect-report', prospectId] 
      });
      toast.success('✨ Rapport enrichi avec succès !');
    },
    onError: (error: Error) => {
      toast.error(`Erreur : ${error.message}`);
    }
  });
}

/**
 * Récupérer l'historique des versions
 */
export function useReportHistory(prospectId: string) {
  return useQuery({
    queryKey: ['prospect-report-history', prospectId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/api/prospects/${prospectId}/report/history`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de l\'historique');
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!prospectId
  });
}

/**
 * Restaurer une version précédente
 */
export function useRestoreVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      prospectId,
      version
    }: {
      prospectId: string;
      version: number;
    }) => {
      const response = await fetch(
        `${API_URL}/api/prospects/${prospectId}/report/restore`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ version })
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la restauration');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['prospect-report', variables.prospectId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['prospect-report-history', variables.prospectId] 
      });
      toast.success('Version restaurée avec succès !');
    },
    onError: (error: Error) => {
      toast.error(`Erreur : ${error.message}`);
    }
  });
}

/**
 * Supprimer un rapport
 */
export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prospectId: string) => {
      const response = await fetch(
        `${API_URL}/api/prospects/${prospectId}/report`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      return response.json();
    },
    onSuccess: (_, prospectId) => {
      queryClient.invalidateQueries({ 
        queryKey: ['prospect-report', prospectId] 
      });
      toast.success('Rapport supprimé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur : ${error.message}`);
    }
  });
}

/**
 * Upload une pièce jointe
 */
export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      prospectId,
      file
    }: {
      prospectId: string;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${API_URL}/api/prospects/${prospectId}/report/attachments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'upload');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['prospect-report', variables.prospectId] 
      });
      toast.success('Fichier ajouté avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur : ${error.message}`);
    }
  });
}

/**
 * Supprimer une pièce jointe
 */
export function useRemoveAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      prospectId,
      url
    }: {
      prospectId: string;
      url: string;
    }) => {
      const response = await fetch(
        `${API_URL}/api/prospects/${prospectId}/report/attachments`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url })
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['prospect-report', variables.prospectId] 
      });
      toast.success('Fichier supprimé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur : ${error.message}`);
    }
  });
}

