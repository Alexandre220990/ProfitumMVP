import { supabase } from '@/lib/supabase';

/**
 * Service Analytics pour Dashboard Admin
 * Utilise les vues SQL créées pour les données globales
 */
export class AdminAnalyticsService {
  constructor() {
    // Utilise le client Supabase centralisé
  }

  /**
   * Récupère les KPIs globaux de la plateforme
   */
  async getGlobalKPIs() {
    try {
      const { data, error } = await supabase
        .from('vue_admin_kpis_globaux')
        .select('*')
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as any
      };
    } catch (error) {
      console.error('Erreur récupération KPIs admin:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des KPIs'
      };
    }
  }

  /**
   * Récupère l'activité globale récente
   */
  async getGlobalActivity(limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from('vue_admin_activite_globale')
        .select('*')
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: data as any[]
      };
    } catch (error) {
      console.error('Erreur récupération activité admin:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération de l\'activité'
      };
    }
  }

  /**
   * Récupère les alertes globales
   */
  async getGlobalAlerts() {
    try {
      const { data, error } = await supabase
        .from('vue_admin_alertes_globales')
        .select('*');

      if (error) throw error;

      return {
        success: true,
        data: data as any[]
      };
    } catch (error) {
      console.error('Erreur récupération alertes admin:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des alertes'
      };
    }
  }

  /**
   * Récupère les statistiques des produits
   */
  async getProductStats() {
    try {
      const { data, error } = await supabase
        .from('vue_stats_produits_globale')
        .select('*');

      if (error) throw error;

      return {
        success: true,
        data: data as any[]
      };
    } catch (error) {
      console.error('Erreur récupération stats produits:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des statistiques produits'
      };
    }
  }

  /**
   * Récupère les sessions actives
   */
  async getActiveSessions() {
    try {
      const { data, error } = await supabase
        .from('vue_sessions_actives_globale')
        .select('*');

      if (error) throw error;

      return {
        success: true,
        data: data as any[]
      };
    } catch (error) {
      console.error('Erreur récupération sessions actives:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des sessions actives'
      };
    }
  }

  /**
   * Récupère les métriques système
   */
  async getSystemMetrics() {
    try {
      const { data, error } = await supabase
        .from('vue_metriques_systeme_globale')
        .select('*');

      if (error) throw error;

      return {
        success: true,
        data: data as any[]
      };
    } catch (error) {
      console.error('Erreur récupération métriques système:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des métriques système'
      };
    }
  }
}