export interface ValidationState {
  id?: string; // UUID - à ajouter
  simulation_id: string; // text - pourrait être UUID
  client_id: string; // text - pourrait être UUID
  phase: string;
  profile_data?: any; // jsonb
  products?: any; // jsonb
  current_product_index?: number;
  conversation_history?: any; // jsonb
  last_interaction?: string; // timestamptz
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

export interface WorkflowInstance {
  id: string; // uuid
  template_id: string; // uuid
  document_id?: string; // uuid
  client_id: string; // uuid
  expert_id?: string; // uuid
  status: string; // varchar
  current_step: number;
  started_at: string; // timestamptz
  completed_at?: string; // timestamptz
  sla_deadline?: string; // timestamptz
  metadata?: any; // jsonb
  created_at: string; // timestamptz
}

export interface WorkflowTemplate {
  id: string; // uuid
  name: string; // varchar
  description?: string; // text
  document_category?: string; // varchar
  document_type?: string; // varchar
  version: string; // varchar
  is_active: boolean;
  estimated_total_duration?: number;
  sla_hours?: number;
  auto_start: boolean;
  requires_expert: boolean;
  requires_signature: boolean;
  compliance_requirements?: string[]; // _text array
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

// Types pour les relations
export interface WorkflowInstanceWithRelations extends WorkflowInstance {
  template?: WorkflowTemplate;
  document?: any; // GEDDocument
  client?: any; // Client
  expert?: any; // Expert
}

export interface WorkflowTemplateWithInstances extends WorkflowTemplate {
  instances?: WorkflowInstance[];
}

// Types pour les statistiques
export interface WorkflowStats {
  total_instances: number;
  active_instances: number;
  completed_instances: number;
  instances_by_status: { [key: string]: number };
  average_duration: number;
  sla_compliance_rate: number;
} 