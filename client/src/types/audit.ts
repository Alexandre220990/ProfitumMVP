// Types d'audit valides
export type AuditType = "TICPE" | "Foncier" | "MSA" | "DFS" | "CIR";

// Statuts d'audit valides
export type AuditStatus = "non_démarré" | "en_cours" | "terminé";

export interface Audit { id: string;
  client_id: string;
  expert_id: string | null;
  audit_type: string;
  status: string;
  current_step: number;
  total_steps?: number; // Nombre total d'étapes du ProductProcessWorkflow
  step_display?: string; // Affichage formaté "X/Y"
  potential_gain: number;
  obtained_gain: number;
  reliability: number;
  progress: number;
  description: string;
  is_eligible_product: boolean;
  charter_signed: boolean;
  created_at: string;
  updated_at: string;
  tauxFinal?: number;
  dureeFinale?: number;
  appointment_datetime?: string;
  expert?: {
    name: string;
    company: string; };
} 