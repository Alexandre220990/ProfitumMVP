/**
 * Service de Détection de Complétude des Données
 * Évite l'enrichissement inutile si données déjà complètes
 * Économie estimée : 30-40% sur prospects déjà enrichis
 */

import { Prospect } from '../types/prospects';
import { EnrichedProspectDataV4 } from '../types/enrichment-v4';

interface CompletenessResult {
  score: number; // 0-100
  missing_fields: string[];
  has_linkedin: boolean;
  has_web: boolean;
  has_operational: boolean;
  has_timing: boolean;
  recommendation: 'skip' | 'partial' | 'full';
  partial_fields?: string[]; // Champs à enrichir si partial
}

export class DataCompletenessDetector {
  
  /**
   * Calculer le score de complétude d'un prospect
   */
  calculateCompleteness(prospect: Prospect): CompletenessResult {
    let score = 0;
    const missing_fields: string[] = [];
    const partial_fields: string[] = [];

    // Vérifier données de base prospect (20 points)
    if (prospect.company_name) score += 5;
    else missing_fields.push('company_name');
    
    if (prospect.siren) score += 5;
    else missing_fields.push('siren');
    
    if (prospect.naf_code && prospect.naf_label) score += 5;
    else missing_fields.push('naf_code/naf_label');
    
    if (prospect.firstname && prospect.lastname) score += 5;
    else missing_fields.push('firstname/lastname');

    // Vérifier enrichissement existant (80 points)
    if (!prospect.enrichment_data) {
      missing_fields.push('enrichment_data');
      return {
        score,
        missing_fields,
        has_linkedin: false,
        has_web: false,
        has_operational: false,
        has_timing: false,
        recommendation: 'full'
      };
    }

    // Vérifier que c'est bien V4
    const enrichmentRaw = prospect.enrichment_data as any;
    if (enrichmentRaw.enrichment_version !== 'v4.0') {
      // Ancien format, considérer comme incomplet
      return {
        score,
        missing_fields: [...missing_fields, 'enrichment_v4'],
        has_linkedin: false,
        has_web: false,
        has_operational: false,
        has_timing: false,
        recommendation: 'full'
      };
    }

    const enrichment = enrichmentRaw as EnrichedProspectDataV4;

    // LinkedIn (20 points)
    if (enrichment.linkedin_data) {
      score += 10;
      if (enrichment.linkedin_data.ice_breakers_generes?.length > 0) {
        score += 10;
      } else {
        partial_fields.push('linkedin_ice_breakers');
      }
    } else {
      missing_fields.push('linkedin_data');
      partial_fields.push('linkedin_data');
    }

    // Web (15 points)
    if (enrichment.web_data) {
      score += 10;
      if (enrichment.web_data.site_web_analyse?.actualites_site?.length > 0) {
        score += 5;
      } else {
        partial_fields.push('web_actualites');
      }
    } else {
      missing_fields.push('web_data');
      partial_fields.push('web_data');
    }

    // Opérationnel (30 points)
    if (enrichment.operational_data) {
      const op = enrichment.operational_data.donnees_operationnelles;
      
      // Vérifier données critiques
      if (op.ressources_humaines?.nombre_salaries_total?.valeur > 0) score += 5;
      else missing_fields.push('nombre_salaries');
      
      if (op.parc_vehicules?.poids_lourds_plus_7_5T?.valeur > 0) score += 5;
      else missing_fields.push('poids_lourds');
      
      if (op.donnees_financieres?.chiffre_affaires?.valeur > 0) score += 5;
      else missing_fields.push('chiffre_affaires');
      
      if (op.infrastructures?.locaux_principaux?.surface_m2?.valeur > 0) score += 5;
      else missing_fields.push('surface_locaux');
      
      // Score complétude opérationnel
      const opCompleteness = enrichment.operational_data.synthese_enrichissement?.score_completude_donnees || 0;
      score += Math.round(opCompleteness * 0.1); // 10 points max
    } else {
      missing_fields.push('operational_data');
      partial_fields.push('operational_data');
    }

    // Timing (15 points)
    if (enrichment.timing_analysis) {
      score += 10;
      if (enrichment.timing_analysis.recommandations_sequence?.nombre_emails_recommande) {
        score += 5;
      } else {
        partial_fields.push('timing_recommendations');
      }
    } else {
      missing_fields.push('timing_analysis');
      partial_fields.push('timing_analysis');
    }

    // Déterminer la recommandation
    let recommendation: 'skip' | 'partial' | 'full';
    
    if (score >= 80) {
      recommendation = 'skip';
    } else if (score >= 50 && partial_fields.length > 0) {
      recommendation = 'partial';
    } else {
      recommendation = 'full';
    }

    return {
      score: Math.min(100, score),
      missing_fields,
      has_linkedin: !!enrichment.linkedin_data,
      has_web: !!enrichment.web_data,
      has_operational: !!enrichment.operational_data,
      has_timing: !!enrichment.timing_analysis,
      recommendation,
      partial_fields: partial_fields.length > 0 ? partial_fields : undefined
    };
  }

  /**
   * Déterminer quels champs doivent être enrichis
   */
  getFieldsToEnrich(completeness: CompletenessResult): {
    enrichLinkedin: boolean;
    enrichWeb: boolean;
    enrichOperational: boolean;
    enrichTiming: boolean;
  } {
    if (completeness.recommendation === 'skip') {
      return {
        enrichLinkedin: false,
        enrichWeb: false,
        enrichOperational: false,
        enrichTiming: false
      };
    }

    if (completeness.recommendation === 'partial') {
      // Enrichir seulement les champs manquants
      return {
        enrichLinkedin: completeness.partial_fields?.includes('linkedin_data') || 
                       completeness.partial_fields?.includes('linkedin_ice_breakers') || false,
        enrichWeb: completeness.partial_fields?.includes('web_data') || 
                  completeness.partial_fields?.includes('web_actualites') || false,
        enrichOperational: completeness.partial_fields?.includes('operational_data') || false,
        enrichTiming: completeness.partial_fields?.includes('timing_analysis') || 
                     completeness.partial_fields?.includes('timing_recommendations') || false
      };
    }

    // Full enrichment
    return {
      enrichLinkedin: true,
      enrichWeb: true,
      enrichOperational: true,
      enrichTiming: true
    };
  }

  /**
   * Vérifier si un prospect peut skip l'enrichissement complet
   */
  shouldSkipEnrichment(prospect: Prospect): {
    skip: boolean;
    reason?: string;
    completeness?: CompletenessResult;
  } {
    const completeness = this.calculateCompleteness(prospect);

    if (completeness.recommendation === 'skip') {
      return {
        skip: true,
        reason: `Données déjà complètes (score: ${completeness.score}/100)`,
        completeness
      };
    }

    return {
      skip: false,
      completeness
    };
  }

  /**
   * Créer un enrichissement à partir des données existantes
   * (si skip recommandé)
   */
  createEnrichmentFromExisting(prospect: Prospect): EnrichedProspectDataV4 | null {
    if (!prospect.enrichment_data) {
      return null;
    }

    const existingRaw = prospect.enrichment_data as any;

    // Vérifier que c'est bien V4
    if (existingRaw.enrichment_version !== 'v4.0') {
      return null;
    }

    const existing = existingRaw as EnrichedProspectDataV4;

    // Mettre à jour la date d'enrichissement
    return {
      ...existing,
      enriched_at: new Date().toISOString()
    };
  }
}

export default new DataCompletenessDetector();

