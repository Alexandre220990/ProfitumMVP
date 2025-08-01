import { NotificationService, NotificationType, NotificationPriority, NotificationChannel } from './notification-service';

export enum URSSAFNotificationType {
  // Étapes du workflow URSSAF
  ELIGIBILITY_CONFIRMED = 'urssaf_eligibility_confirmed',
  EXPERT_SELECTED = 'urssaf_expert_selected',
  DOCUMENTS_COLLECTED = 'urssaf_documents_collected',
  AUDIT_STARTED = 'urssaf_audit_started',
  AUDIT_COMPLETED = 'urssaf_audit_completed',
  VALIDATION_REQUESTED = 'urssaf_validation_requested',
  VALIDATION_APPROVED = 'urssaf_validation_approved',
  VALIDATION_REJECTED = 'urssaf_validation_rejected',
  REIMBURSEMENT_REQUESTED = 'urssaf_reimbursement_requested',
  REIMBURSEMENT_APPROVED = 'urssaf_reimbursement_approved',
  
  // Notifications admin
  ADMIN_DOCUMENT_UPLOADED = 'urssaf_admin_document_uploaded',
  ADMIN_VALIDATION_REQUIRED = 'urssaf_admin_validation_required',
  ADMIN_EXPERT_ASSIGNMENT = 'urssaf_admin_expert_assignment',
  
  // Notifications expert
  EXPERT_DOSSIER_ASSIGNED = 'urssaf_expert_dossier_assigned',
  EXPERT_DOCUMENTS_READY = 'urssaf_expert_documents_ready',
  EXPERT_AUDIT_DUE = 'urssaf_expert_audit_due'
}

export interface URSSAFWorkflowData {
  dossier_id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  company_name: string;
  expert_id?: string;
  expert_name?: string;
  expert_email?: string;
  estimated_amount?: number;
  step_name: string;
  step_description: string;
  documents_count?: number;
  validation_deadline?: string;
  audit_date?: string;
}

