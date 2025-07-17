import { Json } from './supabase';

// Types communs
type UUID = string;
type Timestamp = string;
type DoublePrecision = number;

// Interface de base pour les timestamps communs
export interface BaseEntity {
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Interfaces principales
export interface Appointment extends BaseEntity {
  id: number;
  clientId: UUID | null;
  expertId: UUID | null;
  auditId: UUID | null;
  date: Timestamp;
  duree: number | null;
  type: string | null;
  statut: string;
  lieu: string | null;
  lien_visio: string | null;
  notes: string | null;
  rappel_envoye: boolean;
}

export interface Audit extends BaseEntity {
  id: UUID;
  type: string;
  description: string;
  montant: DoublePrecision;
  status: string;
  dateDebut: Timestamp;
  dateFin: Timestamp | null;
  clientId: UUID;
  expertId: UUID | null;
  documents: Json | null;
  commentaires: string | null;
  charter_signed: boolean;
  current_step: number;
  progress: number;
  appointment_datetime: Timestamp | null;
}

export interface Charter extends BaseEntity {
  id: number;
  audit_type: string | null;
  clientId: UUID | null;
  status: string;
  signed_at: Timestamp | null;
  content_version: string | null;
}

export interface Client extends BaseEntity {
  id: UUID;
  email: string;
  password: string;
  name: string | null;
  company_name: string | null;
  phone_number: string | null;
  revenuAnnuel: DoublePrecision | null;
  secteurActivite: string | null;
  nombreEmployes: number | null;
  ancienneteEntreprise: number | null;
  typeProjet: string | null;
  dateSimulation: Timestamp | null;
  simulationId: number | null;
  siren: string | null;
  username: string;
  address: string;
  city: string;
  postal_code: string;
  type: string;
}

export interface ClientProduitEligible extends BaseEntity {
  id: UUID;
  clientId: UUID;
  produitId: UUID;
  statut: string;
  tauxFinal: DoublePrecision | null;
  montantFinal: DoublePrecision | null;
  dureeFinale: number | null;
  simulationId: number | null;
}

export interface Document extends BaseEntity {
  id: number;
  clientId: UUID | null;
  filename: string | null;
  original_name: string | null;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  category: string | null;
  description: string | null;
  upload_date: Timestamp;
  status: string;
  audit_id: UUID | null;
}

export interface Dossier extends BaseEntity {
  id: number;
  type: string | null;
  status: string;
  montant: DoublePrecision | null;
  description: string | null;
  clientId: UUID | null;
  expertId: UUID | null;
}

export interface Expert extends BaseEntity {
  id: UUID;
  email: string;
  password: string;
  name: string;
  company_name: string;
  siren: string;
  specializations: string[];
  experience: string | null;
  location: string | null;
  rating: DoublePrecision;
  compensation: DoublePrecision | null;
  description: string | null;
  status: string;
  disponibilites: Json | null;
  certifications: Json | null;
  card_number: string | null;
  card_expiry: string | null;
  card_cvc: string | null;
  abonnement: string | null;
  // Nouveaux champs ajoutés
  website: string | null;
  linkedin: string | null;
  languages: string[] | null;
  availability: string | null;
  max_clients: number | null;
  hourly_rate: DoublePrecision | null;
  phone: string | null;
  auth_id: UUID | null;
  approved_by: UUID | null;
  approved_at: Timestamp | null;
  approval_status: string | null;
}

export interface ExpertCategory extends BaseEntity {
  id: number;
  name: string | null;
  description: string | null;
}

export interface ExpertProduitEligible extends BaseEntity {
  id: UUID;
  expertId: UUID;
  produitId: UUID;
  niveauExpertise: string | null;
  tarifHoraire: DoublePrecision | null;
  disponibilite: string | null;
  filtresTaille: Json | null;
  filtresGeographie: Json | null;
  filtresVolume: Json | null;
  statut: string;
}

export interface ExpertSpecialization {
  expertId: UUID;
  specializationId: number;
}

export interface Notification {
  id: number;
  recipient_id: UUID | null;
  message: string | null;
  status: string;
  type_notification: string | null;
  lu: boolean;
  date_notification: Timestamp;
}

export interface Plan extends BaseEntity {
  id: number;
  name: string | null;
  price: DoublePrecision | null;
  description: string | null;
  features: string[] | null;
}

export interface ProduitEligible extends BaseEntity {
  id: UUID;
  nom: string | null;
  description: string | null;
  conditions: Json | null;
  criteres: Json | null;
  formulePotentiel: Json | null;
  tauxMin: DoublePrecision | null;
  tauxMax: DoublePrecision | null;
  montantMin: DoublePrecision | null;
  montantMax: DoublePrecision | null;
  dureeMin: number | null;
  dureeMax: number | null;
  questionsRequises: Json | null;
}

export interface Question extends BaseEntity {
  id: number;
  texte: string | null;
  type: string | null;
  ordre: number | null;
  categorie: string | null;
  options: Json | null;
  description: string | null;
  placeholder: string | null;
  validation: Json | null;
  conditions: Json | null;
  branchement: Json | null;
  importance: number;
}

export interface RegleEligibilite {
  id: UUID;
  produitid: UUID | null;
  questionid: number | null;
  operateur: string | null;
  valeur: Json | null;
  poids: number | null;
}

export interface Reponse extends BaseEntity {
  id: number;
  simulationId: number | null;
  questionId: number | null;
  valeur: string | null;
}

export interface Simulation extends BaseEntity {
  id: number;
  clientId: UUID | null;
  dateCreation: Timestamp;
  statut: string;
  Answers: Json | null;
  score: DoublePrecision | null;
  tempsCompletion: number | null;
  abandonA: string | null;
  CheminParcouru: Json | null;
}

export interface SimulationProcessed extends BaseEntity {
  id: UUID;
  clientid: UUID;
  simulationid: number;
  dateprocessed: Timestamp;
  produitseligiblesids: string[];
  produitsdetails: Json | null;
  rawanswers: Json | null;
  score: DoublePrecision | null;
  dureeanalysems: number | null;
  statut: string | null;
}

export interface SimulationResult extends BaseEntity {
  id: number;
  clientId: UUID | null;
  produitEligible: string | null;
  tauxInteret: DoublePrecision | null;
  montantMaximal: DoublePrecision | null;
  dureeMaximale: number | null;
  scoreEligibilite: DoublePrecision | null;
  commentaires: string | null;
  dateSimulation: Timestamp;
  simulationId: number | null;
}

export interface Specialization extends BaseEntity {
  id: number;
  name: string | null;
  description: string | null;
  conditions: Json | null;
  tauxSuccess: DoublePrecision | null;
  dureeAverage: number | null;
}

export interface AuthenticatedUser {
  id: UUID | null;
  email: string | null;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
  user_type: string | null;
  profile_id: UUID | null;
  raw_user_meta_data: Json | null;
} 