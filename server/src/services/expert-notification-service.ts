/**
 * ExpertNotificationService
 * Service pour envoyer des notifications aux experts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class ExpertNotificationService {
  
  /**
   * Notifier l'expert : Client souhaite lui confier un dossier
   */
  static async notifyDossierPendingAcceptance(data: {
    expert_id: string;
    client_produit_id: string;
    client_id: string;
    client_company?: string;
    client_name?: string;
    product_type: string;
    product_name?: string;
    estimated_amount?: number;
  }): Promise<{ success: boolean; notification_id?: string }> {
    try {
      // Récupérer l'auth_user_id de l'expert depuis la table Expert
      const { data: expertData, error: expertError } = await supabase
        .from('Expert')
        .select('auth_user_id')
        .eq('id', data.expert_id)
        .single();

      if (expertError || !expertData?.auth_user_id) {
        console.error('❌ Expert auth_user_id non trouvé:', expertError);
        return { success: false };
      }

      const amountText = data.estimated_amount 
        ? ` (${data.estimated_amount.toLocaleString('fr-FR')} €)` 
        : '';

      const { data: notification, error } = await supabase
        .from('notification')
        .insert({
          user_id: expertData.auth_user_id,
          user_type: 'expert',
          title: `📋 Nouveau dossier ${data.product_type} en attente`,
          message: `${data.client_company || data.client_name || 'Un client'} souhaite vous confier un dossier ${data.product_name || data.product_type}${amountText}. Souhaitez-vous traiter ce dossier ?`,
          notification_type: 'dossier_pending_acceptance',
          priority: 'high',
          is_read: false,
          action_url: `/expert/dossier/${data.client_produit_id}/review`,
          action_data: {
            client_produit_id: data.client_produit_id,
            client_id: data.client_id,
            client_company: data.client_company,
            client_name: data.client_name,
            product_type: data.product_type,
            product_name: data.product_name,
            estimated_amount: data.estimated_amount,
            action_required: 'accept_or_reject',
            pending_at: new Date().toISOString()
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création notification expert (pending):', error);
        return { success: false };
      }

      console.log(`✅ Notification pending envoyée à l'expert ${data.expert_id}:`, notification.id);
      return { success: true, notification_id: notification.id };

    } catch (error) {
      console.error('❌ Erreur notifyDossierPendingAcceptance:', error);
      return { success: false };
    }
  }

  /**
   * Notifier le client : Expert a accepté le dossier
   */
  static async notifyClientExpertAccepted(data: {
    client_id: string;
    client_produit_id: string;
    expert_id: string;
    expert_name: string;
    expert_email?: string;
    product_type: string;
    product_name?: string;
  }): Promise<{ success: boolean; notification_id?: string }> {
    try {
      // Récupérer l'auth_user_id du client
      const { data: clientData, error: clientError } = await supabase
        .from('Client')
        .select('auth_user_id')
        .eq('id', data.client_id)
        .single();

      if (clientError || !clientData?.auth_user_id) {
        console.error('❌ Client auth_user_id non trouvé:', clientError);
        return { success: false };
      }

      const { data: notification, error } = await supabase
        .from('notification')
        .insert({
          user_id: clientData.auth_user_id,
          user_type: 'client',
          title: `✅ Expert assigné - ${data.product_type}`,
          message: `Excellent ! ${data.expert_name} a accepté votre dossier ${data.product_name || data.product_type}. Vous pouvez maintenant échanger avec lui et planifier un rendez-vous.`,
          notification_type: 'expert_accepted',
          priority: 'high',
          is_read: false,
          action_url: `/produits/${data.product_type.toLowerCase()}/${data.client_produit_id}`,
          action_data: {
            client_produit_id: data.client_produit_id,
            expert_id: data.expert_id,
            expert_name: data.expert_name,
            expert_email: data.expert_email,
            product_type: data.product_type,
            accepted_at: new Date().toISOString(),
            next_step: 'communicate_with_expert'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur notification client (expert accepté):', error);
        return { success: false };
      }

      console.log(`✅ Notification expert accepté envoyée au client ${data.client_id}:`, notification.id);
      return { success: true, notification_id: notification.id };

    } catch (error) {
      console.error('❌ Erreur notifyClientExpertAccepted:', error);
      return { success: false };
    }
  }

  /**
   * Notifier le client : Expert a refusé le dossier
   */
  static async notifyClientExpertRejected(data: {
    client_id: string;
    client_produit_id: string;
    expert_name: string;
    product_type: string;
    product_name?: string;
    rejection_reason?: string;
  }): Promise<{ success: boolean; notification_id?: string }> {
    try {
      // Récupérer l'auth_user_id du client
      const { data: clientData, error: clientError } = await supabase
        .from('Client')
        .select('auth_user_id')
        .eq('id', data.client_id)
        .single();

      if (clientError || !clientData?.auth_user_id) {
        console.error('❌ Client auth_user_id non trouvé:', clientError);
        return { success: false };
      }

      const { data: notification, error } = await supabase
        .from('notification')
        .insert({
          user_id: clientData.auth_user_id,
          user_type: 'client',
          title: `⚠️ Expert non disponible - ${data.product_type}`,
          message: `${data.expert_name} n'est malheureusement pas disponible pour traiter votre dossier ${data.product_name || data.product_type}. ${data.rejection_reason || 'Veuillez sélectionner un autre expert.'}`,
          notification_type: 'expert_rejected',
          priority: 'high',
          is_read: false,
          action_url: `/produits/${data.product_type.toLowerCase()}/${data.client_produit_id}`,
          action_data: {
            client_produit_id: data.client_produit_id,
            expert_name: data.expert_name,
            product_type: data.product_type,
            rejection_reason: data.rejection_reason,
            rejected_at: new Date().toISOString(),
            next_step: 'select_another_expert'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur notification client (expert refusé):', error);
        return { success: false };
      }

      console.log(`✅ Notification expert refusé envoyée au client ${data.client_id}:`, notification.id);
      return { success: true, notification_id: notification.id };

    } catch (error) {
      console.error('❌ Erreur notifyClientExpertRejected:', error);
      return { success: false };
    }
  }

  /**
   * Notifier l'admin : Expert a accepté/refusé un dossier
   */
  static async notifyAdminExpertDecision(data: {
    expert_id: string;
    expert_name: string;
    client_produit_id: string;
    client_company?: string;
    product_type: string;
    decision: 'accepted' | 'rejected';
  }): Promise<{ success: boolean; notification_ids: string[] }> {
    try {
      // Récupérer tous les admins actifs
      const { data: admins, error: adminsError } = await supabase
        .from('Admin')
        .select('auth_user_id')
        .eq('is_active', true);

      if (adminsError || !admins || admins.length === 0) {
        console.error('❌ Aucun admin actif trouvé');
        return { success: false, notification_ids: [] };
      }

      const notificationIds: string[] = [];
      const icon = data.decision === 'accepted' ? '✅' : '❌';
      const actionText = data.decision === 'accepted' ? 'accepté' : 'refusé';

      for (const admin of admins) {
        if (!admin.auth_user_id) continue;

        const { data: notification, error } = await supabase
          .from('notification')
          .insert({
            user_id: admin.auth_user_id,
            user_type: 'admin',
            title: `${icon} Dossier ${actionText} par expert`,
            message: `${data.expert_name} a ${actionText} le dossier ${data.product_type} de ${data.client_company || 'Client'}`,
            notification_type: 'admin_info',
            priority: 'medium',
            is_read: false,
            action_url: `/admin/dossiers/${data.client_produit_id}`,
            action_data: {
              client_produit_id: data.client_produit_id,
              expert_id: data.expert_id,
              expert_name: data.expert_name,
              client_company: data.client_company,
              product_type: data.product_type,
              decision: data.decision,
              decided_at: new Date().toISOString()
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error && notification) {
          notificationIds.push(notification.id);
        }
      }

      console.log(`✅ ${notificationIds.length} notifications admin créées (decision expert)`);
      return { success: notificationIds.length > 0, notification_ids: notificationIds };

    } catch (error) {
      console.error('❌ Erreur notifyAdminExpertDecision:', error);
      return { success: false, notification_ids: [] };
    }
  }
}
