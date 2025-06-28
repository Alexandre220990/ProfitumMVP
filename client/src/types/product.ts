import { Json } from './supabase';

export interface Product {
  id: number;
  nom: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  requirements: Json | null;
  benefits: Json | null;
  limitations: Json | null;
  documentation: Json | null;
  version: string | null;
  category: string | null;
  priority: number | null;
  createdAt: string;
  updatedAt: string;
} 