import { NotificationService } from './NotificationService';

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
  constructor() {
    // Initialisation simplifiée
  }

  // Méthodes pour envoyer les notifications URSSAF
  async notifyEligibilityConfirmed(data: URSSAFWorkflowData): Promise<string> {
    return NotificationService.sendSystemNotification({
      user_id: data.client_id,
      title: 'Éligibilité URSSAF confirmée',
      message: `Votre éligibilité au remboursement URSSAF a été confirmée. Montant estimé : ${data.estimated_amount}€`,
      type: 'system',
      ...data,
      dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
    });
  }

  async notifyExpertSelected(data: URSSAFWorkflowData): Promise<string> {
    // Notification au client
    await NotificationService.sendSystemNotification({
      user_id: data.client_id,
      title: 'Expert URSSAF sélectionné',
      message: `${data.expert_name} a été sélectionné pour votre dossier URSSAF.`,
      type: 'system',
      ...data,
      dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
    });

    // Notification à l'expert
    if (data.expert_id) {
      await NotificationService.sendSystemNotification({
        user_id: data.expert_id,
        title: 'Nouveau dossier URSSAF assigné',
        message: `Vous avez été assigné au dossier URSSAF de ${data.client_name} (${data.company_name}).`,
        type: 'system',
        ...data,
        dashboard_url: `${process.env.FRONTEND_URL}/expert/dossier/${data.dossier_id}`
      });
    }

    return 'notifications_sent';
  }

  async notifyDocumentsCollected(data: URSSAFWorkflowData): Promise<string> {
    return NotificationService.sendSystemNotification({
      user_id: data.client_id,
      title: 'Documents URSSAF collectés',
      message: `${data.documents_count} documents ont été collectés pour votre dossier URSSAF.`,
      type: 'system',
      ...data,
      dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
    });
  }

  async notifyAuditCompleted(data: URSSAFWorkflowData): Promise<string> {
    return NotificationService.sendSystemNotification({
      user_id: data.client_id,
      title: 'Audit URSSAF terminé',
      message: 'L\'audit comptable de votre dossier URSSAF est terminé.',
      type: 'system',
      ...data,
      dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
    });
  }

  async notifyValidationApproved(data: URSSAFWorkflowData): Promise<string> {
    return NotificationService.sendSystemNotification({
      user_id: data.client_id,
      title: 'Validation URSSAF approuvée',
      message: 'Votre dossier URSSAF a été validé avec succès.',
      type: 'system',
      ...data,
      dashboard_url: `${process.env.FRONTEND_URL}/dashboard/client-audit/${data.dossier_id}`
    });
  }

  // Notifications admin
  async notifyAdminDocumentUploaded(data: URSSAFWorkflowData): Promise<string> {
    // Envoyer à tous les admins
    const adminIds = await this.getAdminUserIds();
    
    for (const adminId of adminIds) {
      await NotificationService.sendSystemNotification({
        user_id: adminId,
        title: 'Document URSSAF uploadé',
        message: `Nouveau document uploadé pour le dossier URSSAF de ${data.client_name}.`,
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
