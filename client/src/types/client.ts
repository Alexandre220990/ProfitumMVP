export interface Client { id: number;
  email: string;
  password: string;
  name: string;
  company: string | null;
  siren: string | null;
  phone: string | null;
  revenuAnnuel: number | null; // Montant exact en euros (ex: 250000)
  secteurActivite: string | null;
  nombreEmployes: number | null; // Nombre exact d'employés (ex: 25)
  ancienneteEntreprise: number | null;
  besoinFinancement: boolean | null;
  typeProjet: string | null;
  dateSimulation: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  last_login: Date | null;
  preferences: Record<string, any> | null; }

export interface ClientFormData { email: string;
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
  typeProjet: string; } 