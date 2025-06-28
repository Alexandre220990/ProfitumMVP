import { Json } from './supabase';

export interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  features: Json;
  duration: number;
  status: string;
  type: string;
  limitations: Json | null;
  createdAt: Date;
  updatedAt: Date;
} 