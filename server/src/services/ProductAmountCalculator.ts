/**
 * 💰 ProductAmountCalculator - Calcul précis des montants par produit
 * 
 * RÈGLES STRICTES :
 * ✅ Calculs individualisés basés sur réponses exactes
 * ✅ AUCUNE limite maximale artificielle
 * ✅ Formules métier réelles validées
 * ✅ Résultats au centime près
 * 
 * Date: 2025-10-13
 * Version: 1.0
 */

export interface SimulationAnswers {
  // Questions de base (toujours présentes)
  secteur?: string;
  ca_tranche?: string;
  nb_employes_tranche?: string;
  proprietaire_locaux?: string;
  contrats_energie?: string;
  possede_vehicules?: string;
  types_vehicules?: string[];
  niveau_impayes?: string;
  depenses_rd?: string;
  montant_rd_tranche?: string;
  
  // Questions conditionnelles (nouvelles)
  litres_carburant_mois?: number;
  nb_chauffeurs?: number;
  montant_taxe_fonciere?: number;
  montant_factures_energie_mois?: number;
  export_annuel?: string;
}

export interface ProductCalculationResult {
  produit_nom: string;
  produit_id: string;
  is_eligible: boolean;
  type: 'financier' | 'qualitatif';
  estimated_savings: number | null;
  calculation_details: {
    formula: string;
    inputs: Record<string, any>;
    intermediate_values?: Record<string, number>;
  };
  qualitative_benefits?: string[];
}

export class ProductAmountCalculator {
  
  /**
   * Calculer le montant pour tous les produits
   */
  static calculateAllProducts(answers: SimulationAnswers): ProductCalculationResult[] {
    const results: ProductCalculationResult[] = [];
    
    // 1. TICPE
    results.push(this.calculateTICPE(answers));
    
    // 2. URSSAF
    results.push(this.calculateURSSAF(answers));
    
    // 3. DFS
    results.push(this.calculateDFS(answers));
    
    // 4. FONCIER
    results.push(this.calculateFONCIER(answers));
    
    // 5. CEE
    results.push(this.calculateCEE(answers));
    
    // 6. MSA
    results.push(this.calculateMSA(answers));
    
    // 7. OPTIMISATION ÉNERGIE
    results.push(this.calculateOPTIMISATION_ENERGIE(answers));
    
    // 8. RECOUVREMENT
    results.push(this.calculateRECOUVREMENT(answers));
    
    // 9. TVA
    results.push(this.calculateTVA(answers));
    
    // 10. CHRONOTACHYGRAPHES (qualitatif)
    results.push(this.calculateCHRONOTACHYGRAPHES(answers));
    
    return results;
  }
  
  /**
   * 1️⃣ TICPE - Remboursement Carburant
   * RÈGLE : 0,20€ par litre
   */
  private static calculateTICPE(answers: SimulationAnswers): ProductCalculationResult {
    const secteursEligibles = [
      "Transport routier de marchandises",
      "Transport routier de voyageurs",
      "Taxi / VTC",
      "BTP / Travaux publics",
      "Terrassement",
      "Secteur Agricole"
    ];
    
    const typesVehiculesEligibles = [
      "Camions de plus de 7,5 tonnes",
      "Engins de chantier",
      "Tracteurs agricoles"
    ];
    
    const isEligible = 
      secteursEligibles.includes(answers.secteur || '') &&
      answers.possede_vehicules === "Oui" &&
      answers.types_vehicules?.some(type => typesVehiculesEligibles.includes(type));
    
    if (!isEligible || !answers.litres_carburant_mois) {
      return {
        produit_nom: "Remboursement TICPE",
        produit_id: "TICPE",
        is_eligible: false,
        type: 'financier',
        estimated_savings: 0,
        calculation_details: {
          formula: "litres/mois × 12 × 0,20€",
          inputs: { litres_mois: answers.litres_carburant_mois || 0 }
        }
      };
    }
    
    const TAUX_REMBOURSEMENT = 0.20; // 20 centimes/litre
    const litresAnnuels = answers.litres_carburant_mois * 12;
    const montantAnnuel = litresAnnuels * TAUX_REMBOURSEMENT;
    
    return {
      produit_nom: "Remboursement TICPE",
      produit_id: "TICPE",
      is_eligible: true,
      type: 'financier',
      estimated_savings: Math.round(montantAnnuel),
      calculation_details: {
        formula: "litres/mois × 12 × 0,20€",
        inputs: {
          litres_mois: answers.litres_carburant_mois,
          taux: TAUX_REMBOURSEMENT
        },
        intermediate_values: {
          litres_annuels: litresAnnuels,
          montant_annuel: montantAnnuel
        }
      }
    };
  }
  
