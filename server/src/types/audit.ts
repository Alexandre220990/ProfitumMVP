export type AuditType = string;

export type AuditStatus = 
  | 'non_démarré'
  | 'en_cours'
  | 'terminé'
  | 'annulé';

export interface Audit {
  id: string;
  client_id: string;
  expert_id: string | null;
  audit_type: AuditType;
  status: AuditStatus;
  current_step: number;
  progress: number;
  potential_gain: number;
  obtained_gain: number;
  reliability: number;
  charter_signed: boolean;
  created_at: string;
  updated_at: string;
  description: string;
  is_eligible_product: boolean;
  taux_final: number;
  duree_finale: number;
} 