import { NotificationService } from './NotificationService';

export interface ExpertNotificationData {
  expert_id: string;
  expert_name: string;
  first_name?: string;
  last_name?: string;
  expert_email: string;
  company_name?: string;
  siren?: string;
  phone?: string;
  location?: string;
  experience?: string;
  specializations?: string[];
  secteur_activite?: string[];
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

      return await NotificationService.sendSystemNotification(notificationData);
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

      return await NotificationService.sendSystemNotification(notificationData);
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

      return await NotificationService.sendSystemNotification(notificationData);
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

      return await NotificationService.sendSystemNotification(notificationData);
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

      return await NotificationService.sendSystemNotification(notificationData);
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

      return await NotificationService.sendSystemNotification(notificationData);
    } catch (error) {
      console.error('Erreur notification changement statut expert:', error);
      throw error;
    }
  }

  private async getAdminId(): Promise<string | null> {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      
      const { data: admins, error } = await supabase
        .from('Admin')
        .select('id')
        .eq('status', 'active')
        .limit(1)
        .single();
      
      if (error || !admins) {
        console.error('❌ Erreur récupération admin:', error);
        return null;
      }
      
      return admins.id;
    } catch (error) {
      console.error('❌ Erreur getAdminId:', error);
      return null;
    }
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
