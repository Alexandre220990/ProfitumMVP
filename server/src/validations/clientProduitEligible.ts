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
  client_id: z.string(),
  produit_id: z.string(),
  simulation_id: z.number(),
  taux_final: z.number(),
  montant_final: z.number(),
  duree_finale: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  produit: ProduitSchema,
});

export type Produit = z.infer<typeof ProduitSchema>;
export type ClientProduitEligible = z.infer<typeof ClientProduitEligibleSchema>; 