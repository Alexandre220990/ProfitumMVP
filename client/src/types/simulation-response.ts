import { Json } from './supabase';

export interface SimulationResponse {
  id: number;
  clientId: string;
  dateCreation: string;
  statut: string;
  Answers: Json | null;
  score: number | null;
  tempsCompletion: number | null;
  abandonA: string | null;
  createdAt: string;
  updatedAt: string;
  CheminParcouru: Json | null;
} 