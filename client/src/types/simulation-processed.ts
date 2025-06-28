import { Json } from './supabase';

export interface SimulationProcessed {
  id: string;
  clientid: string;
  simulationid: number;
  dateprocessed: string;
  produitseligiblesids: string[] | null;
  produitsdetails: Json | null;
  rawanswers: Json | null;
  score: number | null;
  dureeanalysems: number | null;
  statut: string;
  createdAt: string;
  updatedAt: string;
} 