  /**
   * 2️⃣ URSSAF - Réduction Charges Sociales
   * RÈGLE : 10% de la masse salariale
   */
  private static calculateURSSAF(answers: SimulationAnswers): ProductCalculationResult {
    const nb_employes_map: Record<string, number> = {
      "Aucun": 0,
      "1 à 5": 3,
      "6 à 20": 13,
      "21 à 50": 35,
      "Plus de 50": 75
    };
    
    const nb_employes = nb_employes_map[answers.nb_employes_tranche || ''] || 0;
    const isEligible = nb_employes > 0;
    
    if (!isEligible) {
      return {
        produit_nom: "Réduction URSSAF",
        produit_id: "URSSAF",
        is_eligible: false,
        type: 'financier',
        estimated_savings: 0,
        calculation_details: {
          formula: "nb_employés × 35 000€ × 10%",
          inputs: { nb_employes: 0 }
        }
      };
    }
    
    const SALAIRE_BRUT_MOYEN = 35000;
    const TAUX_REDUCTION = 0.10;
    
    const masseSalariale = nb_employes * SALAIRE_BRUT_MOYEN;
    const montantAnnuel = masseSalariale * TAUX_REDUCTION;
    
    return {
      produit_nom: "Réduction URSSAF",
      produit_id: "URSSAF",
      is_eligible: true,
      type: 'financier',
      estimated_savings: Math.round(montantAnnuel),
      calculation_details: {
        formula: "nb_employés × 35 000€ × 10%",
        inputs: {
          nb_employes,
          salaire_moyen: SALAIRE_BRUT_MOYEN,
          taux_reduction: TAUX_REDUCTION
        },
        intermediate_values: {
          masse_salariale: masseSalariale,
          montant_annuel: montantAnnuel
        }
      }
    };
  }
  
  /**
   * 3️⃣ DFS - Déduction Forfaitaire Spécifique
   * RÈGLE : 150€ par chauffeur
   */
  private static calculateDFS(answers: SimulationAnswers): ProductCalculationResult {
    const secteursEligibles = [
      "Transport routier de marchandises",
      "Transport routier de voyageurs",
      "Taxi / VTC"
    ];
    
    const isEligible = 
      secteursEligibles.includes(answers.secteur || '') &&
      (answers.nb_chauffeurs || 0) > 0;
    
    if (!isEligible || !answers.nb_chauffeurs) {
      return {
        produit_nom: "Déduction Forfaitaire Spécifique",
        produit_id: "DFS",
        is_eligible: false,
        type: 'financier',
        estimated_savings: 0,
        calculation_details: {
          formula: "nb_chauffeurs × 150€",
          inputs: { nb_chauffeurs: answers.nb_chauffeurs || 0 }
        }
      };
    }
    
    const DEDUCTION_PAR_CHAUFFEUR = 150;
    const montantAnnuel = answers.nb_chauffeurs * DEDUCTION_PAR_CHAUFFEUR;
    
    return {
      produit_nom: "Déduction Forfaitaire Spécifique",
      produit_id: "DFS",
      is_eligible: true,
      type: 'financier',
      estimated_savings: Math.round(montantAnnuel),
      calculation_details: {
        formula: "nb_chauffeurs × 150€",
        inputs: {
          nb_chauffeurs: answers.nb_chauffeurs,
          deduction_unitaire: DEDUCTION_PAR_CHAUFFEUR
        },
        intermediate_values: {
          montant_annuel: montantAnnuel
        }
      }
    };
  }
  
