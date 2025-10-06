import { createClient } from '@supabase/supabase-js';

/**
 * Service Analytics pour Dashboard Admin
 * Utilise les vues SQL créées pour les données globales
 */
export class AdminAnalyticsService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  /**
   * Récupère les KPIs globaux de la plateforme
   */
  async getGlobalKPIs() {
    try {
      const { data, error } = await this.supabase
        .from('vue_admin_kpis_globaux')
        .select('*')
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          // Clients
          totalClients: data.total_clients,
          clientsActifs: data.clients_actifs,
          clientsCeMois: data.clients_ce_mois,
          clientsActifs24h: data.clients_actifs_24h,
          
          // Experts
          totalExperts: data.total_experts,
          expertsActifs: data.experts_actifs,
          expertsEnAttente: data.experts_en_attente,
          expertsCeMois: data.experts_ce_mois,
          
          // Apporteurs
          totalApporteurs: data.total_apporteurs,
          apporteursActifs: data.apporteurs_actifs,
          apporteursEnAttente: data.apporteurs_en_attente,
          
          // Dossiers
          totalDossiers: data.total_dossiers,
          dossiersTermines: data.dossiers_termines,
          dossiersEnCours: data.dossiers_en_cours,
          dossiersCeMois: data.dossiers_ce_mois,
          
          // Montants
          montantTotalGlobal: data.montant_total_global,
          montantRealiseGlobal: data.montant_realise_global,
          
          // Performance
          tauxCompletionGlobal: data.taux_completion_global,
          tauxConversion: data.taux_conversion,
          
          // Produits
          produitsActifs: data.produits_actifs
        }
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
      const { data, error } = await this.supabase
        .from('vue_admin_activite_globale')
        .select('*')
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: data.map(activity => ({
          typeEntite: activity.type_entite,
          entiteId: activity.entite_id,
          reference: activity.reference,
          nom: activity.nom,
          statut: activity.statut,
          dateAction: activity.date_action,
          action: activity.action,
          montant: activity.montant
        }))
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
      const { data, error } = await this.supabase
        .from('vue_admin_alertes_globales')
        .select('*');

      if (error) throw error;

      return {
        success: true,
        data: data.map(alert => ({
          typeAlerte: alert.type_alerte,
          severity: alert.severity,
          nombre: alert.nombre,
          message: alert.message,
          entitesConcernees: alert.entites_concernees
        }))
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
      const { data, error } = await this.supabase
        .from('vue_stats_produits_globale')
        .select('*');

      if (error) throw error;

      return {
        success: true,
        data: data.map(product => ({
          id: product.id,
          nom: product.nom,
          categorie: product.categorie,
          montantMin: product.montant_min,
          montantMax: product.montant_max,
          active: product.active,
          totalDossiers: product.total_dossiers,
          dossiersTermines: product.dossiers_termines,
          montantTotal: product.montant_total,
          montantMoyen: product.montant_moyen,
          clientsUniques: product.clients_uniques,
          expertsAssignes: product.experts_assignes,
          tauxCompletion: product.taux_completion
        }))
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
      const { data, error } = await this.supabase
        .from('vue_sessions_actives_globale')
        .select('*');

      if (error) throw error;

      return {
        success: true,
        data: data.map(session => ({
          userType: session.user_type,
          sessionsActives: session.sessions_actives,
          utilisateursUniques: session.utilisateurs_uniques
        }))
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
      const { data, error } = await this.supabase
        .from('vue_metriques_systeme_globale')
        .select('*');

      if (error) throw error;

      return {
        success: true,
        data: data.map(metric => ({
          metricType: metric.metric_type,
          metricName: metric.metric_name,
          valeurMoyenne: metric.valeur_moyenne,
          valeurMax: metric.valeur_max,
          valeurMin: metric.valeur_min,
          nbMesures: metric.nb_mesures
        }))
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