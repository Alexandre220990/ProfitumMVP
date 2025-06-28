import { ClientProduitEligibleSchema } from '../../validations/clientProduitEligible';

describe('Validation Zod – ClientProduitEligible', () => {
  const mockProduitValide = {
    id: 'cpe_001',
    client_id: 'cli_001',
    produit_id: 'pe_001',
    simulation_id: 1,
    taux_final: 3.2,
    montant_final: 12000,
    duree_finale: 48,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    produit: {
      nom: 'DFS',
      description: 'Test',
      tauxMin: 1.5,
      tauxMax: 4.5,
      montantMin: 1000,
      montantMax: 50000,
      dureeMin: 6,
      dureeMax: 60,
    }
  };

  it('valide un produit conforme', () => {
    expect(() => ClientProduitEligibleSchema.parse(mockProduitValide)).not.toThrow();
  });

  it('rejette un produit avec des champs manquants', () => {
    const mockInvalide = { ...mockProduitValide } as any;
    delete mockInvalide.produit;
    
    expect(() => ClientProduitEligibleSchema.parse(mockInvalide)).toThrow();
  });

  it('rejette un produit avec des types incorrects', () => {
    const mockInvalide = {
      ...mockProduitValide,
      taux_final: '3.2', // string au lieu de number
    };
    
    expect(() => ClientProduitEligibleSchema.parse(mockInvalide)).toThrow();
  });

  it('rejette un produit avec des valeurs hors limites', () => {
    const mockInvalide = {
      ...mockProduitValide,
      produit: {
        ...mockProduitValide.produit,
        tauxMin: -1, // taux négatif
      }
    };
    
    expect(() => ClientProduitEligibleSchema.parse(mockInvalide)).toThrow();
  });
}); 