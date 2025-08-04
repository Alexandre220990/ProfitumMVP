import { z } from 'zod';

export const ProduitSchema = z.object({
  nom: z.string(),
  description: z.string(),
  tauxMin: z.number(),
  tauxMax: z.number(),
  montantMin: z.number(),
  montantMax: z.number(),
  dureeMin: z.number(),
  dureeMax: z.number(),
});

export const ClientProduitEligibleSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  produitId: z.string(),
  simulationId: z.string(),
  statut: z.string(),
  tauxFinal: z.number(),
  montantFinal: z.number(),
  dureeFinale: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  metadata: z.any().optional(),
  notes: z.string().optional(),
  priorite: z.number().optional(),
  dateEligibilite: z.string().optional(),
  current_step: z.number(),
  progress: z.number(),
  expert_id: z.string().optional(),
  sessionId: z.string().optional(),
  produit: ProduitSchema.optional(),
});

export type Produit = z.infer<typeof ProduitSchema>;
export type ClientProduitEligible = z.infer<typeof ClientProduitEligibleSchema>; 