import { NotificationService, NotificationType, NotificationPriority, NotificationChannel } from './notification-service';

export enum TICPENotificationType {
  // Étapes du workflow TICPE
  ELIGIBILITY_CONFIRMED = 'ticpe_eligibility_confirmed',
  EXPERT_SELECTED = 'ticpe_expert_selected',
  DOCUMENTS_COLLECTED = 'ticpe_documents_collected',
  AUDIT_STARTED = 'ticpe_audit_started',
  AUDIT_COMPLETED = 'ticpe_audit_completed',
  VALIDATION_REQUESTED = 'ticpe_validation_requested',
  VALIDATION_APPROVED = 'ticpe_validation_approved',
  VALIDATION_REJECTED = 'ticpe_validation_rejected',
  REIMBURSEMENT_REQUESTED = 'ticpe_reimbursement_requested',
  REIMBURSEMENT_APPROVED = 'ticpe_reimbursement_approved',
  
  // Notifications admin
  ADMIN_DOCUMENT_UPLOADED = 'ticpe_admin_document_uploaded',
  ADMIN_VALIDATION_REQUIRED = 'ticpe_admin_validation_required',
  ADMIN_EXPERT_ASSIGNMENT = 'ticpe_admin_expert_assignment',
  
  // Notifications expert
  EXPERT_DOSSIER_ASSIGNED = 'ticpe_expert_dossier_assigned',
  EXPERT_DOCUMENTS_READY = 'ticpe_expert_documents_ready',
  EXPERT_AUDIT_DUE = 'ticpe_expert_audit_due'
}

