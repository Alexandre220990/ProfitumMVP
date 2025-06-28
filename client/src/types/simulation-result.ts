export interface SimulationResult {
  id: number;
  clientId: string;
  produitEligible: string | null;
  tauxInteret: number | null;
  montantMaximal: number | null;
  dureeMaximale: number | null;
  scoreEligibilite: number | null;
  commentaires: string | null;
  dateSimulation: string | null;
  simulationId: number | null;
  createdAt: string;
  updatedAt: string;
} 