/**
 * Types pour l'enrichissement V4 - Système optimisé avec données opérationnelles détaillées
 * Inclut : LinkedIn, Site Web, Données opérationnelles, Analyse temporelle
 */

// ===== ENRICHISSEMENT LINKEDIN =====

export interface LinkedInPost {
  date: string; // YYYY-MM-DD
  type: 'Annonce' | 'Article' | 'Événement' | 'Recrutement';
  contenu_resume: string;
  angle_ice_breaker: string;
}

export interface LinkedInEvent {
  nom_evenement: string;
  date_debut: string; // YYYY-MM-DD
  date_fin: string; // YYYY-MM-DD
  statut_temporel: 'FUTUR' | 'EN_COURS' | 'PASSE' | 'DATE_INCONNUE';
  type: 'Salon' | 'Conférence' | 'Webinar' | 'Table Ronde';
  lieu: string;
  ice_breaker_futur: string;
  ice_breaker_passe: string;
  ice_breaker_en_cours: string;
}

export interface LinkedInActualite {
  contenu: string;
  date: string; // YYYY-MM-DD
  anciennete_jours: number;
  fraicheur: 'TRES_RECENTE' | 'RECENTE' | 'ANCIENNE';
}

export interface LinkedInDecisionnairePost {
  date: string; // YYYY-MM-DD
  anciennete_jours: number;
  sujet: string;
  ice_breaker_suggestion: string;
  pertinence_temporelle: 'TRES_FRAIS' | 'FRAIS' | 'PERIME';
}

export interface IceBreaker {
  type: string;
  phrase: string;
  phrase_alternative_si_passe?: string;
  phrase_alternative_si_en_cours?: string;
  contexte: string;
  date_reference?: string; // YYYY-MM-DD
  statut_temporel: 'FUTUR' | 'EN_COURS' | 'PASSE' | 'PERIME' | 'DATE_INCONNUE';
  anciennete_jours?: number;
  score: number; // 1-10
  source: 'LinkedIn' | 'Site Web' | 'NAF' | 'Expertise';
  validite_temporelle: string;
}

export interface LinkedInEnrichmentData {
  entreprise_linkedin: {
    followers?: string;
    posts_recents: LinkedInPost[];
    evenements_participation: LinkedInEvent[];
    actualites_entreprise: LinkedInActualite[];
    employés_croissance: {
      recrutements_recents: boolean;
      departements_en_croissance: string[];
      signal_expansion: string;
    };
  };
  decisionnaire_linkedin: {
    anciennete_poste?: string;
    parcours_notable?: string;
    posts_recents: LinkedInDecisionnairePost[];
    centres_interet_pro: string[];
    points_communs_potentiels: string[];
    style_communication: 'Formel' | 'Accessible' | 'Innovant' | 'Conservateur';
    niveau_activite: 'Actif' | 'Modéré' | 'Passif';
  };
  ice_breakers_generes: IceBreaker[];
  insights_strategiques: {
    meilleur_moment_contact: string;
    ton_recommande: 'Formel' | 'Semi-formel' | 'Accessible';
    angles_prioritaires: string[];
  };
}

// ===== ENRICHISSEMENT SITE WEB =====

export interface WebActualite {
  titre: string;
  date: string; // YYYY-MM-DD or 'Récent'
  type: 'Nouveau produit' | 'Partenariat' | 'Certification' | 'Expansion';
  ice_breaker_suggestion: string;
}

export interface WebEnrichmentData {
  site_web_analyse: {
    activites_principales: string[];
    valeurs_entreprise: string[];
    actualites_site: WebActualite[];
    projets_en_cours: string[];
    certifications_labels: string[];
    presence_internationale: {
      pays: string[];
      bureaux: string[];
      signal_expansion: boolean;
    };
    technologies_utilisees: string[];
    clients_references: string[];
  };
  opportunites_profitum: {
    signaux_eligibilite_ticpe: {
      score: number; // 1-10
      raison: string;
      preuves: string[];
    };
    signaux_eligibilite_cee: {
      score: number;
      raison: string;
      preuves: string[];
    };
    signaux_optimisation_sociale: {
      score: number;
      raison: string;
      preuves: string[];
    };
  };
  ice_breakers_site_web: IceBreaker[];
  tone_of_voice: {
    style_site: 'Corporatif' | 'Innovant' | 'Accessible' | 'Technique';
    recommendation_tone: string;
  };
}

// ===== DONNÉES OPÉRATIONNELLES =====

export interface DataSource {
  valeur: number | string | boolean;
  source: string;
  precision: 'EXACTE' | 'ESTIMÉE' | 'FOURCHETTE';
  fourchette_si_estimation?: string;
  confiance: number; // 1-10
  derniere_mise_a_jour?: string;
  methode_calcul?: string;
}

