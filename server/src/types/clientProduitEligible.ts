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
  client_id: string;
  produit_id: string;
  simulation_id: number;
  taux_final: number;
  montant_final: number;
  duree_finale: number;
  created_at: string;
  updated_at: string;
  produit: Produit;
} 