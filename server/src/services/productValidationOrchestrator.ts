import { Pool } from 'pg';
import { ClientProfile } from './eligibilityEngine';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { SequentialProductAnalyzer } from './sequentialProductAnalyzer';

dotenv.config();

// Pool PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

// Initialiser le client OpenAI seulement si la clé est disponible
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log('✅ Client OpenAI initialisé');
} else {
  console.log('⚠️  Clé OpenAI non trouvée - fonctionnalités IA désactivées');
}

// Instance du service d'analyse séquentielle
const sequentialAnalyzer = new SequentialProductAnalyzer();

// États de validation produit
export enum ValidationPhase {
  WELCOME = 'welcome',
  COLLECTING_PROFILE = 'collecting_profile',
  VALIDATING_PRODUCTS = 'validating_products',
  COMPLETED = 'completed',
  // Nouveaux états séquentiels
  SEQUENTIAL_MODE = 'sequential_mode',
  ANALYZING_PRODUCT = 'analyzing_product',
  RECAP_PRODUCT = 'recap_product',
  SHOWING_RESULTS = 'showing_results'
}

// Interface pour l'état séquentiel
export interface SequentialState {
  currentProductIndex: number;
  totalProducts: number;
  products: Array<{
    id: string;
    nom: string;
    description: string;
    isEligible: boolean;
    estimatedGain: number;
    reasons: string[];
    analysisComplete: boolean;
  }>;
  currentProduct: {
    id: string;
    nom: string;
    description: string;
    questions: string[];
    currentQuestionIndex: number;
  } | null;
}

export interface ValidationState {
  simulationId: string;
  clientId: string;
  phase: ValidationPhase;
  profileData: ClientProfile;
  conversationHistory: Array<{role: 'user' | 'assistant', content: string, timestamp: Date}>;
  lastInteraction: Date;
  collectedInfo: {
    secteur?: string;
    nombreEmployes?: number;
    chiffreAffaires?: string;
    vehiculesProfessionnels?: boolean;
    activitesRD?: boolean;
    proprietaireLocaux?: boolean;
    nombreCamions?: number;
    consommationCarburant?: number;
    activitesEnergetiques?: boolean;
    taxeFonciere?: number;
    masseSalariale?: number;
    salaireBrutMoyen?: number;
    consommationEnergie?: number;
    metiersDFS?: boolean;
    dfsAppliquee?: boolean;
    accordBranche?: boolean;
    [key: string]: any;
  };
  eligibleProducts: Array<{
    id: string;
    nom: string;
    description: string;
    estimatedGain: number;
    reasons: string[];
  }>;
  // Nouveau : état séquentiel
  sequentialState?: SequentialState;
  // Nouveau : mode séquentiel
  sequentialMode?: boolean;
}

export interface ValidationResponse {
  response: string;
  phase: ValidationPhase;
  isComplete: boolean;
  eligibleProducts: Array<{
    id: string;
    nom: string;
    description: string;
    estimatedGain: number;
    reasons: string[];
  }>;
  profileData: ClientProfile;
}

export class ProductValidationOrchestrator {
  private states: Map<string, ValidationState> = new Map();

  constructor() {}

  // 🎯 Traitement principal du message utilisateur
  async processUserMessage(
    simulationId: string,
    clientId: string,
    message: string,
    history: Array<{role: 'user' | 'assistant', content: string, timestamp: Date}> = []
  ): Promise<ValidationResponse> {
    try {
      // Récupérer ou créer l'état de validation
      const state = await this.getOrCreateValidationState(simulationId, clientId, history);
      
      // Ajouter le message utilisateur à l'historique
      state.conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // Analyser le message et extraire les informations
      this.analyzeMessageAndUpdateProfile(state, message);

      // Traiter selon la phase actuelle
      const response = await this.processCurrentPhase(state, message);
      
      // Ajouter la réponse à l'historique
      state.conversationHistory.push({
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      });

      // Sauvegarder l'état
      await this.saveValidationState(state);

      return response;
    } catch (error) {
      console.error('❌ Erreur processUserMessage:', error);
      return {
        response: "Désolé, je rencontre un problème technique. Pouvez-vous réessayer ?",
        phase: ValidationPhase.WELCOME,
        isComplete: false,
        eligibleProducts: [],
        profileData: { besoinsSpecifiques: [] }
      };
    }
  }

