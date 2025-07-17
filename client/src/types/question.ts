import { Json } from "./supabase";

export interface Question { id: number;
  texte: string;
  type: string;
  categorie: string;
  description: string | null;
  placeholder: string | null;
  validation: Json | null;
  conditions: Json | null;
  branchement: string | null;
  importance: number | null;
  options?: {
    min?: number;
    max?: number;
    choix?: string[]; };
  createdAt: string;
  updatedAt: string;
} 