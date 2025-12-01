// Types pour le système de prospection automatisé

export type ProspectSource = 'google_maps' | 'import_csv' | 'linkedin' | 'manuel';
export type EmailValidity = 'valid' | 'risky' | 'invalid';
export type EnrichmentStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type AIStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type EmailingStatus = 'pending' | 'queued' | 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'unsubscribed';
export type EmailProvider = 'instantly' | 'lemlist' | 'manual';

export interface Prospect {
  id: string;
  email: string;
  email_validity: EmailValidity | null;
  source: ProspectSource;
  created_at: string;
  updated_at: string;
  
  // Informations contact (Dropcontact)
  firstname: string | null;
  lastname: string | null;
  job_title: string | null;
  linkedin_profile: string | null;
  phone_direct: string | null;
  
  // Informations entreprise (Dropcontact + Pappers)
  company_name: string | null;
  company_website: string | null;
  siren: string | null;
  adresse: string | null;
  city: string | null;
  postal_code: string | null;
  naf_code: string | null;
  naf_label: string | null;
  employee_range: string | null;
  phone_standard: string | null;
  linkedin_company: string | null;
  
  // Métadonnées
  enrichment_status: EnrichmentStatus;
  ai_status: AIStatus;
  emailing_status: EmailingStatus;
  score_priority: number;
  
  // Champs IA
  ai_summary: string | null;
  ai_trigger_points: string | null;
  ai_product_match: Record<string, any> | null;
  ai_email_personalized: string | null;
  
  // Métadonnées supplémentaires
  metadata: Record<string, any> | null;
}

export interface ProspectEmail {
  id: string;
  prospect_id: string;
  step: number;
  subject: string;
  body: string;
  sent_at: string | null;
  opened: boolean;
  opened_at: string | null;
  clicked: boolean;
  clicked_at: string | null;
  replied: boolean;
  replied_at: string | null;
  bounced: boolean;
  bounced_at: string | null;
  unsubscribed: boolean;
  unsubscribed_at: string | null;
  email_provider: EmailProvider | null;
  provider_email_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProspectInput {
  email: string;
  source: ProspectSource;
  email_validity?: EmailValidity;
  firstname?: string;
  lastname?: string;
  company_name?: string;
  siren?: string;
  metadata?: Record<string, any>;
}

export interface UpdateProspectInput {
  email?: string;
  email_validity?: EmailValidity;
  firstname?: string;
  lastname?: string;
  job_title?: string;
  linkedin_profile?: string;
  phone_direct?: string;
  company_name?: string;
  company_website?: string;
  siren?: string;
  adresse?: string;
  city?: string;
  postal_code?: string;
  naf_code?: string;
  naf_label?: string;
  employee_range?: string;
  phone_standard?: string;
  linkedin_company?: string;
  enrichment_status?: EnrichmentStatus;
  ai_status?: AIStatus;
  emailing_status?: EmailingStatus;
  score_priority?: number;
  ai_summary?: string;
  ai_trigger_points?: string;
  ai_product_match?: Record<string, any>;
  ai_email_personalized?: string;
  metadata?: Record<string, any>;
}

export interface CreateProspectEmailInput {
  prospect_id: string;
  step: number;
  subject: string;
  body: string;
  email_provider?: EmailProvider;
  provider_email_id?: string;
  metadata?: Record<string, any>;
}

export interface UpdateProspectEmailInput {
  sent_at?: string;
  opened?: boolean;
  opened_at?: string;
  clicked?: boolean;
  clicked_at?: string;
  replied?: boolean;
  replied_at?: string;
  bounced?: boolean;
  bounced_at?: string;
  unsubscribed?: boolean;
  unsubscribed_at?: string;
  metadata?: Record<string, any>;
}

export interface ProspectFilters {
  page?: number;
  limit?: number;
  source?: ProspectSource;
  email_validity?: EmailValidity;
  enrichment_status?: EnrichmentStatus;
  ai_status?: AIStatus;
  emailing_status?: EmailingStatus;
  search?: string; // Recherche sur email, nom, company_name
  min_score_priority?: number;
  has_siren?: boolean;
  has_sequences?: boolean; // true = avec séquences, false = sans séquences, undefined = tous
  sort_by?: 'created_at' | 'score_priority' | 'email' | 'company_name' | 'firstname' | 'lastname' | 'enrichment_status' | 'ai_status' | 'emailing_status';
  sort_order?: 'asc' | 'desc';
}

export interface ProspectListResponse {
  data: Prospect[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ProspectStats {
  total_prospects: number;
  enriched_count: number;
  ai_processed_count: number;
  emails_sent_count: number;
  emails_opened_count: number;
  emails_replied_count: number;
  open_rate: number;
  reply_rate: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ===== SÉQUENCES D'EMAILS =====

export interface ProspectEmailSequence {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProspectEmailSequenceStep {
  id: string;
  sequence_id: string;
  step_number: number;
  delay_days: number;
  subject: string;
  body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProspectEmailScheduled {
  id: string;
  prospect_id: string;
  sequence_id: string | null;
  step_number: number;
  subject: string;
  body: string;
  scheduled_for: string;
  status: 'scheduled' | 'sent' | 'cancelled' | 'paused';
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  prospect_email_id: string | null;
}

export interface CreateEmailSequenceInput {
  name: string;
  description?: string;
  steps: Array<{
    step_number: number;
    delay_days: number;
    subject: string;
    body: string;
  }>;
}

export interface ScheduleSequenceForProspectInput {
  prospect_id: string;
  sequence_id: string;
  start_date?: string; // Date de début (par défaut: maintenant)
}

