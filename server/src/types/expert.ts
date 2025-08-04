import { Json } from './supabase';

/**
 * Interface pour les données publiques d'un expert
 */
export interface PublicExpert {
  id: string;
  name: string;
  email: string;
  company_name: string;
  siren: string;
  specializations: string[];
  experience: string;
  location: string;
  rating: number;
  compensation: number | null;
  status: string;
  description: string | null;
  disponibilites: Json | null;
  certifications: Json | null;
  website: string | null;
  linkedin: string | null;
  languages: string[] | null;
  availability: string | null;
  max_clients: number | null;
  hourly_rate: number | null;
  phone: string | null;
  approval_status: string | null;
  // Champs calculés ajoutés
  total_assignments: number;
  completed_assignments: number;
  total_earnings: number;
  monthly_earnings: number;
  created_at: string;
  updated_at: string;
}

/**
 * Interface complète d'un expert (usage interne uniquement)
 */
export interface Expert extends PublicExpert {
  password: string;
  card_number: string | null;
  card_expiry: string | null;
  card_cvc: string | null;
  abonnement: string | null;
  auth_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
} 