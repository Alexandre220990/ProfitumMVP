import { AuthUser } from "./auth";

// --- Base commune à tous les utilisateurs ---
export interface BaseUser { id: string;
  email: string;
  type: "client" | "expert" | "admin" | "apporteur";
  available_types?: ("client" | "expert" | "admin" | "apporteur")[];
  username?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  siren?: string;
  status?: string;
  database_id?: string;
  auth_user_id?: string;
  created_at?: string;
  updated_at?: string; }

// --- Champs spécifiques aux experts ---
export interface ExpertData { specializations?: string[];
  experience?: string;
  location?: string;
  rating?: number;
  compensation?: number;
  description?: string;
  status?: string;
  disponibilites?: any;
  certifications?: any;
  card_number?: string;
  card_expiry?: string;
  card_cvc?: string;
  abonnement?: string; }

// --- Champs spécifiques aux clients ---
export interface ClientData { revenuAnnuel?: number;
  secteurActivite?: string;
  nombreEmployes?: number;
  ancienneteEntreprise?: number;
  typeProjet?: string;
  dateSimulation?: string;
  simulationId?: number; }

// --- Type utilisateur unifié côté frontend ---
export type UserType = BaseUser & Partial<ClientData> & Partial<ExpertData>;

// --- Type de réponse générique ---
export interface ApiResponse<T> { success: boolean;
  data: T | null;
  message?: string; }

// --- Réponse Auth / Login ---
export interface AuthData { token: string;
  user: AuthUser; }

export type AuthResponse = ApiResponse<AuthData>;
export type RegisterResponse = ApiResponse<AuthData>;

// --- Réponses diverses ---
export interface LogoutResponse { success: boolean;
  message?: string; }

export interface CheckAuthResponse { user: UserType; }

export interface ForgotPasswordResponse { success: boolean;
  message?: string; }

export interface ResetPasswordResponse { success: boolean;
  message?: string; }

export interface UpdateProfileResponse { success: boolean;
  user: UserType;
  message?: string; }

export interface DeleteAccountResponse { success: boolean;
  message?: string; }

// --- Crédentials Login ---
export interface LoginCredentials { email: string;
  password: string;
  type: "client" | "expert" | "admin" | "apporteur"; }

// --- Crédentials Register (frontend -> backend) ---
export interface RegisterCredentials extends Partial<ClientData>, Partial<ExpertData> { email: string;
  password: string;
  type: "client" | "expert" | "admin" | "apporteur";
  name?: string;
  username?: string;
  company_name?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  siren?: string; }

// --- Types pour les signatures de charte ---
export interface CharteSignature { id: string;
  client_id: string;
  produit_id: string;
  client_produit_eligible_id: string;
  signature_date: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string; }

export interface CharteSignatureRequest { clientProduitEligibleId: string;
  ipAddress?: string;
  userAgent?: string; }

export interface CharteSignatureResponse { signed: boolean;
  signature: CharteSignature | null; }

export type CharteSignatureApiResponse = ApiResponse<CharteSignature>;
export type CharteSignatureCheckResponse = ApiResponse<CharteSignatureResponse>;

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

export interface ReportEnrichmentAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  key_insights: string[];
  potential_score: number;
  urgency_score: number;
  fit_score: number;
  closing_probability: number;
}

export interface ReportEnrichmentResult {
  enriched_content: string;
  enriched_html: string;
  action_plan: string;
  analysis: ReportEnrichmentAnalysis;
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
  emailing_status: string;
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