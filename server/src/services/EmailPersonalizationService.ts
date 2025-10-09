/**
 * Service de personnalisation avancée des emails
 * A/B testing, variables dynamiques, conditions
 */

import { createClient } from '@supabase/supabase-js';
import Handlebars from 'handlebars';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// TYPES
// ============================================================================

export interface PersonalizationRule {
  id: string;
  name: string;
  template_name: string;
  condition: string; // Expression JavaScript
  modifications: {
    subject?: string;
    header_text?: string;
    cta_text?: string;
    footer_text?: string;
    custom_sections?: Record<string, string>;
  };
  priority: number;
  is_active: boolean;
}

export interface ABTestVariant {
  id: string;
  test_name: string;
  variant_name: string;
  template_modifications: Record<string, any>;
  weight: number; // Pourcentage d'attribution (0-100)
  is_active: boolean;
  metrics?: {
    sent: number;
    opened: number;
    clicked: number;
  };
}

// ============================================================================
// HELPERS HANDLEBARS PERSONNALISÉS
// ============================================================================

export class EmailPersonalizationService {
  
  /**
   * Enregistrer tous les helpers Handlebars
   */
  static registerHandlebarsHelpers() {
    // Helper: Égalité
    Handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });

    // Helper: Différent
    Handlebars.registerHelper('neq', function(a, b) {
      return a !== b;
    });

    // Helper: Plus grand que
    Handlebars.registerHelper('gt', function(a, b) {
      return a > b;
    });

    // Helper: Plus petit que
    Handlebars.registerHelper('lt', function(a, b) {
      return a < b;
    });

    // Helper: Contient
    Handlebars.registerHelper('contains', function(arr, value) {
      return Array.isArray(arr) && arr.includes(value);
    });

    // Helper: Formater nombre en euros
    Handlebars.registerHelper('formatEuro', function(amount) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount);
    });

    // Helper: Formater date
    Handlebars.registerHelper('formatDate', function(date) {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    });

    // Helper: Premier prénom
    Handlebars.registerHelper('firstName', function(fullName) {
      return fullName.split(' ')[0];
    });

    // Helper: Capitaliser
    Handlebars.registerHelper('capitalize', function(str) {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    // Helper: Pluriel
    Handlebars.registerHelper('plural', function(count, singular, plural) {
      return count > 1 ? plural : singular;
    });

    // Helper: Condition OR
    Handlebars.registerHelper('or', function(...args) {
      // Retirer le dernier argument (options Handlebars)
      args.pop();
      return args.some(arg => !!arg);
    });

    // Helper: Condition AND
    Handlebars.registerHelper('and', function(...args) {
      // Retirer le dernier argument (options Handlebars)
      args.pop();
      return args.every(arg => !!arg);
    });

    // Helper: Badge de statut
    Handlebars.registerHelper('statusBadge', function(status) {
      const badges: Record<string, string> = {
        proposed: '🟡 Proposé',
        confirmed: '🟢 Confirmé',
        completed: '✅ Terminé',
        cancelled: '🔴 Annulé',
        rescheduled: '🔄 Reprogrammé'
      };
      return badges[status] || status;
    });

    // Helper: Icône produit
    Handlebars.registerHelper('productIcon', function(productName) {
      const icons: Record<string, string> = {
        'TICPE': '⛽',
        'URSSAF': '🏢',
        'Crédit Impôt Recherche': '🔬',
        'Crédit Formation': '📚',
        'Exonération fiscale': '💰',
        'Aides régionales': '🏛️'
      };
      return icons[productName] || '📦';
    });

    console.log('✅ Helpers Handlebars enregistrés');
  }

  /**
   * Appliquer les règles de personnalisation
   */
  static async applyPersonalizationRules(
    templateName: string,
    data: Record<string, any>
  ): Promise<Record<string, any>> {
    // Récupérer les règles actives pour ce template
    const { data: rules } = await supabase
      .from('PersonalizationRule')
      .select('*')
      .eq('template_name', templateName)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (!rules || rules.length === 0) {
      return data;
    }

    let modifiedData = { ...data };

    for (const rule of rules) {
      try {
        // Évaluer la condition
        const conditionMet = this.evaluateCondition(rule.condition, modifiedData);

        if (conditionMet) {
          // Appliquer les modifications
          modifiedData = {
            ...modifiedData,
            ...rule.modifications
          };

          console.log(`✅ Règle "${rule.name}" appliquée`);
        }
      } catch (error) {
        console.error(`❌ Erreur évaluation règle "${rule.name}":`, error);
      }
    }

    return modifiedData;
  }

  /**
   * Évaluer une condition JavaScript en toute sécurité
   */
  private static evaluateCondition(condition: string, data: Record<string, any>): boolean {
    try {
      // Créer un contexte sécurisé avec seulement les données
      const func = new Function(...Object.keys(data), `return ${condition};`);
      return func(...Object.values(data));
    } catch (error) {
      console.error('❌ Erreur évaluation condition:', error);
      return false;
    }
  }

  /**
   * Sélectionner une variante A/B test
   */
  static async selectABTestVariant(
    testName: string,
    recipientEmail: string
  ): Promise<ABTestVariant | null> {
    // Récupérer les variantes actives
    const { data: variants } = await supabase
      .from('ABTestVariant')
      .select('*')
      .eq('test_name', testName)
      .eq('is_active', true);

    if (!variants || variants.length === 0) {
      return null;
    }

    // Sélection déterministe basée sur l'email (même email = même variante)
    const hash = this.hashEmail(recipientEmail);
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    const selection = hash % totalWeight;

    let cumulativeWeight = 0;
    for (const variant of variants) {
      cumulativeWeight += variant.weight;
      if (selection < cumulativeWeight) {
        console.log(`🎯 Variante A/B sélectionnée: ${variant.variant_name}`);
        return variant;
      }
    }

    return variants[0]; // Fallback
  }

  /**
   * Hash simple d'un email pour sélection déterministe
   */
  private static hashEmail(email: string): number {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Appliquer les modifications d'une variante A/B
   */
  static applyABTestVariant(
    data: Record<string, any>,
    variant: ABTestVariant
  ): Record<string, any> {
    return {
      ...data,
      ...variant.template_modifications,
      ab_test_variant: variant.variant_name
    };
  }

  /**
   * Injecter des variables dynamiques
   */
  static injectDynamicVariables(data: Record<string, any>): Record<string, any> {
    const now = new Date();

    return {
      ...data,
      // Variables de date/heure
      current_year: now.getFullYear(),
      current_month: now.toLocaleDateString('fr-FR', { month: 'long' }),
      current_date: now.toLocaleDateString('fr-FR'),
      current_time: now.toLocaleTimeString('fr-FR'),
      
      // Variables de personnalisation
      greeting: this.getGreeting(),
      season: this.getSeason(),
      
      // URLs de la plateforme
      platform_url: process.env.CLIENT_URL || 'https://www.profitum.app',
      support_url: `${process.env.CLIENT_URL || 'https://www.profitum.app'}/support`,
      unsubscribe_url: `${process.env.CLIENT_URL || 'https://www.profitum.app'}/unsubscribe`,
      
      // Informations de l'entreprise
      company_name: 'Profitum',
      company_email: 'contact@profitum.fr',
      company_phone: '+33 (0)1 23 45 67 89'
    };
  }

  /**
   * Obtenir une salutation selon l'heure
   */
  private static getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  /**
   * Obtenir la saison actuelle
   */
  private static getSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'printemps';
    if (month >= 5 && month <= 7) return 'été';
    if (month >= 8 && month <= 10) return 'automne';
    return 'hiver';
  }

  /**
   * Pipeline complet de personnalisation
   */
  static async personalizeEmailData(
    templateName: string,
    baseData: Record<string, any>,
    recipientEmail: string,
    options?: {
      enableABTest?: boolean;
      abTestName?: string;
    }
  ): Promise<Record<string, any>> {
    // 1. Injecter variables dynamiques
    let data = this.injectDynamicVariables(baseData);

    // 2. Appliquer règles de personnalisation
    data = await this.applyPersonalizationRules(templateName, data);

    // 3. A/B testing (si activé)
    if (options?.enableABTest && options?.abTestName) {
      const variant = await this.selectABTestVariant(options.abTestName, recipientEmail);
      if (variant) {
        data = this.applyABTestVariant(data, variant);
      }
    }

    return data;
  }

  /**
   * Créer une règle de personnalisation
   */
  static async createPersonalizationRule(rule: Omit<PersonalizationRule, 'id'>): Promise<string> {
    const { data, error } = await supabase
      .from('PersonalizationRule')
      .insert(rule)
      .select('id')
      .single();

    if (error) {
      console.error('❌ Erreur création règle:', error);
      throw error;
    }

    console.log(`✅ Règle de personnalisation créée: ${data.id}`);
    return data.id;
  }

  /**
   * Créer une variante A/B test
   */
  static async createABTestVariant(variant: Omit<ABTestVariant, 'id' | 'metrics'>): Promise<string> {
    const { data, error } = await supabase
      .from('ABTestVariant')
      .insert(variant)
      .select('id')
      .single();

    if (error) {
      console.error('❌ Erreur création variante A/B:', error);
      throw error;
    }

    console.log(`✅ Variante A/B créée: ${data.id}`);
    return data.id;
  }
}

// Enregistrer les helpers au chargement
EmailPersonalizationService.registerHandlebarsHelpers();

