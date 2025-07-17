import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { post, del, get } from "@/lib/api";

export interface GEDFavorite {
  id: string;
  documentId: string;
  documentName: string;
  documentType: string;
  documentUrl: string;
  addedAt: string;
  userId: string;
}

/**
 * Hook pour gérer les favoris GED avec React Query
 */
export function useGEDFavorites() {
  const queryClient = useQueryClient();

  // Récupérer la liste des favoris
  const { data: favorites, error, isLoading } = useQuery<GEDFavorite[], Error>({
    queryKey: ['ged-favorites'],
    queryFn: async (): Promise<GEDFavorite[]> => {
      try {
        const response = await get<GEDFavorite[]>('/api/ged/favorites');
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      } catch (error) {
        console.error('Erreur lors de la récupération des favoris GED:', error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Mutation pour ajouter un favori
  const addFavoriteMutation = useMutation<GEDFavorite, Error, { documentId: string }>({
    mutationFn: async (favoriteData): Promise<GEDFavorite> => {
      const response = await post<GEDFavorite>('/api/ged/favorites', favoriteData);
      if (!response.success || !response.data) {
        throw new Error('Erreur lors de l\'ajout du favori');
      }
      return response.data;
    },
    onSuccess: (newFavorite) => {
      queryClient.setQueryData<GEDFavorite[]>(['ged-favorites'], (oldFavorites = []) => {
        return [...oldFavorites, newFavorite];
      });
    },
  });

  // Mutation pour supprimer un favori
  const removeFavoriteMutation = useMutation<void, Error, { documentId: string }>({
    mutationFn: async (favoriteData) => {
      const response = await del<void>(`/api/ged/favorites/${favoriteData.documentId}`);
      if (!response.success) {
        throw new Error('Erreur lors de la suppression du favori');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData<GEDFavorite[]>(['ged-favorites'], (oldFavorites = []) => {
        return oldFavorites.filter(fav => fav.documentId !== variables.documentId);
      });
    },
  });

  // Mutation pour vider tous les favoris
  const clearFavoritesMutation = useMutation<void, Error>({
    mutationFn: async () => {
      const response = await del<void>('/api/ged/favorites');
      if (!response.success) {
        throw new Error('Erreur lors de la suppression de tous les favoris');
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['ged-favorites'], []);
    },
  });

  // Fonction utilitaire pour vérifier si un document est en favori
  const isFavorite = (documentId: string): boolean => {
    return favorites?.some((fav: GEDFavorite) => fav.documentId === documentId) ?? false;
  };

  // Fonction utilitaire pour obtenir un favori par documentId
  const getFavorite = (documentId: string): GEDFavorite | undefined => {
    return favorites?.find((fav: GEDFavorite) => fav.documentId === documentId);
  };

  return {
    favorites: favorites ?? [],
    isLoading,
    error,
    addFavorite: addFavoriteMutation.mutateAsync,
    removeFavorite: removeFavoriteMutation.mutateAsync,
    clearFavorites: clearFavoritesMutation.mutateAsync,
    isAddingFavorite: addFavoriteMutation.isPending,
    isRemovingFavorite: removeFavoriteMutation.isPending,
    isClearingFavorites: clearFavoritesMutation.isPending,
    isFavorite,
    getFavorite
  };
}

/**
 * Hook pour gérer les favoris d'un document spécifique
 */
export function useDocumentFavorite(documentId: string) {
  const { addFavorite, removeFavorite, isFavorite, getFavorite, isLoading } = useGEDFavorites();
  
  const isDocumentFavorite = isFavorite(documentId);
  const favorite = getFavorite(documentId);

  const toggleFavorite = async () => {
    try {
      if (isDocumentFavorite) {
        await removeFavorite({ documentId });
      } else {
        await addFavorite({ documentId });
      }
    } catch (error) {
      console.error('Erreur lors du basculement du favori:', error);
    }
  };

  return {
    isFavorite: isDocumentFavorite,
    favorite,
    toggleFavorite,
    isLoading
  };
} 