import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Types adaptés à la structure réelle de EligibilityRules
export interface Answer {
  questionId: number | string;
  value: string | string[];
  timestamp: Date;
}

export interface RuleCondition {
  question_id: string;
  operator: 'equals' | 'not_equals' | 'includes' | 'not_includes' | 'greater_than' | 'less_than';
  value: string | string[] | number;
}

export interface CombinedRuleCondition {
  rules: (RuleCondition | CombinedRuleCondition)[];
  operator: 'AND' | 'OR';
}

export interface EligibilityRule {
  id: string;
  produit_id: string;
  produit_nom: string;
  rule_type: 'simple' | 'combined' | 'conditional';
  conditions: RuleCondition | CombinedRuleCondition;
  priority: number;
  is_active: boolean;
}

export interface ProductEligibility {
  productId: string;
  productName: string;
  score: number;
  satisfiedRules: number;
  totalRules: number;
  isEligible: boolean;
  details: {
    ruleId: string;
    satisfied: boolean;
    priority: number;
  }[];
}

// Classe principale du moteur de décision moderne
export class ModernDecisionEngine {
  private supabase;
  private ruleCache: Map<string, EligibilityRule[]>;

  constructor() {
    this.supabase = createClient<Database>(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    this.ruleCache = new Map();
  }

  // Récupère les règles depuis la base de données
  private async getRulesForProduct(productId: string): Promise<EligibilityRule[]> {
    if (this.ruleCache.has(productId)) {
      return this.ruleCache.get(productId)!;
    }

    const { data: rules, error } = await this.supabase
      .from('EligibilityRules')
      .select('*')
      .eq('produit_id', productId)
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (error) {
      console.error('❌ Erreur récupération règles:', error);
      return [];
    }

    console.log(`📋 ${rules?.length || 0} règles trouvées pour le produit ${productId}`);
    
    this.ruleCache.set(productId, rules as EligibilityRule[]);
    return (rules as EligibilityRule[]) || [];
  }

  // Évalue une condition simple
  private evaluateSimpleCondition(condition: RuleCondition, answers: Answer[]): boolean {
    // Trouver la réponse correspondante par question_id
    const answer = answers.find(a => {
      // Supporter à la fois string et number pour questionId
      return String(a.questionId) === condition.question_id || 
             a.questionId === condition.question_id;
    });

    if (!answer) {
      console.log(`⚠️ Pas de réponse pour question ${condition.question_id}`);
      return false;
    }

    const answerValue = Array.isArray(answer.value) ? answer.value[0] : answer.value;
    const conditionValue = condition.value;

    console.log(`  🔍 Question ${condition.question_id}: "${answerValue}" ${condition.operator} "${conditionValue}"`);

    switch (condition.operator) {
      case 'equals':
        return answerValue === conditionValue;
      
      case 'not_equals':
        return answerValue !== conditionValue;
      
      case 'includes':
        if (Array.isArray(answer.value)) {
          return answer.value.includes(String(conditionValue));
        }
        return String(answerValue).includes(String(conditionValue));
      
      case 'not_includes':
        if (Array.isArray(answer.value)) {
          return !answer.value.includes(String(conditionValue));
        }
        return !String(answerValue).includes(String(conditionValue));
      
      case 'greater_than':
        return Number(answerValue) > Number(conditionValue);
      
      case 'less_than':
        return Number(answerValue) < Number(conditionValue);
      
      default:
        console.warn(`⚠️ Opérateur inconnu: ${condition.operator}`);
        return false;
    }
  }

  // Évalue une condition combinée (AND/OR)
  private evaluateCombinedCondition(
    condition: CombinedRuleCondition, 
    answers: Answer[]
  ): boolean {
    const results = condition.rules.map(rule => {
      if ('rules' in rule) {
        // C'est une condition combinée imbriquée
        return this.evaluateCombinedCondition(rule as CombinedRuleCondition, answers);
      } else {
        // C'est une condition simple
        return this.evaluateSimpleCondition(rule as RuleCondition, answers);
      }
    });

    if (condition.operator === 'AND') {
      return results.every(r => r);
    } else if (condition.operator === 'OR') {
      return results.some(r => r);
    }

    return false;
  }

  // Évalue une règle complète
  private evaluateRule(rule: EligibilityRule, answers: Answer[]): boolean {
    console.log(`  📝 Évaluation règle ${rule.rule_type} (priorité ${rule.priority})`);

    if (rule.rule_type === 'simple') {
      return this.evaluateSimpleCondition(rule.conditions as RuleCondition, answers);
    } else if (rule.rule_type === 'combined') {
      return this.evaluateCombinedCondition(rule.conditions as CombinedRuleCondition, answers);
    }

    return false;
  }

  // Évalue l'éligibilité d'un produit
  private async evaluateProductEligibility(
    productId: string,
    productName: string,
    answers: Answer[]
  ): Promise<ProductEligibility> {
    const rules = await this.getRulesForProduct(productId);
    
    if (!rules || rules.length === 0) {
      console.warn(`⚠️ Aucune règle pour ${productName}`);
      return {
        productId,
        productName,
        score: 0,
        satisfiedRules: 0,
        totalRules: 0,
        isEligible: false,
        details: []
      };
    }

    console.log(`\n🎯 Évaluation produit: ${productName}`);

    let satisfiedRules = 0;
    const details: ProductEligibility['details'] = [];

    for (const rule of rules) {
      const satisfied = this.evaluateRule(rule, answers);
      
      if (satisfied) {
        satisfiedRules++;
        console.log(`  ✅ Règle satisfaite`);
      } else {
        console.log(`  ❌ Règle non satisfaite`);
      }
      
      details.push({
        ruleId: rule.id,
        satisfied,
        priority: rule.priority
      });
    }

    // Un produit est éligible si TOUTES ses règles sont satisfaites
    const isEligible = satisfiedRules === rules.length;
    const score = rules.length > 0 ? satisfiedRules / rules.length : 0;
    
    console.log(`📊 ${productName}: ${satisfiedRules}/${rules.length} règles satisfaites - ${isEligible ? '✅ ÉLIGIBLE' : '❌ NON ÉLIGIBLE'}`);

    return {
      productId,
      productName,
      score,
      satisfiedRules,
      totalRules: rules.length,
      isEligible,
      details
    };
  }

  // Méthode principale pour évaluer l'éligibilité
  public async evaluateEligibility(
    simulationId: string,
    answers: Answer[]
  ): Promise<ProductEligibility[]> {
    try {
      console.log(`\n🎯 DÉBUT ÉVALUATION ÉLIGIBILITÉ`);
      console.log(`📋 Simulation ${simulationId}`);
      console.log(`📝 ${answers.length} réponses reçues`);

      // Récupérer tous les produits actifs
      const { data: products, error } = await this.supabase
        .from('ProduitEligible')
        .select('id, nom')
        .eq('active', true);

      if (error || !products) {
        console.error('❌ Erreur récupération produits:', error);
        throw new Error('Impossible de récupérer les produits');
      }

      console.log(`📦 ${products.length} produits actifs à évaluer\n`);

      // Évaluer chaque produit
      const evaluations = await Promise.all(
        products.map(product => 
          this.evaluateProductEligibility(product.id, product.nom || 'Produit', answers)
        )
      );

      // Filtrer les produits éligibles pour les stats
      const eligibleProducts = evaluations.filter(e => e.isEligible);

      console.log(`\n✅ RÉSULTAT: ${eligibleProducts.length}/${products.length} produits éligibles`);

      // Mettre à jour la simulation
      const updatedResults = {
        all_evaluations: evaluations,
        eligible_products: eligibleProducts,
        eligible_count: eligibleProducts.length,
        total_evaluated: products.length,
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

      // Retourner TOUTES les évaluations, pas seulement les éligibles
      return evaluations;
    } catch (error) {
      console.error('❌ Erreur lors de l\'évaluation de l\'éligibilité:', error);
      throw error;
    }
  }

  // Méthode pour nettoyer le cache
  public clearCache(): void {
    this.ruleCache.clear();
  }
}

