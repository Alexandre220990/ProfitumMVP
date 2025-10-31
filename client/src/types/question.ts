import { Json } from "./supabase";

export interface Question { 
  id: string;
  question_text: string;
  question_type: string;
  question_order: number;
  section: string;
  description: string | null;
  placeholder: string | null;
  validation_rules: Json | null;
  conditions: Json | null;
  importance: number | null;
  produits_cibles: string[] | null;
  options?: {
    min?: number;
    max?: number;
    choix?: string[]; 
  };
  created_at?: string;
  updated_at?: string;
} 