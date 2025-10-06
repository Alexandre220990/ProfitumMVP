import { supabase } from '@/lib/supabase';

export interface ExpertRealData {
  // KPIs
  dossiersActifs: number;
  gainsDuMois: number;
  tauxReussite: number;
  opportunites: number;
  
  // Dossiers
  dossiers: Array<{
    id: string;
    clientName: string;
    productName: string;
    statut: string;
    progress: number;
    montantFinal: number;
    currentStep: number;
    priorite: number;
    created_at: string;
    expert_id?: string;
    Client?: {
      id: string;
      name?: string;
      email: string;
      company_name?: string;
      phone?: string;
      city?: string;
    };
    ProduitEligible?: {
      id: string;
      nom: string;
      description?: string;
      category?: string;
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
    conversionRate: number;
    totalRevenue: number;
    averageCompletionTime: number;
    clientSatisfaction: number;
  };
}

export class ExpertRealDataService {
  private expertId: string;

  constructor(expertId: string) {
    this.expertId = expertId;
  }

  /**
   * Récupère toutes les données réelles de l'expert
   */
  async getAllData(): Promise<{ success: boolean; data?: ExpertRealData; error?: string }> {
    try {
      // Récupérer les dossiers assignés à l'expert
      const { data: dossiers, error: dossiersError } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          statut,
          progress,
          montantFinal,
          current_step,
          priorite,
          created_at,
          expert_id,
          Client:Client!inner(
            id,
            name,
            email,
            company_name,
            phone,
            city
          ),
          ProduitEligible:ProduitEligible!inner(
            id,
            nom,
            description,
            category
          ),
          Expert:Expert!inner(
            id,
            name,
            company_name,
            email
          )
        `)
        .eq('expert_id', this.expertId)
        .order('created_at', { ascending: false });

      if (dossiersError) throw dossiersError;

      // Calculer les KPIs
      const dossiersActifs = dossiers?.filter(d => d.statut === 'en_cours').length || 0;
      const dossiersTermines = dossiers?.filter(d => d.statut === 'termine').length || 0;
      const totalDossiers = dossiers?.length || 0;
      
      // Gains du mois (dossiers terminés ce mois)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const gainsDuMois = dossiers
        ?.filter(d => d.statut === 'termine' && new Date(d.created_at) >= startOfMonth)
        .reduce((sum, d) => sum + (d.montantFinal || 0), 0) || 0;
      
      // Taux de réussite
      const tauxReussite = totalDossiers > 0 ? (dossiersTermines / totalDossiers) * 100 : 0;
      
      // Opportunités (dossiers éligibles)
      const opportunites = dossiers?.filter(d => d.statut === 'eligible').length || 0;

      // Analytics
      const totalRevenue = dossiers
        ?.filter(d => d.statut === 'termine')
        .reduce((sum, d) => sum + (d.montantFinal || 0), 0) || 0;

      const analytics = {
        conversionRate: tauxReussite,
        totalRevenue,
        averageCompletionTime: 0, // À calculer si nécessaire
        clientSatisfaction: 0 // À calculer si nécessaire
      };

      return {
        success: true,
        data: {
          dossiersActifs,
          gainsDuMois,
          tauxReussite,
          opportunites,
          dossiers: dossiers || [],
          analytics
        }
      };
    } catch (error) {
      console.error('Erreur récupération données expert:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des données expert'
      };
    }
  }

  /**
   * Récupère les métriques rapides
   */
  async getQuickMetrics(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data: dossiers, error } = await supabase
        .from('ClientProduitEligible')
        .select('statut, montantFinal, created_at')
        .eq('expert_id', this.expertId);

      if (error) throw error;

      const inProgress = dossiers?.filter(d => d.statut === 'en_cours').length || 0;
      const completed = dossiers?.filter(d => d.statut === 'termine').length || 0;
      const totalRevenue = dossiers
        ?.filter(d => d.statut === 'termine')
        .reduce((sum, d) => sum + (d.montantFinal || 0), 0) || 0;
      const opportunities = dossiers?.filter(d => d.statut === 'eligible').length || 0;

      return {
        success: true,
        data: {
          inProgress,
          completed,
          totalRevenue,
          opportunities,
          totalAssignments: dossiers?.length || 0
        }
      };
    } catch (error) {
      console.error('Erreur récupération métriques expert:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des métriques'
      };
    }
  }

  /**
   * Récupère les dossiers prioritaires
   */
  async getPriorityDossiers(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          statut,
          progress,
          montantFinal,
          current_step,
          priorite,
          created_at,
          Client:Client!inner(
            id,
            name,
            company_name,
            email,
            phone,
            city
          ),
          ProduitEligible:ProduitEligible!inner(
            id,
            nom,
            description
          )
        `)
        .eq('expert_id', this.expertId)
        .order('priorite', { ascending: false })
        .limit(5);

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Erreur récupération dossiers prioritaires:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des dossiers prioritaires'
      };
    }
  }

  /**
   * Récupère les dossiers en retard
   */
  async getOverdueDossiers(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          statut,
          progress,
          montantFinal,
          current_step,
          created_at,
          Client:Client!inner(
            id,
            name,
            company_name,
            email,
            phone,
            city
          ),
          ProduitEligible:ProduitEligible!inner(
            id,
            nom,
            description
          )
        `)
        .eq('expert_id', this.expertId)
        .eq('statut', 'en_cours')
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Erreur récupération dossiers en retard:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des dossiers en retard'
      };
    }
  }
}