export interface OperationalEnrichmentData {
  donnees_operationnelles: {
    ressources_humaines: {
      nombre_salaries_total: DataSource & { valeur: number };
      nombre_chauffeurs: DataSource & { valeur: number };
      postes_en_recrutement: {
        nombre: number;
        types: string[];
        source: string;
        confiance: number;
      };
      masse_salariale_estimee: {
        valeur_annuelle: string;
        methode_calcul: string;
        fourchette: string;
        confiance: number;
      };
    };
    parc_vehicules: {
      poids_lourds_plus_7_5T: DataSource & {
        valeur: number;
        types_vehicules?: string[];
        eligibilite_ticpe: {
          eligible: boolean;
          potentiel_annuel_estime: string;
          calcul: string;
        };
      };
      vehicules_legers: DataSource & {
        valeur: number;
        types?: string[];
      };
      engins_speciaux: {
        present: boolean;
        types: string[];
        confiance: number;
      };
    };
    infrastructures: {
      locaux_principaux: {
        adresse: string;
        surface_m2: DataSource & { valeur: number };
        type: string;
        statut_propriete: {
          proprietaire_ou_locataire: 'PROPRIETAIRE' | 'LOCATAIRE' | 'INCONNU';
          source: string;
          confiance: number;
          details: string;
        };
      };
      autres_sites: {
        nombre: number;
        localisations: string[];
        source: string;
        confiance: number;
      };
      consommation_energetique: {
        niveau: 'ELEVÉE' | 'MOYENNE' | 'FAIBLE';
        justification: string;
        eligibilite_cee: {
          eligible: boolean;
          potentiel_annuel_estime: string;
          dispositifs_applicables: string[];
        };
        confiance: number;
      };
    };
    donnees_financieres: {
      chiffre_affaires: DataSource & {
        valeur: number;
        annee: string;
        evolution?: string;
      };
      resultat_net?: DataSource & {
        valeur: number;
        annee: string;
      };
      santé_financiere: {
        score: 'SAINE' | 'MOYENNE' | 'FRAGILE';
        justification: string;
        confiance: number;
      };
    };
    signaux_eligibilite_profitum: {
      ticpe: {
        eligible: boolean;
        score_certitude: number; // 1-10
        donnee_cle: string;
        potentiel_economie_annuelle: string;
        calcul_detaille: string;
        priorite: 'TRÈS HAUTE' | 'HAUTE' | 'MOYENNE' | 'FAIBLE';
      };
      cee: {
        eligible: boolean;
        score_certitude: number;
        donnee_cle: string;
        potentiel_economie_annuelle: string;
        travaux_eligibles?: string[];
        priorite: 'TRÈS HAUTE' | 'HAUTE' | 'MOYENNE' | 'FAIBLE';
      };
      optimisation_sociale: {
        eligible: boolean;
        score_certitude: number;
        donnee_cle: string;
        dispositifs_applicables: string[];
        potentiel_economie_annuelle: string;
        calcul_detaille: string;
        priorite: 'TRÈS HAUTE' | 'HAUTE' | 'MOYENNE' | 'FAIBLE';
      };
      autres_dispositifs: Record<string, {
        eligible: boolean;
        score_certitude: number;
        raison: string;
      }>;
    };
  };
  synthese_enrichissement: {
    score_completude_donnees: number; // 0-100
    donnees_manquantes_critiques: string[];
    donnees_haute_confiance: string[];
    recommandations_qualification: string[];
  };
  potentiel_global_profitum: {
    economies_annuelles_totales: {
      minimum: number;
      maximum: number;
      moyenne: number;
      details: string;
    };
    score_attractivite_prospect: number; // 1-10
    justification: string;
  };
}

// ===== ANALYSE TEMPORELLE =====

export interface PeriodeSensible {
  nom: string;
  date?: string; // YYYY-MM-DD
  date_debut?: string;
  date_fin?: string;
  impact: 'MAJEUR' | 'MOYEN' | 'MINEUR';
  type: 'Férié' | 'Vacances' | 'Événement sectoriel' | 'Deadline fiscale';
  recommandation: string;
}

export interface AccrocheContextuelle {
  contexte: string;
  phrase_suggestion: string;
  score_pertinence: number; // 1-10
  utilisable_du?: string; // YYYY-MM-DD
  utilisable_jusque?: string; // YYYY-MM-DD
}

export interface StratégieEnvoiEmail {
  delai_envoi?: string;
  delai_apres_email_1?: number;
  delai_apres_email_2?: number;
  delai_min?: number;
  delai_max?: number;
  jours_semaine_optimaux?: string[];
  heures_optimales?: string[];
  justification: string;
  eviter_periodes?: string[];
  jours_optimaux?: string[];
  alternative?: string;
  inclure?: boolean;
}