  // 🔄 Traitement selon la phase actuelle
  private async processCurrentPhase(state: ValidationState, message: string): Promise<ValidationResponse> {
    switch (state.phase) {
      case ValidationPhase.WELCOME:
        return this.processWelcome(state);
      case ValidationPhase.COLLECTING_PROFILE:
        return this.processProfileCollection(state, message);
      case ValidationPhase.VALIDATING_PRODUCTS:
        return this.processProductValidation(state, message);
      case ValidationPhase.COMPLETED:
        return this.processCompleted(state, message);
      default:
        return this.processWelcome(state);
    }
  }

  // 👋 Phase d'accueil
  private async processWelcome(state: ValidationState): Promise<ValidationResponse> {
    state.phase = ValidationPhase.COLLECTING_PROFILE;
    
    const systemPrompt = `Tu es un assistant conversationnel expert en optimisation de charges pour entreprises, intégré dans la plateforme Profitum. Tu aides les professionnels à identifier les dispositifs auxquels ils peuvent prétendre et à estimer les économies potentielles. 

Tu guides l'utilisateur à travers deux grandes étapes : 

1. Une **présentation claire et rassurante** de Profitum, de toi (le chatbot) et de l'objectif de la simulation : identifier des optimisations possibles sans engagement.
2. Une **séquence de questions ciblées**, produit par produit (TICPE, FONCIER, FISCAL, URSSAF, DFS, Fournisseur Énergie), pour valider les cas d'usage et collecter les données nécessaires à une estimation.

Tu poses les questions avec méthode, produit par produit, dans l'ordre suivant : TICPE → FONCIER  → URSSAF → DFS → ÉNERGIE. 

Pour chaque produit :
- Tu poses des questions **adaptées à la situation** (même un petit volume peut suffire).
- Tu ne refuses jamais un produit uniquement sur des seuils bas. Ton but est d'explorer toutes les pistes.
- Si le produit semble applicable, tu collectes les données utiles pour l'estimation.
- Si le produit ne semble pas concerné, tu l'expliques simplement, sans jamais dire que ce n'est 'pas éligible'.

Tu restes professionnel, pédagogique, courtois et méthodique. Tu parles simplement et évites le jargon fiscal.

Voici les produits et les questions précises à poser pour chacun :

---

▶ **TICPE – Récupération de taxe carburant**
- Secteur d'activité ?
- Disposez-vous de véhicules motorisés utilisant du gazole ?
- Combien avez-vous de :
  - Poids lourds (plus de 7,5 tonnes) ?
  - Engins de chantier ?
  - Véhicules légers professionnels ?
- Avez-vous les factures de carburant ?
- Volume estimé de carburant consommé par an (en litres) ?

---

▶ **FONCIER – Analyse de la taxe foncière**
- Êtes-vous propriétaire de vos bâtiments professionnels ou d'un local d'activité ?
- Disposez-vous d'un avis de taxe foncière ?
- Quelle est la surface totale des locaux ?
- Où sont situés ces biens (adresse ou ville) ?
- Connaissez-vous le montant de la taxe foncière annuelle ?

---

▶ **URSSAF – Analyse des cotisations et trop-perçus**
- Combien de salariés comptez-vous actuellement ?
- Avez-vous des situations complexes à gérer (arrêts de travail, intérim, dirigeants, multi-contrats...) ?
- Avez-vous déjà réalisé un audit URSSAF ou détecté des régularisations inattendues ?
- Connaissez-vous votre masse salariale annuelle ?
- Avez-vous accès à vos bordereaux URSSAF récents ?

---

▶ **DFS – Déduction Forfaitaire Spécifique**
- Dans quel secteur opèrent vos salariés (ex : BTP, transport, sécurité, spectacle...) ?
- Appliquez-vous actuellement une DFS sur vos bulletins de paie ?
- Souhaitez-vous vérifier si vous pouvez bénéficier ou optimiser cette déduction ?
- Combien de salariés pourraient être concernés ?
- Connaissez-vous leur salaire brut mensuel moyen ?

---

▶ **Fournisseur ÉNERGIE – Optimisation des contrats**
- Avez-vous des contrats d'électricité et/ou de gaz pour vos locaux professionnels ?
- Connaissez-vous votre consommation annuelle d'énergie (électricité et gaz) ?
- Savez-vous à quel prix vous payez votre kWh (ou avez-vous une facture récente) ?
- Depuis combien de temps n'avez-vous pas renégocié votre contrat ?
- Souhaitez-vous recevoir une étude personnalisée et sans engagement ?

---

Tu traites chaque produit indépendamment, puis tu passes au suivant. À la fin, tu résumes les produits concernés, donne une estimation indicative, enregistre la simulation et tu affiches un bouton "Revenir au dashboard".

Commence par une présentation claire et rassurante de Profitum et de ton rôle, puis demande le secteur d'activité de l'entreprise.`;

    const response = await this.getOpenAIResponse(systemPrompt, state.conversationHistory);
    
    return {
      response,
      phase: state.phase,
      isComplete: false,
      eligibleProducts: [],
      profileData: state.profileData
    };
  }

