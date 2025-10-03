export interface AuthUser { 
  id: string;
  email: string;
  type: 'client' | 'expert' | 'admin' | 'apporteur_affaires';
  username?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  siren?: string;
  specializations?: string[];
  experience?: number;
  location?: string;
  description?: string;
  status?: string;
  database_id?: string;
} 