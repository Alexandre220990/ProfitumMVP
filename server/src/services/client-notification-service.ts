/**
 * ClientNotificationService
 * Service pour envoyer des notifications aux clients
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class ClientNotificationService {
  
  /**
   * Notifier le client : Pré-éligibilité VALIDÉE
   */
  static async notifyEligibilityValidated(data: {
    client_id: string;
    client_produit_id: string;
    product_type: string;
    product_name?: string;
    validated_by?: string;
    validated_by_email?: string;
    notes?: string;
  }): Promise<{ success: boolean; notification_id?: string }> {
    try {
      // Récupérer l'auth_user_id du client depuis la table Client
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
          title: `✅ Pré-éligibilité ${data.product_type} confirmée`,
          message: `Félicitations ! Votre pré-éligibilité pour ${data.product_name || data.product_type} a été validée par nos équipes. Vous pouvez maintenant passer à l'étape suivante : sélectionner votre expert.`,
          notification_type: 'eligibility_validated',
          priority: 'high',
          is_read: false,
          action_url: `/client/produits/${data.client_produit_id}`,
          action_data: {
            client_produit_id: data.client_produit_id,
            product_type: data.product_type,
            validated_by: data.validated_by,
            validated_by_email: data.validated_by_email,
            validated_at: new Date().toISOString(),
            notes: data.notes,
            next_step: 'select_expert'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création notification client (validée):', error);
        return { success: false };
      }

      console.log(`✅ Notification validée envoyée au client ${data.client_id}:`, notification.id);
      return { success: true, notification_id: notification.id };

    } catch (error) {
      console.error('❌ Erreur notifyEligibilityValidated:', error);
      return { success: false };
    }
  }

  /**
   * Notifier le client : Pré-éligibilité REJETÉE
   */
  static async notifyEligibilityRejected(data: {
    client_id: string;
    client_produit_id: string;
    product_type: string;
    product_name?: string;
    rejected_by?: string;
    rejected_by_email?: string;
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
          title: `❌ Pré-éligibilité ${data.product_type} non confirmée`,
          message: `Votre dossier ${data.product_name || data.product_type} n'a pas pu être validé en l'état. ${data.rejection_reason || 'Veuillez corriger ou compléter vos documents.'} Vous pouvez modifier vos documents et soumettre à nouveau.`,
          notification_type: 'eligibility_rejected',
          priority: 'high',
          is_read: false,
          action_url: `/client/produits/${data.client_produit_id}`,
          action_data: {
            client_produit_id: data.client_produit_id,
            product_type: data.product_type,
            rejected_by: data.rejected_by,
            rejected_by_email: data.rejected_by_email,
            rejected_at: new Date().toISOString(),
            rejection_reason: data.rejection_reason,
            next_step: 'fix_documents'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création notification client (rejetée):', error);
        return { success: false };
      }

      console.log(`✅ Notification rejetée envoyée au client ${data.client_id}:`, notification.id);
      return { success: true, notification_id: notification.id };

    } catch (error) {
      console.error('❌ Erreur notifyEligibilityRejected:', error);
      return { success: false };
    }
  }

  /**
   * Notifier le client : Dossier complet validé, transmis à l'expert
   */
  static async notifyDossierSentToExpert(data: {
    client_id: string;
    client_produit_id: string;
    product_type: string;
    expert_name: string;
    expert_email?: string;
  }): Promise<{ success: boolean; notification_id?: string }> {
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('Client')
        .select('auth_user_id')
        .eq('id', data.client_id)
        .single();

      if (clientError || !clientData?.auth_user_id) {
        return { success: false };
      }

      const { data: notification, error } = await supabase
        .from('notification')
        .insert({
          user_id: clientData.auth_user_id,
          user_type: 'client',
          title: `📤 Dossier transmis à l'expert`,
          message: `Votre dossier ${data.product_type} a été validé et transmis à votre expert ${data.expert_name}. Vous serez notifié de l'avancement.`,
          notification_type: 'dossier_sent_to_expert',
          priority: 'medium',
          is_read: false,
          action_url: `/client/produits/${data.client_produit_id}`,
          action_data: {
            client_produit_id: data.client_produit_id,
            product_type: data.product_type,
            expert_name: data.expert_name,
            expert_email: data.expert_email,
            sent_at: new Date().toISOString()
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur notification dossier envoyé:', error);
        return { success: false };
      }

      return { success: true, notification_id: notification.id };

    } catch (error) {
      console.error('❌ Erreur notifyDossierSentToExpert:', error);
      return { success: false };
    }
  }
}

