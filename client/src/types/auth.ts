export interface AuthUser {
  id: string;
  email: string;
  type: 'client' | 'expert';
  username?: string;
  company_name?: string;
  siren?: string;
  specializations?: string[];
  experience?: number;
  location?: string;
  description?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: AuthUser;
    token: string;
  };
  message?: string;
}

export interface RegisterResponse {
  success: boolean;
  data: {
    user: AuthUser;
    token: string;
  };
  message?: string;
} 