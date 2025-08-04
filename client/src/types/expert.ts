// Types pour l'interface expert - Conforme à la base de données

export interface Expert {
  id: string;
  email: string;
  name: string;
  company_name: string;
  siren: string;
  specializations: string[];
  experience: string; // Conforme à la DB (text)
  location: string;
  rating: number; // double precision en DB
  compensation: number | null; // double precision en DB
  description: string | null;
  status: string;
  disponibilites: any | null; // jsonb en DB
  certifications: any | null; // jsonb en DB
  card_number: string | null;
  card_expiry: string | null;
  card_cvc: string | null;
  abonnement: string | null;
  website: string | null;
  linkedin: string | null;
  languages: string[] | null;
  availability: string | null;
  max_clients: number | null;
  hourly_rate: number | null; // double precision en DB
  phone: string | null;
  auth_id: string | null; // uuid en DB
  approved_by: string | null; // uuid en DB
  approved_at: string | null; // timestamptz en DB
  approval_status: string | null;
  // Champs calculés ajoutés
  total_assignments: number;
  completed_assignments: number;
  total_earnings: number;
  monthly_earnings: number;
  created_at: string;
  updated_at: string;
}

export interface PublicExpert {
  id: string;
  name: string;
  company_name: string;
  specializations: string[];
  experience: string;
  location: string;
  rating: number;
  status: string;
  description: string | null;
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
}

export interface ExpertPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
  };
  availability: {
    workingHours: {
      start: string;
      end: string;
    };
    maxAssignments: number;
    preferredProducts: string[];
    autoAccept: boolean;
  };
  compensation: {
    minimumRate: number;
    preferredRate: number;
    autoNegotiate: boolean;
  };
} 