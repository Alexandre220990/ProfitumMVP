export interface AuthUser { 
  id: string;
  email: string;
  type: 'client' | 'expert' | 'admin';
  username?: string;
  company_name?: string;
  siren?: string;
  specializations?: string[];
  experience?: number;
  location?: string;
  description?: string; 
} 