  // 👤 Phase de collecte du profil
  private async processProfileCollection(state: ValidationState, message: string): Promise<ValidationResponse> {
    const collectedInfo = state.collectedInfo;
    
    // Vérifier si l'utilisateur demande explicitement les résultats
    const text = message.toLowerCase();
    const demandeResultats = text.includes('simulation') || text.includes('résultat') || text.includes('proposition') || 
        text.includes('voir') || text.includes('analyse') || text.includes('terminé') || 
        text.includes('fin') || text.includes('conclusion') || text.includes('propose') ||
        text.includes('montre') || text.includes('donne') || text.includes('présente');
    
    console.log('🔍 Analyse de la demande:', text, 'Demande résultats:', demandeResultats);
    
    if (demandeResultats) {
      console.log('🎯 Utilisateur demande les résultats, passage à l\'analyse');
      state.phase = ValidationPhase.VALIDATING_PRODUCTS;
      return this.processProductValidation(state, message);
    }
    
    // Vérifier si on a assez d'informations pour passer à la validation des produits
    const hasSecteur = !!collectedInfo.secteur;
    const hasEmployes = !!collectedInfo.nombreEmployes;
    const hasChiffreAffaires = !!collectedInfo.chiffreAffaires;
    const hasVehicules = !!collectedInfo.vehiculesProfessionnels;
    const hasCamions = !!collectedInfo.nombreCamions;
    const hasCarburant = !!collectedInfo.consommationCarburant;
    
    const infoCount = [hasSecteur, hasEmployes, hasChiffreAffaires, hasVehicules, hasCamions, hasCarburant]
      .filter(Boolean).length;
    
    console.log('📊 Comptage des informations:', { hasSecteur, hasEmployes, hasChiffreAffaires, hasVehicules, hasCamions, hasCarburant, infoCount });
    
    // Si on a le secteur + au moins 3 autres informations importantes, on peut analyser
    if (hasSecteur && infoCount >= 4) {
      console.log('🎯 Assez d\'informations collectées, passage à l\'analyse des produits');
      state.phase = ValidationPhase.VALIDATING_PRODUCTS;
      return this.processProductValidation(state, message);
    }

    const missingInfo = [];
    if (!collectedInfo.secteur) missingInfo.push('- Secteur d\'activité');
    if (!collectedInfo.nombreEmployes) missingInfo.push('- Nombre d\'employés');
    if (!collectedInfo.chiffreAffaires) missingInfo.push('- Chiffre d\'affaires');
    if (!collectedInfo.vehiculesProfessionnels && collectedInfo.secteur === 'transport') missingInfo.push('- Informations sur les véhicules');

    const systemPrompt = `Tu es un assistant conversationnel expert en optimisation de charges pour entreprises, intégré dans la plateforme Profitum. Tu continues la collecte d'informations de manière méthodique et professionnelle.

Informations déjà collectées :
${Object.entries(collectedInfo).filter(([_, value]) => value !== undefined && value !== null && value !== '').map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Tu poses les questions avec méthode, produit par produit, dans l'ordre suivant : TICPE → FONCIER → URSSAF → DFS → ÉNERGIE.

Pour chaque produit :
- Tu poses des questions **adaptées à la situation** (même un petit volume peut suffire).
- Tu ne refuses jamais un produit uniquement sur des seuils bas. Ton but est d'explorer toutes les pistes.
- Si le produit semble applicable, tu collectes les données utiles pour l'estimation.
- Si le produit ne semble pas concerné, tu l'expliques simplement, sans jamais dire que ce n'est 'pas éligible'.

Tu restes professionnel, pédagogique, courtois et méthodique. Tu parles simplement et évites le jargon fiscal.

Pose la prochaine question pertinente pour collecter les informations manquantes. Sois naturel et conversationnel.`;

    const response = await this.getOpenAIResponse(systemPrompt, state.conversationHistory);
    
    return {
      response,
      phase: state.phase,
      isComplete: false,
      eligibleProducts: [],
      profileData: state.profileData
    };
  }

