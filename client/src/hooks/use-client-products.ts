import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export interface ClientProduitEligible {
  id: string;
  clientId: string;
  produitId: string;
  statut: string;
  expert_id?: string;
  charte_signed: boolean;
  charte_signed_at?: string;
  montantFinal: number;
  tauxFinal: number;
  dureeFinale: number;
  current_step: number;
  progress: number;
  created_at: string;
  updated_at: string;
  metadata?: any;
  notes?: string;
  priorite: number;
  dateEligibilite: string;
  ProduitEligible: {
    id: string;
    nom: string;
    description: string;
    category: string;
  };
}

interface UseClientProductsReturn {
  produits: ClientProduitEligible[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  hasProducts: boolean;
  totalProducts: number;
  eligibleProducts: number;
  inProgressProducts: number;
  completedProducts: number;
}

export const useClientProducts = (): UseClientProductsReturn => {
  const { user } = useAuth();
  const [produits, setProduits] = useState<ClientProduitEligible[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);

  const fetchProducts = useCallback(async () => {
    if (!user) {
      setError('Utilisateur non authentifié');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/api/client/produits-eligibles');
      
      if (response.data.success) {
        setProduits(response.data.data || []);
        setTotalProducts(response.data.pagination?.total || 0);
      } else {
        setError(response.data.message || 'Erreur lors de la récupération des produits');
      }
    } catch (err: any) {
      console.error('Erreur lors de la récupération des produits éligibles:', err);
      
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else if (err.response?.status === 404) {
        setError('Aucun produit éligible trouvé. Commencez par faire une simulation.');
      } else {
        setError('Erreur de connexion. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refresh = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Calculs dérivés
  const eligibleProducts = produits.filter(p => p.statut === 'eligible').length;
  const inProgressProducts = produits.filter(p => p.statut === 'en_cours').length;
  const completedProducts = produits.filter(p => p.statut === 'termine').length;
  const hasProducts = produits.length > 0;

  return {
    produits,
    loading,
    error,
    refresh,
    hasProducts,
    totalProducts,
    eligibleProducts,
    inProgressProducts,
    completedProducts
  };
}; 