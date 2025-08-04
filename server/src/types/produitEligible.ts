export interface ProduitEligible {
  id: string;
  nom: string;
  description?: string;
  dureeMax?: number; // Colonne doublon avec duree_max
  created_at: string;
  updated_at: string;
  categorie?: string; // Colonne doublon avec category
  montant_min?: number;
  montant_max?: number;
  taux_min?: number;
  taux_max?: number;
  duree_min?: number;
  duree_max?: number; // Colonne doublon avec dureeMax
  category?: string; // Colonne doublon avec categorie
  active?: boolean;
}

// Interface pour les relations avec ClientProduitEligible
export interface ProduitEligibleWithRelations extends ProduitEligible {
  ClientProduitEligible?: any[];
}

// Interface pour les statistiques
export interface ProduitEligibleStats {
  total_produits: number;
  produits_actifs: number;
  produits_par_categorie: { [key: string]: number };
  produits_par_duree: { [key: string]: number };
} 