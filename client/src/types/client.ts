export interface Client {
  id: number;
  email: string;
  password: string;
  name: string;
  company: string | null;
  siren: string | null;
  phone: string | null;
  revenuAnnuel: number | null;
  secteurActivite: string | null;
  nombreEmployes: number | null;
  ancienneteEntreprise: number | null;
  besoinFinancement: boolean | null;
  typeProjet: string | null;
  dateSimulation: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  last_login: Date | null;
  preferences: Record<string, any> | null;
}

export interface ClientFormData {
  email: string;
  password: string;
  name: string;
  company: string;
  siren: string;
  phone: string;
  revenuAnnuel: number;
  secteurActivite: string;
  nombreEmployes: number;
  ancienneteEntreprise: number;
  besoinFinancement: boolean;
  typeProjet: string;
} 