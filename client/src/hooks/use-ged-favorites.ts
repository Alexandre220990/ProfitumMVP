import { useCallback, useState, useEffect } from "react";
import { get, post, del } from '@/lib/api';

export interface GEDFavorite {
  id: string;
  document_id: string;
  user_id: string;
  created_at: string;
  document?: {
    id: string;
    title: string;
    description?: string;
    category: 'business' | 'technical';
    read_time: number;
  };
}

export function useGEDFavorites() {
  const [favorites, setFavorites] = useState<GEDFavorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les favoris
  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await get<GEDFavorite[]>('/documents/favorites');
      
      if (response.success && response.data) {
        setFavorites(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des favoris');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur inconnue';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Ajouter aux favoris
  const addToFavorites = useCallback(async (documentId: string) => {
    try {
      setError(null);
      
      const response = await post(`/documents/${documentId}/favorite`);
      
      if (response.success) {
        // Recharger les favoris
        await loadFavorites();
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de l\'ajout aux favoris');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur inconnue';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadFavorites]);

  // Retirer des favoris
  const removeFromFavorites = useCallback(async (documentId: string) => {
    try {
      setError(null);
      
      const response = await del(`/documents/${documentId}/favorite`);
      
      if (response.success) {
        // Recharger les favoris
        await loadFavorites();
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression des favoris');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur inconnue';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadFavorites]);

  // Vérifier si un document est en favori
  const isFavorite = useCallback((documentId: string): boolean => {
    return favorites.some(fav => fav.document_id === documentId);
  }, [favorites]);

  // Toggle favori
  const toggleFavorite = useCallback(async (documentId: string) => {
    if (isFavorite(documentId)) {
      return await removeFromFavorites(documentId);
    } else {
      return await addToFavorites(documentId);
    }
  }, [isFavorite, addToFavorites, removeFromFavorites]);

  // Charger les favoris au montage
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    loadFavorites,
    clearError: () => setError(null)
  };
} 