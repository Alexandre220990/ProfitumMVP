/**
 * Hooks pour la gestion des réponses prospects
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProspectReplySummary, RepliesFilters, RepliesGlobalStats } from '@/types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Récupérer la liste des réponses avec filtres
 */
export function useProspectReplies(filters?: RepliesFilters) {
  return useQuery({
    queryKey: ['prospect-replies', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.unread_only) params.append('unread', 'true');
      if (filters?.sequence_id) params.append('sequence_id', filters.sequence_id);
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.quick_reply_only) params.append('quick_reply', 'true');

      const response = await fetch(
        `${API_URL}/api/prospects/replies?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des réponses');
      }

      const result = await response.json();
      return result.data as ProspectReplySummary[];
    },
    refetchInterval: 60000, // Refresh toutes les minutes
    staleTime: 30000
  });
}

/**
 * Récupérer les statistiques globales des réponses
 */
export function useRepliesStats() {
  return useQuery({
    queryKey: ['replies-stats'],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/api/prospects/replies/stats`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des stats');
      }

      const result = await response.json();
      return result.data as RepliesGlobalStats;
    },
    refetchInterval: 60000, // Refresh toutes les minutes
    staleTime: 30000
  });
}

/**
 * Récupérer le nombre de réponses non lues (pour badge)
 */
export function useUnreadRepliesCount() {
  return useQuery({
    queryKey: ['unread-replies-count'],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/api/prospects/replies/unread-count`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du compteur');
      }

      const result = await response.json();
      return result.data as number;
    },
    refetchInterval: 30000, // Refresh toutes les 30 secondes
    staleTime: 15000
  });
}

/**
 * Marquer toutes les réponses d'un prospect comme lues
 */
export function useMarkRepliesRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prospectId: string) => {
      const response = await fetch(
        `${API_URL}/api/prospects/${prospectId}/replies/mark-read`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors du marquage comme lu');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalider les caches pour rafraîchir
      queryClient.invalidateQueries({ queryKey: ['prospect-replies'] });
      queryClient.invalidateQueries({ queryKey: ['replies-stats'] });
      queryClient.invalidateQueries({ queryKey: ['unread-replies-count'] });
    }
  });
}

