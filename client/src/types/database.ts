/**
 * Types pour la base de données et les résultats de simulation
 */

export interface Question {
  id: number;
  texte: string;
  type: 'text' | 'number' | 'multiple_choice';
  options?: string[];
  dependsOn?: {
    questionId: number;
    expectedAnswer: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SimulationResult {
  id: number;
  produits: ProduitEligible[];
  score?: number;
  created_at: string;
  updated_at: string;
}

export interface ProduitEligible {
  id: string;
  nom: string;
  description: string;
  conditions: {
    titre: string;
    details: string[];
  }[];
  criteres: {
    minimum: number;
    maximum: number;
    unite: string;
  }[];
  score: number;
  tauxInteret?: number;
  montantMaximum?: number;
  dureeRemboursement?: {
    minimum: number;
    maximum: number;
    unite: 'mois' | 'annees';
  };
  created_at: string;
  updated_at: string;
} 