  // ✅ Phase de validation des produits
  private async processProductValidation(state: ValidationState, message: string): Promise<ValidationResponse> {
    const collectedInfo = state.collectedInfo;
    
    console.log('🔍 Début analyse éligibilité avec données:', collectedInfo);
    
    // Analyser l'éligibilité aux produits
    const eligibleProducts = this.analyzeEligibility(collectedInfo);
    state.eligibleProducts = eligibleProducts;

    console.log('🎯 Produits éligibles trouvés:', eligibleProducts.length);

    // Toujours passer à la phase finale si on a des produits éligibles
    if (eligibleProducts.length > 0) {
      console.log('✅ Produits éligibles trouvés, passage à la phase finale');
      state.phase = ValidationPhase.COMPLETED;
      return this.generateFinalSummary(state);
    }

    // Si aucun produit éligible, générer quand même un résumé avec des recommandations
    console.log('⚠️ Aucun produit éligible, génération d\'un résumé avec recommandations');
    state.phase = ValidationPhase.COMPLETED;
    
    // Créer des produits recommandés basés sur le profil
    const recommendedProducts = this.generateRecommendedProducts(collectedInfo);
    state.eligibleProducts = recommendedProducts;
    
    return this.generateFinalSummary(state);
  }

  // 🎯 Générer le résumé final
  private generateFinalSummary(state: ValidationState): ValidationResponse {
    const eligibleProducts = state.eligibleProducts;
    const totalGain = eligibleProducts.reduce((sum, p) => sum + p.estimatedGain, 0);
    
    const productsList = eligibleProducts.map((p, i) => `${i + 1}. **${p.nom}** - ${p.estimatedGain.toLocaleString()}€`).join('\n');
    
    return {
      response: `🎉 **Analyse terminée !**\n\n💰 **Gain total estimé : ${totalGain.toLocaleString()}€**\n\n${productsList}\n\n💡 **Prochaines étapes :**\n1. Validation détaillée par nos experts\n2. Optimisation des montants\n3. Mise en place des dossiers\n\n🤝 Nos experts sont là pour vous accompagner !`,
      phase: ValidationPhase.COMPLETED,
      isComplete: true,
      eligibleProducts,
      profileData: state.profileData
    };
  }

  // 🔄 Traitement de la phase terminée
  private processCompleted(state: ValidationState, message: string): ValidationResponse {
    return {
      response: "L'analyse est terminée. Nos experts peuvent vous accompagner pour la mise en place des dispositifs identifiés.",
      phase: ValidationPhase.COMPLETED,
      isComplete: true,
      eligibleProducts: state.eligibleProducts,
      profileData: state.profileData
    };
  }

  // 🗃️ Récupérer ou créer l'état de validation
  private async getOrCreateValidationState(
    simulationId: string,
    clientId: string,
    history: Array<{role: 'user' | 'assistant', content: string, timestamp: Date}>
  ): Promise<ValidationState> {
    
    if (this.states.has(simulationId)) {
      const state = this.states.get(simulationId)!;
      state.lastInteraction = new Date();
      return state;
    }

    const newState: ValidationState = {
      simulationId,
      clientId,
      phase: ValidationPhase.WELCOME,
      profileData: { besoinsSpecifiques: [] },
      conversationHistory: history,
      lastInteraction: new Date(),
      collectedInfo: {},
      eligibleProducts: []
    };

    this.states.set(simulationId, newState);
    return newState;
  }

