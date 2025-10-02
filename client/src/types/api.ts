import { AuthUser } from "./auth";

// --- Base commune à tous les utilisateurs ---
export interface BaseUser { id: string;
  email: string;
  type: "client" | "expert" | "admin";
  username?: string;
  name?: string;
  company_name?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  siren?: string;
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
  type: "client" | "expert" | "admin" | "apporteur_affaires"; }

// --- Crédentials Register (frontend -> backend) ---
export interface RegisterCredentials extends Partial<ClientData>, Partial<ExpertData> { email: string;
  password: string;
  type: "client" | "expert" | "admin" | "apporteur_affaires";
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