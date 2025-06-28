import { Pool } from 'pg';
import EligibilityEngine, { ClientProfile, ProductEligibility } from './eligibilityEngine';
import dotenv from 'dotenv';

dotenv.config();

// Pool PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

// États de la conversation
export enum ConversationPhase {
  WELCOME = 'welcome',
  PROFILING = 'profiling',  // Questions socles
  EXPLORATION = 'exploration',  // Questions spécifiques aux produits
  SYNTHESIS = 'synthesis',  // Présentation des résultats
  COMPLETED = 'completed'
}

// Types pour l'orchestration
export interface ConversationState {
  simulationId: string;
  clientId: string;
  phase: ConversationPhase;
  profileData: ClientProfile;
  identifiedProducts: ProductEligibility[];
  questionsAsked: Set<string>;
  missingInformation: Map<string, string[]>; // produitId -> questions manquantes
  conversationHistory: ConversationMessage[];
  lastInteraction: Date;
}

export interface ConversationMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  metadata?: {
    questionType?: string;
    targetProduct?: string;
    phase?: ConversationPhase;
  };
}

export interface NextAction {
  type: 'question' | 'synthesis' | 'completion';
  content: string;
  metadata?: {
    questionType?: string;
    expectedAnswerFormat?: string;
    targetProduct?: string;
    importance?: number; // 1-5
  };
}

export class ConversationOrchestrator {
  private eligibilityEngine: EligibilityEngine;
  private states: Map<string, ConversationState> = new Map();

  constructor() {
    this.eligibilityEngine = new EligibilityEngine();
  }

  // 📍 Point d'entrée principal : traiter un message utilisateur
  async processUserMessage(
    simulationId: string,
    clientId: string,
    message: string,
    history?: ConversationMessage[]
  ): Promise<{
    response: string;
    nextAction?: NextAction;
    phase: ConversationPhase;
    profileData: ClientProfile;
    identifiedProducts: ProductEligibility[];
    conversationComplete: boolean;
  }> {
    try {
      console.log(`🎯 Orchestrateur: traitement message pour simulation ${simulationId}`);

      // 1. Récupérer ou initialiser l'état de conversation
      let state = await this.getOrCreateConversationState(simulationId, clientId, history);

      // 2. Analyser le message et mettre à jour le profil
      await this.analyzeMessageAndUpdateProfile(state, message);

      // 3. Identifier les produits potentiels
      await this.identifyPotentialProducts(state);

      // 4. Déterminer la prochaine action selon la phase
      const result = await this.determineNextAction(state);

      // 5. Sauvegarder l'état mis à jour
      await this.saveConversationState(state);

      return result;

    } catch (error) {
      console.error('❌ Erreur dans l\'orchestrateur de conversation:', error);
      throw error;
    }
  }

  // 🗃️ Récupérer ou créer l'état de conversation
  private async getOrCreateConversationState(
    simulationId: string,
    clientId: string,
    history?: ConversationMessage[]
  ): Promise<ConversationState> {
    
    // Vérifier si l'état existe déjà en mémoire
    if (this.states.has(simulationId)) {
      const state = this.states.get(simulationId)!;
      state.lastInteraction = new Date();
      return state;
    }

    // Essayer de récupérer depuis la base de données
    try {
      const { rows } = await pool.query(
        'SELECT * FROM "chatbotsimulation" WHERE id = $1',
        [simulationId]
      );

      if (rows.length > 0) {
        const dbState = rows[0];
        const state: ConversationState = {
          simulationId,
          clientId,
          phase: this.parsePhase(dbState.processing_status) || ConversationPhase.PROFILING,
          profileData: this.extractProfileFromHistory(history || []),
          identifiedProducts: dbState.eligible_products || [],
          questionsAsked: new Set(dbState.questions_asked || []),
          missingInformation: new Map(),
          conversationHistory: history || [],
          lastInteraction: new Date()
        };

        this.states.set(simulationId, state);
        return state;
      }
    } catch (error) {
      console.error('⚠️ Erreur lors de la récupération de l\'état:', error);
    }

    // Créer un nouvel état
    const newState: ConversationState = {
      simulationId,
      clientId,
      phase: ConversationPhase.PROFILING,
      profileData: this.extractProfileFromHistory(history || []),
      identifiedProducts: [],
      questionsAsked: new Set(),
      missingInformation: new Map(),
      conversationHistory: history || [],
      lastInteraction: new Date()
    };

    this.states.set(simulationId, newState);
    return newState;
  }

