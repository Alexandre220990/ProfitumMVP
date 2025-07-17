import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { post, get } from "@/lib/api";
import type { User } from '@/types/user';

/**
 * Hook pour gérer les données utilisateur avec React Query
 */
export function useUser() {
  const queryClient = useQueryClient();

  // Récupérer les données utilisateur
  const { data: user, error, isLoading } = useQuery<User | null, Error>({
    queryKey: ['user'],
    queryFn: async (): Promise<User | null> => {
      try {
        const response = await get<User>('/api/user/profile');
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      } catch (error) {
        console.error('Erreur lors de la récupération du profil utilisateur:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  // Mutation pour mettre à jour le profil utilisateur
  const updateProfileMutation = useMutation<User, Error, Partial<User>>({
    mutationFn: async (userData): Promise<User> => {
      const response = await post<User>('/api/user/profile', userData);
      if (!response.success || !response.data) {
        throw new Error('Erreur lors de la mise à jour du profil');
      }
      return response.data;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['user'], updatedUser);
    },
  });

  // Mutation pour changer le mot de passe
  const changePasswordMutation = useMutation<void, Error, { currentPassword: string; newPassword: string }>({
    mutationFn: async (passwordData) => {
      const response = await post<void>('/api/user/change-password', passwordData);
      if (!response.success) {
        throw new Error('Erreur lors du changement de mot de passe');
      }
    },
  });

  // Mutation pour supprimer le compte
  const deleteAccountMutation = useMutation<void, Error, { password: string }>({
    mutationFn: async (deleteData) => {
      const response = await post<void>('/api/user/delete-account', deleteData);
      if (!response.success) {
        throw new Error('Erreur lors de la suppression du compte');
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['user'], null);
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    error,
    updateProfile: updateProfileMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
    deleteAccount: deleteAccountMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
    isDeletingAccount: deleteAccountMutation.isPending
  };
}

/**
 * Hook pour récupérer les préférences utilisateur
 */
export function useUserPreferences() {
  const { data: preferences, error, isLoading } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: async () => {
      try {
        const response = await get<any>('/api/user/preferences');
        return response.success ? response.data : null;
      } catch (error) {
        console.error('Erreur lors de la récupération des préférences:', error);
        return null;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return { preferences, isLoading, error };
}

/**
 * Hook pour récupérer les statistiques utilisateur
 */
export function useUserStats() {
  const { data: stats, error, isLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      try {
        const response = await get<any>('/api/user/stats');
        return response.success ? response.data : null;
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { stats, isLoading, error };
} 