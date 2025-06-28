export interface Question {
  id: number;
  texte: string;
  type: "choix_multiple" | "nombre" | "choix_unique";
  ordre: number;
  categorie: string;
  options: {
    min?: number;
    max?: number;
    choix?: string[];
  };
  description?: string;
  placeholder?: string;
  validation?: Record<string, any>;
  conditions?: Record<string, any>;
  branchement?: Record<string, any>;
}

export interface Simulation {
  id: number;
  clientId: string;
  dateCreation: string;
  statut: "en_cours" | "terminee";
  Answers: Record<number, string[]>;
  score?: number;
  tempsCompletion?: number;
  CheminParcouru?: Record<string, any>;
}

export interface ProduitEligible {
  id: string;
  nom: string;
  description: string;
  conditions: Record<string, any>;
  criteres: Record<string, any>;
  formulePotentiel: Record<string, any>;
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
  statut: string;
  tauxFinal?: number;
  montantFinal?: number;
  dureeFinale?: number;
  simulationId: number;
  produit: ProduitEligible;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
} 