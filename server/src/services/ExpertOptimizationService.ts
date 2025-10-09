import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export interface Expert {
  id: string;
  name: string;
  email: string;
  company_name: string;
  specializations: string[];
  rating: number;
  total_dossiers: number;
  success_rate: number;
  average_response_time_hours: number;
  availability_status: 'available' | 'busy' | 'unavailable';
}

export interface ProductEligibility {
  productId: string;
  productName: string;
  score: number;
  estimatedSavings: number;
  priority: number;
}

export interface ExpertProductMatch {
  expertId: string;
  productId: string;
  matchScore: number; // 0-100
  specialization_match: boolean;
  experience_count: number; // Nombre de dossiers similaires
}

export interface ExpertCombination {
  experts: Expert[];
  products: ProductEligibility[];
  meetings: MeetingPlan[];
  totalScore: number;
  totalMeetings: number;
  totalDuration: number;
  totalSavings: number;
  advantages: string[];
  tradeoffs: string[];
}

export interface MeetingPlan {
  expertId: string;
  expert: Expert;
  productIds: string[];
  products: ProductEligibility[];
  estimatedDuration: number; // minutes
  combinedScore: number;
  estimatedSavings: number;
}

export interface OptimizationResult {
  recommended: ExpertCombination; // Meilleure recommandation
  alternatives: ExpertCombination[]; // 2 alternatives
  expertsByProduct: Record<string, Expert[]>; // Tous les experts par produit
}

// ============================================================================
// SERVICE D'OPTIMISATION EXPERTS
// ============================================================================

export class ExpertOptimizationService {
  
  /**
   * Optimiser la sélection d'experts pour plusieurs produits
   * Algorithme intelligent qui équilibre qualité et efficacité
   */
  static async optimizeExpertSelection(
    products: ProductEligibility[],
    clientData?: {
      secteur_activite?: string;
      budget_range?: string;
      timeline?: string;
    }
  ): Promise<OptimizationResult> {
    
    console.log(`🎯 Optimisation experts pour ${products.length} produits`);
    
    try {
      // 1. Récupérer tous les experts avec leurs spécialisations
      const availableExperts = await this.getAvailableExperts(products.map(p => p.productId));
      
      if (availableExperts.length === 0) {
        throw new Error('Aucun expert disponible pour ces produits');
      }
      
      // 2. Calculer les scores de match expert-produit
      const expertMatches = await this.calculateExpertMatches(products, availableExperts);
      
      // 3. Générer toutes les combinaisons possibles
      const combinations = this.generateCombinations(products, availableExperts, expertMatches);
      
      // 4. Scorer chaque combinaison avec algorithme intelligent
      const scoredCombinations = combinations.map(combo => 
        this.scoreCombination(combo)
      );
      
      // 5. Trier par score (meilleur en premier)
      scoredCombinations.sort((a, b) => b.totalScore - a.totalScore);
      
      // 6. Retourner top 3
      return {
        recommended: scoredCombinations[0],
        alternatives: scoredCombinations.slice(1, 3),
        expertsByProduct: await this.getExpertsByProduct(products, availableExperts, expertMatches)
      };
      
    } catch (error) {
      console.error('❌ Erreur optimisation experts:', error);
      throw error;
    }
  }
  