  // 🔍 Analyser le message et mettre à jour le profil
  private analyzeMessageAndUpdateProfile(state: ValidationState, message: string): void {
    const text = message.toLowerCase();
    console.log('🔍 Analyse du message:', text);

    // Secteur d'activité
    if (text.includes('transport') || text.includes('livraison') || text.includes('logistique')) {
      state.collectedInfo.secteur = 'transport';
    } else if (text.includes('bâtiment') || text.includes('construction') || text.includes('btp')) {
      state.collectedInfo.secteur = 'btp';
    } else if (text.includes('commerce') || text.includes('vente') || text.includes('retail')) {
      state.collectedInfo.secteur = 'commerce';
    } else if (text.includes('industrie') || text.includes('manufacture') || text.includes('production')) {
      state.collectedInfo.secteur = 'industrie';
    } else if (text.includes('service') || text.includes('conseil') || text.includes('bureau')) {
      state.collectedInfo.secteur = 'services';
    } else if (text.includes('restaurant') || text.includes('hôtel') || text.includes('hôtellerie')) {
      state.collectedInfo.secteur = 'hotellerie';
    } else if (text.includes('sécurité') || text.includes('surveillance')) {
      state.collectedInfo.secteur = 'securite';
    } else if (text.includes('spectacle') || text.includes('événementiel')) {
      state.collectedInfo.secteur = 'spectacle';
    }

    // Nombre d'employés
    const employesMatch = text.match(/(\d+)\s*(employé|salarié|personne|équipe)/);
    if (employesMatch) {
      state.collectedInfo.nombreEmployes = parseInt(employesMatch[1]);
    }

    // Chiffre d'affaires
    const caMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:millions?|m|k|euros?|€)/);
    if (caMatch) {
      let ca = parseFloat(caMatch[1].replace(',', '.'));
      if (text.includes('millions') || text.includes('m')) {
        ca *= 1000000;
      } else if (text.includes('k')) {
        ca *= 1000;
      }
      state.collectedInfo.chiffreAffaires = ca.toString();
    }

    // Véhicules professionnels
    if (text.includes('camion') || text.includes('poids lourd') || text.includes('véhicule') || 
        text.includes('voiture') || text.includes('utilitaire') || text.includes('engin')) {
      state.collectedInfo.vehiculesProfessionnels = true;
    }

    // Nombre de camions/poids lourds
    const camionsMatch = text.match(/(\d+)\s*(camion|poids lourd|engin)/);
    if (camionsMatch) {
      state.collectedInfo.nombreCamions = parseInt(camionsMatch[1]);
    }

    // Consommation carburant
    const carburantMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:litres?|l|kilos?|kg)/);
    if (carburantMatch && (text.includes('carburant') || text.includes('gazole') || text.includes('diesel') || text.includes('consomme') || text.includes('consomme'))) {
      let consommation = parseFloat(carburantMatch[1].replace(',', '.'));
      if (text.includes('kilos') || text.includes('kg')) {
        consommation *= 1.2; // Conversion kg vers litres (approximatif)
      }
      state.collectedInfo.consommationCarburant = consommation;
    }

    // Propriété de locaux
    if (text.includes('propriétaire') || text.includes('locaux') || text.includes('bâtiment') || 
        text.includes('immeuble') || text.includes('local')) {
      state.collectedInfo.proprietaireLocaux = true;
    }

    // Taxe foncière
    const taxeFonciereMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:euros?|€).*taxe foncière/);
    if (taxeFonciereMatch) {
      const taxe = parseFloat(taxeFonciereMatch[1].replace(',', '.'));
      state.collectedInfo.taxeFonciere = taxe;
    }

    // Masse salariale
    const masseSalarialeMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:millions?|m|k|euros?|€).*masse salariale/);
    if (masseSalarialeMatch) {
      let masse = parseFloat(masseSalarialeMatch[1].replace(',', '.'));
      if (text.includes('millions') || text.includes('m')) {
        masse *= 1000000;
      } else if (text.includes('k')) {
        masse *= 1000;
      }
      state.collectedInfo.masseSalariale = masse;
    }

    // Salaire brut moyen
    const salaireMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:euros?|€).*salaire/);
    if (salaireMatch) {
      const salaire = parseFloat(salaireMatch[1].replace(',', '.'));
      state.collectedInfo.salaireBrutMoyen = salaire;
    }

    // Consommation énergie
    const energieMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:kwh|kilowattheures?)/);
    if (energieMatch && (text.includes('électricité') || text.includes('gaz') || text.includes('énergie'))) {
      const consommation = parseFloat(energieMatch[1].replace(',', '.'));
      state.collectedInfo.consommationEnergie = consommation;
    }

    // Activités énergétiques
    if (text.includes('énergie') || text.includes('électricité') || text.includes('gaz') || 
        text.includes('chauffage') || text.includes('climatisation') || text.includes('contrat énergie')) {
      state.collectedInfo.activitesEnergetiques = true;
    }

    // DFS - Déduction Forfaitaire Spécifique
    if (text.includes('dfs') || text.includes('déduction forfaitaire') || text.includes('déduction spécifique') ||
        text.includes('métier technique') || text.includes('métier physique') || text.includes('métier manuel') ||
        text.includes('btp') || text.includes('maintenance') || text.includes('sécurité') || 
        text.includes('spectacle') || text.includes('hôtellerie') || text.includes('restauration')) {
      state.collectedInfo.metiersDFS = true;
    }

    // DFS déjà appliquée
    if (text.includes('dfs appliquée') || text.includes('déduction déjà') || text.includes('déjà appliqué')) {
      state.collectedInfo.dfsAppliquee = true;
    }

    // Accord de branche
    if (text.includes('accord de branche') || text.includes('convention collective') || text.includes('accord collectif')) {
      state.collectedInfo.accordBranche = true;
    }

    console.log('📊 Informations collectées mises à jour:', state.collectedInfo);
  }

  // 📊 Analyser l'éligibilité aux produits avec les nouvelles règles de calcul
  private analyzeEligibility(collectedInfo: any): Array<{
    id: string;
    nom: string;
    description: string;
    estimatedGain: number;
    reasons: string[];
  }> {
    console.log('🔍 Analyse éligibilité avec les nouvelles règles de calcul:', collectedInfo);
    
    const eligible: Array<{
      id: string;
      nom: string;
      description: string;
      estimatedGain: number;
      reasons: string[];
    }> = [];

    const chiffreAffaires = ProductValidationOrchestrator.extractAmount(collectedInfo.chiffreAffaires || '0');
    console.log('💰 Chiffre d\'affaires extrait:', chiffreAffaires);

    // 1. TICPE – Taxe sur les carburants professionnels
    if (collectedInfo.vehiculesProfessionnels && collectedInfo.consommationCarburant) {
      console.log('✅ TICPE éligible - véhicules professionnels et consommation carburant');
      // Formule : litres consommés × 0,17€
      const gain = Math.round(collectedInfo.consommationCarburant * 0.17);
      const gainFinal = Math.min(Math.max(gain, 1000), 100000); // Entre 1000€ et 100000€
      
      eligible.push({
        id: 'TICPE',
        nom: 'Récupération TICPE',
        description: 'Remboursement de la taxe sur les carburants professionnels',
        estimatedGain: gainFinal,
        reasons: [
          'Véhicules professionnels',
          `${collectedInfo.consommationCarburant} litres/an`,
          'Taux de récupération : 0,17€/litre'
        ]
      });
    } else if (collectedInfo.secteur === 'transport' && collectedInfo.vehiculesProfessionnels) {
      console.log('✅ TICPE éligible - secteur transport, estimation basée sur le CA');
      // Estimation basée sur le CA si pas de consommation précise
      const gain = Math.round(chiffreAffaires * 0.02);
      const gainFinal = Math.min(Math.max(gain, 2000), 50000);
      
      eligible.push({
        id: 'TICPE',
        nom: 'Récupération TICPE',
        description: 'Remboursement de la taxe sur les carburants professionnels',
        estimatedGain: gainFinal,
        reasons: [
          'Secteur transport',
          'Véhicules professionnels',
          'Estimation basée sur le CA'
        ]
      });
    }

    // 2. FONCIER – Taxe foncière sur les propriétés bâties
    if (collectedInfo.proprietaireLocaux && collectedInfo.taxeFonciere) {
      console.log('✅ FONCIER éligible - propriétaire de locaux avec taxe foncière');
      // Formule : taxe foncière × 30% (taux d'erreur estimé)
      const gain = Math.round(collectedInfo.taxeFonciere * 0.30);
      const gainFinal = Math.min(Math.max(gain, 500), 25000);
      
      eligible.push({
        id: 'FONCIER',
        nom: 'Optimisation Taxe Foncière',
        description: 'Optimisation de la taxe foncière sur les propriétés bâties',
        estimatedGain: gainFinal,
        reasons: [
          'Propriétaire de locaux',
          `Taxe foncière : ${collectedInfo.taxeFonciere}€`,
          'Taux d\'erreur estimé : 30%'
        ]
      });
    } else if (collectedInfo.proprietaireLocaux) {
      console.log('✅ FONCIER éligible - propriétaire de locaux, estimation');
      // Estimation si pas de taxe foncière précise
      const gain = Math.round(chiffreAffaires * 0.01);
      const gainFinal = Math.min(Math.max(gain, 500), 25000);
      
      eligible.push({
        id: 'FONCIER',
        nom: 'Optimisation Taxe Foncière',
        description: 'Optimisation de la taxe foncière sur les propriétés bâties',
        estimatedGain: gainFinal,
        reasons: [
          'Propriétaire de locaux',
          'Estimation basée sur le CA',
          'Optimisation possible'
        ]
      });
    }

    // 3. URSSAF – Trop-perçus ou régularisations
    if (collectedInfo.nombreEmployes && collectedInfo.nombreEmployes >= 3) {
      console.log('✅ URSSAF éligible -', collectedInfo.nombreEmployes, 'employés');
      // Formule : masse salariale × 2%
      const masseSalariale = collectedInfo.masseSalariale || (collectedInfo.nombreEmployes * 35000);
      const gain = Math.round(masseSalariale * 0.02);
      const gainFinal = Math.min(Math.max(gain, 2000), 80000);
      
      eligible.push({
        id: 'URSSAF',
        nom: 'Optimisation URSSAF',
        description: 'Trop-perçus et régularisations de cotisations sociales',
        estimatedGain: gainFinal,
        reasons: [
          `${collectedInfo.nombreEmployes} employés`,
          'Taux d\'optimisation : 2% de la masse salariale',
          'Régularisations possibles'
        ]
      });
    }

    // 4. DFS – Déduction Forfaitaire Spécifique
    if (collectedInfo.nombreEmployes && collectedInfo.nombreEmployes >= 2) {
      console.log('✅ DFS éligible -', collectedInfo.nombreEmployes, 'employés');
      // Formule : nombre de salariés × salaire brut × taux DFS × charges patronales
      const salaireBrutMoyen = collectedInfo.salaireBrutMoyen || 2500;
      const tauxDFS = 0.10; // 10% en moyenne
      const chargesPatronales = 0.42; // 42% en moyenne
      const salariesConcernes = Math.round(collectedInfo.nombreEmployes * 0.7); // 70% des salariés concernés
      
      const gain = Math.round(salariesConcernes * salaireBrutMoyen * 12 * tauxDFS * chargesPatronales);
      const gainFinal = Math.min(Math.max(gain, 1000), 60000);
      
      eligible.push({
        id: 'DFS',
        nom: 'Déduction Forfaitaire Spécifique',
        description: 'Réduction de l\'assiette des cotisations sociales pour métiers techniques',
        estimatedGain: gainFinal,
        reasons: [
          `${salariesConcernes} salariés concernés`,
          `Taux DFS : ${(tauxDFS * 100)}%`,
          'Économies sur charges patronales'
        ]
      });
    }

    // 5. ENERGIE – Optimisation des contrats
    if (collectedInfo.consommationEnergie) {
      console.log('✅ ENERGIE éligible - consommation énergie précise');
      // Formule : consommation annuelle × différence de prix (ex: 0,03€/kWh)
      const differencePrix = 0.03; // 3 centimes d'économie par kWh
      const gain = Math.round(collectedInfo.consommationEnergie * differencePrix);
      const gainFinal = Math.min(Math.max(gain, 500), 20000);
      
      eligible.push({
        id: 'ENERGIE',
        nom: 'Optimisation Énergie',
        description: 'Optimisation des contrats d\'électricité et de gaz',
        estimatedGain: gainFinal,
        reasons: [
          'Contrats d\'énergie',
          `${collectedInfo.consommationEnergie} kWh/an`,
          `Économie : ${differencePrix}€/kWh`
        ]
      });
    } else if (collectedInfo.activitesEnergetiques) {
      console.log('✅ ENERGIE éligible - activités énergétiques, estimation');
      // Estimation si pas de consommation précise
      const consommation = Math.round(chiffreAffaires * 0.005);
      const differencePrix = 0.03; // 3 centimes d'économie par kWh
      const gain = Math.round(consommation * differencePrix);
      const gainFinal = Math.min(Math.max(gain, 500), 20000);
      
      eligible.push({
        id: 'ENERGIE',
        nom: 'Optimisation Énergie',
        description: 'Optimisation des contrats d\'électricité et de gaz',
        estimatedGain: gainFinal,
        reasons: [
          'Contrats d\'énergie',
          'Estimation basée sur le CA',
          `Économie : ${differencePrix}€/kWh`
        ]
      });
    }

    console.log('🎯 Produits éligibles trouvés:', eligible.length);
    return eligible.sort((a, b) => b.estimatedGain - a.estimatedGain);
  }

  // 🎯 Générer des produits recommandés basés sur le profil
  private generateRecommendedProducts(collectedInfo: any): Array<{
    id: string;
    nom: string;
    description: string;
    estimatedGain: number;
    reasons: string[];
  }> {
    console.log('🔍 Génération de produits recommandés pour:', collectedInfo);
    
    const recommended: Array<{
      id: string;
      nom: string;
      description: string;
      estimatedGain: number;
      reasons: string[];
    }> = [];

    const chiffreAffaires = ProductValidationOrchestrator.extractAmount(collectedInfo.chiffreAffaires || '0');

    // Recommandations basées sur le secteur
    if (collectedInfo.secteur === 'transport') {
      recommended.push({
        id: 'TICPE_RECOMMENDED',
        nom: 'Audit TICPE',
        description: 'Remboursement de la taxe sur les carburants professionnels',
        estimatedGain: 15000,
        reasons: ['Secteur transport', 'Recommandation basée sur votre activité']
      });
    }

    // Recommandations basées sur la taille
    if (collectedInfo.nombreEmployes && collectedInfo.nombreEmployes >= 5) {
      recommended.push({
        id: 'URSSAF_RECOMMENDED',
        nom: 'Optimisation URSSAF',
        description: 'Optimisation des charges sociales et cotisations',
        estimatedGain: 25000,
        reasons: [`${collectedInfo.nombreEmployes} employés`, 'Optimisation recommandée']
      });
    }

    // Recommandations basées sur le CA
    if (chiffreAffaires > 100000) {
      recommended.push({
        id: 'FISCAL_RECOMMENDED',
        nom: 'Audit Fiscal',
        description: 'Optimisation fiscale globale (IS, TVA, autres taxes)',
        estimatedGain: 30000,
        reasons: [`CA: ${(chiffreAffaires/1000000).toFixed(1)}M€`, 'Optimisation fiscale recommandée']
      });
    }

    // Recommandations générales
    recommended.push({
      id: 'DFS_RECOMMENDED',
      nom: 'Audit DFS',
      description: 'Solutions de défiscalisation et d\'investissement',
      estimatedGain: 20000,
      reasons: ['Opportunités de défiscalisation', 'Recommandation générale']
    });

    return recommended.sort((a, b) => b.estimatedGain - a.estimatedGain);
  }

  // 💾 Sauvegarder l'état de validation
  private async saveValidationState(state: ValidationState): Promise<void> {
    try {
      await pool.query(
        'INSERT INTO "ValidationState" (simulation_id, client_id, phase, profile_data, conversation_history, last_interaction) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (simulation_id) DO UPDATE SET phase = $3, profile_data = $4, conversation_history = $5, last_interaction = $6',
        [
          state.simulationId,
          state.clientId,
          state.phase,
          JSON.stringify(state.profileData),
          JSON.stringify(state.conversationHistory),
          state.lastInteraction
        ]
      );
    } catch (error) {
      console.error('❌ Erreur sauvegarde (non bloquante):', error);
    }
  }

  // 📊 Extraire un montant d'un texte
  private static extractAmount(text: string): number {
    const normalizedText = text.toLowerCase().replace(/\s+/g, '');
    const patterns = [
      /(\d+(?:\.\d+)?)\s*m[€e]/,
      /(\d+(?:\.\d+)?)\s*k[€e]/,
      /(\d+)\s*[€e]/,
      /(\d+)/
    ];
    
    for (let i = 0; i < patterns.length; i++) {
      const match = normalizedText.match(patterns[i]);
      if (match) {
        const value = parseFloat(match[1]);
        switch (i) {
          case 0: return value * 1000000;
          case 1: return value * 1000;
          case 2: 
          case 3: return value;
        }
      }
    }
    return 0;
  }

  // 🤖 Fonction pour interagir avec l'API OpenAI
  private async getOpenAIResponse(systemPrompt: string, conversationHistory: Array<{role: 'user' | 'assistant', content: string, timestamp: Date}> = []): Promise<string> {
    try {
      if (!openai) {
        return "Désolé, les fonctionnalités IA ne sont pas disponibles pour le moment.";
      }

      const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      ];

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      });
      
      const messageContent = response!.choices[0]?.message?.content;
      if (!messageContent) {
        console.warn("Réponse vide de l'API OpenAI.");
        return "Je suis désolé, je n'ai pas pu obtenir une réponse. Pouvez-vous reformuler votre question ?";
      }
      return messageContent.trim();
    } catch (error) {
      console.error('Erreur OpenAI:', error);
      return "Je suis désolé, une erreur est survenue lors de la communication avec notre service d'intelligence artificielle. Pouvez-vous reformuler votre question ?";
    }
  }
}

export default ProductValidationOrchestrator;
