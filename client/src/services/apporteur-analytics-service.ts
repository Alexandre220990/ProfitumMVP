import { supabase } from '@/lib/supabase';

/**
 * Service Analytics pour Dashboard Apporteur
 * Utilise les fonctions SQL créées pour les données personnelles
 */
export class ApporteurAnalyticsService {
  private apporteurId: string;

  constructor(apporteurId: string) {
    this.apporteurId = apporteurId;
  }

  /**
   * Récupère les KPIs personnels de l'apporteur
   */
  async getPersonalKPIs() {
    try {
      const { data, error } = await supabase
        .rpc('get_apporteur_kpis', { apporteur_uuid: this.apporteurId });

      if (error) throw error;

      return {
        success: true,
        data: {
          // Prospects
          mesProspects: data[0]?.mes_prospects || 0,
          prospectsQualifies: data[0]?.prospects_qualifies || 0,
          nouveauxProspects30j: data[0]?.nouveaux_prospects_30j || 0,
          
          // Clients convertis
          mesClientsActifs: data[0]?.mes_clients_actifs || 0,
          nouveauxClients30j: data[0]?.nouveaux_clients_30j || 0,
          
          // Dossiers
          dossiersMesClients: data[0]?.dossiers_mes_clients || 0,
          dossiersTerminesMesClients: data[0]?.dossiers_termines_mes_clients || 0,
          
          // Montants
          montantTotalMesClients: data[0]?.montant_total_mes_clients || 0,
          montantRealiseMesClients: data[0]?.montant_realise_mes_clients || 0,
          
          // Commissions
          commissionsTotales: data[0]?.commissions_totales || 0,
          commissionsPayees: data[0]?.commissions_payees || 0,
          
          // Performance
          tauxConversionProspects: data[0]?.taux_conversion_prospects || 0
        }
      };
    } catch (error) {
      console.error('Erreur récupération KPIs apporteur:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des KPIs personnels'
      };
    }
  }

  /**
   * Récupère l'activité personnelle de l'apporteur
   */
  async getPersonalActivity() {
    try {
      const { data, error } = await supabase
        .rpc('get_apporteur_activite_personnelle', { apporteur_uuid: this.apporteurId });

      if (error) throw error;

      return {
        success: true,
        data: data.map((activity: any) => ({
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
      console.error('Erreur récupération activité apporteur:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération de l\'activité personnelle'
      };
    }
  }

  /**
   * Récupère les prospects détaillés de l'apporteur
   */
  async getPersonalProspects() {
    try {
      const { data, error } = await supabase
        .rpc('get_apporteur_prospects_detaille', { apporteur_uuid: this.apporteurId });

      if (error) throw error;

      return {
        success: true,
        data: data.map((prospect: any) => ({
          id: prospect.id,
          email: prospect.email,
          name: prospect.name,
          companyName: prospect.company_name,
          createdAt: prospect.created_at,
          derniereConnexion: prospect.derniereConnexion,
          statutActivite: prospect.statut_activite,
          anciennete: prospect.anciennete,
          nbDossiers: prospect.nb_dossiers,
          montantTotalDossiers: prospect.montant_total_dossiers
        }))
      };
    } catch (error) {
      console.error('Erreur récupération prospects apporteur:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des prospects'
      };
    }
  }

  /**
   * Récupère les alertes personnelles de l'apporteur
   */
  async getPersonalAlerts() {
    try {
      const { data, error } = await supabase
        .rpc('get_apporteur_alertes_personnelles', { apporteur_uuid: this.apporteurId });

      if (error) throw error;

      return {
        success: true,
        data: data.map((alert: any) => ({
          typeAlerte: alert.type_alerte,
          severity: alert.severity,
          nombre: alert.nombre,
          message: alert.message,
          entitesConcernees: alert.entites_concernees
        }))
      };
    } catch (error) {
      console.error('Erreur récupération alertes apporteur:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des alertes personnelles'
      };
    }
  }

  /**
   * Récupère les statistiques des produits (partagées)
   */
  async getProductStats() {
    try {
      const { data, error } = await supabase
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
   * Récupère les sessions actives (partagées)
   */
  async getActiveSessions() {
    try {
      const { data, error } = await supabase
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
}
