import { NotificationService, NotificationType, NotificationPriority } from './notification-service';
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Notifier l'admin d'une nouvelle demande de démo expert
   */
  async notifyAdminOfDemoRequest(data: ExpertNotificationData): Promise<string> {
    try {
      // Obtenir l'ID admin (premier admin trouvé ou email spécifique)
      const adminId = await this.getAdminId();
      if (!adminId) {
        throw new Error('Aucun admin trouvé pour la notification');
      }

      const notificationData = {
        ...data,
        admin_dashboard_url: `${process.env.FRONTEND_URL}/admin/gestion-experts`,
        recipient_name: 'Administrateur'
      };

      return await this.notificationService.sendNotification(
        adminId,
        'admin',
        NotificationType.EXPERT_DEMO_REQUEST,
        notificationData,
        NotificationPriority.HIGH
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

      return await this.notificationService.sendNotification(
        data.expert_id,
        'expert',
        NotificationType.EXPERT_APPROVED,
        notificationData,
        NotificationPriority.HIGH
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

      return await this.notificationService.sendNotification(
        data.expert_id,
        'expert',
        NotificationType.EXPERT_REJECTED,
        notificationData,
        NotificationPriority.MEDIUM
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

      return await this.notificationService.sendNotification(
        data.expert_id,
        'expert',
        NotificationType.EXPERT_ACCOUNT_CREATED,
        notificationData,
        NotificationPriority.HIGH
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

      return await this.notificationService.sendNotification(
        data.expert_id,
        'expert',
        NotificationType.EXPERT_PROFILE_UPDATED,
        notificationData,
        NotificationPriority.MEDIUM
      );
    } catch (error) {
      console.error('Erreur notification mise à jour profil expert:', error);
      throw error;
    }
  }

  /**
   * Notifier l'expert du changement de statut de son compte
   */
  async notifyExpertStatusChanged(data: ExpertNotificationData): Promise<string> {
    try {
      const notificationData = {
        ...data,
        recipient_name: data.expert_name
      };

      return await this.notificationService.sendNotification(
        data.expert_id,
        'expert',
        NotificationType.EXPERT_STATUS_CHANGED,
        notificationData,
        NotificationPriority.HIGH
      );
    } catch (error) {
      console.error('Erreur notification changement statut expert:', error);
      throw error;
    }
  }

  /**
   * Obtenir l'ID d'un admin pour les notifications
   */
  private async getAdminId(): Promise<string | null> {
    try {
      // Essayer de trouver un admin dans la table Client
      const { data: adminClient } = await supabase
        .from('Client')
        .select('id')
        .eq('type', 'admin')
        .limit(1)
        .single();

      if (adminClient) {
        return adminClient.id;
      }

      // Si pas d'admin dans Client, utiliser un ID par défaut ou email
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const { data: adminByEmail } = await supabase
          .from('Client')
          .select('id')
          .eq('email', adminEmail)
          .single();

        if (adminByEmail) {
          return adminByEmail.id;
        }
      }

      return null;
    } catch (error) {
      console.error('Erreur recherche admin:', error);
      return null;
    }
  }

  /**
   * Générer un mot de passe temporaire sécurisé
   */
  static generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Formater les champs mis à jour pour l'affichage
   */
  static formatUpdatedFields(updatedFields: Record<string, any>): string {
    const fieldLabels: Record<string, string> = {
      name: 'Nom',
      email: 'Email',
      company_name: 'Nom de l\'entreprise',
      siren: 'SIREN',
      phone: 'Téléphone',
      location: 'Localisation',
      experience: 'Expérience',
      specializations: 'Spécialisations',
      languages: 'Langues',
      website: 'Site web',
      linkedin: 'LinkedIn',
      compensation: 'Compensation',
      max_clients: 'Limite de clients',
      hourly_rate: 'Taux horaire',
      availability: 'Disponibilité',
      status: 'Statut',
      approval_status: 'Statut d\'approbation',
      abonnement: 'Abonnement',
      description: 'Description'
    };

    return Object.entries(updatedFields)
      .map(([field, value]) => {
        const label = fieldLabels[field] || field;
        let displayValue = value;
        
        if (Array.isArray(value)) {
          displayValue = value.join(', ');
        } else if (typeof value === 'boolean') {
          displayValue = value ? 'Activé' : 'Désactivé';
        }
        
        return `<li><strong>${label} :</strong> ${displayValue}</li>`;
      })
      .join('');
  }

  /**
   * Obtenir l'impact d'un changement de statut
   */
  static getStatusImpact(oldStatus: string, newStatus: string): string {
    const impacts: Record<string, Record<string, string>> = {
      'active': {
        'inactive': 'Votre compte est maintenant inactif. Vous ne recevrez plus de nouvelles missions.',
        'suspended': 'Votre compte a été suspendu temporairement. Contactez le support pour plus d\'informations.'
      },
      'inactive': {
        'active': 'Votre compte est maintenant actif. Vous pouvez à nouveau recevoir des missions.',
        'suspended': 'Votre compte a été suspendu. Contactez le support pour plus d\'informations.'
      },
      'suspended': {
        'active': 'Votre compte a été réactivé. Vous pouvez à nouveau recevoir des missions.',
        'inactive': 'Votre compte est maintenant inactif. Vous ne recevrez plus de nouvelles missions.'
      }
    };

    return impacts[oldStatus]?.[newStatus] || 'Le statut de votre compte a été modifié.';
  }
} 