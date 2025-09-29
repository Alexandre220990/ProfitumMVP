import { NotificationService } from './NotificationService';

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
}

export class FONCIERNotificationService {
  constructor() {
    // Initialisation simplifiée
  }

  // Méthodes pour envoyer les notifications FONCIER
  async notifyEligibilityConfirmed(data: FONCIERWorkflowData): Promise<string> {
    return NotificationService.sendSystemNotification({
      user_id: data.client_id,
      title: 'Éligibilité FONCIER confirmée',
      message: `Votre éligibilité au remboursement FONCIER a été confirmée. Montant estimé : ${data.estimated_amount}€`,
      type: 'system',
      ...data,
      dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
    });
  }

  async notifyExpertSelected(data: FONCIERWorkflowData): Promise<string> {
    // Notification au client
    await NotificationService.sendSystemNotification({
      user_id: data.client_id,
      title: 'Expert FONCIER sélectionné',
      message: `${data.expert_name} a été sélectionné pour votre dossier FONCIER.`,
      type: 'system',
      ...data,
      dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
    });

    // Notification à l'expert
    if (data.expert_id) {
      await NotificationService.sendSystemNotification({
        user_id: data.expert_id,
        title: 'Nouveau dossier FONCIER assigné',
        message: `Vous avez été assigné au dossier FONCIER de ${data.client_name} (${data.company_name}).`,
        type: 'system',
        ...data,
        dashboard_url: `${process.env.FRONTEND_URL}/expert/dossier/${data.dossier_id}`
      });
    }

    return 'notifications_sent';
  }

  async notifyDocumentsCollected(data: FONCIERWorkflowData): Promise<string> {
    return NotificationService.sendSystemNotification({
      user_id: data.client_id,
      title: 'Documents FONCIER collectés',
      message: `${data.documents_count} documents ont été collectés pour votre dossier FONCIER.`,
      type: 'system',
      ...data,
      dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
    });
  }

  async notifyAuditCompleted(data: FONCIERWorkflowData): Promise<string> {
    return NotificationService.sendSystemNotification({
      user_id: data.client_id,
      title: 'Audit FONCIER terminé',
      message: 'L\'audit comptable de votre dossier FONCIER est terminé.',
      type: 'system',
      ...data,
      dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
    });
  }

  async notifyValidationApproved(data: FONCIERWorkflowData): Promise<string> {
    return NotificationService.sendSystemNotification({
      user_id: data.client_id,
      title: 'Validation FONCIER approuvée',
      message: 'Votre dossier FONCIER a été validé avec succès.',
      type: 'system',
      ...data,
      dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
    });
  }

  // Notifications admin
  async notifyAdminDocumentUploaded(data: FONCIERWorkflowData): Promise<string> {
    // Envoyer à tous les admins
    const adminIds = await this.getAdminUserIds();
    
    for (const adminId of adminIds) {
      await NotificationService.sendSystemNotification({
        user_id: adminId,
        title: 'Document FONCIER uploadé',
        message: `Nouveau document uploadé pour le dossier FONCIER de ${data.client_name}.`,
        type: 'system',
        ...data,
        dashboard_url: `${process.env.FRONTEND_URL}/admin/documents/validate`
      });
    }

    return 'admin_notifications_sent';
  }

  private async getAdminUserIds(): Promise<string[]> {
    // TODO: Implémenter la récupération des IDs admin
    return [];
  }
}
