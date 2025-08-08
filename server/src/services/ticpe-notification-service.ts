import { NotificationService } from './NotificationService';

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
  constructor() {
    // Initialisation simplifiée
  }

  // Méthodes pour envoyer les notifications TICPE
  async notifyEligibilityConfirmed(data: TICPEWorkflowData): Promise<string> {
    return NotificationService.sendSystemNotification(
      data.client_id,
      'Éligibilité TICPE confirmée',
      `Votre éligibilité au remboursement TICPE a été confirmée. Montant estimé : ${data.estimated_amount}€`,
      {
        ...data,
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
      }
    );
  }

  async notifyExpertSelected(data: TICPEWorkflowData): Promise<string> {
    // Notification au client
    await NotificationService.sendSystemNotification(
      data.client_id,
      'Expert TICPE sélectionné',
      `${data.expert_name} a été sélectionné pour votre dossier TICPE.`,
      {
        ...data,
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
      }
    );

    // Notification à l'expert
    if (data.expert_id) {
      await NotificationService.sendSystemNotification(
        data.expert_id,
        'Nouveau dossier TICPE assigné',
        `Vous avez été assigné au dossier TICPE de ${data.client_name} (${data.company_name}).`,
        {
          ...data,
          dashboard_url: `${process.env.FRONTEND_URL}/expert/dossier/${data.dossier_id}`
        }
      );
    }

    return 'notifications_sent';
  }

  async notifyDocumentsCollected(data: TICPEWorkflowData): Promise<string> {
    return NotificationService.sendSystemNotification(
      data.client_id,
      'Documents TICPE collectés',
      `${data.documents_count} documents ont été collectés pour votre dossier TICPE.`,
      {
        ...data,
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
      }
    );
  }

  async notifyAuditCompleted(data: TICPEWorkflowData): Promise<string> {
    return NotificationService.sendSystemNotification(
      data.client_id,
      'Audit TICPE terminé',
      'L\'audit comptable de votre dossier TICPE est terminé.',
      {
        ...data,
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
      }
    );
  }

  async notifyValidationApproved(data: TICPEWorkflowData): Promise<string> {
    return NotificationService.sendSystemNotification(
      data.client_id,
      'Validation TICPE approuvée',
      'Votre dossier TICPE a été validé avec succès.',
      {
        ...data,
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
      }
    );
  }

  // Notifications admin
  async notifyAdminDocumentUploaded(data: TICPEWorkflowData): Promise<string> {
    // Envoyer à tous les admins
    const adminIds = await this.getAdminUserIds();
    
    for (const adminId of adminIds) {
      await NotificationService.sendSystemNotification(
        adminId,
        'Document TICPE uploadé',
        `Nouveau document uploadé pour le dossier TICPE de ${data.client_name}.`,
        {
          ...data,
          dashboard_url: `${process.env.FRONTEND_URL}/admin/documents/validate`
        }
      );
    }

    return 'admin_notifications_sent';
  }

  private async getAdminUserIds(): Promise<string[]> {
    // TODO: Implémenter la récupération des IDs admin
    return [];
  }
}
