export interface Client {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  siren: string;
  expertise: string;
  phone_number: string;
  address: string;
  city: string;
  postal_code: string;
  plan_id: number;
  created_at: string;
  updated_at: string;
}

export interface ClientFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  company_name: string;
  siren: string;
  expertise: string;
  phone_number: string;
  address: string;
  city: string;
  postal_code: string;
  plan_id: number;
} 