export class URSSAFNotificationService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
    this.initializeURSSAFTemplates();
  }

  private initializeURSSAFTemplates(): void {
    // Templates spécifiques URSSAF
    const templates = [
      {
        id: URSSAFNotificationType.ELIGIBILITY_CONFIRMED,
        type: NotificationType.WORKFLOW_STEP_COMPLETED,
        title: 'Éligibilité URSSAF confirmée',
        message: 'Votre éligibilité au remboursement URSSAF a été confirmée. Vous pouvez maintenant sélectionner un expert.',
        emailSubject: '✅ Éligibilité URSSAF confirmée - Prochaine étape',
        emailBody: `
          <h2>Félicitations ! Votre éligibilité URSSAF est confirmée</h2>
          <p>Bonjour {{client_name}},</p>
          <p>Nous avons validé votre éligibilité au remboursement URSSAF pour votre entreprise <strong>{{company_name}}</strong>.</p>
          <p><strong>Prochaine étape :</strong> Sélectionnez un expert qui vous accompagnera dans votre démarche.</p>
          <p><strong>Montant estimé :</strong> {{estimated_amount}}€</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📋 Prochaines étapes :</h3>
            <ol>
              <li>✅ Éligibilité confirmée</li>
              <li>👨‍💼 Sélection de l'expert</li>
              <li>📄 Collecte des documents</li>
              <li>🔍 Audit comptable</li>
              <li>✅ Validation finale</li>
              <li>💰 Demande de remboursement</li>
            </ol>
          </div>
          <p><a href="{{dashboard_url}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Accéder à mon dossier</a></p>
        `,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        variables: ['client_name', 'company_name', 'estimated_amount', 'dashboard_url']
      },
      {
        id: URSSAFNotificationType.EXPERT_SELECTED,
        type: NotificationType.EXPERT_ASSIGNMENT,
        title: 'Expert URSSAF sélectionné',
        message: '{{expert_name}} a été sélectionné pour votre dossier URSSAF.',
        emailSubject: '👨‍💼 Expert URSSAF sélectionné - {{expert_name}}',
        emailBody: `
          <h2>Expert URSSAF sélectionné</h2>
          <p>Bonjour {{client_name}},</p>
          <p>Nous avons le plaisir de vous annoncer que <strong>{{expert_name}}</strong> a été sélectionné pour vous accompagner dans votre démarche URSSAF.</p>
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>👨‍💼 Votre expert :</h3>
            <p><strong>Nom :</strong> {{expert_name}}</p>
            <p><strong>Email :</strong> {{expert_email}}</p>
            <p><strong>Spécialité :</strong> Droit social et URSSAF</p>
          </div>
          <p>Votre expert va maintenant analyser votre dossier et vous contacter pour la collecte des documents nécessaires.</p>
          <p><a href="{{dashboard_url}}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Voir mon dossier</a></p>
        `,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        variables: ['client_name', 'expert_name', 'expert_email', 'dashboard_url']
      },
      {
        id: URSSAFNotificationType.DOCUMENTS_COLLECTED,
        type: NotificationType.DOCUMENT_UPLOADED,
        title: 'Documents URSSAF collectés',
        message: '{{documents_count}} documents ont été collectés pour votre dossier URSSAF.',
        emailSubject: '📄 Documents URSSAF collectés - Audit en cours',
        emailBody: `
          <h2>Documents URSSAF collectés</h2>
          <p>Bonjour {{client_name}},</p>
          <p>Nous avons reçu <strong>{{documents_count}} documents</strong> pour votre dossier URSSAF.</p>
          <p>Votre expert va maintenant procéder à l'audit comptable de votre dossier.</p>
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>⏱️ Délai d'audit :</h3>
            <p>L'audit comptable sera réalisé dans les <strong>3 à 7 jours ouvrables</strong>.</p>
            <p>Vous recevrez une notification dès que l'audit sera terminé.</p>
          </div>
          <p><a href="{{dashboard_url}}" style="background: #ffc107; color: #212529; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Suivre mon dossier</a></p>
        `,
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        variables: ['client_name', 'documents_count', 'dashboard_url']
      },
      {
        id: URSSAFNotificationType.AUDIT_COMPLETED,
        type: NotificationType.WORKFLOW_STEP_COMPLETED,
        title: 'Audit URSSAF terminé',
        message: 'L\'audit comptable de votre dossier URSSAF est terminé.',
        emailSubject: '✅ Audit URSSAF terminé - Validation en cours',
        emailBody: `
          <h2>Audit URSSAF terminé</h2>
          <p>Bonjour {{client_name}},</p>
          <p>L'audit comptable de votre dossier URSSAF pour <strong>{{company_name}}</strong> est maintenant terminé.</p>
          <p>Votre dossier est en cours de validation par notre équipe administrative.</p>
          <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📋 Prochaines étapes :</h3>
            <ol>
              <li>✅ Audit comptable terminé</li>
              <li>⏳ Validation administrative (1-2 jours)</li>
              <li>✅ Validation finale</li>
              <li>💰 Demande de remboursement</li>
            </ol>
          </div>
          <p><a href="{{dashboard_url}}" style="background: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Voir le rapport d'audit</a></p>
        `,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        variables: ['client_name', 'company_name', 'dashboard_url']
      },
      {
        id: URSSAFNotificationType.VALIDATION_APPROVED,
        type: NotificationType.WORKFLOW_COMPLETED,
        title: 'Validation URSSAF approuvée',
        message: 'Votre dossier URSSAF a été validé. Demande de remboursement en cours.',
        emailSubject: '🎉 Validation URSSAF approuvée - Remboursement en cours',
        emailBody: `
          <h2>🎉 Validation URSSAF approuvée !</h2>
          <p>Bonjour {{client_name}},</p>
          <p>Excellente nouvelle ! Votre dossier URSSAF pour <strong>{{company_name}}</strong> a été validé avec succès.</p>
          <p>Nous avons initié la demande de remboursement auprès de l'URSSAF.</p>
          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>💰 Informations remboursement :</h3>
            <p><strong>Montant estimé :</strong> {{estimated_amount}}€</p>
            <p><strong>Délai de traitement :</strong> 2 à 4 semaines</p>
            <p><strong>Mode de versement :</strong> Virement bancaire</p>
          </div>
          <p>Vous recevrez une notification dès que le remboursement sera effectué.</p>
          <p><a href="{{dashboard_url}}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Voir mon dossier</a></p>
        `,
        priority: NotificationPriority.URGENT,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        variables: ['client_name', 'company_name', 'estimated_amount', 'dashboard_url']
      }
    ];

    // Ajouter les templates au service de notification
    templates.forEach(template => {
      this.notificationService.addTemplate(template);
    });
  }

  // Méthodes pour envoyer les notifications URSSAF
  async notifyEligibilityConfirmed(data: URSSAFWorkflowData): Promise<string> {
    return this.notificationService.sendNotification(
      data.client_id,
      'client',
      URSSAFNotificationType.ELIGIBILITY_CONFIRMED as any,
      {
        ...data,
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
      },
      NotificationPriority.HIGH
    );
  }

  async notifyExpertSelected(data: URSSAFWorkflowData): Promise<string> {
    // Notification au client
    await this.notificationService.sendNotification(
      data.client_id,
      'client',
      URSSAFNotificationType.EXPERT_SELECTED as any,
      {
        ...data,
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
      },
      NotificationPriority.HIGH
    );

    // Notification à l'expert
    if (data.expert_id) {
      await this.notificationService.sendNotification(
        data.expert_id,
        'expert',
        URSSAFNotificationType.EXPERT_DOSSIER_ASSIGNED as any,
        {
          ...data,
          dashboard_url: `${process.env.FRONTEND_URL}/expert/dossier/${data.dossier_id}`
        },
        NotificationPriority.HIGH
      );
    }

    return 'notifications_sent';
  }

  async notifyDocumentsCollected(data: URSSAFWorkflowData): Promise<string> {
    return this.notificationService.sendNotification(
      data.client_id,
      'client',
      URSSAFNotificationType.DOCUMENTS_COLLECTED as any,
      {
        ...data,
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
      },
      NotificationPriority.MEDIUM
    );
  }

  async notifyAuditCompleted(data: URSSAFWorkflowData): Promise<string> {
    return this.notificationService.sendNotification(
      data.client_id,
      'client',
      URSSAFNotificationType.AUDIT_COMPLETED as any,
      {
        ...data,
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
      },
      NotificationPriority.HIGH
    );
  }

  async notifyValidationApproved(data: URSSAFWorkflowData): Promise<string> {
    return this.notificationService.sendNotification(
      data.client_id,
      'client',
      URSSAFNotificationType.VALIDATION_APPROVED as any,
      {
        ...data,
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
      },
      NotificationPriority.URGENT
    );
  }

  // Notifications admin
  async notifyAdminDocumentUploaded(data: URSSAFWorkflowData): Promise<string> {
    // Envoyer à tous les admins
    const adminIds = await this.getAdminUserIds();
    
    for (const adminId of adminIds) {
      await this.notificationService.sendNotification(
        adminId,
        'admin',
        URSSAFNotificationType.ADMIN_DOCUMENT_UPLOADED as any,
        {
          ...data,
          dashboard_url: `${process.env.FRONTEND_URL}/admin/documents/validate`
        },
        NotificationPriority.MEDIUM
      );
    }

    return 'admin_notifications_sent';
  }

  // Méthode utilitaire pour récupérer les IDs des admins
  private async getAdminUserIds(): Promise<string[]> {
    // Implémentation pour récupérer les IDs des utilisateurs admin
    // À adapter selon votre structure de base de données
    return ['admin-1', 'admin-2']; // Placeholder
  }
} 