  /**
   * Récupérer les experts disponibles pour les produits donnés
   */
  private static async getAvailableExperts(productIds: string[]): Promise<Expert[]> {
    try {
      // Récupérer les experts qui ont des spécialisations matchant ces produits
      const { data: expertProduits, error } = await supabase
        .from('ExpertProduitEligible')
        .select(`
          expert_id,
          produit_id,
          niveauExpertise,
          statut,
          Expert!inner (
            id,
            name,
            email,
            company_name,
            specializations,
            rating,
            status,
            disponibilites
          )
        `)
        .in('produit_id', productIds)
        .eq('statut', 'actif')
        .eq('Expert.status', 'approved');
      
      if (error) throw error;
      
      // Dédupliquer les experts et enrichir les données
      const uniqueExperts = new Map<string, Expert>();
      
      for (const ep of expertProduits || []) {
        const expert: any = ep.Expert;
        if (expert && !Array.isArray(expert) && expert.id && !uniqueExperts.has(expert.id)) {
          uniqueExperts.set(expert.id, {
            id: expert.id,
            name: expert.name,
            email: expert.email,
            company_name: expert.company_name,
            specializations: expert.specializations || [],
            rating: expert.rating || 4.0,
            total_dossiers: 0,
            success_rate: 0,
            average_response_time_hours: 24,
            availability_status: 'available'
          });
        }
      }
      
      // Enrichir avec statistiques de performance
      const expertsArray = Array.from(uniqueExperts.values());
      
      for (const expert of expertsArray) {
        const stats = await this.getExpertStats(expert.id);
        expert.total_dossiers = stats.total_dossiers;
        expert.success_rate = stats.success_rate;
        expert.average_response_time_hours = stats.average_response_time;
      }
      
      console.log(`✅ ${expertsArray.length} experts disponibles trouvés`);
      return expertsArray;
      
    } catch (error) {
      console.error('❌ Erreur récupération experts:', error);
      return [];
    }
  }
  
  /**
   * Calculer les scores de match entre experts et produits
   */
  private static async calculateExpertMatches(
    products: ProductEligibility[],
    experts: Expert[]
  ): Promise<ExpertProductMatch[]> {
    
    const matches: ExpertProductMatch[] = [];
    
    for (const expert of experts) {
      for (const product of products) {
        // Vérifier si l'expert a ce produit dans ses spécialisations
        const { data: expertProduit } = await supabase
          .from('ExpertProduitEligible')
          .select('niveauExpertise, statut')
          .eq('expert_id', expert.id)
          .eq('produit_id', product.productId)
          .single();
        
        if (expertProduit && expertProduit.statut === 'actif') {
          // Calculer le score de match
          let matchScore = 0;
          
          // Facteur 1 : Niveau d'expertise (40 points)
          const expertiseScore: Record<string, number> = {
            'expert': 40,
            'avance': 30,
            'intermediaire': 20,
            'debutant': 10
          };
          const expertiseLevel = expertProduit.niveauExpertise || 'intermediaire';
          const expertisePoints = expertiseScore[expertiseLevel] || 20;
          
          matchScore += expertisePoints;
          
          // Facteur 2 : Rating général (30 points)
          matchScore += (expert.rating / 5.0) * 30;
          
          // Facteur 3 : Expérience (30 points)
          const experienceScore = Math.min(30, (expert.total_dossiers / 50) * 30);
          matchScore += experienceScore;
          
          matches.push({
            expertId: expert.id,
            productId: product.productId,
            matchScore: Math.round(matchScore),
            specialization_match: true,
            experience_count: expert.total_dossiers
          });
        }
      }
    }
    
    return matches;
  }
  
  /**
   * Générer toutes les combinaisons possibles d'experts
   * Optimisation intelligente : équilibre qualité/efficacité
   */
  private static generateCombinations(
    products: ProductEligibility[],
    experts: Expert[],
    matches: ExpertProductMatch[]
  ): ExpertCombination[] {
    
    const combinations: ExpertCombination[] = [];
    
    // Stratégie 1 : Un expert par produit (qualité maximale)
    const specialistCombination = this.generateSpecialistCombination(products, experts, matches);
    if (specialistCombination) combinations.push(specialistCombination);
    
    // Stratégie 2 : Minimiser le nombre d'experts (efficacité)
    const consolidatedCombination = this.generateConsolidatedCombination(products, experts, matches);
    if (consolidatedCombination) combinations.push(consolidatedCombination);
    
    // Stratégie 3 : Équilibre intelligent (recommandé)
    const balancedCombination = this.generateBalancedCombination(products, experts, matches);
    if (balancedCombination) combinations.push(balancedCombination);
    
    return combinations;
  }
  