  // 🧠 Analyser le message et mettre à jour le profil
  private async analyzeMessageAndUpdateProfile(
    state: ConversationState,
    message: string
  ): Promise<void> {
    console.log('🔍 Analyse du message:', message);

    // Ajouter le message à l'historique
    state.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Extraire les informations du profil depuis le message
    const messageProfile = this.extractProfileFromMessage(message);
    
    // Fusionner avec le profil existant
    state.profileData = this.mergeProfiles(state.profileData, messageProfile);

    console.log('📊 Profil mis à jour:', state.profileData);
  }

  // 🏷️ Extraire le profil depuis un message spécifique
  private extractProfileFromMessage(message: string): Partial<ClientProfile> {
    const profile: Partial<ClientProfile> = {};
    const messageLower = message.toLowerCase();

    // Secteur d'activité
    if (messageLower.includes('transport')) profile.secteur = 'transport';
    else if (messageLower.includes('agriculture')) profile.secteur = 'agriculture';
    else if (messageLower.includes('industrie')) profile.secteur = 'industrie';
    else if (messageLower.includes('commerce')) profile.secteur = 'commerce';
    else if (messageLower.includes('service')) profile.secteur = 'services';

    // Chiffre d'affaires
    const caMatch = messageLower.match(/(\d+(?:[.,]\d+)?)\s*([km])?[€e]/);
    if (caMatch) {
      let amount = parseFloat(caMatch[1].replace(',', '.'));
      if (caMatch[2] === 'k') amount *= 1000;
      if (caMatch[2] === 'm') amount *= 1000000;
      profile.chiffreAffaires = `${amount}€`;
    }

    // Nombre d'employés
    const employeesMatch = messageLower.match(/(\d+)\s*(?:employé|salarié|personne)/);
    if (employeesMatch) {
      profile.nombreEmployes = parseInt(employeesMatch[1]);
    }

    // Véhicules professionnels
    if (messageLower.includes('véhicule') || messageLower.includes('camion') || messageLower.includes('utilitaire')) {
      if (messageLower.includes('oui') || messageLower.includes('possède') || messageLower.includes('avons')) {
        profile.vehiculesProfessionnels = true;
      } else if (messageLower.includes('non') || messageLower.includes('pas')) {
        profile.vehiculesProfessionnels = false;
      }
    }

    // Propriétaire locaux
    if (messageLower.includes('propriétaire') || messageLower.includes('locaux')) {
      if (messageLower.includes('oui') || messageLower.includes('propriétaire')) {
        profile.proprietaireLocaux = true;
      } else if (messageLower.includes('non') || messageLower.includes('locataire')) {
        profile.proprietaireLocaux = false;
      }
    }

    // Activités R&D
    if (messageLower.includes('recherche') || messageLower.includes('développement') || messageLower.includes('innovation') || messageLower.includes('r&d')) {
      if (messageLower.includes('oui') || messageLower.includes('menons') || messageLower.includes('faisons')) {
        profile.activitesRD = true;
      } else if (messageLower.includes('non') || messageLower.includes('pas')) {
        profile.activitesRD = false;
      }
    }

    // Besoins spécifiques
    if (!profile.besoinsSpecifiques) profile.besoinsSpecifiques = [];
    if (messageLower.includes('optimiser') || messageLower.includes('réduire') || messageLower.includes('charges')) {
      profile.besoinsSpecifiques.push('optimisation_charges');
    }
    if (messageLower.includes('financement') || messageLower.includes('crédit')) {
      profile.besoinsSpecifiques.push('financement');
    }

    return profile;
  }

