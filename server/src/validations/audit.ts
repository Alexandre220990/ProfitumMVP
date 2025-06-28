import { z } from 'zod';
import { AuditStatus } from '../types/audit';

export const AuditSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  expert_id: z.string().nullable(),
  audit_type: z.string(), // Accepte n'importe quel nom de produit
  status: z.enum(['non_démarré', 'en_cours', 'terminé', 'annulé'] as const),
  current_step: z.number().int().min(0),
  progress: z.number().min(0).max(100),
  potential_gain: z.number().min(0),
  obtained_gain: z.number().min(0),
  reliability: z.number().min(0).max(100),
  charter_signed: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  description: z.string(),
  is_eligible_product: z.boolean(),
  taux_final: z.number().min(0),
  duree_finale: z.number().int().min(0),
});

export type Audit = z.infer<typeof AuditSchema>; 