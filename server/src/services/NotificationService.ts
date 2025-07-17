import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface NotificationData {
  expert_id: string;
  type: 'preselection' | 'message' | 'assignment' | 'system';
  title: string;
  message: string;
  data?: any;
}

export class NotificationService {
  /**
   * Envoyer une notification à un expert
   */
  static async sendNotification(notificationData: NotificationData) {
    try {
      const { data, error } = await supabase
        .from('ExpertNotifications')
        .insert({
          expert_id: notificationData.expert_id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data || null,
          read: false
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de l\'envoi de la notification:', error);
        throw error;
      }

      console.log(`✅ Notification envoyée à l'expert ${notificationData.expert_id}: ${notificationData.title}`);
      return data;
    } catch (error) {
      console.error('Erreur dans NotificationService.sendNotification:', error);
      throw error;
    }
  }

  /**
   * Envoyer une notification de pré-sélection
   */
  static async sendPreselectionNotification(expertId: string, clientName: string, produitNom: string, montantEstime?: number) {
    const title = 'Nouvelle pré-sélection';
    const message = `Pré-sélection par ${clientName} pour ${produitNom}${montantEstime ? ` (montant estimé: ${montantEstime}€)` : ''}. Nous vous tiendrons informé dès que le dossier sera prêt.`;
    
    return this.sendNotification({
      expert_id: expertId,
      type: 'preselection',
      title,
      message,
      data: {
        client_name: clientName,
        produit_nom: produitNom,
        montant_estime: montantEstime,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Envoyer une notification de message
   */
  static async sendMessageNotification(expertId: string, clientName: string, messagePreview: string) {
    const title = 'Nouveau message';
    const message = `Nouveau message de ${clientName}: "${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}"`;
    
    return this.sendNotification({
      expert_id: expertId,
      type: 'message',
      title,
      message,
      data: {
        client_name: clientName,
        message_preview: messagePreview,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Envoyer une notification d'assignment
   */
  static async sendAssignmentNotification(expertId: string, clientName: string, produitNom: string) {
    const title = 'Dossier assigné';
    const message = `Le dossier ${produitNom} de ${clientName} vous a été assigné. Vous pouvez maintenant commencer le traitement.`;
    
    return this.sendNotification({
      expert_id: expertId,
      type: 'assignment',
      title,
      message,
      data: {
        client_name: clientName,
        produit_nom: produitNom,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Envoyer une notification système
   */
  static async sendSystemNotification(expertId: string, title: string, message: string, data?: any) {
    return this.sendNotification({
      expert_id: expertId,
      type: 'system',
      title,
      message,
      data: {
        ...data,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Marquer une notification comme lue
   */
  static async markAsRead(notificationId: string, expertId: string) {
    try {
      const { error } = await supabase
        .from('ExpertNotifications')
        .update({ 
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('expert_id', expertId);

      if (error) {
        console.error('Erreur lors du marquage comme lu:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erreur dans NotificationService.markAsRead:', error);
      throw error;
    }
  }

  /**
   * Supprimer une notification
   */
  static async deleteNotification(notificationId: string, expertId: string) {
    try {
      const { error } = await supabase
        .from('ExpertNotifications')
        .delete()
        .eq('id', notificationId)
        .eq('expert_id', expertId);

      if (error) {
        console.error('Erreur lors de la suppression:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erreur dans NotificationService.deleteNotification:', error);
      throw error;
    }
  }

  /**
   * Récupérer les notifications d'un expert
   */
  static async getExpertNotifications(expertId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('ExpertNotifications')
        .select('*')
        .eq('expert_id', expertId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans NotificationService.getExpertNotifications:', error);
      throw error;
    }
  }

  /**
   * Compter les notifications non lues d'un expert
   */
  static async getUnreadCount(expertId: string) {
    try {
      const { count, error } = await supabase
        .from('ExpertNotifications')
        .select('*', { count: 'exact', head: true })
        .eq('expert_id', expertId)
        .eq('read', false);

      if (error) {
        console.error('Erreur lors du comptage des notifications:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Erreur dans NotificationService.getUnreadCount:', error);
      throw error;
    }
  }
} 