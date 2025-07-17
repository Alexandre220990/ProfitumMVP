import { Json } from "./supabase";

export interface RegleEligibilite { id: number;
  produitId: number;
  type: string;
  criteres: Json;
  seuil: number;
  message: string;
  priorite: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date; } 