  /**
   * Stratégie 1 : Un expert spécialiste par produit
   */
  private static generateSpecialistCombination(
    products: ProductEligibility[],
    experts: Expert[],
    matches: ExpertProductMatch[]
  ): ExpertCombination | null {
    
    const selectedExperts: Expert[] = [];
    const meetings: MeetingPlan[] = [];
    
    for (const product of products) {
      // Trouver le meilleur expert pour ce produit
      const productMatches = matches
        .filter(m => m.productId === product.productId)
        .sort((a, b) => b.matchScore - a.matchScore);
      
      if (productMatches.length === 0) continue;
      
      const bestMatch = productMatches[0];
      const expert = experts.find(e => e.id === bestMatch.expertId);
      
      if (!expert) continue;
      
      // Ajouter l'expert si pas déjà présent
      if (!selectedExperts.find(e => e.id === expert.id)) {
        selectedExperts.push(expert);
      }
      
      // Créer ou mettre à jour le meeting
      let meeting = meetings.find(m => m.expertId === expert.id);
      if (!meeting) {
        meeting = {
          expertId: expert.id,
          expert: expert,
          productIds: [],
          products: [],
          estimatedDuration: 0,
          combinedScore: 0,
          estimatedSavings: 0
        };
        meetings.push(meeting);
      }
      
      meeting.productIds.push(product.productId);
      meeting.products.push(product);
      meeting.estimatedDuration += 45; // 45 min par produit
      meeting.combinedScore = (meeting.combinedScore * (meeting.products.length - 1) + bestMatch.matchScore) / meeting.products.length;
      meeting.estimatedSavings += product.estimatedSavings;
    }
    
    if (selectedExperts.length === 0) return null;
    
    return {
      experts: selectedExperts,
      products: products,
      meetings: meetings,
      totalScore: 0, // Sera calculé par scoreCombination
      totalMeetings: meetings.length,
      totalDuration: meetings.reduce((sum, m) => sum + m.estimatedDuration, 0),
      totalSavings: products.reduce((sum, p) => sum + p.estimatedSavings, 0),
      advantages: [
        'Experts spécialistes de haute qualité',
        `Score moyen : ${meetings.reduce((sum, m) => sum + m.combinedScore, 0) / meetings.length}%`,
        'Expertise approfondie sur chaque produit'
      ],
      tradeoffs: meetings.length > 1 ? [
        `${meetings.length} RDV à organiser`,
        'Coordination entre plusieurs experts nécessaire'
      ] : []
    };
  }
  
  /**
   * Stratégie 2 : Minimiser le nombre d'experts (consolidation)
   */
  private static generateConsolidatedCombination(
    products: ProductEligibility[],
    experts: Expert[],
    matches: ExpertProductMatch[]
  ): ExpertCombination | null {
    
    // Trouver l'expert qui peut traiter le plus de produits
    const expertProductCounts = new Map<string, number>();
    
    for (const match of matches) {
      const count = expertProductCounts.get(match.expertId) || 0;
      expertProductCounts.set(match.expertId, count + 1);
    }
    
    // Trier experts par nombre de produits qu'ils peuvent traiter
    const sortedExperts = Array.from(expertProductCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([expertId]) => experts.find(e => e.id === expertId)!)
      .filter(Boolean);
    
    const selectedExperts: Expert[] = [];
    const coveredProducts = new Set<string>();
    const meetings: MeetingPlan[] = [];
    
    // Greedy algorithm : sélectionner les experts qui couvrent le plus de produits
    for (const expert of sortedExperts) {
      const expertProductIds = matches
        .filter(m => m.expertId === expert.id && !coveredProducts.has(m.productId))
        .map(m => m.productId);
      
      if (expertProductIds.length > 0) {
        selectedExperts.push(expert);
        expertProductIds.forEach(pid => coveredProducts.add(pid));
        
        const meetingProducts = products.filter(p => expertProductIds.includes(p.productId));
        const avgScore = matches
          .filter(m => m.expertId === expert.id && expertProductIds.includes(m.productId))
          .reduce((sum, m) => sum + m.matchScore, 0) / expertProductIds.length;
        
        meetings.push({
          expertId: expert.id,
          expert: expert,
          productIds: expertProductIds,
          products: meetingProducts,
          estimatedDuration: expertProductIds.length * 45,
          combinedScore: avgScore,
          estimatedSavings: meetingProducts.reduce((sum, p) => sum + p.estimatedSavings, 0)
        });
      }
      
      if (coveredProducts.size === products.length) break;
    }
    
    if (coveredProducts.size < products.length) return null;
    
    return {
      experts: selectedExperts,
      products: products,
      meetings: meetings,
      totalScore: 0,
      totalMeetings: meetings.length,
      totalDuration: meetings.reduce((sum, m) => sum + m.estimatedDuration, 0),
      totalSavings: products.reduce((sum, p) => sum + p.estimatedSavings, 0),
      advantages: [
        `Seulement ${meetings.length} RDV au lieu de ${products.length}`,
        'Organisation simplifiée',
        meetings.length === 1 ? 'Un seul interlocuteur' : 'Nombre minimal d\'interlocuteurs'
      ],
      tradeoffs: [
        'Experts généralistes (scores moyens)',
        'Moins d\'expertise approfondie par produit'
      ]
    };
  }
  
