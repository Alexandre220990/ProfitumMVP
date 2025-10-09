import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Types
export interface Answer {
  questionId: number;
  value: string;
  timestamp: Date;
}

export interface Rule {
  id: string;
  productId: string;
  questionId: number;
  operator: Operator;
  value: any;
  weight: number;
  priority: number;
  dependencies?: string[];
}

export interface ProductEligibility {
  productId: string;
  score: number;
  satisfiedRules: number;
  totalRules: number;
  details: {
    ruleId: string;
    satisfied: boolean;
    weight: number;
  }[];
}

export type Operator = '=' | 'in' | '>' | '>=' | '<' | '<=' | 'contains';

// Classe principale du moteur de décision
export class DecisionEngine {
  private supabase;
  private ruleCache: Map<string, Rule[]>;
  private eligibilityCache: Map<string, ProductEligibility[]>;

  constructor() {
    this.supabase = createClient<Database>(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    this.ruleCache = new Map();
    this.eligibilityCache = new Map();
  }

  // Récupère les règles depuis la base de données avec mise en cache
  private async getRulesForProduct(productId: string): Promise<Rule[]> {
    if (this.ruleCache.has(productId)) {
      return this.ruleCache.get(productId)!;
    }

    const { data: rules, error } = await this.supabase
      .from('RegleEligibilite')
      .select('*')
      .eq('produitid', productId)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des règles:', error);
      throw new Error('Impossible de récupérer les règles');
    }

    this.ruleCache.set(productId, rules as Rule[]);
    return rules as Rule[];
  }

  // Évalue une règle individuelle
  private evaluateRule(rule: Rule, answer?: Answer): boolean {
    if (!answer) return false;

    const answerValue = answer.value;
    const ruleValue = rule.value;

    switch (rule.operator) {
      case '=':
        return answerValue === ruleValue;
      case 'in':
        return Array.isArray(ruleValue) && ruleValue.includes(answerValue);
      case '>':
        return Number(answerValue) > Number(ruleValue);
      case '>=':
        return Number(answerValue) >= Number(ruleValue);
      case '<':
        return Number(answerValue) < Number(ruleValue);
      case '<=':
        return Number(answerValue) <= Number(ruleValue);
      case 'contains':
        return typeof ruleValue === 'string' && 
               typeof answerValue === 'string' && 
               answerValue.toLowerCase().includes(ruleValue.toLowerCase());
      default:
        return false;
    }
  }

  // Vérifie les dépendances d'une règle
  private async checkDependencies(rule: Rule, answers: Answer[]): Promise<boolean> {
    if (!rule.dependencies || rule.dependencies.length === 0) {
      return true;
    }

    for (const depId of rule.dependencies) {
      const depRule = await this.getRuleById(depId);
      if (!depRule) continue;

      const depAnswer = answers.find(a => a.questionId === depRule.questionId);
      if (!this.evaluateRule(depRule, depAnswer)) {
        return false;
      }
    }

    return true;
  }

  // Récupère une règle par son ID
  private async getRuleById(ruleId: string): Promise<Rule | null> {
    const { data: rule, error } = await this.supabase
      .from('RegleEligibilite')
      .select('*')
      .eq('id', ruleId)
      .single();

    if (error || !rule) return null;
    return rule as Rule;
  }

  // Évalue l'éligibilité d'un produit
  private async evaluateProductEligibility(
    productId: string,
    answers: Answer[]
  ): Promise<ProductEligibility> {
    const rules = await this.getRulesForProduct(productId);
    let satisfiedRules = 0;
    let totalWeight = 0;
    const details: ProductEligibility['details'] = [];

    for (const rule of rules) {
      const answer = answers.find(a => a.questionId === rule.questionId);
      const dependenciesSatisfied = await this.checkDependencies(rule, answers);
      
      if (dependenciesSatisfied) {
        const satisfied = this.evaluateRule(rule, answer);
        if (satisfied) {
          satisfiedRules += rule.weight;
        }
        totalWeight += rule.weight;
        
        details.push({
          ruleId: rule.id,
          satisfied,
          weight: rule.weight
        });
      }
    }

    return {
      productId,
      score: totalWeight > 0 ? satisfiedRules / totalWeight : 0,
      satisfiedRules,
      totalRules: rules.length,
      details
    };
  }

  // Méthode principale pour évaluer l'éligibilité
  public async evaluateEligibility(
    simulationId: string,
    answers: Answer[]
  ): Promise<ProductEligibility[]> {
    try {
      // Récupérer tous les produits
      const { data: products, error } = await this.supabase
        .from('ProduitEligible')
        .select('id');

      if (error || !products) {
        throw new Error('Impossible de récupérer les produits');
      }

      // Évaluer chaque produit
      const evaluations = await Promise.all(
        products.map(product => 
          this.evaluateProductEligibility(product.id, answers)
        )
      );

      // Filtrer les produits éligibles (score > 0.6)
      const eligibleProducts = evaluations.filter(evaluation => evaluation.score >= 0.6);

      // Mettre en cache les résultats
      this.eligibilityCache.set(simulationId, eligibleProducts);

      // Récupérer le CheminParcouru actuel
      const { data: simulation } = await this.supabase
        .from('simulations')
        .select('results')
        .eq('id', simulationId)
        .single();

      // Mettre à jour la table simulations avec les produits éligibles
      const updatedResults = {
        ...(simulation?.results || {}),
        eligible_products: eligibleProducts,
        last_calculation: new Date().toISOString()
      };

      await this.supabase
        .from('simulations')
        .update({
          results: updatedResults,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', simulationId);

      return eligibleProducts;
    } catch (error) {
      console.error('Erreur lors de l\'évaluation de l\'éligibilité:', error);
      throw error;
    }
  }

  // Méthode pour nettoyer le cache
  public clearCache(): void {
    this.ruleCache.clear();
    this.eligibilityCache.clear();
  }
} 