import { supabase } from '@/lib/supabase';

export interface ClientRealData {
  // KPIs
  dossiersEnCours: number;
  gainsPotentiels: number;
  gainsObtenus: number;
  progression: number;
  
  // Produits
  produits: Array<{
    id: string;
    statut: string;
    montantFinal: number;
    progress: number;
    current_step: number;
    expert_id?: string;
    created_at: string;
    ProduitEligible: {
      id: string;
      nom: string;
      description: string;
      category: string;
    };
    Expert?: {
      id: string;
      name: string;
      company_name?: string;
      email: string;
    };
  }>;
  
  // Analytics
  analytics: {
    totalProducts: number;
    eligibleProducts: number;
    inProgressProducts: number;
    completedProducts: number;
    averageProgress: number;
  };
}

export class ClientRealDataService {
  private clientId: string;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  /**
   * Récupère toutes les données réelles du client
   */
  async getAllData(): Promise<{ success: boolean; data?: ClientRealData; error?: string }> {
    try {
      // Récupérer les produits éligibles du client
      const { data: produits, error: produitsError } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          statut,
          montantFinal,
          progress,
          current_step,
          expert_id,
          created_at,
          ProduitEligible:ProduitEligible!inner(
            id,
            nom,
            description,
            category
          ),
          Expert:Expert(
            id,
            name,
            company_name,
            email
          )
        `)
        .eq('clientId', this.clientId)
        .order('created_at', { ascending: false });

      if (produitsError) throw produitsError;

      // Calculer les KPIs
      const dossiersEnCours = produits?.filter(p => p.statut === 'en_cours').length || 0;
      
      const gainsPotentiels = produits
        ?.filter(p => p.montantFinal && p.montantFinal > 0)
        .reduce((sum, p) => sum + (p.montantFinal || 0), 0) || 0;
      
      const gainsObtenus = produits
        ?.filter(p => p.statut === 'termine' && p.montantFinal && p.montantFinal > 0)
        .reduce((sum, p) => sum + (p.montantFinal || 0), 0) || 0;
      
      const progression = produits?.length > 0 
        ? Math.round(produits.reduce((sum, p) => sum + (p.progress || 0), 0) / produits.length)
        : 0;

      // Analytics
      const totalProducts = produits?.length || 0;
      const eligibleProducts = produits?.filter(p => p.statut === 'eligible').length || 0;
      const inProgressProducts = produits?.filter(p => p.statut === 'en_cours').length || 0;
      const completedProducts = produits?.filter(p => p.statut === 'termine').length || 0;
      const averageProgress = progression;

      const analytics = {
        totalProducts,
        eligibleProducts,
        inProgressProducts,
        completedProducts,
        averageProgress
      };

      return {
        success: true,
        data: {
          dossiersEnCours,
          gainsPotentiels,
          gainsObtenus,
          progression,
          produits: produits || [],
          analytics
        }
      };
    } catch (error) {
      console.error('Erreur récupération données client:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des données client'
      };
    }
  }

  /**
   * Récupère les métriques rapides
   */
  async getQuickMetrics(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data: produits, error } = await supabase
        .from('ClientProduitEligible')
        .select('statut, montantFinal, progress')
        .eq('clientId', this.clientId);

      if (error) throw error;

      const inProgress = produits?.filter(p => p.statut === 'en_cours').length || 0;
      const completed = produits?.filter(p => p.statut === 'termine').length || 0;
      const totalRevenue = produits
        ?.filter(p => p.statut === 'termine')
        .reduce((sum, p) => sum + (p.montantFinal || 0), 0) || 0;
      const averageProgress = produits?.length > 0 
        ? Math.round(produits.reduce((sum, p) => sum + (p.progress || 0), 0) / produits.length)
        : 0;

      return {
        success: true,
        data: {
          inProgress,
          completed,
          totalRevenue,
          averageProgress,
          totalProducts: produits?.length || 0
        }
      };
    } catch (error) {
      console.error('Erreur récupération métriques client:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des métriques'
      };
    }
  }

  /**
   * Récupère les produits par statut
   */
  async getProductsByStatus(status: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          statut,
          montantFinal,
          progress,
          current_step,
          expert_id,
          created_at,
          ProduitEligible:ProduitEligible!inner(
            id,
            nom,
            description,
            category
          ),
          Expert:Expert(
            id,
            name,
            company_name,
            email
          )
        `)
        .eq('clientId', this.clientId)
        .eq('statut', status)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Erreur récupération produits par statut:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des produits'
      };
    }
  }
}
