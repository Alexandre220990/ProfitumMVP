import { NotificationService } from './NotificationService';

export interface ExpertNotificationData {
  expert_id: string;
  expert_name: string;
  expert_email: string;
  company_name?: string;
  siren?: string;
  phone?: string;
  location?: string;
  experience?: string;
  specializations?: string[];
  languages?: string[];
  website?: string;
  linkedin?: string;
  compensation?: number;
  max_clients?: number;
  description?: string;
  rejection_reason?: string;
  temp_password?: string;
  old_status?: string;
  new_status?: string;
  change_reason?: string;
  status_impact?: string;
  updated_fields?: string;
  abonnement?: string;
}

export class ExpertNotificationService {
  constructor() {
    // Initialisation simplifiée
  }

  /**
   * Notifier l'admin d'une nouvelle demande d'expert
   */
  async notifyAdminOfDemoRequest(data: ExpertNotificationData): Promise<string> {
    try {
      const adminId = await this.getAdminId();
      if (!adminId) {
        throw new Error('Aucun admin trouvé');
      }

      const notificationData = {
        ...data,
        admin_dashboard_url: `${process.env.FRONTEND_URL}/admin/gestion-experts`,
        recipient_name: 'Administrateur'
      };

      return await NotificationService.sendSystemNotification(
        adminId,
        'Nouvelle demande d\'expert',
        `Nouvelle demande d'expert : ${data.expert_name} (${data.expert_email})`,
        notificationData
      );
    } catch (error) {
      console.error('Erreur notification admin demande démo:', error);
      throw error;
    }
  }

  /**
   * Notifier l'expert de l'approbation de son compte
   */
  async notifyExpertApproval(data: ExpertNotificationData): Promise<string> {
    try {
      const notificationData = {
        ...data,
        expert_dashboard_url: `${process.env.FRONTEND_URL}/expert/dashboard`,
        recipient_name: data.expert_name
      };

      return await NotificationService.sendSystemNotification(
        data.expert_id,
        'Compte expert approuvé',
        `Votre compte expert a été approuvé. Bienvenue ${data.expert_name} !`,
        notificationData
      );
    } catch (error) {
      console.error('Erreur notification approbation expert:', error);
      throw error;
    }
  }

  /**
   * Notifier l'expert du refus de sa demande
   */
  async notifyExpertRejection(data: ExpertNotificationData): Promise<string> {
    try {
      const notificationData = {
        ...data,
        recipient_name: data.expert_name
      };

      return await NotificationService.sendSystemNotification(
        data.expert_id,
        'Demande expert refusée',
        `Votre demande d'expert a été refusée. Raison : ${data.rejection_reason}`,
        notificationData
      );
    } catch (error) {
      console.error('Erreur notification refus expert:', error);
      throw error;
    }
  }

  /**
   * Notifier l'expert de la création de son compte
   */
  async notifyExpertAccountCreated(data: ExpertNotificationData): Promise<string> {
    try {
      const notificationData = {
        ...data,
        login_url: `${process.env.FRONTEND_URL}/expert/login`,
        recipient_name: data.expert_name
      };

      return await NotificationService.sendSystemNotification(
        data.expert_id,
        'Compte expert créé',
        `Votre compte expert a été créé. Mot de passe temporaire : ${data.temp_password}`,
        notificationData
      );
    } catch (error) {
      console.error('Erreur notification création compte expert:', error);
      throw error;
    }
  }

  /**
   * Notifier l'expert de la mise à jour de son profil
   */
  async notifyExpertProfileUpdated(data: ExpertNotificationData): Promise<string> {
    try {
      const notificationData = {
        ...data,
        expert_profile_url: `${process.env.FRONTEND_URL}/expert/profile`,
        recipient_name: data.expert_name
      };

      return await NotificationService.sendSystemNotification(
        data.expert_id,
        'Profil expert mis à jour',
        `Votre profil expert a été mis à jour.`,
        notificationData
      );
    } catch (error) {
      console.error('Erreur notification mise à jour profil expert:', error);
      throw error;
    }
  }

  /**
   * Notifier l'expert d'un changement de statut
   */
  async notifyExpertStatusChanged(data: ExpertNotificationData): Promise<string> {
    try {
      const notificationData = {
        ...data,
        expert_dashboard_url: `${process.env.FRONTEND_URL}/expert/dashboard`,
        recipient_name: data.expert_name
      };

      return await NotificationService.sendSystemNotification(
        data.expert_id,
        'Statut expert modifié',
        `Votre statut expert a été modifié de ${data.old_status} à ${data.new_status}.`,
        notificationData
      );
    } catch (error) {
      console.error('Erreur notification changement statut expert:', error);
      throw error;
    }
  }

  private async getAdminId(): Promise<string | null> {
    // TODO: Implémenter la récupération de l'ID admin
    return null;
  }

  // Méthodes utilitaires statiques
  static generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static formatUpdatedFields(updatedFields: Record<string, any>): string {
    return Object.keys(updatedFields)
      .map(field => field.replace(/_/g, ' '))
      .join(', ');
  }

  static getStatusImpact(oldStatus: string, newStatus: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'En attente',
      'active': 'Actif',
      'suspended': 'Suspendu',
      'inactive': 'Inactif'
    };

    const oldStatusFr = statusMap[oldStatus] || oldStatus;
    const newStatusFr = statusMap[newStatus] || newStatus;

    return `Changement de statut de ${oldStatusFr} à ${newStatusFr}`;
  }
}