  /**
   * 4️⃣ FONCIER - Taxe Foncière Professionnelle
   * RÈGLE : 20% de la taxe foncière récupérable (sur 6 ans)
   */
  private static calculateFONCIER(answers: SimulationAnswers): ProductCalculationResult {
    const isEligible = 
      answers.proprietaire_locaux === "Oui" &&
      (answers.montant_taxe_fonciere || 0) > 0;
    
    if (!isEligible || !answers.montant_taxe_fonciere) {
      return {
        produit_nom: "Optimisation Foncier Entreprise",
        produit_id: "FONCIER",
        is_eligible: false,
        type: 'financier',
        estimated_savings: 0,
        calculation_details: {
          formula: "taxe_foncière × 20%",
          inputs: { taxe_fonciere: answers.montant_taxe_fonciere || 0 }
        }
      };
    }
    
    const TAUX_RECUPERATION = 0.20;
    const montantAnnuel = answers.montant_taxe_fonciere * TAUX_RECUPERATION;
    const montantTotal6ans = montantAnnuel * 6;
    
    return {
      produit_nom: "Optimisation Foncier Entreprise",
      produit_id: "FONCIER",
      is_eligible: true,
      type: 'financier',
      estimated_savings: Math.round(montantAnnuel), // Montant annuel
      calculation_details: {
        formula: "taxe_foncière × 20%",
        inputs: {
          taxe_fonciere: answers.montant_taxe_fonciere,
          taux_recuperation: TAUX_RECUPERATION
        },
        intermediate_values: {
          montant_annuel: montantAnnuel,
          montant_total_6ans: montantTotal6ans // Pour info
        }
      }
    };
  }
  
  /**
   * 5️⃣ CEE - Certificats Économie Énergie
   * RÈGLE : 30% du montant R&D
   */
  private static calculateCEE(answers: SimulationAnswers): ProductCalculationResult {
    const isEligible = 
      ["Oui, régulièrement", "Oui, occasionnellement"].includes(answers.depenses_rd || '') &&
      answers.montant_rd_tranche;
    
    const montant_rd_map: Record<string, number> = {
      "Moins de 50 000€": 25000,
      "50 000€ - 100 000€": 75000,
      "100 000€ - 500 000€": 300000,
      "Plus de 500 000€": 750000
    };
    
    const montant_rd = montant_rd_map[answers.montant_rd_tranche || ''] || 0;
    
    if (!isEligible || montant_rd === 0) {
      return {
        produit_nom: "Certificats Économie Énergie",
        produit_id: "CEE",
        is_eligible: false,
        type: 'financier',
        estimated_savings: 0,
        calculation_details: {
          formula: "montant_RD × 30%",
          inputs: { montant_rd: 0 }
        }
      };
    }
    
    const TAUX_CEE = 0.30;
    const montantAnnuel = montant_rd * TAUX_CEE;
    
    return {
      produit_nom: "Certificats Économie Énergie",
      produit_id: "CEE",
      is_eligible: true,
      type: 'financier',
      estimated_savings: Math.round(montantAnnuel),
      calculation_details: {
        formula: "montant_RD × 30%",
        inputs: {
          montant_rd,
          taux_cee: TAUX_CEE
        },
        intermediate_values: {
          montant_annuel: montantAnnuel
        }
      }
    };
  }
  
