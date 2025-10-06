import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class ApporteurRealDataService {
  private apporteurId: string;

  constructor(apporteurId: string) {
    this.apporteurId = apporteurId;
  }

  // Récupérer les rendez-vous réels
  async getRendezVous() {
    try {
      const { data, error } = await supabase
        .from('vue_apporteur_rendez_vous')
        .select('*')
        .order('date_rdv', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Erreur récupération rendez-vous:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des rendez-vous'
      };
    }
  }

  // Récupérer les experts réels
  async getExperts() {
    try {
      const { data, error } = await supabase
        .from('vue_apporteur_experts')
        .select('*')
        .order('rating', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Erreur récupération experts:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des experts'
      };
    }
  }

  // Récupérer les produits réels
  async getProduits() {
    try {
      const { data, error } = await supabase
        .from('vue_apporteur_produits')
        .select('*')
        .order('total_dossiers', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Erreur récupération produits:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des produits'
      };
    }
  }

  // Récupérer les conversations réelles
  async getConversations() {
    try {
      const { data, error } = await supabase
        .from('vue_apporteur_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Erreur récupération conversations:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des conversations'
      };
    }
  }

  // Récupérer les commissions réelles
  async getCommissions() {
    try {
      const { data, error } = await supabase
        .from('vue_apporteur_commissions')
        .select('*')
        .order('date_commission', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Erreur récupération commissions:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des commissions'
      };
    }
  }

  // Récupérer les statistiques mensuelles réelles
  async getStatistiquesMensuelles() {
    try {
      const { data, error } = await supabase
        .from('vue_apporteur_statistiques_mensuelles')
        .select('*')
        .order('mois', { ascending: false })
        .limit(12);

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Erreur récupération statistiques mensuelles:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des statistiques mensuelles'
      };
    }
  }

  // Récupérer l'activité récente de l'apporteur
  async getActiviteRecente() {
    try {
      const { data, error } = await supabase
        .from('vue_apporteur_activite_recente')
        .select('*')
        .order('date_action', { ascending: false })
        .limit(20);

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Erreur récupération activité récente:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération de l\'activité récente'
      };
    }
  }

  // Récupérer les KPIs globaux de l'apporteur
  async getKPIsGlobaux() {
    try {
      const { data, error } = await supabase
        .from('vue_apporteur_kpis_globaux')
        .select('*')
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data || {}
      };
    } catch (error) {
      console.error('Erreur récupération KPIs globaux:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des KPIs globaux'
      };
    }
  }

  // Récupérer les performances par produit réelles
  async getPerformanceProduits() {
    try {
      const { data, error } = await supabase
        .from('vue_apporteur_performance_produits')
        .select('*')
        .order('chiffre_affaires', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Erreur récupération performance produits:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des performances produits'
      };
    }
  }

  // Récupérer les notifications réelles
  async getNotifications() {
    try {
      const { data, error } = await supabase
        .from('vue_apporteur_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des notifications'
      };
    }
  }

  // Récupérer l'agenda réel
  async getAgenda() {
    try {
      const { data, error } = await supabase
        .from('vue_apporteur_agenda')
        .select('*')
        .order('date_rdv', { ascending: true })
        .order('heure_debut', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Erreur récupération agenda:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération de l\'agenda'
      };
    }
  }

  // Récupérer les sources de prospects réelles
  async getSourcesProspects() {
    try {
      const { data, error } = await supabase
        .from('vue_apporteur_sources_prospects')
        .select('*')
        .order('nb_prospects', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Erreur récupération sources prospects:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des sources de prospects'
      };
    }
  }

  // Marquer une notification comme lue
  async marquerNotificationLue(notificationId: string) {
    try {
      const { error } = await supabase
        .from('Notification')
        .update({ lue: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('apporteur_id', this.apporteurId);

      if (error) throw error;

      return {
        success: true
      };
    } catch (error) {
      console.error('Erreur marquage notification:', error);
      return {
        success: false,
        error: 'Erreur lors du marquage de la notification'
      };
    }
  }

  // Supprimer une notification
  async supprimerNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('Notification')
        .delete()
        .eq('id', notificationId)
        .eq('apporteur_id', this.apporteurId);

      if (error) throw error;

      return {
        success: true
      };
    } catch (error) {
      console.error('Erreur suppression notification:', error);
      return {
        success: false,
        error: 'Erreur lors de la suppression de la notification'
      };
    }
  }

  // Récupérer les statistiques réelles
  async getStatistics() {
    try {
      const { data, error } = await supabase
        .from('vue_apporteur_statistiques')
        .select('*')
        .order('mois', { ascending: false })
        .limit(12);

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des statistiques'
      };
    }
  }
}
