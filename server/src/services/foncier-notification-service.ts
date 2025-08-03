import { NotificationService, NotificationType, NotificationPriority, NotificationChannel } from './notification-service';

export enum FONCIERNotificationType {
  // Étapes du workflow FONCIER
  ELIGIBILITY_CONFIRMED = 'foncier_eligibility_confirmed',
  EXPERT_SELECTED = 'foncier_expert_selected',
  DOCUMENTS_COLLECTED = 'foncier_documents_collected',
  AUDIT_STARTED = 'foncier_audit_started',
  AUDIT_COMPLETED = 'foncier_audit_completed',
  VALIDATION_REQUESTED = 'foncier_validation_requested',
  VALIDATION_APPROVED = 'foncier_validation_approved',
  VALIDATION_REJECTED = 'foncier_validation_rejected',
  REIMBURSEMENT_REQUESTED = 'foncier_reimbursement_requested',
  REIMBURSEMENT_APPROVED = 'foncier_reimbursement_approved',
  
  // Notifications admin
  ADMIN_DOCUMENT_UPLOADED = 'foncier_admin_document_uploaded',
  ADMIN_VALIDATION_REQUIRED = 'foncier_admin_validation_required',
  ADMIN_EXPERT_ASSIGNMENT = 'foncier_admin_expert_assignment',
  
  // Notifications expert
  EXPERT_DOSSIER_ASSIGNED = 'foncier_expert_dossier_assigned',
  EXPERT_DOCUMENTS_READY = 'foncier_expert_documents_ready',
  EXPERT_AUDIT_DUE = 'foncier_expert_audit_due'
}

export interface FONCIERWorkflowData {
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
  property_address?: string;
  property_type?: string;
}

export class FONCIERNotificationService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
    this.initializeFONCIERTemplates();
  }

  private initializeFONCIERTemplates(): void {
    // Les templates sont gérés par le service de notification principal
    // Nous utilisons les types de notification existants avec des données spécialisées
    console.log('Service de notification FONCIER initialisé');
  }

  // Méthodes pour envoyer les notifications FONCIER
  async notifyEligibilityConfirmed(data: FONCIERWorkflowData): Promise<string> {
    return this.notificationService.sendNotification(
      data.client_id,
      'client',
      NotificationType.EXPERT_WORKFLOW_STEP_COMPLETED,
      {
        ...data,
        product_type: 'FONCIER',
        step_name: 'Éligibilité confirmée',
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
      },
      NotificationPriority.HIGH
    );
  }

  async notifyExpertSelected(data: FONCIERWorkflowData): Promise<string> {
    // Notification au client
    await this.notificationService.sendNotification(
      data.client_id,
      'client',
      NotificationType.EXPERT_NEW_ASSIGNMENT,
      {
        ...data,
        product_type: 'FONCIER',
        step_name: 'Expert sélectionné',
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
      },
      NotificationPriority.HIGH
    );

    // Notification à l'expert
    if (data.expert_id) {
      await this.notificationService.sendNotification(
        data.expert_id,
        'expert',
        NotificationType.EXPERT_NEW_ASSIGNMENT,
        {
          ...data,
          product_type: 'FONCIER',
          step_name: 'Nouveau dossier assigné',
          dashboard_url: `${process.env.FRONTEND_URL}/expert/dossier/${data.dossier_id}`
        },
        NotificationPriority.HIGH
      );
    }

    return 'notifications_sent';
  }

  async notifyDocumentsCollected(data: FONCIERWorkflowData): Promise<string> {
    return this.notificationService.sendNotification(
      data.client_id,
      'client',
      NotificationType.CLIENT_DOCUMENT_UPLOADED,
      {
        ...data,
        product_type: 'FONCIER',
        step_name: 'Documents collectés',
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
      },
      NotificationPriority.MEDIUM
    );
  }

  async notifyAuditCompleted(data: FONCIERWorkflowData): Promise<string> {
    return this.notificationService.sendNotification(
      data.client_id,
      'client',
      NotificationType.EXPERT_WORKFLOW_STEP_COMPLETED,
      {
        ...data,
        product_type: 'FONCIER',
        step_name: 'Audit immobilier terminé',
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
      },
      NotificationPriority.HIGH
    );
  }

  async notifyValidationApproved(data: FONCIERWorkflowData): Promise<string> {
    return this.notificationService.sendNotification(
      data.client_id,
      'client',
      NotificationType.CLIENT_WORKFLOW_COMPLETED,
      {
        ...data,
        product_type: 'FONCIER',
        step_name: 'Validation approuvée',
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
      },
      NotificationPriority.URGENT
    );
  }

  // Notifications admin
  async notifyAdminDocumentUploaded(data: FONCIERWorkflowData): Promise<string> {
    // Envoyer à tous les admins
    const adminIds = await this.getAdminUserIds();
    
    for (const adminId of adminIds) {
      await this.notificationService.sendNotification(
        adminId,
        'admin',
        NotificationType.CLIENT_DOCUMENT_UPLOADED,
        {
          ...data,
          product_type: 'FONCIER',
          step_name: 'Document uploadé',
          dashboard_url: `${process.env.FRONTEND_URL}/admin/documents/validate`
        },
        NotificationPriority.MEDIUM
      );
    }

    return 'admin_notifications_sent';
  }

  // Notifications spécialisées FONCIER
  async notifyPropertyInspectionScheduled(data: FONCIERWorkflowData & { inspection_date: string; inspector_name: string }): Promise<string> {
    return this.notificationService.sendNotification(
      data.client_id,
      'client',
      NotificationType.EXPERT_WORKFLOW_STEP_COMPLETED,
      {
        ...data,
        product_type: 'FONCIER',
        step_name: 'Inspection programmée',
        inspection_date: data.inspection_date,
        inspector_name: data.inspector_name,
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
      },
      NotificationPriority.HIGH
    );
  }

  async notifyTaxCalculationCompleted(data: FONCIERWorkflowData & { tax_benefit: number; eligible_expenses: number }): Promise<string> {
    return this.notificationService.sendNotification(
      data.client_id,
      'client',
      NotificationType.EXPERT_WORKFLOW_STEP_COMPLETED,
      {
        ...data,
        product_type: 'FONCIER',
        step_name: 'Calcul fiscal terminé',
        tax_benefit: data.tax_benefit,
        eligible_expenses: data.eligible_expenses,
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
      },
      NotificationPriority.HIGH
    );
  }

  // Méthode utilitaire pour récupérer les IDs des admins
  private async getAdminUserIds(): Promise<string[]> {
    // Implémentation pour récupérer les IDs des utilisateurs admin
    // À adapter selon votre structure de base de données
    return ['admin-1', 'admin-2']; // Placeholder
  }
} 