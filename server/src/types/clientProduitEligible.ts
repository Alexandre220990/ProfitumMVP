export interface Produit {
  nom: string;
  description: string;
  tauxMin: number;
  tauxMax: number;
  montantMin: number;
  montantMax: number;
  dureeMin: number;
  dureeMax: number;
}

export interface ClientProduitEligible {
  id: string;
  clientId: string;
  produitId: string;
  simulationId: string;
  statut: string;
  tauxFinal: number;
  montantFinal: number;
  dureeFinale: number;
  created_at: string;
  updated_at: string;
  metadata?: any;
  notes?: string;
  priorite?: number;
  dateEligibilite?: string;
  current_step: number;
  progress: number;
  expert_id?: string;

  sessionId?: string;
  produit?: Produit;
} 