export interface TimingAnalysis {
  analyse_periode: {
    periode_actuelle: string;
    contexte_business: {
      charge_mentale_prospects: 'FAIBLE' | 'MOYENNE' | 'ELEVEE' | 'TRES_ELEVEE';
      raison: string;
      receptivite_estimee: number; // 1-10
      score_attention: number; // 1-10
    };
    evenements_proches: PeriodeSensible[];
    jours_feries_3_prochaines_semaines: string[];
  };
  recommandations_sequence: {
    nombre_emails_recommande: number;
    ajustement_vs_defaut: number;
    rationale_detaillee: string;
    justification_nombre: {
      facteurs_reduction: Array<{
        facteur: string;
        impact: number;
        explication: string;
      }>;
      facteurs_augmentation: Array<{
        facteur: string;
        impact: number;
        explication: string;
      }>;
      calcul_final: string;
    };
    matrice_decision: {
      si_score_attractivite_faible_3_5: string;
      si_score_attractivite_moyen_5_7: string;
      si_score_attractivite_eleve_7_9: string;
      si_score_attractivite_tres_eleve_9_10: string;
      ajustement_periode_defavorable: string;
      ajustement_periode_tres_favorable: string;
    };
    nombre_emails_par_scenario: {
      scenario_actuel: {
        nombre: number;
        delais: number[];
        justification: string;
      };
      scenario_optimal_alternatif?: {
        nombre: number;
        delais: number[];
        justification: string;
        condition: string;
      };
    };
    strategie_envoi: Record<string, StratégieEnvoiEmail>;
    ajustements_contextuels: {
      periodes_a_eviter_absolument: Array<{
        date_debut: string;
        date_fin: string;
        raison: string;
        action: string;
      }>;
      periodes_favorables: Array<{
        date_debut: string;
        date_fin: string;
        raison: string;
        boost_recommande?: string;
      }>;
    };
    personnalisation_temporelle: {
      accroches_contextuelles: AccrocheContextuelle[];
      tone_adjustments: {
        periode_actuelle: string;
        recommandation: string;
        cta_adapte: string;
      };
    };
  };
  scoring_opportunite: {
    score_global_timing: number; // 1-10
    explication: string;
    action_recommandee: 'ENVOYER_MAINTENANT' | 'ATTENDRE_APRES_FETES' | 'PROGRAMMER_JANVIER' | string;
    justification_detaillee: string;
  };
  insights_sectoriels?: {
    secteur: string;
    periodes_chargees_specifiques: string[];
    recommandation_sectorielle: string;
  };
}

// ===== DONNÉES ENRICHIES COMPLÈTES V4 =====

export interface EnrichedProspectDataV4 {
  // Enrichissement LinkedIn
  linkedin_data: LinkedInEnrichmentData | null;
  
  // Enrichissement Site Web
  web_data: WebEnrichmentData | null;
  
  // Données opérationnelles détaillées
  operational_data: OperationalEnrichmentData;
  
  // Analyse temporelle
  timing_analysis: TimingAnalysis;
  
  // Métadonnées
  enriched_at: string; // ISO timestamp
  enrichment_version: string; // 'v4.0'
}

// ===== GÉNÉRATION DE SÉQUENCE =====

export interface EmailStep {
  stepNumber: number;
  delayDays: number;
  subject: string;
  body: string;
  ice_breakers_fusionnes?: Array<{
    type: string;
    phrase_utilisee: string;
    position_dans_flux: string;
    statut_temporel: string;
    validation: string;
  }>;
  fluidite_narrative?: {
    connecteurs_utilises: string[];
    structure: string;
    score_fluidite: number;
  };
  adaptation_temporelle?: {
    contexte_reconnu: string;
    accroche_utilisee: string;
    cta_adapte: string;
    empathie_contexte: string;
  };
  nombre_mots?: number;
  tone_check?: string;
  personalization_score?: number;
  personalization_notes?: string;
}

export interface GeneratedSequence {
  steps: EmailStep[];
  meta: {
    nombre_emails: number;
    timing_strategy: string;
    enrichment_completeness: number;
    potentiel_total: number;
  };
  meta_sequence?: {
    timing_strategy: string;
    periodes_evitees: string[];
    optimisation_temporelle: string;
  };
}

export interface SequenceAdjustment {
  adjusted: boolean;
  steps: EmailStep[];
  originalNum?: number;
  newNum?: number;
  adjustment?: number;
  rationale?: string;
  message: string;
}

// ===== RÉPONSE API COMPLÈTE =====

export interface OptimalSequenceResponse {
  success: boolean;
  data: {
    sequence: GeneratedSequence;
    enrichment: EnrichedProspectDataV4;
    adjustment: SequenceAdjustment;
    prospect_insights: {
      potentiel_economies: string;
      score_attractivite: string;
      timing_strategy: string;
      donnees_operationnelles: {
        poids_lourds: number;
        chauffeurs: number;
        salaries: number;
        ca: number;
        surface_locaux: number;
        statut_propriete: 'PROPRIETAIRE' | 'LOCATAIRE' | 'INCONNU';
      };
    };
  };
  message: string;
}

export interface BatchSequenceResponse {
  success: boolean;
  total: number;
  generated: number;
  adjustments: {
    increased: number;
    decreased: number;
    unchanged: number;
  };
  results: OptimalSequenceResponse[];
}

