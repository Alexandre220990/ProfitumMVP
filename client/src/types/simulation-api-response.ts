import { Json } from './supabase';

export interface SimulationApiResponse {
  id: number;
  client_id: string;
  created_at: string;
  status: string;
  Answers: Json | null;
  score: number | null;
  tempsCompletion: number | null;
  abandonA: string | null;
  updatedAt: string;
  CheminParcouru: Json | null;
}

export interface SimulationData {
  id: number;
  client_id: string;
  created_at: string;
  updated_at: string;
  status: string;
} 