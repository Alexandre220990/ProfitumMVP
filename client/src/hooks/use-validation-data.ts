import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

// ============================================================================
// HOOK VALIDATION DATA RÉVOLUTIONNAIRE
// ============================================================================
// Récupération des données de validation depuis l'API admin

interface ValidationItem {
  id: string;
  type: 'expert' | 'dossier' | 'pre_eligibilite';
  title: string;
  subtitle: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  metadata: any;
  actions: string[];
}

interface ValidationStats {
  expertsPending: number;
  dossiersPending: number;
  preEligibilitesPending: number;
  criticalItems: number;
  totalItems: number;
}

interface UseValidationDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseValidationDataReturn {
  validationItems: ValidationItem[];
  stats: ValidationStats;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshData: () => Promise<void>;
  approveItem: (itemId: string, type: string) => Promise<void>;
  rejectItem: (itemId: string, type: string, reason?: string) => Promise<void>;
  updateItem: (itemId: string, type: string, data: any) => Promise<void>;
}

export const useValidationData = (options: UseValidationDataOptions = {}): UseValidationDataReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 30000
  } = options;

  const [validationItems, setValidationItems] = useState<ValidationItem[]>([]);
  const [stats, setStats] = useState<ValidationStats>({
    expertsPending: 0,
    dossiersPending: 0,
    preEligibilitesPending: 0,
    criticalItems: 0,
    totalItems: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ===== FONCTIONS DE RÉCUPÉRATION =====

  const fetchExperts = async (): Promise<ValidationItem[]> => {
    try {
      const response = await api.get('/admin/experts');
      const experts = response.data.experts || [];
      
      return experts
        .filter((expert: any) => expert.approval_status === 'pending')
        .map((expert: any): ValidationItem => ({
          id: expert.id,
          type: 'expert',
          title: `${expert.first_name} ${expert.last_name}`,
          subtitle: `Expert ${expert.specialities?.join(', ') || 'Général'} - ${expert.location || 'Non spécifié'}`,
          status: expert.approval_status === 'pending' ? 'pending' : 
                 expert.approval_status === 'approved' ? 'approved' : 'rejected',
          priority: expert.priority || 'medium',
          createdAt: expert.created_at,
          updatedAt: expert.updated_at || expert.created_at,
          metadata: {
            email: expert.email,
            phone: expert.phone,
            location: expert.location,
            specialities: expert.specialities || [],
            experience: expert.experience || 'Non spécifié',
            certifications: expert.certifications || [],
            documents: expert.documents || []
          },
          actions: ['approve', 'reject', 'view', 'contact']
        }));
    } catch (error) {
      console.error('Erreur récupération experts:', error);
      return [];
    }
  };

  const fetchDossiers = async (): Promise<ValidationItem[]> => {
    try {
      const response = await api.get('/admin/dossiers');
      const dossiers = response.data.dossiers || [];
      
      return dossiers
        .filter((dossier: any) => dossier.statut === 'en_attente' || dossier.statut === 'pending')
        .map((dossier: any): ValidationItem => ({
          id: dossier.id,
          type: 'dossier',
          title: `Dossier ${dossier.produitId || 'Général'} - ${dossier.Client?.company_name || dossier.Client?.name || 'Client'}`,
          subtitle: `Client: ${dossier.Client?.company_name || dossier.Client?.name || 'Non spécifié'}`,
          status: dossier.statut === 'en_attente' || dossier.statut === 'pending' ? 'pending' :
                 dossier.statut === 'approuvé' || dossier.statut === 'approved' ? 'approved' : 'rejected',
          priority: dossier.priorite || 'medium',
          createdAt: dossier.created_at,
          updatedAt: dossier.updated_at || dossier.created_at,
          metadata: {
            client: dossier.Client?.company_name || dossier.Client?.name,
            produit: dossier.produitId,
            montant: dossier.montantFinal || 0,
            expert: dossier.expert_id,
            documents: dossier.documents || [],
            notes: dossier.notes || ''
          },
          actions: ['approve', 'reject', 'assign_expert', 'view']
        }));
    } catch (error) {
      console.error('Erreur récupération dossiers:', error);
      return [];
    }
  };

  const fetchPreEligibilites = async (): Promise<ValidationItem[]> => {
    try {
      const response = await api.get('/admin/client-produits-eligibles');
      const preEligibilites = response.data.clientProduitsEligibles || [];
      
      return preEligibilites
        .filter((item: any) => item.validation_state === 'pending' || item.statut === 'en_attente')
        .map((item: any): ValidationItem => ({
          id: item.id,
          type: 'pre_eligibilite',
          title: `Pré-éligibilité ${item.produitId || 'Général'}`,
          subtitle: `Client: ${item.Client?.company_name || item.Client?.name || 'Non spécifié'}`,
          status: item.validation_state === 'pending' || item.statut === 'en_attente' ? 'pending' :
                 item.validation_state === 'validated' || item.statut === 'validé' ? 'approved' : 'rejected',
          priority: item.priorite || 'medium',
          createdAt: item.created_at,
          updatedAt: item.updated_at || item.created_at,
          metadata: {
            client: item.Client?.company_name || item.Client?.name,
            produit: item.produitId,
            montant_estime: item.montantFinal || 0,
            expert: item.expert_id,
            criteres: item.criteres || [],
            documents: item.documents || []
          },
          actions: ['validate', 'reject', 'request_info', 'view']
        }));
    } catch (error) {
      console.error('Erreur récupération pré-éligibilités:', error);
      return [];
    }
  };

  const loadValidationItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [experts, dossiers, preEligibilites] = await Promise.all([
        fetchExperts(),
        fetchDossiers(),
        fetchPreEligibilites()
      ]);

      const allItems = [...experts, ...dossiers, ...preEligibilites];
      
      setValidationItems(allItems);
      setStats({
        expertsPending: experts.filter(item => item.status === 'pending').length,
        dossiersPending: dossiers.filter(item => item.status === 'pending').length,
        preEligibilitesPending: preEligibilites.filter(item => item.status === 'pending').length,
        criticalItems: allItems.filter(item => item.priority === 'critical').length,
        totalItems: allItems.length
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Erreur chargement données validation:', error);
      setError('Impossible de charger les données de validation');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===== ACTIONS DE VALIDATION =====

  const approveItem = async (itemId: string, type: string): Promise<void> => {
    try {
      let endpoint = '';
      
      switch (type) {
        case 'expert':
          endpoint = `/admin/experts/${itemId}/approve`;
          break;
        case 'dossier':
          endpoint = `/admin/dossiers/${itemId}/approve`;
          break;
        case 'pre_eligibilite':
          endpoint = `/admin/client-produits-eligibles/${itemId}/validate`;
          break;
        default:
          throw new Error(`Type de validation non supporté: ${type}`);
      }

      await api.put(endpoint);
      
      // Mise à jour locale
      setValidationItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, status: 'approved' }
          : item
      ));
      
      // Recharger les statistiques
      await loadValidationItems();
    } catch (error) {
      console.error('Erreur approbation:', error);
      throw error;
    }
  };

  const rejectItem = async (itemId: string, type: string, reason?: string): Promise<void> => {
    try {
      let endpoint = '';
      let data = {};
      
      switch (type) {
        case 'expert':
          endpoint = `/admin/experts/${itemId}/reject`;
          data = { reason };
          break;
        case 'dossier':
          endpoint = `/admin/dossiers/${itemId}/reject`;
          data = { reason };
          break;
        case 'pre_eligibilite':
          endpoint = `/admin/client-produits-eligibles/${itemId}/reject`;
          data = { reason };
          break;
        default:
          throw new Error(`Type de validation non supporté: ${type}`);
      }

      await api.put(endpoint, data);
      
      // Mise à jour locale
      setValidationItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, status: 'rejected' }
          : item
      ));
      
      // Recharger les statistiques
      await loadValidationItems();
    } catch (error) {
      console.error('Erreur rejet:', error);
      throw error;
    }
  };

  const updateItem = async (itemId: string, type: string, data: any): Promise<void> => {
    try {
      let endpoint = '';
      
      switch (type) {
        case 'expert':
          endpoint = `/admin/experts/${itemId}`;
          break;
        case 'dossier':
          endpoint = `/admin/dossiers/${itemId}`;
          break;
        case 'pre_eligibilite':
          endpoint = `/admin/client-produits-eligibles/${itemId}`;
          break;
        default:
          throw new Error(`Type de validation non supporté: ${type}`);
      }

      await api.put(endpoint, data);
      
      // Recharger les données
      await loadValidationItems();
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      throw error;
    }
  };

  // ===== EFFETS =====

  useEffect(() => {
    loadValidationItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadValidationItems();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadValidationItems]);

  // ===== RENDU =====

  return {
    validationItems,
    stats,
    isLoading,
    error,
    lastUpdated,
    refreshData: loadValidationItems,
    approveItem,
    rejectItem,
    updateItem
  };
}; 