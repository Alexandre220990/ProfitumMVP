import { Json } from './supabase';

export interface Specialization {
  id: number;
  nom: string;
  description: string | null;
  conditions: Json | null;
  tauxSuccess: number | null;
  dureeAverage: number | null;
  createdAt: string;
  updatedAt: string;
} 