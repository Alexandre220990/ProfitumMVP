/**
 * ============================================================================
 * SERVICE D'ÉVALUATION D'ÉLIGIBILITÉ - SIMULATEUR COURT INTELLIGENT
 * ============================================================================
 * 
 * Service simple, maintenable et scalable pour évaluer l'éligibilité
 * des clients aux 10 produits basé sur les règles stockées en BDD.
 * 
 * Architecture:
 * - Règles stockées dans EligibilityRules (BDD)
 * - Évaluation dynamique basée sur les réponses
 * - Facile d'ajouter de nouveaux produits
 * 
 * @author Profitum
 * @date 2025-10-08
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// ============================================================================
// INTERFACES
// ============================================================================

interface SimulatorAnswer {
  question_id: string;
  value: string | string[]; // string pour choix_unique, string[] pour choix_multiple
}

interface EligibilityRule {
  id: string;
  produit_id: string;
  produit_nom: string;
  rule_type: 'simple' | 'combined' | 'conditional';
  conditions: any;
  priority: number;
  is_active: boolean;
}

interface ProductEligibilityResult {
  produit_id: string;
  produit_nom: string;
  is_eligible: boolean;
  confidence_score: number; // 0-100
  matched_rules: string[];
  reasons: string[];
}

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class EligibilityEvaluator {

  /**
   * Évaluer l'éligibilité pour tous les produits
   */
  async evaluateEligibility(answers: SimulatorAnswer[]): Promise<ProductEligibilityResult[]> {
    try {
      console.log('🔍 Début évaluation éligibilité avec', answers.length, 'réponses');

      // 1. Récupérer toutes les règles actives
      const { data: rules, error: rulesError } = await supabase
        .from('EligibilityRules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (rulesError) {
        console.error('❌ Erreur récupération règles:', rulesError);
        throw new Error('Impossible de récupérer les règles d\'éligibilité');
      }

      if (!rules || rules.length === 0) {
        console.warn('⚠️ Aucune règle d\'éligibilité trouvée');
        return [];
      }

      console.log(`📋 ${rules.length} règles chargées pour évaluation`);

      // 2. Récupérer tous les produits
      const { data: products, error: productsError } = await supabase
        .from('ProduitEligible')
        .select('id, nom')
        .eq('active', true);

      if (productsError || !products) {
        throw new Error('Impossible de récupérer les produits');
      }

      // 3. Évaluer chaque produit
      const results: ProductEligibilityResult[] = [];

      for (const product of products) {
        // Trouver les règles pour ce produit
        const productRules = rules.filter(r => r.produit_id === product.id);

        if (productRules.length === 0) {
          // Aucune règle = non éligible par défaut
          results.push({
            produit_id: product.id,
            produit_nom: product.nom,
            is_eligible: false,
            confidence_score: 0,
            matched_rules: [],
            reasons: ['Aucune règle d\'éligibilité définie pour ce produit']
          });
          continue;
        }

        // Évaluer toutes les règles du produit
        const evaluation = this.evaluateProductRules(productRules, answers);

        results.push({
          produit_id: product.id,
          produit_nom: product.nom,
          ...evaluation
        });
      }

      // 4. Trier par score de confiance décroissant
      results.sort((a, b) => b.confidence_score - a.confidence_score);

      const eligibleCount = results.filter(r => r.is_eligible).length;
      console.log(`✅ Évaluation terminée: ${eligibleCount}/${results.length} produits éligibles`);

      return results;

    } catch (error) {
      console.error('❌ Erreur lors de l\'évaluation d\'éligibilité:', error);
      throw error;
    }
  }

  /**
   * Évaluer les règles d'un produit spécifique
   */
  private evaluateProductRules(
    rules: EligibilityRule[],
    answers: SimulatorAnswer[]
  ): {
    is_eligible: boolean;
    confidence_score: number;
    matched_rules: string[];
    reasons: string[];
  } {
    const matchedRules: string[] = [];
    const reasons: string[] = [];
    let totalScore = 0;
    let evaluatedRules = 0;

    for (const rule of rules) {
      const ruleResult = this.evaluateRule(rule.conditions, answers);

      evaluatedRules++;

      if (ruleResult.matched) {
        matchedRules.push(rule.id);
        totalScore += 100; // Chaque règle matchée = 100 points
        reasons.push(...ruleResult.reasons);
      } else {
        reasons.push(...ruleResult.failureReasons);
      }
    }

    // Score de confiance = moyenne des règles matchées
    const confidence_score = evaluatedRules > 0 ? Math.round(totalScore / evaluatedRules) : 0;

    // Éligible si AU MOINS UNE règle est matchée
    const is_eligible = matchedRules.length > 0;

    return {
      is_eligible,
      confidence_score,
      matched_rules: matchedRules,
      reasons
    };
  }

  /**
   * Évaluer une règle (simple ou combinée)
   */
  private evaluateRule(
    conditions: any,
    answers: SimulatorAnswer[]
  ): {
    matched: boolean;
    reasons: string[];
    failureReasons: string[];
  } {
    const reasons: string[] = [];
    const failureReasons: string[] = [];

    // Règle simple
    if (conditions.question_id) {
      return this.evaluateSimpleRule(conditions, answers);
    }

    // Règle combinée (AND/OR)
    if (conditions.operator && conditions.rules) {
      const operator = conditions.operator.toUpperCase();
      const subResults = conditions.rules.map((subRule: any) => 
        this.evaluateRule(subRule, answers)
      );

      if (operator === 'AND') {
        const allMatched = subResults.every((r: any) => r.matched);
        return {
          matched: allMatched,
          reasons: allMatched ? subResults.flatMap((r: any) => r.reasons) : [],
          failureReasons: !allMatched ? subResults.flatMap((r: any) => r.failureReasons) : []
        };
      }

      if (operator === 'OR') {
        const anyMatched = subResults.some((r: any) => r.matched);
        return {
          matched: anyMatched,
          reasons: anyMatched ? subResults.filter((r: any) => r.matched).flatMap((r: any) => r.reasons) : [],
          failureReasons: !anyMatched ? subResults.flatMap((r: any) => r.failureReasons) : []
        };
      }
    }

    return { matched: false, reasons: [], failureReasons: ['Règle mal formée'] };
  }

  /**
   * Évaluer une règle simple
   */
  private evaluateSimpleRule(
    condition: any,
    answers: SimulatorAnswer[]
  ): {
    matched: boolean;
    reasons: string[];
    failureReasons: string[];
  } {
    const answer = answers.find(a => a.question_id === condition.question_id);

    if (!answer) {
      return {
        matched: false,
        reasons: [],
        failureReasons: [`Question ${condition.question_id} non répondue`]
      };
    }

    const value = answer.value;
    const expectedValue = condition.value;
    const operator = condition.operator;

    let matched = false;
    let reason = '';
    let failureReason = '';

    switch (operator) {
      case 'equals':
        matched = value === expectedValue;
        reason = matched ? `Répond au critère : ${expectedValue}` : '';
        failureReason = !matched ? `Ne répond pas au critère : ${expectedValue}` : '';
        break;

      case 'not_equals':
        matched = value !== expectedValue;
        reason = matched ? `Différent de : ${expectedValue}` : '';
        failureReason = !matched ? `Égal à : ${expectedValue}` : '';
        break;

      case 'includes':
        // Pour choix_multiple
        if (Array.isArray(value)) {
          matched = value.some(v => v.includes(expectedValue) || expectedValue.includes(v));
        } else {
          matched = String(value).includes(expectedValue) || expectedValue.includes(String(value));
        }
        reason = matched ? `Inclut : ${expectedValue}` : '';
        failureReason = !matched ? `N'inclut pas : ${expectedValue}` : '';
        break;

      case 'greater_than':
        matched = Number(value) > Number(expectedValue);
        reason = matched ? `Supérieur à : ${expectedValue}` : '';
        failureReason = !matched ? `Inférieur ou égal à : ${expectedValue}` : '';
        break;

      case 'less_than':
        matched = Number(value) < Number(expectedValue);
        reason = matched ? `Inférieur à : ${expectedValue}` : '';
        failureReason = !matched ? `Supérieur ou égal à : ${expectedValue}` : '';
        break;

      default:
        failureReason = `Opérateur inconnu : ${operator}`;
    }

    return {
      matched,
      reasons: matched && reason ? [reason] : [],
      failureReasons: !matched && failureReason ? [failureReason] : []
    };
  }

  /**
   * Obtenir les produits éligibles (is_eligible = true)
   */
  getEligibleProducts(results: ProductEligibilityResult[]): ProductEligibilityResult[] {
    return results.filter(r => r.is_eligible);
  }

  /**
   * Obtenir les produits non éligibles
   */
  getNonEligibleProducts(results: ProductEligibilityResult[]): ProductEligibilityResult[] {
    return results.filter(r => !r.is_eligible);
  }

  /**
   * Formater les résultats pour le frontend
   */
  formatResults(results: ProductEligibilityResult[]): {
    eligible: ProductEligibilityResult[];
    non_eligible: ProductEligibilityResult[];
    summary: {
      total: number;
      eligible_count: number;
      non_eligible_count: number;
      average_confidence: number;
    };
  } {
    const eligible = this.getEligibleProducts(results);
    const non_eligible = this.getNonEligibleProducts(results);

    const avgConfidence = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.confidence_score, 0) / results.length)
      : 0;

    return {
      eligible,
      non_eligible,
      summary: {
        total: results.length,
        eligible_count: eligible.length,
        non_eligible_count: non_eligible.length,
        average_confidence: avgConfidence
      }
    };
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default EligibilityEvaluator;

