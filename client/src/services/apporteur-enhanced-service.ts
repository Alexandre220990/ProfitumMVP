import { supabase } from '../lib/supabase';

/**
 * Service Apporteur Enhanced
 * Utilise les nouvelles vues SQL corrigées pour des données complètes et précises
 */
export class ApporteurEnhancedService {
  private apporteurId: string;

  constructor(apporteurId: string) {
    this.apporteurId = apporteurId;
  }

  /**
   * Récupère toutes les données du dashboard depuis les vues corrigées
   */
  async getAllDashboardData() {
    try {
      // Récupérer toutes les données en parallèle
      const [
        dashboardResult,
        prospectsResult,
        activityResult,
        commissionsResult,
        objectivesResult,
        performanceResult
      ] = await Promise.allSettled([
        this.getDashboardPrincipal(),
        this.getProspectsDetaille(),
        this.getActiviteRecente(),
        this.getCommissionsCalculees(),
        this.getObjectifsPerformance(),
        this.getPerformanceProduits()
      ]);

      return {
        dashboard: dashboardResult.status === 'fulfilled' ? dashboardResult.value : null,
        prospects: prospectsResult.status === 'fulfilled' ? prospectsResult.value : null,
        activite: activityResult.status === 'fulfilled' ? activityResult.value : null,
        commissions: commissionsResult.status === 'fulfilled' ? commissionsResult.value : null,
        objectifs: objectivesResult.status === 'fulfilled' ? objectivesResult.value : null,
        performance: performanceResult.status === 'fulfilled' ? performanceResult.value : null
      };
    } catch (error) {
      console.error('Erreur récupération données dashboard:', error);
      throw error;
    }
  }

  /**
   * Vue principale du dashboard avec toutes les statistiques clés
   */
  async getDashboardPrincipal() {
    try {
      const { data, error } = await supabase
        .from('vue_apporteur_dashboard_principal')
        .select('*')
        .eq('apporteur_id', this.apporteurId)
        .single();

      if (error) {
        console.warn('Vue vue_apporteur_dashboard_principal non disponible');
        return { success: false, error: 'Vue SQL vue_apporteur_dashboard_principal non créée - Voir recommended-apporteur-views.sql' };
      }

      return { success: true, data };
    } catch (error) {
      console.warn('Erreur getDashboardPrincipal:', error);
      return { success: false, error: 'Vue SQL vue_apporteur_dashboard_principal non créée - Voir recommended-apporteur-views.sql' };
    }
  }

