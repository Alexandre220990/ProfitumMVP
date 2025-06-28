import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Product {
  id: string;
  nom: string;
  description: string;
  questions: string[];
  eligibilityCriteria: string[];
}

export interface ProductAnalysis {
  productId: string;
  productName: string;
  isEligible: boolean;
  estimatedGain: number;
  reasons: string[];
  analysisComplete: boolean;
}

export interface SequentialAnalysisState {
  currentProductIndex: number;
  totalProducts: number;
  products: Product[];
  analyzedProducts: ProductAnalysis[];
  currentProduct: Product | null;
  currentQuestionIndex: number;
  phase: 'ANALYZING' | 'RECAP' | 'RESULTS';
  profileData: any;
}

export class SequentialProductAnalyzer {
  private states: Map<string, SequentialAnalysisState> = new Map();
  
  // Produits disponibles dans l'ordre d'analyse
  private readonly PRODUCTS: Product[] = [
    {
      id: '32dd9cf8-15e2-4375-86ab-a95158d3ada1',
      nom: 'TICPE',
      description: 'Remboursement de la Taxe Intérieure de Consommation sur les Produits Énergétiques',
      questions: [
        'Dans quel secteur d\'activité évoluez-vous ?',
        'Disposez-vous de véhicules motorisés utilisant du gazole ?',
        'Combien avez-vous de poids lourds (plus de 7,5 tonnes) ?',
        'Combien avez-vous d\'engins de chantier ?',
        'Combien avez-vous de véhicules légers professionnels ?',
        'Avez-vous les factures de carburant ?',
        'Quel est le volume estimé de carburant consommé par an (en litres) ?'
      ],
      eligibilityCriteria: ['transport', 'vehicules', 'carburant', 'factures']
    },
    {
      id: 'c5d2e980-4f63-44c0-b8a9-9d6e8e21c0f7',
      nom: 'Foncier',
      description: 'Optimisation Fiscalité Foncière',
      questions: [
        'Êtes-vous propriétaire de vos bâtiments professionnels ou d\'un local d\'activité ?',
        'Disposez-vous d\'un avis de taxe foncière ?',
        'Quelle est la surface totale des locaux ?',
        'Où sont situés ces biens (adresse ou ville) ?',
        'Connaissez-vous le montant de la taxe foncière annuelle ?'
      ],
      eligibilityCriteria: ['proprietaire', 'locaux', 'taxe_fonciere']
    },
    {
      id: 'd1e8f740-7c2a-4b5e-9a91-0e15c0e7d3a2',
      nom: 'URSSAF',
      description: 'Optimisation de Charges Sociales',
      questions: [
        'Combien de salariés comptez-vous actuellement ?',
        'Avez-vous des situations complexes à gérer (arrêts de travail, intérim, dirigeants, multi-contrats...) ?',
        'Avez-vous déjà réalisé un audit URSSAF ou détecté des régularisations inattendues ?',
        'Connaissez-vous votre masse salariale annuelle ?',
        'Avez-vous accès à vos bordereaux URSSAF récents ?'
      ],
      eligibilityCriteria: ['salaries', 'masse_salariale', 'bordereaux']
    },
    {
      id: 'f3a7b920-9e4c-4d8d-a680-2e89d2c0d5c6',
      nom: 'MSA',
      description: 'Optimisation Charges MSA',
      questions: [
        'Êtes-vous dans le secteur agricole ou avez-vous des activités agricoles ?',
        'Combien d\'employés agricoles avez-vous ?',
        'Avez-vous des contrats de travail agricoles ?',
        'Connaissez-vous vos charges MSA actuelles ?'
      ],
      eligibilityCriteria: ['agricole', 'employes_agricoles', 'charges_msa']
    },
    {
      id: 'bc2b94ec-659b-4cf5-a693-d61178b03caf',
      nom: 'Optimisation Énergie',
      description: 'Optimisation des contrats d\'électricité et de gaz',
      questions: [
        'Avez-vous des contrats d\'électricité et/ou de gaz pour vos locaux professionnels ?',
        'Quelle est votre consommation annuelle d\'électricité (kWh) ?',
        'Quelle est votre consommation annuelle de gaz (kWh) ?',
        'Avez-vous des factures d\'énergie récentes ?',
        'Souhaitez-vous optimiser vos contrats énergétiques ?'
      ],
      eligibilityCriteria: ['contrats_energie', 'consommation', 'factures']
    },
    {
      id: 'e2f9a830-8d3b-4c7c-b590-1d7631c0d4b5',
      nom: 'DFS',
      description: 'Déduction Forfaitaire Spécifique',
      questions: [
        'Dans quel secteur opèrent vos salariés (ex : BTP, transport, sécurité, spectacle...) ?',
        'Appliquez-vous actuellement une DFS sur vos bulletins de paie ?',
        'Combien de salariés sont concernés par la DFS ?',
        'Souhaitez-vous vérifier si vous pouvez bénéficier ou optimiser cette déduction ?'
      ],
      eligibilityCriteria: ['secteur_dfs', 'salaries_dfs', 'optimisation']
    },
    {
      id: 'b7f3c891-28d9-4982-b0eb-821c9e7cbcf0',
      nom: 'CEE',
      description: 'Aides CEE - Certificats d\'économies d\'énergie',
      questions: [
        'Avez-vous des projets d\'amélioration énergétique (isolation, chauffage, éclairage...) ?',
        'Quelle est la surface de vos locaux à rénover ?',
        'Avez-vous des devis pour des travaux d\'économie d\'énergie ?',
        'Souhaitez-vous bénéficier d\'aides pour vos travaux ?'
      ],
      eligibilityCriteria: ['travaux_energie', 'surface', 'devis', 'aides']
    }
  ];