  // 🔄 Fusionner deux profils
  private mergeProfiles(existing: ClientProfile, update: Partial<ClientProfile>): ClientProfile {
    return {
      ...existing,
      ...update,
      besoinsSpecifiques: [
        ...(existing.besoinsSpecifiques || []),
        ...(update.besoinsSpecifiques || [])
      ].filter((item, index, arr) => arr.indexOf(item) === index) // Déduplication
    };
  }

  // 📦 Identifier les produits potentiels
  private async identifyPotentialProducts(state: ConversationState): Promise<void> {
    try {
      console.log('🎯 Identification des produits potentiels...');
      
      const eligibilities = await this.eligibilityEngine.evaluateClientEligibility(state.profileData);
      
      // Filtrer les produits avec un score minimum
      state.identifiedProducts = eligibilities.filter(e => e.score >= 40); // Seuil plus bas pour exploration
      
      // Identifier les informations manquantes pour chaque produit
      state.missingInformation.clear();
      for (const product of state.identifiedProducts) {
        const missingInfo = this.identifyMissingInformation(product, state.profileData);
        if (missingInfo.length > 0) {
          state.missingInformation.set(product.product.id, missingInfo);
        }
      }

      console.log(`✅ ${state.identifiedProducts.length} produits identifiés`);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'identification des produits:', error);
    }
  }

  // ❓ Identifier les informations manquantes pour un produit
  private identifyMissingInformation(eligibility: ProductEligibility, profile: ClientProfile): string[] {
    const missing: string[] = [];
    const productName = eligibility.product.nom;

    switch (productName) {
      case 'TICPE':
        if (!profile.vehiculesProfessionnels) missing.push('véhicules_professionnels');
        if (!profile.chiffreAffaires) missing.push('chiffre_affaires');
        if (!profile.nombreEmployes) missing.push('nombre_employes');
        break;

      case 'CIR':
        if (profile.activitesRD === undefined) missing.push('activites_rd');
        if (!profile.chiffreAffaires) missing.push('chiffre_affaires');
        break;

      case 'CII':
        if (profile.activitesRD === undefined) missing.push('activites_rd');
        if (!profile.nombreEmployes) missing.push('nombre_employes');
        break;

      case 'Foncier':
        if (profile.proprietaireLocaux === undefined) missing.push('proprietaire_locaux');
        if (!profile.secteur) missing.push('secteur');
        break;

      case 'URSSAF':
        if (!profile.nombreEmployes) missing.push('nombre_employes');
        if (!profile.chiffreAffaires) missing.push('chiffre_affaires');
        break;

      case 'MSA':
        if (!profile.secteur || profile.secteur !== 'agriculture') missing.push('secteur_agriculture');
        if (!profile.nombreEmployes) missing.push('nombre_employes');
        break;

      case 'DFS':
        if (!profile.secteur) missing.push('secteur');
        if (!profile.nombreEmployes) missing.push('nombre_employes');
        break;
    }

    return missing;
  }

  // 🎯 Déterminer la prochaine action
  private async determineNextAction(state: ConversationState): Promise<{
    response: string;
    nextAction?: NextAction;
    phase: ConversationPhase;
    profileData: ClientProfile;
    identifiedProducts: ProductEligibility[];
    conversationComplete: boolean;
  }> {
    
    // Vérifier si nous avons assez d'informations pour les produits identifiés
    const hasUnexploredProducts = Array.from(state.missingInformation.values()).some(missing => missing.length > 0);
    
    // Transition de phase si nécessaire
    if (state.phase === ConversationPhase.PROFILING && state.identifiedProducts.length > 0) {
      if (hasUnexploredProducts) {
        state.phase = ConversationPhase.EXPLORATION;
      } else {
        state.phase = ConversationPhase.SYNTHESIS;
      }
    } else if (state.phase === ConversationPhase.EXPLORATION && !hasUnexploredProducts) {
      state.phase = ConversationPhase.SYNTHESIS;
    }

    // Générer la réponse selon la phase
    switch (state.phase) {
      case ConversationPhase.PROFILING:
        return await this.generateProfilingResponse(state);
      
      case ConversationPhase.EXPLORATION:
        return await this.generateExplorationResponse(state);
      
      case ConversationPhase.SYNTHESIS:
        return this.generateSynthesisResponse(state);
      
      default:
        return await this.generateProfilingResponse(state);
    }
  }

  // 🗣️ Générer une réponse de profilage
  private async generateProfilingResponse(state: ConversationState): Promise<{
    response: string;
    nextAction?: NextAction;
    phase: ConversationPhase;
    profileData: ClientProfile;
    identifiedProducts: ProductEligibility[];
    conversationComplete: boolean;
  }> {
    
    let response = "📋 **Parfait !** Je commence à analyser votre profil.\n\n";
    
    // Résumer ce qu'on sait déjà
    if (state.profileData.secteur) {
      response += `✅ Secteur : **${state.profileData.secteur}**\n`;
    }
    if (state.profileData.nombreEmployes) {
      response += `✅ Employés : **${state.profileData.nombreEmployes}**\n`;
    }
    if (state.profileData.chiffreAffaires) {
      response += `✅ CA : **${state.profileData.chiffreAffaires}**\n`;
    }
    
    response += "\n";

    // Questions prioritaires
    const nextQuestion = this.getNextProfilingQuestion(state);
    
    if (nextQuestion) {
      response += `❓ **Question suivante :**\n${nextQuestion.content}`;
      
      return {
        response,
        nextAction: nextQuestion,
        phase: state.phase,
        profileData: state.profileData,
        identifiedProducts: state.identifiedProducts,
        conversationComplete: false
      };
    }

    // Si plus de questions de profilage, passer à l'exploration
    state.phase = ConversationPhase.EXPLORATION;
    return await this.generateExplorationResponse(state);
  }

  // 🔍 Générer une réponse d'exploration
  private async generateExplorationResponse(state: ConversationState): Promise<{
    response: string;
    nextAction?: NextAction;
    phase: ConversationPhase;
    profileData: ClientProfile;
    identifiedProducts: ProductEligibility[];
    conversationComplete: boolean;
  }> {
    
    let response = "🎯 **Excellent !** J'ai identifié des opportunités pour vous.\n\n";
    
    // Montrer les produits identifiés
    const eligibleProducts = state.identifiedProducts.filter(p => p.isEligible);
    if (eligibleProducts.length > 0) {
      response += "✅ **Produits éligibles identifiés :**\n";
      eligibleProducts.forEach((p, i) => {
        response += `${i + 1}. **${p.product.nom}** (score: ${p.score}%)\n`;
      });
      response += "\n";
    }

    // Question spécifique pour optimiser
    const nextQuestion = await this.getNextExplorationQuestion(state);
    
    if (nextQuestion) {
      response += `🔍 **Pour optimiser vos gains :**\n${nextQuestion.content}`;
      
      return {
        response,
        nextAction: nextQuestion,
        phase: state.phase,
        profileData: state.profileData,
        identifiedProducts: state.identifiedProducts,
        conversationComplete: false
      };
    }

    // Si plus de questions d'exploration, passer à la synthèse
    state.phase = ConversationPhase.SYNTHESIS;
    return this.generateSynthesisResponse(state);
  }

  // 📊 Générer une réponse de synthèse
  private generateSynthesisResponse(state: ConversationState): {
    response: string;
    nextAction?: NextAction;
    phase: ConversationPhase;
    profileData: ClientProfile;
    identifiedProducts: ProductEligibility[];
    conversationComplete: boolean;
  } {
    
    let response = "🎉 **Analyse terminée !** Voici votre bilan personnalisé :\n\n";
    
    const eligibleProducts = state.identifiedProducts.filter(p => p.isEligible);
    const totalGain = eligibleProducts.reduce((sum, p) => sum + this.calculateGain(p, state.profileData), 0);
    
    response += `💰 **Gain potentiel total : ${totalGain.toLocaleString()}€**\n\n`;
    
    if (eligibleProducts.length > 0) {
      response += "📋 **Détail par produit :**\n";
      eligibleProducts
        .sort((a, b) => this.calculateGain(b, state.profileData) - this.calculateGain(a, state.profileData))
        .forEach((p, i) => {
          const gain = this.calculateGain(p, state.profileData);
          response += `${i + 1}. **${p.product.nom}** - ${gain.toLocaleString()}€\n`;
          response += `   ${p.product.description}\n`;
          if (p.reasons.length > 0) {
            response += `   ✅ ${p.reasons[0]}\n`;
          }
          response += "\n";
        });
    }

    response += "🚀 **Prochaines étapes :**\n";
    response += "1. Validation de votre éligibilité par un expert\n";
    response += "2. Constitution du dossier\n";
    response += "3. Dépôt et suivi administratif\n\n";
    response += "Souhaitez-vous prendre rendez-vous avec un de nos experts ?";

    state.phase = ConversationPhase.COMPLETED;

    return {
      response,
      phase: state.phase,
      profileData: state.profileData,
      identifiedProducts: state.identifiedProducts,
      conversationComplete: true
    };
  }

  // ❓ Obtenir la prochaine question de profilage
  private getNextProfilingQuestion(state: ConversationState): NextAction | null {
    const profile = state.profileData;

    if (!profile.secteur) {
      return {
        type: 'question',
        content: "Dans quel secteur d'activité évoluez-vous ? (transport, agriculture, industrie, commerce, services...)",
        metadata: {
          questionType: 'secteur',
          expectedAnswerFormat: 'secteur_activite',
          importance: 5
        }
      };
    }

    if (!profile.chiffreAffaires) {
      return {
        type: 'question',
        content: "Quel est approximativement votre chiffre d'affaires annuel ?",
        metadata: {
          questionType: 'chiffre_affaires',
          expectedAnswerFormat: 'montant_euros',
          importance: 5
        }
      };
    }

    if (!profile.nombreEmployes) {
      return {
        type: 'question',
        content: "Combien d'employés compte votre entreprise ?",
        metadata: {
          questionType: 'nombre_employes',
          expectedAnswerFormat: 'nombre',
          importance: 4
        }
      };
    }

    return null;
  }

  // 🔍 Obtenir la prochaine question d'exploration
  private async getNextExplorationQuestion(state: ConversationState): Promise<NextAction | null> {
    try {
      // Parcourir les produits identifiés et leurs informations manquantes
      for (const [productId, missingInfo] of state.missingInformation.entries()) {
        if (missingInfo.length === 0) continue;

        const product = state.identifiedProducts.find(p => p.product.id === productId);
        if (!product) continue;

        // Récupérer la question depuis la base de données
        const question = await this.getQuestionFromDatabase(product.product.nom, missingInfo[0], state.profileData);
        
        if (question) {
          // Marquer cette question comme posée
          state.questionsAsked.add(`${product.product.nom}_${missingInfo[0]}`);
          
          // Retirer l'information de la liste des manquantes
          const remainingMissing = missingInfo.slice(1);
          if (remainingMissing.length > 0) {
            state.missingInformation.set(productId, remainingMissing);
          } else {
            state.missingInformation.delete(productId);
          }
          
          return question;
        }
      }

      return null;
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de la question d\'exploration:', error);
      return null;
    }
  }

  // 🎯 Générer une question spécifique pour un produit
  private generateSpecificQuestion(productName: string, missingInfo: string): NextAction | null {
    const questions: { [key: string]: { [key: string]: NextAction } } = {
      'TICPE': {
        'véhicules_professionnels': {
          type: 'question',
          content: "Possédez-vous des véhicules professionnels (utilitaires, poids lourds) ?",
          metadata: {
            questionType: 'vehicules_professionnels',
            targetProduct: 'TICPE',
            expectedAnswerFormat: 'oui_non',
            importance: 5
          }
        }
      },
      'CIR': {
        'activites_rd': {
          type: 'question',
          content: "Votre entreprise mène-t-elle des activités de recherche et développement ?",
          metadata: {
            questionType: 'activites_rd',
            targetProduct: 'CIR',
            expectedAnswerFormat: 'oui_non',
            importance: 5
          }
        }
      },
      'Foncier': {
        'proprietaire_locaux': {
          type: 'question',
          content: "Êtes-vous propriétaire de vos locaux professionnels ?",
          metadata: {
            questionType: 'proprietaire_locaux',
            targetProduct: 'Foncier',
            expectedAnswerFormat: 'oui_non',
            importance: 4
          }
        }
      }
    };

    return questions[productName]?.[missingInfo] || null;
  }

  // 💰 Calculer le gain pour un produit
  private calculateGain(eligibility: ProductEligibility, profile: ClientProfile): number {
    const ca = profile.chiffreAffaires ? this.extractChiffreAffaires(profile.chiffreAffaires) : 0;
    const nbEmployes = profile.nombreEmployes || 0;
    
    switch (eligibility.product.nom) {
      case 'TICPE':
        return Math.min(Math.max(ca * 0.02, 5000), 50000);
      case 'CIR':
        return Math.min(Math.max(ca * 0.05, 10000), 100000);
      case 'CII':
        return Math.min(Math.max(ca * 0.03, 5000), 80000);
      case 'Foncier':
        return Math.min(Math.max(ca * 0.01, 3000), 50000);
      case 'URSSAF':
        const masseSalariale = nbEmployes * 35000;
        return Math.min(Math.max(masseSalariale * 0.15, 5000), 120000);
      case 'DFS':
        return Math.min(Math.max(ca * 0.02, 3000), 80000);
      case 'MSA':
        return Math.min(Math.max(ca * 0.08, 3000), 60000);
      default:
        return eligibility.product.montantMax || 10000;
    }
  }

  // 🗃️ Récupérer une question depuis la base de données
  private async getQuestionFromDatabase(
    productName: string, 
    informationType: string, 
    profile: ClientProfile
  ): Promise<NextAction | null> {
    try {
      const { rows } = await pool.query(
        `SELECT question_text, expected_format, importance, follow_up_questions
         FROM "QuestionExploration"
         WHERE produit_id = $1 AND information_type = $2
         ORDER BY importance DESC
         LIMIT 1`,
        [productName, informationType]
      );

      if (rows.length > 0) {
        const question = rows[0];
        return {
          type: 'question',
          content: question.question_text,
          metadata: {
            questionType: informationType,
            targetProduct: productName,
            expectedAnswerFormat: question.expected_format,
            importance: question.importance
          }
        };
      }

      // Fallback vers les questions hardcodées si pas trouvé en base
      return this.generateSpecificQuestion(productName, informationType);

    } catch (error) {
      console.error('❌ Erreur lors de la récupération de la question en base:', error);
      // Fallback vers les questions hardcodées
      return this.generateSpecificQuestion(productName, informationType);
    }
  }

  // 🔧 Méthodes utilitaires
  private extractProfileFromHistory(history: ConversationMessage[]): ClientProfile {
    const profile: ClientProfile = { besoinsSpecifiques: [] };
    
    history.forEach(msg => {
      if (msg.role === 'user') {
        const messageProfile = this.extractProfileFromMessage(msg.content);
        Object.assign(profile, messageProfile);
      }
    });
    
    return profile;
  }

  private parsePhase(status: string): ConversationPhase | null {
    const phaseMap: { [key: string]: ConversationPhase } = {
      'profiling': ConversationPhase.PROFILING,
      'exploration': ConversationPhase.EXPLORATION,
      'synthesis': ConversationPhase.SYNTHESIS,
      'completed': ConversationPhase.COMPLETED
    };
    return phaseMap[status] || null;
  }

  private extractChiffreAffaires(text: string): number {
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

  // 💾 Sauvegarder l'état de conversation
  private async saveConversationState(state: ConversationState): Promise<void> {
    try {
      // Essayer d'abord la structure complète
      await pool.query(
        `UPDATE "chatbotsimulation" 
         SET processing_status = $1, 
             eligible_products = $2,
             last_processed_at = NOW()
         WHERE id = $3`,
        [
          state.phase,
          JSON.stringify(state.identifiedProducts),
          state.simulationId
        ]
      );
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de l\'état:', error);
      // Fallback silencieux - ne pas bloquer le processus
    }
  }
}

export default ConversationOrchestrator; 