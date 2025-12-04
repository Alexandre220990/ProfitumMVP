// Types pour le système de prospection automatisé

export type ProspectSource = 'google_maps' | 'import_csv' | 'linkedin' | 'manuel' | 'email_reply';
export type EmailValidity = 'valid' | 'risky' | 'invalid';
export type EnrichmentStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type AIStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type EmailingStatus = 'pending' | 'queued' | 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'unsubscribed';
export type EmailProvider = 'instantly' | 'lemlist' | 'manual';

// Structure des données d'enrichissement
export interface ProspectEnrichmentData {
  // Secteur d'activité
  secteur_activite: {
    description: string;
    tendances_profitum: string; // Comment ce secteur bénéficie de Profitum
  };
  
  // Actualités de l'entreprise
  actualites_entreprise: {
    recentes: string[]; // Liste des actualités récentes
    pertinence_profitum: string; // En quoi ces actualités créent des opportunités
  };
  
  // Signaux opérationnels détectés
  signaux_operationnels: {
    recrutements_en_cours: boolean;
    locaux_physiques: boolean;
    parc_vehicules_lourds: boolean; // Camions +7.5t
    consommation_gaz_importante: boolean;
    details?: string; // Détails supplémentaires si disponibles
  };
  
  // Profil d'éligibilité aux produits Profitum
  profil_eligibilite: {
    ticpe: {
      eligible: boolean;
      raison: string;
      potentiel_economie?: string; // Estimation si possible
    };
    cee: {
      eligible: boolean;
      raison: string;
      potentiel_economie?: string;
    };
    optimisation_sociale: {
      eligible: boolean;
      raison: string;
      potentiel_economie?: string;
    };
    autres?: Record<string, {
      eligible: boolean;
      raison: string;
      potentiel_economie?: string;
    }>;
  };
  
  // Résumé stratégique
  resume_strategique: string; // Synthèse en 2-3 phrases des opportunités principales
  
  // Métadonnées
  enriched_at: string; // ISO timestamp
  enrichment_version: string; // Version du prompt d'enrichissement utilisé
}

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
  enrichment_data: ProspectEnrichmentData | null;
  enriched_at: string | null;
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
  
  // Lien vers l'import d'origine
  import_batch_id: string | null;
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
  skip_enrichment?: boolean; // Si true, ne pas déclencher l'enrichissement automatique
  import_batch_id?: string; // Référence vers l'import d'origine
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
  enrichment_data?: ProspectEnrichmentData;
  enriched_at?: string;
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

// ============================================================================
// TYPES RAPPORTS PROSPECTS
// ============================================================================

export interface ReportAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
  uploaded_at: string;
}

export interface ProspectReport {
  id: string;
  prospect_id: string;
  report_content: string;
  report_html: string | null;
  enriched_content: string | null;
  enriched_html: string | null;
  action_plan: string | null;
  created_by: string | null;
  last_modified_by: string | null;
  enriched_at: string | null;
  enriched_by: string | null;
  tags: string[] | null;
  attachments: ReportAttachment[];
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ProspectReportHistory {
  id: string;
  report_id: string;
  version: number;
  report_content: string;
  report_html: string | null;
  enriched_content: string | null;
  enriched_html: string | null;
  action_plan: string | null;
  tags: string[] | null;
  modified_by: string | null;
  modified_at: string;
  change_reason: string | null;
}

export interface ReportEnrichmentAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  key_insights: string[];
  potential_score: number; // 0-10
  urgency_score: number; // 0-10
  fit_score: number; // 0-10
  closing_probability: number; // 0-100
}

export interface ReportEnrichmentResult {
  enriched_content: string;
  enriched_html: string;
  action_plan: string;
  analysis: ReportEnrichmentAnalysis;
}

export interface CreateReportInput {
  prospect_id: string;
  report_content: string;
  report_html?: string;
  tags?: string[];
}

export interface UpdateReportInput {
  report_content?: string;
  report_html?: string;
  tags?: string[];
  attachments?: ReportAttachment[];
}

export interface EnrichReportInput {
  prospect_id: string;
  user_id: string;
}

// ============================================================================
// TYPES RÉPONSES PROSPECTS
// ============================================================================

export interface ProspectReplySummary {
  prospect_id: string;
  prospect_email: string;
  firstname: string | null;
  lastname: string | null;
  company_name: string | null;
  emailing_status: EmailingStatus;
  first_reply_at: string;
  last_reply_at: string;
  total_replies: number;
  unread_replies: number;
  sequence_start_date: string | null;
  emails_sent_before_reply: number;
  total_emails_sent: number;
  sequence_id: string | null;
  sequence_name: string | null;
  last_activity_at: string;
  is_quick_reply: boolean;
  has_report: boolean;
}

export interface RepliesFilters {
  unread_only?: boolean;
  sequence_id?: string;
  date_from?: string;
  date_to?: string;
  quick_reply_only?: boolean;
}

export interface RepliesGlobalStats {
  total_replies: number;
  response_rate: number;
  avg_response_time_hours: number;
  quick_replies_count: number;
  replies_today: number;
  replies_this_week: number;
  replies_this_month: number;
  best_sequence: {
    sequence_id: string;
    sequence_name: string;
    response_rate: number;
  } | null;
  avg_emails_before_reply: number;
}