  /**
   * Vue détaillée des prospects avec informations complètes
   */
  async getProspectsDetaille() {
    try {
      const { data, error } = await supabase
        .from('vue_apporteur_prospects_detaille')
        .select('*')
        .eq('apporteur_id', this.apporteurId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Vue vue_apporteur_prospects_detaille non disponible');
        return { success: false, error: 'Vue SQL vue_apporteur_prospects_detaille non créée - Voir recommended-apporteur-views.sql' };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.warn('Erreur getProspectsDetaille:', error);
      return { success: false, error: 'Vue SQL vue_apporteur_prospects_detaille non créée - Voir recommended-apporteur-views.sql' };
    }
  }

  /**
   * Activité récente chronologique (clients, dossiers, conversions)
   */
  async getActiviteRecente() {
    try {
      const { data, error } = await supabase
        .from('vue_apporteur_activite_recente')
        .select('*')
        .eq('apporteur_id', this.apporteurId)
        .order('date_activite', { ascending: false })
        .limit(20);

      if (error) {
        console.warn('Vue vue_apporteur_activite_recente non disponible');
        return { success: false, error: 'Vue SQL vue_apporteur_activite_recente non créée - Voir recommended-apporteur-views.sql' };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.warn('Erreur getActiviteRecente:', error);
      return { success: false, error: 'Vue SQL vue_apporteur_activite_recente non créée - Voir recommended-apporteur-views.sql' };
    }
  }

  /**
   * Calcul automatique des commissions basé sur les dossiers acceptés
   */
  async getCommissionsCalculees() {
    try {
      const { data, error } = await supabase
        .from('vue_apporteur_commissions_calculees')
        .select('*')
        .eq('apporteur_id', this.apporteurId)
        .order('date_commission', { ascending: false });

      if (error) {
        console.warn('Vue vue_apporteur_commissions_calculees non disponible');
        return { success: false, error: 'Vue SQL vue_apporteur_commissions_calculees non créée - Voir recommended-apporteur-views.sql' };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.warn('Erreur getCommissionsCalculees:', error);
      return { success: false, error: 'Vue SQL vue_apporteur_commissions_calculees non créée - Voir recommended-apporteur-views.sql' };
    }
  }

  /**
   * Suivi des objectifs mensuels et performance
   */
  async getObjectifsPerformance() {
    try {
      const { data, error } = await supabase
        .from('vue_apporteur_objectifs_performance')
        .select('*')
        .eq('apporteur_id', this.apporteurId)
        .single();

      if (error) {
        console.warn('Vue vue_apporteur_objectifs_performance non disponible');
        return { success: false, error: 'Vue SQL vue_apporteur_objectifs_performance non créée - Voir recommended-apporteur-views.sql' };
      }

      return { success: true, data };
    } catch (error) {
      console.warn('Erreur getObjectifsPerformance:', error);
      return { success: false, error: 'Vue SQL vue_apporteur_objectifs_performance non créée - Voir recommended-apporteur-views.sql' };
    }
  }

  /**
   * Performance par produit avec taux de réussite et montants
   */
  async getPerformanceProduits() {
    try {
      const { data, error } = await supabase
        .from('vue_apporteur_performance_produits')
        .select('*')
        .eq('apporteur_id', this.apporteurId)
        .order('taux_reussite_pourcent', { ascending: false });

      if (error) {
        console.warn('Vue vue_apporteur_performance_produits non disponible');
        return { success: false, error: 'Vue SQL vue_apporteur_performance_produits non créée - Voir recommended-apporteur-views.sql' };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.warn('Erreur getPerformanceProduits:', error);
      return { success: false, error: 'Vue SQL vue_apporteur_performance_produits non créée - Voir recommended-apporteur-views.sql' };
    }
  }

  /**
   * Statistiques agrégées par mois pour les graphiques
   */
  async getStatistiquesMensuelles() {
    try {
      const { data, error } = await supabase
        .from('vue_apporteur_statistiques_mensuelles')
        .select('*')
        .eq('apporteur_id', this.apporteurId)
        .order('mois', { ascending: false })
        .limit(12);

      if (error) {
        console.warn('Vue vue_apporteur_statistiques_mensuelles non disponible');
        return { success: false, error: 'Vue SQL vue_apporteur_statistiques_mensuelles non créée - Voir recommended-apporteur-views.sql' };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.warn('Erreur getStatistiquesMensuelles:', error);
      return { success: false, error: 'Vue SQL vue_apporteur_statistiques_mensuelles non créée - Voir recommended-apporteur-views.sql' };
    }
  }

  /**
   * Analyse des sources de prospects
   */
  async getSourcesProspects() {
    try {
      const { data, error } = await supabase
        .from('vue_apporteur_sources_prospects')
        .select('*')
        .eq('apporteur_id', this.apporteurId)
        .order('nb_prospects', { ascending: false });

      if (error) {
        console.warn('Vue vue_apporteur_sources_prospects non disponible');
        return { success: false, error: 'Vue SQL vue_apporteur_sources_prospects non créée - Voir recommended-apporteur-views.sql' };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.warn('Erreur getSourcesProspects:', error);
      return { success: false, error: 'Vue SQL vue_apporteur_sources_prospects non créée - Voir recommended-apporteur-views.sql' };
    }
  }

  /**
   * Récupérer les experts disponibles
   */
  async getExperts() {
    try {
      const { data, error } = await supabase
        .from('Expert')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Erreur récupération experts:', error);
        return { success: false, error: error.message };
      }

      // Formater les données pour le composant
      const formattedExperts = (data || []).map((expert: any) => ({
        id: expert.id,
        name: expert.name,
        email: expert.email,
        phone: expert.phone,
        specialty: expert.specializations?.[0] || 'Généraliste',
        location: expert.city || 'Non spécifié',
        rating: expert.rating || 4.5,
        status: expert.availability || 'available',
        availability: expert.availability || 'available',
        dossiers: 0, // À calculer depuis les dossiers
        successRate: expert.rating ? Math.round(expert.rating * 20) : 90
      }));

      return { success: true, data: formattedExperts };
    } catch (error) {
      console.error('Erreur getExperts:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  }

  /**
   * Méthode de fallback pour les données de base si les vues ne sont pas disponibles
   */
  async getFallbackData() {
    try {
      // Données de base depuis les tables principales
      const { data: clients, error } = await supabase
        .from('Client')
        .select('*')
        .eq('apporteur_id', this.apporteurId);

      if (error) {
        console.error('Erreur récupération clients fallback:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          total_prospects: clients?.length || 0,
          total_active_clients: clients?.filter((c: any) => c.status === 'client').length || 0,
          nouveaux_clients_30j: clients?.filter((c: any) => {
            const created = new Date(c.created_at);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return created >= thirtyDaysAgo;
          }).length || 0,
          total_montant_demande: 0, // À calculer depuis les dossiers
          taux_conversion_pourcent: 0, // À calculer
          dossiers_acceptes: 0 // À calculer depuis les dossiers
        }
      };
    } catch (error) {
      console.error('Erreur fallback data:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  }
}