export interface User {
  id: string;
  email: string;
  role: 'client' | 'expert' | 'admin';
  profile: {
    first_name: string;
    last_name: string;
    phone?: string;
    company?: string;
    position?: string;
  };
  status: 'active' | 'inactive' | 'pending';
  preferences?: {
    notifications: boolean;
    language: string;
  };
  created_at: string;
  updated_at: string;
} 