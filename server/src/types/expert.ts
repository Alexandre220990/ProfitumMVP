import { Json } from './supabase';

/**
 * Interface pour les données publiques d'un expert
 */
export interface PublicExpert {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  company_name?: string;
  siren?: string;
  specializations?: string[];
  experience?: string;
  location?: string;
  rating?: number;
  compensation?: number;
  status: string;
  description?: string;
  disponibilites?: Json;
  certifications?: Json;
  created_at: string;
  updated_at: string;
  clients?: number;
  audits?: number;
  category_id?: number;
}

/**
 * Interface complète d'un expert (usage interne uniquement)
 */
export interface Expert extends PublicExpert {
  password: string;
  card_number?: string;
  card_expiry?: string;
  card_cvc?: string;
  abonnement?: string;
} 