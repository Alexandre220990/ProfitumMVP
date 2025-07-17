import { Json } from "./supabase";

export interface Reponse { id: number;
  questionId: number;
  simulationId: number;
  reponse: Json;
  score: number;
  commentaires: string | null;
  createdAt: Date;
  updatedAt: Date; } 