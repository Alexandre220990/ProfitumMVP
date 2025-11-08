export type DossierStatus =
  | 'pending_upload'
  | 'pending_admin_validation'
  | 'admin_validated'
  | 'admin_rejected'
  | 'expert_assigned'
  | 'expert_pending_validation'
  | 'expert_validated'
  | 'charte_pending'
  | 'charte_signed'
  | 'documents_requested'
  | 'complementary_documents_upload_pending'
  | 'complementary_documents_sent'
  | 'complementary_documents_validated'
  | 'complementary_documents_refused'
  | 'audit_in_progress'
  | 'audit_completed'
  | 'validation_pending'
  | 'validated'
  | 'implementation_in_progress'
  | 'implementation_validated'
  | 'payment_requested'
  | 'payment_in_progress'
  | 'refund_completed';

export const LEGACY_STATUS_MAP: Record<string, DossierStatus> = {
  pending: 'pending_upload',
  eligible: 'pending_upload',
  opportunité: 'pending_upload',
  documents_uploaded: 'pending_admin_validation',
  eligible_confirmed: 'pending_admin_validation',
  eligibility_validated: 'admin_validated',
  eligibility_rejected: 'admin_rejected',
  non_eligible: 'admin_rejected',
  expert_pending_acceptance: 'expert_pending_validation',
  en_cours: 'audit_in_progress',
  documents_manquants: 'documents_requested',
  documents_complementaires_requis: 'complementary_documents_upload_pending',
  documents_complementaires_soumis: 'complementary_documents_sent',
  documents_complementaires_valides: 'complementary_documents_validated',
  documents_complementaires_refuses: 'complementary_documents_refused',
  soumis_administration: 'implementation_in_progress',
  resultat_obtenu: 'implementation_validated',
  refund_in_progress: 'payment_in_progress',
  termine: 'refund_completed',
  terminee: 'refund_completed'
};

export function normalizeDossierStatus(status: string | null | undefined): DossierStatus {
  if (!status) {
    return 'pending_upload';
  }

  if (status in LEGACY_STATUS_MAP) {
    return LEGACY_STATUS_MAP[status];
  }

  return status as DossierStatus;
}

export function mapToLegacyStatus(status: DossierStatus): string {
  switch (status) {
    case 'pending_upload':
      return 'pending_upload';
    case 'pending_admin_validation':
      return 'pending_admin_validation';
    case 'admin_validated':
      return 'admin_validated';
    case 'admin_rejected':
      return 'admin_rejected';
    case 'expert_assigned':
      return 'expert_assigned';
    case 'expert_pending_validation':
      return 'expert_pending_validation';
    case 'expert_validated':
      return 'expert_validated';
    case 'charte_pending':
      return 'charte_pending';
    case 'charte_signed':
      return 'charte_signed';
    case 'documents_requested':
      return 'documents_requested';
    case 'complementary_documents_upload_pending':
      return 'complementary_documents_upload_pending';
    case 'complementary_documents_sent':
      return 'complementary_documents_sent';
    case 'complementary_documents_validated':
      return 'complementary_documents_validated';
    case 'complementary_documents_refused':
      return 'complementary_documents_refused';
    case 'audit_in_progress':
      return 'audit_in_progress';
    case 'audit_completed':
      return 'audit_completed';
    case 'validation_pending':
      return 'validation_pending';
    case 'validated':
      return 'validated';
    case 'implementation_in_progress':
      return 'implementation_in_progress';
    case 'implementation_validated':
      return 'implementation_validated';
    case 'payment_requested':
      return 'payment_requested';
    case 'payment_in_progress':
      return 'payment_in_progress';
    case 'refund_completed':
      return 'refund_completed';
    default:
      return status;
  }
}

export function isLegacyStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return status in LEGACY_STATUS_MAP;
}