  constructor() {}

  // 🎯 Point d'entrée principal
  async processMessage(
    clientId: string,
    message: string,
    profileData: any = {}
  ): Promise<{
    response: string;
    phase: 'ANALYZING' | 'RECAP' | 'RESULTS';
    currentProduct: Product | null;
    analyzedProducts: ProductAnalysis[];
    isComplete: boolean;
  }> {
    try {
      // Récupérer ou créer l'état d'analyse
      const state = this.getOrCreateState(clientId, profileData);
      
      // Traiter le message selon la phase
      if (state.phase === 'ANALYZING') {
        return this.processAnalyzingPhase(state, message);
      } else if (state.phase === 'RECAP') {
        return this.processRecapPhase(state, message);
      } else {
        return this.processResultsPhase(state, message);
      }
    } catch (error) {
      console.error('❌ Erreur SequentialProductAnalyzer:', error);
      return {
        response: "Désolé, je rencontre un problème technique. Pouvez-vous réessayer ?",
        phase: 'ANALYZING',
        currentProduct: null,
        analyzedProducts: [],
        isComplete: false
      };
    }
  }

  // 🔄 Traitement de la phase d'analyse
  private processAnalyzingPhase(
    state: SequentialAnalysisState, 
    message: string
  ): {
    response: string;
    phase: 'ANALYZING' | 'RECAP' | 'RESULTS';
    currentProduct: Product | null;
    analyzedProducts: ProductAnalysis[];
    isComplete: boolean;
  } {
    const currentProduct = state.products[state.currentProductIndex];
    
    if (!currentProduct) {
      // Tous les produits analysés, passer aux résultats
      state.phase = 'RESULTS';
      return {
        response: this.generateFinalResults(state),
        phase: 'RESULTS',
        currentProduct: null,
        analyzedProducts: state.analyzedProducts,
        isComplete: true
      };
    }

    // Analyser la réponse pour le produit courant
    const analysis = this.analyzeProductEligibility(currentProduct, message, state.profileData);
    state.analyzedProducts.push(analysis);

    // Passer au récapitulatif
    state.phase = 'RECAP';
    
    return {
      response: this.generateProductRecap(currentProduct, analysis),
      phase: 'RECAP',
      currentProduct,
      analyzedProducts: state.analyzedProducts,
      isComplete: false
    };
  }

  // 📋 Traitement de la phase de récapitulatif
  private processRecapPhase(
    state: SequentialAnalysisState, 
    message: string
  ): {
    response: string;
    phase: 'ANALYZING' | 'RECAP' | 'RESULTS';
    currentProduct: Product | null;
    analyzedProducts: ProductAnalysis[];
    isComplete: boolean;
  } {
    // Passer au produit suivant
    state.currentProductIndex++;
    
    if (state.currentProductIndex >= state.products.length) {
      // Tous les produits analysés
      state.phase = 'RESULTS';
      return {
        response: this.generateFinalResults(state),
        phase: 'RESULTS',
        currentProduct: null,
        analyzedProducts: state.analyzedProducts,
        isComplete: true
      };
    }

    // Passer au produit suivant
    state.phase = 'ANALYZING';
    const nextProduct = state.products[state.currentProductIndex];
    
    return {
      response: this.generateProductIntroduction(nextProduct),
      phase: 'ANALYZING',
      currentProduct: nextProduct,
      analyzedProducts: state.analyzedProducts,
      isComplete: false
    };
  }

  // 🎯 Traitement de la phase de résultats
  private processResultsPhase(
    state: SequentialAnalysisState, 
    message: string
  ): {
    response: string;
    phase: 'ANALYZING' | 'RECAP' | 'RESULTS';
    currentProduct: Product | null;
    analyzedProducts: ProductAnalysis[];
    isComplete: boolean;
  } {
    return {
      response: this.generateFinalResults(state),
      phase: 'RESULTS',
      currentProduct: null,
      analyzedProducts: state.analyzedProducts,
      isComplete: true
    };
  }

