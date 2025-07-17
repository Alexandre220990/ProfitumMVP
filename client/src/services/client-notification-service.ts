import { get, post, put } from '@/lib/api';

// Types pour les notifications client
export interface ClientNotification {
  id: string;
  user_id: string;
  user_type: 'client';
  title: string;
  message: string;
  notification_type: NotificationType;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  action_data?: NotificationActionData;
  expires_at?: string;
  is_dismissed: boolean;
  dismissed_at?: string;
  created_at: string;
  updated_at: string;
}

export type NotificationType = 
  // Types génériques
  | 'assignment' | 'message' | 'reminder' | 'alert' | 'promotion' | 'system'
  // Types spécifiques clients
  | 'document_uploaded' | 'document_required' | 'document_approved' | 'document_rejected' | 'document_expiring'
  | 'dossier_accepted' | 'dossier_rejected' | 'dossier_step_completed' | 'dossier_audit_completed'
  | 'message_received' | 'message_urgent' | 'message_response'
  | 'deadline_reminder' | 'payment_reminder' | 'validation_reminder';

export interface NotificationActionData {
  action_type: 'redirect' | 'modal' | 'external';
  target_page?: 'messagerie' | 'documents' | 'dossier' | 'marketplace' | 'dashboard';
  target_id?: string;
  expert_id?: string;
  dossier_id?: string;
  conversation_id?: string;
  document_id?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  urgent: number;
  by_type: Record<NotificationType, number>;
}

class ClientNotificationService {
  /**
   * Récupérer toutes les notifications d'un client
   */
  async getClientNotifications(clientId: string, limit: number = 50): Promise<ClientNotification[]> {
    try {
      const response = await get<{ data: ClientNotification[] }>(`/api/notifications/client/${clientId}?limit=${limit}`);
      
      if (response.success && response.data) {
        return response.data.data;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      return [];
    }
  }

  /**
   * Récupérer les notifications non lues
   */
  async getUnreadNotifications(clientId: string): Promise<ClientNotification[]> {
    try {
      const response = await get<{ data: ClientNotification[] }>(`/api/notifications/client/${clientId}/unread`);
      
      if (response.success && response.data) {
        return response.data.data;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur récupération notifications non lues:', error);
      return [];
    }
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const response = await put<{ success: boolean }>(`/api/notifications/${notificationId}/read`, {});
      return response.success;
    } catch (error) {
      console.error('Erreur marquage comme lu:', error);
      return false;
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(clientId: string): Promise<boolean> {
    try {
      const response = await put<{ success: boolean }>(`/api/notifications/client/${clientId}/read-all`, {});
      return response.success;
    } catch (error) {
      console.error('Erreur marquage tout comme lu:', error);
      return false;
    }
  }

  /**
   * Rejeter une notification (masquer)
   */
  async dismissNotification(notificationId: string): Promise<boolean> {
    try {
      const response = await put<{ success: boolean }>(`/api/notifications/${notificationId}/dismiss`, {});
      return response.success;
    } catch (error) {
      console.error('Erreur rejet notification:', error);
      return false;
    }
  }

  /**
   * Récupérer les statistiques des notifications
   */
  async getNotificationStats(clientId: string): Promise<NotificationStats> {
    try {
      const response = await get<{ data: NotificationStats }>(`/api/notifications/client/${clientId}/stats`);
      
      if (response.success && response.data) {
        return response.data.data;
      }
      
      return {
        total: 0,
        unread: 0,
        urgent: 0,
        by_type: {} as Record<NotificationType, number>
      };
    } catch (error) {
      console.error('Erreur calcul statistiques:', error);
      return {
        total: 0,
        unread: 0,
        urgent: 0,
        by_type: {} as Record<NotificationType, number>
      };
    }
  }

  /**
   * Créer une notification (pour les tests ou notifications système)
   */
  async createNotification(
    clientId: string,
    type: NotificationType,
    title: string,
    message: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    actionData?: NotificationActionData
  ): Promise<string | null> {
    try {
      const response = await post<{ data: { id: string } }>('/api/notifications', {
        user_id: clientId,
        user_type: 'client',
        title,
        message,
        notification_type: type,
        priority,
        action_data: actionData || {}
      });
      
      if (response.success && response.data) {
        return response.data.data.id;
      }
      
      return null;
    } catch (error) {
      console.error('Erreur création notification:', error);
      return null;
    }
  }

  /**
   * Obtenir l'URL de redirection pour une notification
   */
  getNotificationRedirectUrl(notification: ClientNotification): string | null {
    if (!notification.action_data) return null;

    const { action_data } = notification;
    
    switch (action_data.target_page) {
      case 'messagerie':
        return action_data.conversation_id 
          ? `/messagerie-client/conversation/${action_data.conversation_id}`
          : '/messagerie-client';
      
      case 'documents':
        return '/documents-client';
      
      case 'dossier':
        return action_data.dossier_id 
          ? `/dossier-client/${action_data.target_id}/${action_data.dossier_id}`
          : '/dashboard/client';
      
      case 'marketplace':
        return '/experts';
      
      case 'dashboard':
        return '/dashboard/client';
      
      default:
        return null;
    }
  }

  /**
   * Obtenir l'icône pour un type de notification
   */
  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case 'message_received':
      case 'message_urgent':
      case 'message_response':
        return 'MessageSquare';
      
      case 'document_uploaded':
      case 'document_required':
      case 'document_approved':
      case 'document_rejected':
      case 'document_expiring':
        return 'FileText';
      
      case 'dossier_accepted':
      case 'dossier_rejected':
      case 'dossier_step_completed':
      case 'dossier_audit_completed':
        return 'Briefcase';
      
      case 'deadline_reminder':
      case 'payment_reminder':
      case 'validation_reminder':
        return 'Clock';
      
      case 'alert':
        return 'AlertTriangle';
      
      default:
        return 'Bell';
    }
  }

  /**
   * Obtenir la couleur pour un type de notification
   */
  getNotificationColor(type: NotificationType): string {
    switch (type) {
      case 'message_urgent':
      case 'dossier_rejected':
      case 'alert':
        return 'text-red-600 bg-red-50 border-red-200';
      
      case 'document_required':
      case 'deadline_reminder':
      case 'payment_reminder':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      
      case 'dossier_accepted':
      case 'document_approved':
        return 'text-green-600 bg-green-50 border-green-200';
      
      case 'document_uploaded':
      case 'message_received':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }
}

export const clientNotificationService = new ClientNotificationService(); 