  /**
   * Stratégie 3 : ÉQUILIBRE INTELLIGENT (RECOMMANDÉ)
   * Balance entre qualité des experts et nombre de RDV
   */
  private static generateBalancedCombination(
    products: ProductEligibility[],
    experts: Expert[],
    matches: ExpertProductMatch[]
  ): ExpertCombination | null {
    
    const selectedExperts: Expert[] = [];
    const meetings: MeetingPlan[] = [];
    const assignedProducts = new Set<string>();
    
    // Trier produits par priorité et économies
    const sortedProducts = [...products].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.estimatedSavings - a.estimatedSavings;
    });
    
    for (const product of sortedProducts) {
      if (assignedProducts.has(product.productId)) continue;
      
      // Trouver experts pour ce produit
      const productMatches = matches
        .filter(m => m.productId === product.productId)
        .sort((a, b) => b.matchScore - a.matchScore);
      
      if (productMatches.length === 0) continue;
      
      // Chercher si un expert déjà sélectionné peut traiter ce produit
      let assignedToExisting = false;
      
      for (const existingMeeting of meetings) {
        const expertMatch = productMatches.find(m => m.expertId === existingMeeting.expertId);
        
        if (expertMatch) {
          // Vérifier si l'ajout est pertinent (score acceptable + pas trop de produits)
          if (expertMatch.matchScore >= 70 && existingMeeting.products.length < 3) {
            existingMeeting.productIds.push(product.productId);
            existingMeeting.products.push(product);
            existingMeeting.estimatedDuration += 45;
            existingMeeting.combinedScore = (existingMeeting.combinedScore * (existingMeeting.products.length - 1) + expertMatch.matchScore) / existingMeeting.products.length;
            existingMeeting.estimatedSavings += product.estimatedSavings;
            assignedProducts.add(product.productId);
            assignedToExisting = true;
            break;
          }
        }
      }
      
      // Si pas assigné à un expert existant, créer nouveau meeting
      if (!assignedToExisting) {
        const bestMatch = productMatches[0];
        const expert = experts.find(e => e.id === bestMatch.expertId);
        
        if (expert) {
          if (!selectedExperts.find(e => e.id === expert.id)) {
            selectedExperts.push(expert);
          }
          
          meetings.push({
            expertId: expert.id,
            expert: expert,
            productIds: [product.productId],
            products: [product],
            estimatedDuration: 45,
            combinedScore: bestMatch.matchScore,
            estimatedSavings: product.estimatedSavings
          });
          
          assignedProducts.add(product.productId);
        }
      }
    }
    
    if (assignedProducts.size < products.length) return null;
    
    // Calculer les avantages et compromis
    const avgQuality = meetings.reduce((sum, m) => sum + m.combinedScore, 0) / meetings.length;
    const maxProductsPerMeeting = Math.max(...meetings.map(m => m.products.length));
    
    return {
      experts: selectedExperts,
      products: products,
      meetings: meetings,
      totalScore: 0,
      totalMeetings: meetings.length,
      totalDuration: meetings.reduce((sum, m) => sum + m.estimatedDuration, 0),
      totalSavings: products.reduce((sum, p) => sum + p.estimatedSavings, 0),
      advantages: [
        `Équilibre optimal : ${meetings.length} RDV pour ${products.length} produits`,
        `Qualité moyenne : ${avgQuality.toFixed(0)}%`,
        maxProductsPerMeeting > 1 ? 'Experts multi-spécialités efficaces' : 'Experts spécialisés',
        'Meilleur compromis temps/qualité'
      ],
      tradeoffs: meetings.length > 1 ? [
        `${meetings.length} RDV à coordonner`
      ] : []
    };
  }
  
  /**
   * Scorer une combinaison avec algorithme intelligent
   * Pondération : 40% qualité, 30% efficacité, 30% disponibilité
   */
  private static scoreCombination(combination: ExpertCombination): ExpertCombination {
    
    // 1. Score de QUALITÉ (40%)
    const avgExpertRating = combination.experts.reduce((sum, e) => sum + e.rating, 0) / combination.experts.length;
    const avgMatchScore = combination.meetings.reduce((sum, m) => sum + m.combinedScore, 0) / combination.meetings.length;
    const avgExperience = combination.experts.reduce((sum, e) => sum + e.total_dossiers, 0) / combination.experts.length;
    
    const qualityScore = (
      (avgExpertRating / 5.0) * 40 +      // Rating sur 40 points
      avgMatchScore * 0.4 +                 // Match score sur 40 points
      Math.min(20, avgExperience / 5)      // Expérience sur 20 points
    );
    
    // 2. Score d'EFFICACITÉ (30%)
    const efficiencyPenalty = Math.max(0, (combination.totalMeetings - 1) * 10); // Pénalité par RDV supplémentaire
    const durationBonus = Math.max(0, 30 - (combination.totalDuration / 60) * 5); // Bonus si durée raisonnable
    
    const efficiencyScore = 30 - efficiencyPenalty + durationBonus;
    
    // 3. Score de DISPONIBILITÉ (30%)
    const availableExperts = combination.experts.filter(e => e.availability_status === 'available').length;
    const availabilityScore = (availableExperts / combination.experts.length) * 30;
    
    // Score total
    combination.totalScore = Math.round(qualityScore + efficiencyScore + availabilityScore);
    
    return combination;
  }
  
  /**
   * Organiser experts par produit
   */
  private static async getExpertsByProduct(
    products: ProductEligibility[],
    experts: Expert[],
    matches: ExpertProductMatch[]
  ): Promise<Record<string, Expert[]>> {
    
    const result: Record<string, Expert[]> = {};
    
    for (const product of products) {
      const productExperts = matches
        .filter(m => m.productId === product.productId)
        .sort((a, b) => b.matchScore - a.matchScore)
        .map(m => {
          const expert = experts.find(e => e.id === m.expertId);
          return expert ? { ...expert, matchScore: m.matchScore } : null;
        })
        .filter(Boolean) as any[];
      
      result[product.productId] = productExperts;
    }
    
    return result;
  }
  
  /**
   * Récupérer statistiques de performance d'un expert
   */
  private static async getExpertStats(expertId: string): Promise<{
    total_dossiers: number;
    success_rate: number;
    average_response_time: number;
  }> {
    try {
      // Compter les dossiers totaux
      const { count: totalDossiers } = await supabase
        .from('ClientProduitEligible')
        .select('*', { count: 'exact', head: true })
        .eq('expert_id', expertId);
      
      // Compter les dossiers réussis (statut = 'completed' ou 'signed')
      const { count: successDossiers } = await supabase
        .from('ClientProduitEligible')
        .select('*', { count: 'exact', head: true })
        .eq('expert_id', expertId)
        .in('statut', ['completed', 'signed']);
      
      const success_rate = totalDossiers && totalDossiers > 0
        ? (successDossiers! / totalDossiers) * 100
        : 0;
      
      return {
        total_dossiers: totalDossiers || 0,
        success_rate: Math.round(success_rate),
        average_response_time: 24 // Valeur par défaut (TODO: calculer réel)
      };
      
    } catch (error) {
      console.error('Erreur stats expert:', error);
      return {
        total_dossiers: 0,
        success_rate: 0,
        average_response_time: 24
      };
    }
  }
}

