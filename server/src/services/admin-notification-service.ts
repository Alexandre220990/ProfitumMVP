/**
 * AdminNotificationService
 * Service pour envoyer des notifications aux administrateurs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Import SSE service (lazy pour éviter circular dependencies)
let notificationSSE: any = null;
const getSSEService = () => {
  if (!notificationSSE) {
    try {
      notificationSSE = require('./notification-sse-service').notificationSSE;
    } catch (error) {
      // SSE pas encore initialisé
    }
  }
  return notificationSSE;
};

export class AdminNotificationService {
  
  /**
   * Récupérer tous les IDs des admins actifs
   */
  static async getAdminIds(): Promise<string[]> {
    try {
      // Récupérer depuis la table Admin (plus fiable que auth.admin.listUsers)
      const { data: admins, error } = await supabase
        .from('Admin')
        .select('auth_user_id')
        .eq('is_active', true);
      
      if (error) {
        console.error('❌ Erreur récupération admins:', error);
        return [];
      }

      return admins?.map(admin => admin.auth_user_id) || [];
    } catch (error) {
      console.error('❌ Erreur getAdminIds:', error);
      return [];
    }
  }

  /**
   * Notifier les admins : Documents de pré-éligibilité uploadés
   */
  static async notifyDocumentsPreEligibilityUploaded(data: {
    client_produit_id: string;
    client_id: string;
    client_name?: string;
    client_email?: string;
    client_company?: string;
    product_type: string;
    product_name?: string;
    documents: Array<{
      id: string;
      type: string;
      filename: string;
    }>;
  }): Promise<{ success: boolean; notification_ids: string[] }> {
    try {
      const adminIds = await this.getAdminIds();
      
      if (adminIds.length === 0) {
        console.warn('⚠️ Aucun admin trouvé pour recevoir la notification');
        return { success: false, notification_ids: [] };
      }

      const notificationIds: string[] = [];

      // Créer une notification pour chaque admin
      for (const adminId of adminIds) {
        const { data: notification, error } = await supabase
          .from('notification')
          .insert({
            user_id: adminId,
            user_type: 'admin',
            title: `📄 Documents de pré-éligibilité ${data.product_type}`,
            message: `${data.client_company || data.client_name || 'Un client'} a uploadé des documents pour validation d'éligibilité ${data.product_type}`,
            notification_type: 'admin_action_required',
            priority: 'high',
            is_read: false,
            action_url: `/admin/dossiers/${data.client_produit_id}`,
            action_data: {
              client_produit_id: data.client_produit_id,
              client_id: data.client_id,
              client_name: data.client_name,
              client_email: data.client_email,
              client_company: data.client_company,
              product_type: data.product_type,
              product_name: data.product_name,
              documents: data.documents,
              action_required: 'validate_eligibility'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Erreur création notification admin:', error);
          continue;
        }

        notificationIds.push(notification.id);
        console.log(`✅ Notification créée pour admin ${adminId}:`, notification.id);

        // 📡 Envoyer via SSE en temps réel
        const sse = getSSEService();
        if (sse) {
          sse.sendNotificationToUser(adminId, notification);
          sse.sendKPIRefresh(); // Rafraîchir KPI dashboard admin
        }
      }

      return {
        success: notificationIds.length > 0,
        notification_ids: notificationIds
      };

    } catch (error) {
      console.error('❌ Erreur notifyDocumentsPreEligibilityUploaded:', error);
      return { success: false, notification_ids: [] };
    }
  }

  /**
   * Notifier les admins : Documents complémentaires uploadés (Étape 3)
   */
  static async notifyDocumentsComplementaryUploaded(data: {
    client_produit_id: string;
    client_id: string;
    client_name?: string;
    client_company?: string;
    product_type: string;
    documents: Array<{
      id: string;
      type: string;
      filename: string;
    }>;
  }): Promise<{ success: boolean; notification_ids: string[] }> {
    try {
      const adminIds = await this.getAdminIds();
      
      if (adminIds.length === 0) {
        return { success: false, notification_ids: [] };
      }

      const notificationIds: string[] = [];

      for (const adminId of adminIds) {
        const { data: notification, error } = await supabase
          .from('notification')
          .insert({
            user_id: adminId,
            user_type: 'admin',
            title: `📑 Documents complémentaires ${data.product_type}`,
            message: `${data.client_company || data.client_name || 'Un client'} a uploadé des documents complémentaires. Vérifier avant transmission à l'expert.`,
            notification_type: 'admin_action_required',
            priority: 'medium',
            is_read: false,
            action_url: `/admin/dossiers/${data.client_produit_id}/validate-complete`,
            action_data: {
              client_produit_id: data.client_produit_id,
              client_id: data.client_id,
              client_name: data.client_name,
              client_company: data.client_company,
              product_type: data.product_type,
              documents: data.documents,
              action_required: 'validate_complete_dossier'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error && notification) {
          notificationIds.push(notification.id);

          // 📡 Envoyer via SSE en temps réel
          const sse = getSSEService();
          if (sse) {
            sse.sendNotificationToUser(adminId, notification);
            sse.sendKPIRefresh();
          }
        }
      }

      return {
        success: notificationIds.length > 0,
        notification_ids: notificationIds
      };

    } catch (error) {
      console.error('❌ Erreur notifyDocumentsComplementaryUploaded:', error);
      return { success: false, notification_ids: [] };
    }
  }

  /**
   * Notifier les admins : Expert a refusé le dossier
   */
  static async notifyExpertRefusedDossier(data: {
    client_produit_id: string;
    expert_id: string;
    expert_name: string;
    client_name?: string;
    product_type: string;
    refusal_reason?: string;
  }): Promise<{ success: boolean; notification_ids: string[] }> {
    try {
      const adminIds = await this.getAdminIds();
      
      if (adminIds.length === 0) {
        return { success: false, notification_ids: [] };
      }

      const notificationIds: string[] = [];

      for (const adminId of adminIds) {
        const { data: notification, error } = await supabase
          .from('notification')
          .insert({
            user_id: adminId,
            user_type: 'admin',
            title: `⚠️ Expert a refusé le dossier`,
            message: `L'expert ${data.expert_name} a refusé le dossier ${data.product_type} de ${data.client_name || 'un client'}. ${data.refusal_reason || ''}`,
            notification_type: 'admin_action_required',
            priority: 'high',
            is_read: false,
            action_url: `/admin/dossiers/${data.client_produit_id}/reassign`,
            action_data: {
              client_produit_id: data.client_produit_id,
              expert_id: data.expert_id,
              expert_name: data.expert_name,
              client_name: data.client_name,
              product_type: data.product_type,
              refusal_reason: data.refusal_reason,
              action_required: 'reassign_expert'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error && notification) {
          notificationIds.push(notification.id);

          // 📡 Envoyer via SSE en temps réel
          const sse = getSSEService();
          if (sse) {
            sse.sendNotificationToUser(adminId, notification);
            sse.sendKPIRefresh();
          }
        }
      }

      return {
        success: notificationIds.length > 0,
        notification_ids: notificationIds
      };

    } catch (error) {
      console.error('❌ Erreur notifyExpertRefusedDossier:', error);
      return { success: false, notification_ids: [] };
    }
  }

  /**
   * Notifier les admins : Nouveau message de contact
   */
  static async notifyNewContactMessage(data: {
    contact_message_id: string;
    name: string;
    email: string;
    phone?: string | null;
    subject?: string | null;
    message: string;
  }): Promise<{ success: boolean; notification_ids: string[] }> {
    try {
      const adminIds = await this.getAdminIds();
      
      if (adminIds.length === 0) {
        return { success: false, notification_ids: [] };
      }

      const notificationIds: string[] = [];

      for (const adminId of adminIds) {
        const { data: notification, error } = await supabase
          .from('notification')
          .insert({
            user_id: adminId,
            user_type: 'admin',
            title: `📧 Nouveau message de contact`,
            message: `${data.name} (${data.email}) vous a envoyé un message${data.subject ? ` : ${data.subject}` : ''}`,
            notification_type: 'contact_message',
            priority: 'medium',
            is_read: false,
            action_url: `/admin/contact/${data.contact_message_id}`,
            action_data: {
              contact_message_id: data.contact_message_id,
              name: data.name,
              email: data.email,
              phone: data.phone,
              subject: data.subject,
              message: data.message,
              action_required: 'view_contact'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error && notification) {
          notificationIds.push(notification.id);

          // 📡 Envoyer via SSE en temps réel
          const sse = getSSEService();
          if (sse) {
            sse.sendNotificationToUser(adminId, notification);
            sse.sendKPIRefresh();
          }
        }
      }

      return {
        success: notificationIds.length > 0,
        notification_ids: notificationIds
      };

    } catch (error) {
      console.error('❌ Erreur notifyNewContactMessage:', error);
      return { success: false, notification_ids: [] };
    }
  }
}