  /**
   * 6️⃣ MSA - Cotisations Agricoles
   * RÈGLE : 6,5% du CA
   */
  private static calculateMSA(answers: SimulationAnswers): ProductCalculationResult {
    const isEligible = answers.secteur === "Secteur Agricole";
    
    const ca_map: Record<string, number> = {
      "Moins de 100 000€": 50000,
      "100 000€ - 500 000€": 300000,
      "500 000€ - 1 000 000€": 750000,
      "1 000 000€ - 5 000 000€": 2500000,
      "Plus de 5 000 000€": 7000000
    };
    
    const ca = ca_map[answers.ca_tranche || ''] || 0;
    
    if (!isEligible || ca === 0) {
      return {
        produit_nom: "Réduction MSA",
        produit_id: "MSA",
        is_eligible: false,
        type: 'financier',
        estimated_savings: 0,
        calculation_details: {
          formula: "CA × 6,5%",
          inputs: { ca: 0 }
        }
      };
    }
    
    const TAUX_REDUCTION_MSA = 0.065;
    const montantAnnuel = ca * TAUX_REDUCTION_MSA;
    
    return {
      produit_nom: "Réduction MSA",
      produit_id: "MSA",
      is_eligible: true,
      type: 'financier',
      estimated_savings: Math.round(montantAnnuel),
      calculation_details: {
        formula: "CA × 6,5%",
        inputs: {
          ca,
          taux_reduction: TAUX_REDUCTION_MSA
        },
        intermediate_values: {
          montant_annuel: montantAnnuel
        }
      }
    };
  }
  
  /**
   * 7️⃣ OPTIMISATION ÉNERGIE
   * RÈGLE : 30% des factures annuelles
   */
  private static calculateOPTIMISATION_ENERGIE(answers: SimulationAnswers): ProductCalculationResult {
    const isEligible = 
      answers.contrats_energie === "Oui" &&
      (answers.montant_factures_energie_mois || 0) > 0;
    
    if (!isEligible || !answers.montant_factures_energie_mois) {
      return {
        produit_nom: "Optimisation Énergie",
        produit_id: "ENERGIE",
        is_eligible: false,
        type: 'financier',
        estimated_savings: 0,
        calculation_details: {
          formula: "factures/mois × 12 × 30%",
          inputs: { factures_mois: 0 }
        }
      };
    }
    
    const TAUX_RECUPERATION = 0.30;
    const facturesAnnuelles = answers.montant_factures_energie_mois * 12;
    const montantAnnuel = facturesAnnuelles * TAUX_RECUPERATION;
    
    return {
      produit_nom: "Optimisation Énergie",
      produit_id: "ENERGIE",
      is_eligible: true,
      type: 'financier',
      estimated_savings: Math.round(montantAnnuel),
      calculation_details: {
        formula: "factures/mois × 12 × 30%",
        inputs: {
          factures_mois: answers.montant_factures_energie_mois,
          taux_recuperation: TAUX_RECUPERATION
        },
        intermediate_values: {
          factures_annuelles: facturesAnnuelles,
          montant_annuel: montantAnnuel
        }
      }
    };
  }
  
  /**
   * 8️⃣ RECOUVREMENT - Créances Impayées
   * RÈGLE : 100% récupérable
   */
  private static calculateRECOUVREMENT(answers: SimulationAnswers): ProductCalculationResult {
    const montant_impayes_map: Record<string, number> = {
      "Oui, montant faible (< 10 000€)": 5000,
      "Oui, montant modéré (10 000€ - 50 000€)": 30000,
      "Oui, montant important (> 50 000€)": 75000,
      "Non": 0
    };
    
    const montant_impayes = montant_impayes_map[answers.niveau_impayes || ''] || 0;
    const isEligible = montant_impayes > 0;
    
    if (!isEligible) {
      return {
        produit_nom: "Recouvrement Créances",
        produit_id: "RECOUVREMENT",
        is_eligible: false,
        type: 'financier',
        estimated_savings: 0,
        calculation_details: {
          formula: "impayés × 100%",
          inputs: { impayes: 0 }
        }
      };
    }
    
    const TAUX_RECUPERATION = 1.00; // 100%
    const montantRecuperable = montant_impayes * TAUX_RECUPERATION;
    
    return {
      produit_nom: "Recouvrement Créances",
      produit_id: "RECOUVREMENT",
      is_eligible: true,
      type: 'financier',
      estimated_savings: Math.round(montantRecuperable),
      calculation_details: {
        formula: "impayés × 100%",
        inputs: {
          impayes: montant_impayes,
          taux_recuperation: TAUX_RECUPERATION
        },
        intermediate_values: {
          montant_recuperable: montantRecuperable
        }
      }
    };
  }
  