export interface TICPEWorkflowData {
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

export class TICPENotificationService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
    this.initializeTICPETemplates();
  }

  private initializeTICPETemplates(): void {
    // Templates spécifiques TICPE
    const templates = [
      {
        id: TICPENotificationType.ELIGIBILITY_CONFIRMED,
        type: NotificationType.WORKFLOW_STEP_COMPLETED,
        title: 'Éligibilité TICPE confirmée',
        message: 'Votre éligibilité au remboursement TICPE a été confirmée. Vous pouvez maintenant sélectionner un expert.',
        emailSubject: '✅ Éligibilité TICPE confirmée - Prochaine étape',
        emailBody: `
          <h2>Félicitations ! Votre éligibilité TICPE est confirmée</h2>
          <p>Bonjour {{client_name}},</p>
          <p>Nous avons validé votre éligibilité au remboursement TICPE pour votre entreprise <strong>{{company_name}}</strong>.</p>
          <p><strong>Prochaine étape :</strong> Sélectionnez un expert qui vous accompagnera dans votre démarche.</p>
          <p><strong>Montant estimé :</strong> {{estimated_amount}}€</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📋 Prochaines étapes :</h3>
            <ol>
              <li>✅ Éligibilité confirmée</li>
              <li>👨‍💼 Sélection de l'expert</li>
              <li>📄 Collecte des documents</li>
              <li>🔍 Audit technique</li>
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
        id: TICPENotificationType.EXPERT_SELECTED,
        type: NotificationType.EXPERT_ASSIGNMENT,
        title: 'Expert TICPE sélectionné',
        message: '{{expert_name}} a été sélectionné pour votre dossier TICPE.',
        emailSubject: '👨‍💼 Expert TICPE sélectionné - {{expert_name}}',
        emailBody: `
          <h2>Expert TICPE sélectionné</h2>
          <p>Bonjour {{client_name}},</p>
          <p>Nous avons le plaisir de vous annoncer que <strong>{{expert_name}}</strong> a été sélectionné pour vous accompagner dans votre démarche TICPE.</p>
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>👨‍💼 Votre expert :</h3>
            <p><strong>Nom :</strong> {{expert_name}}</p>
            <p><strong>Email :</strong> {{expert_email}}</p>
            <p><strong>Spécialité :</strong> TICPE et fiscalité transport</p>
          </div>
          <p>Votre expert va maintenant analyser votre dossier et vous contacter pour la collecte des documents nécessaires.</p>
          <p><a href="{{dashboard_url}}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Voir mon dossier</a></p>
        `,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        variables: ['client_name', 'expert_name', 'expert_email', 'dashboard_url']
      },
      {
        id: TICPENotificationType.DOCUMENTS_COLLECTED,
        type: NotificationType.DOCUMENT_UPLOADED,
        title: 'Documents TICPE collectés',
        message: '{{documents_count}} documents ont été collectés pour votre dossier TICPE.',
        emailSubject: '📄 Documents TICPE collectés - Audit en cours',
        emailBody: `
          <h2>Documents TICPE collectés</h2>
          <p>Bonjour {{client_name}},</p>
          <p>Nous avons reçu <strong>{{documents_count}} documents</strong> pour votre dossier TICPE.</p>
          <p>Votre expert va maintenant procéder à l'audit technique de votre dossier.</p>
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>⏱️ Délai d'audit :</h3>
            <p>L'audit technique sera réalisé dans les <strong>5 à 10 jours ouvrables</strong>.</p>
            <p>Vous recevrez une notification dès que l'audit sera terminé.</p>
          </div>
          <p><a href="{{dashboard_url}}" style="background: #ffc107; color: #212529; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Suivre mon dossier</a></p>
        `,
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        variables: ['client_name', 'documents_count', 'dashboard_url']
      },
      {
        id: TICPENotificationType.AUDIT_COMPLETED,
        type: NotificationType.WORKFLOW_STEP_COMPLETED,
        title: 'Audit TICPE terminé',
        message: 'L\'audit technique de votre dossier TICPE est terminé.',
        emailSubject: '✅ Audit TICPE terminé - Validation en cours',
        emailBody: `
          <h2>Audit TICPE terminé</h2>
          <p>Bonjour {{client_name}},</p>
          <p>L'audit technique de votre dossier TICPE pour <strong>{{company_name}}</strong> est maintenant terminé.</p>
          <p>Votre dossier est en cours de validation par notre équipe administrative.</p>
          <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📋 Prochaines étapes :</h3>
            <ol>
              <li>✅ Audit technique terminé</li>
              <li>⏳ Validation administrative (2-3 jours)</li>
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
        id: TICPENotificationType.VALIDATION_APPROVED,
        type: NotificationType.WORKFLOW_COMPLETED,
        title: 'Validation TICPE approuvée',
        message: 'Votre dossier TICPE a été validé. Demande de remboursement en cours.',
        emailSubject: '🎉 Validation TICPE approuvée - Remboursement en cours',
        emailBody: `
          <h2>🎉 Validation TICPE approuvée !</h2>
          <p>Bonjour {{client_name}},</p>
          <p>Excellente nouvelle ! Votre dossier TICPE pour <strong>{{company_name}}</strong> a été validé avec succès.</p>
          <p>Nous avons initié la demande de remboursement auprès des autorités compétentes.</p>
          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>💰 Informations remboursement :</h3>
            <p><strong>Montant estimé :</strong> {{estimated_amount}}€</p>
            <p><strong>Délai de traitement :</strong> 4 à 8 semaines</p>
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

  // Méthodes pour envoyer les notifications TICPE
  async notifyEligibilityConfirmed(data: TICPEWorkflowData): Promise<string> {
    return this.notificationService.sendNotification(
      data.client_id,
      'client',
      TICPENotificationType.ELIGIBILITY_CONFIRMED as any,
      {
        ...data,
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
      },
      NotificationPriority.HIGH
    );
  }

  async notifyExpertSelected(data: TICPEWorkflowData): Promise<string> {
    // Notification au client
    await this.notificationService.sendNotification(
      data.client_id,
      'client',
      TICPENotificationType.EXPERT_SELECTED as any,
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
        TICPENotificationType.EXPERT_DOSSIER_ASSIGNED as any,
        {
          ...data,
          dashboard_url: `${process.env.FRONTEND_URL}/expert/dossier/${data.dossier_id}`
        },
        NotificationPriority.HIGH
      );
    }

    return 'notifications_sent';
  }

  async notifyDocumentsCollected(data: TICPEWorkflowData): Promise<string> {
    return this.notificationService.sendNotification(
      data.client_id,
      'client',
      TICPENotificationType.DOCUMENTS_COLLECTED as any,
      {
        ...data,
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
      },
      NotificationPriority.MEDIUM
    );
  }

  async notifyAuditCompleted(data: TICPEWorkflowData): Promise<string> {
    return this.notificationService.sendNotification(
      data.client_id,
      'client',
      TICPENotificationType.AUDIT_COMPLETED as any,
      {
        ...data,
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
      },
      NotificationPriority.HIGH
    );
  }

  async notifyValidationApproved(data: TICPEWorkflowData): Promise<string> {
    return this.notificationService.sendNotification(
      data.client_id,
      'client',
      TICPENotificationType.VALIDATION_APPROVED as any,
      {
        ...data,
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
      },
      NotificationPriority.URGENT
    );
  }

  // Notifications admin
  async notifyAdminDocumentUploaded(data: TICPEWorkflowData): Promise<string> {
    // Envoyer à tous les admins
    const adminIds = await this.getAdminUserIds();
    
    for (const adminId of adminIds) {
      await this.notificationService.sendNotification(
        adminId,
        'admin',
        TICPENotificationType.ADMIN_DOCUMENT_UPLOADED as any,
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