  // 🔍 Analyser l'éligibilité d'un produit
  private analyzeProductEligibility(
    product: Product, 
    message: string, 
    profileData: any
  ): ProductAnalysis {
    const messageLower = message.toLowerCase();
    const profileDataStr = JSON.stringify(profileData).toLowerCase();
    
    // Logique d'analyse basée sur les critères
    let isEligible = false;
    let estimatedGain = 0;
    let reasons: string[] = [];

    switch (product.nom) {
      case 'TICPE':
        if (messageLower.includes('transport') || messageLower.includes('véhicule') || messageLower.includes('carburant')) {
          isEligible = true;
          estimatedGain = 50000;
          reasons = ['Secteur transport', 'Véhicules professionnels', 'Consommation carburant'];
        }
        break;
      case 'Foncier':
        if (messageLower.includes('propriétaire') || messageLower.includes('local') || messageLower.includes('taxe foncière')) {
          isEligible = true;
          estimatedGain = 15000;
          reasons = ['Propriétaire de locaux', 'Taxe foncière applicable'];
        }
        break;
      case 'URSSAF':
        if (messageLower.includes('salarié') || messageLower.includes('masse salariale')) {
          isEligible = true;
          estimatedGain = 25000;
          reasons = ['Salariés présents', 'Masse salariale significative'];
        }
        break;
      case 'DFS':
        if (messageLower.includes('btp') || messageLower.includes('transport') || messageLower.includes('sécurité')) {
          isEligible = true;
          estimatedGain = 8820;
          reasons = ['Secteur éligible DFS', 'Salariés concernés'];
        }
        break;
      default:
        // Analyse générique pour les autres produits
        if (messageLower.includes('oui') || messageLower.includes('effectivement') || messageLower.includes('correct')) {
          isEligible = true;
          estimatedGain = 10000;
          reasons = ['Réponse positive', 'Critères remplis'];
        }
    }

    return {
      productId: product.id,
      productName: product.nom,
      isEligible,
      estimatedGain,
      reasons,
      analysisComplete: true
    };
  }

  // 📝 Générer l'introduction d'un produit
  private generateProductIntroduction(product: Product): string {
    return `🔍 **Analyse du produit : ${product.nom}**

${product.description}

${product.questions[0]}

*Répondez simplement à cette question pour que je puisse évaluer votre éligibilité.*`;
  }

  // 📋 Générer le récapitulatif d'un produit
  private generateProductRecap(product: Product, analysis: ProductAnalysis): string {
    if (analysis.isEligible) {
      return `✅ **Récapitulatif ${product.nom}**

🎯 **Éligible** - Gain estimé : ${analysis.estimatedGain.toLocaleString()}€

📋 **Raisons :**
${analysis.reasons.map(reason => `• ${reason}`).join('\n')}

💡 *Nous avons identifié une opportunité d'optimisation pour ce produit.*

**Passons maintenant au produit suivant...**`;
    } else {
      return `❌ **Récapitulatif ${product.nom}**

🔍 **Non éligible** pour le moment

💡 *Ce produit ne semble pas applicable à votre situation actuelle.*

**Passons au produit suivant...**`;
    }
  }

  // 🎯 Générer les résultats finaux
  private generateFinalResults(state: SequentialAnalysisState): string {
    const eligibleProducts = state.analyzedProducts.filter(p => p.isEligible);
    const totalGain = eligibleProducts.reduce((sum, p) => sum + p.estimatedGain, 0);

    let response = `🎉 **Analyse terminée !**

📊 **Résultats de votre analyse :**

✅ **${eligibleProducts.length} produits éligibles** identifiés
💰 **Gain total estimé : ${totalGain.toLocaleString()}€**

📋 **Produits éligibles :**
`;

    eligibleProducts.forEach(product => {
      response += `• **${product.productName}** : ${product.estimatedGain.toLocaleString()}€\n`;
    });

    if (eligibleProducts.length === 0) {
      response += `\n❌ **Aucun produit éligible** identifié pour le moment.\n\n💡 *Cela peut évoluer selon votre situation. N'hésitez pas à nous recontacter.*`;
    } else {
      response += `\n🚀 **Prochaines étapes :**\n• Nos experts vont analyser votre dossier\n• Vous recevrez une proposition détaillée\n• Mise en place des optimisations identifiées`;
    }

    return response;
  }

  // 🔧 Récupérer ou créer l'état d'analyse
  private getOrCreateState(clientId: string, profileData: any): SequentialAnalysisState {
    if (!this.states.has(clientId)) {
      const initialState: SequentialAnalysisState = {
        currentProductIndex: 0,
        totalProducts: this.PRODUCTS.length,
        products: [...this.PRODUCTS],
        analyzedProducts: [],
        currentProduct: this.PRODUCTS[0],
        currentQuestionIndex: 0,
        phase: 'ANALYZING',
        profileData
      };
      this.states.set(clientId, initialState);
    }
    return this.states.get(clientId)!;
  }

  // 🧹 Nettoyer l'état d'un client
  public clearState(clientId: string): void {
    this.states.delete(clientId);
  }
} 