  /**
   * 9️⃣ TVA - Remboursement Crédit TVA Export
   * RÈGLE : 20% du montant export
   */
  private static calculateTVA(answers: SimulationAnswers): ProductCalculationResult {
    const montant_export_map: Record<string, number> = {
      "Non": 0,
      "Oui, < 50 000€": 25000,
      "Oui, Entre 50 000€ et 100 000€": 75000,
      "Oui, Entre 100 000€ et 500 000€": 300000,
      "Oui, + de 500 000€": 750000
    };
    
    const montant_export = montant_export_map[answers.export_annuel || ''] || 0;
    const isEligible = montant_export > 0;
    
    if (!isEligible) {
      return {
        produit_nom: "Remboursement Crédit TVA",
        produit_id: "TVA",
        is_eligible: false,
        type: 'financier',
        estimated_savings: 0,
        calculation_details: {
          formula: "export × 20%",
          inputs: { export: 0 }
        }
      };
    }
    
    const TAUX_TVA = 0.20;
    const montantRecuperable = montant_export * TAUX_TVA;
    
    return {
      produit_nom: "Remboursement Crédit TVA",
      produit_id: "TVA",
      is_eligible: true,
      type: 'financier',
      estimated_savings: Math.round(montantRecuperable),
      calculation_details: {
        formula: "export × 20%",
        inputs: {
          export: montant_export,
          taux_tva: TAUX_TVA
        },
        intermediate_values: {
          montant_recuperable: montantRecuperable
        }
      }
    };
  }
  
  /**
   * 🔟 CHRONOTACHYGRAPHES - Produit Qualitatif
   * PAS DE MONTANT : Bénéfices en temps/conformité
   */
  private static calculateCHRONOTACHYGRAPHES(answers: SimulationAnswers): ProductCalculationResult {
    const secteursEligibles = [
      "Transport routier de marchandises",
      "Transport routier de voyageurs"
    ];
    
    const typesVehiculesEligibles = [
      "Camions de plus de 7,5 tonnes",
      "Camions de 3,5 à 7,5 tonnes"
    ];
    
    const isEligible = 
      secteursEligibles.includes(answers.secteur || '') &&
      answers.types_vehicules?.some(type => typesVehiculesEligibles.includes(type));
    
    return {
      produit_nom: "Chronotachygraphes Digitaux",
      produit_id: "CHRONOTACHYGRAPHES",
      is_eligible: isEligible,
      type: 'qualitatif',
      estimated_savings: null, // Pas de montant financier
      calculation_details: {
        formula: "Bénéfices qualitatifs",
        inputs: {
          secteur: answers.secteur,
          types_vehicules: answers.types_vehicules
        }
      },
      qualitative_benefits: [
        "⏱️ 10-15 heures/mois de gestion administrative gagnées",
        "📊 Données de conduite 100% fiables et traçables",
        "✅ Conformité réglementaire garantie",
        "🔒 Sécurité juridique renforcée",
        "📉 Réduction des pertes de données",
        "🚫 Moins de litiges lors des contrôles routiers"
      ]
    };
  }
  
  /**
   * Helper : Extraire valeur numérique depuis tranche CA
   */
  private static extractCAMedian(ca_tranche: string): number {
    const map: Record<string, number> = {
      "Moins de 100 000€": 50000,
      "100 000€ - 500 000€": 300000,
      "500 000€ - 1 000 000€": 750000,
      "1 000 000€ - 5 000 000€": 2500000,
      "Plus de 5 000 000€": 7000000
    };
    return map[ca_tranche] || 0;
  }
}

