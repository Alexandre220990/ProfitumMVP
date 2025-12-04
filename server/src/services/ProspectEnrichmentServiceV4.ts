/**
 * Service d'enrichissement V4 - Système complet optimisé
 * Inclut : LinkedIn, Site Web, Données opérationnelles, Analyse temporelle
 */

import OpenAI from 'openai';
import {
  LinkedInEnrichmentData,
  WebEnrichmentData,
  OperationalEnrichmentData,
  TimingAnalysis,
  EnrichedProspectDataV4
} from '../types/enrichment-v4';
import { Prospect } from '../types/prospects';
import ProspectCacheService from './ProspectCacheService';
import DataCompletenessDetector from './DataCompletenessDetector';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export class ProspectEnrichmentServiceV4 {
  
  /**
   * ÉTAPE 1 : Enrichissement LinkedIn (avec cache)
   */
  async enrichLinkedIn(
    companyName: string,
    siren: string | null,
    fullName: string | null,
    jobTitle: string | null,
    linkedinCompanyUrl: string | null = null,
    linkedinProfileUrl: string | null = null,
    prospectId?: string,
    skipCache: boolean = false
  ): Promise<LinkedInEnrichmentData | null> {
    // Vérifier cache si prospectId fourni
    if (prospectId && !skipCache) {
      const cached = await ProspectCacheService.getCachedEnrichment(prospectId, 'linkedin');
      if (cached) {
        console.log(`💾 Cache LinkedIn utilisé pour prospect ${prospectId}`);
        return cached;
      }
    }

    try {
      const currentDate = new Date().toISOString().split('T')[0];
      
      const prompt = `Tu es un expert en recherche et analyse de profils professionnels LinkedIn.

📊 DONNÉES FOURNIES :
- Entreprise : ${companyName}
- SIREN : ${siren || 'non disponible'}
- Décisionnaire : ${fullName || 'non disponible'}
- Poste : ${jobTitle || 'non disponible'}
- Date actuelle : ${currentDate}
- URL LinkedIn Entreprise : ${linkedinCompanyUrl || 'À rechercher'}
- URL LinkedIn Décisionnaire : ${linkedinProfileUrl || 'À rechercher'}

🎯 TA MISSION :
Analyse les informations LinkedIn disponibles et fournis une synthèse structurée au format JSON.

⚠️ RÈGLES CRITIQUES SUR LES DATES :

1. **DATES OBLIGATOIRES** : Toujours fournir une date précise (YYYY-MM-DD) ou "DATE_INCONNUE"
2. **STATUT TEMPOREL OBLIGATOIRE** : 
   - FUTUR : Événement/post dans le futur ou < 7 jours
   - EN_COURS : Événement en cours actuellement
   - PASSE : Événement/post passé depuis > 7 jours
   - PERIME : Post > 21 jours (moins pertinent pour ice breaker)
3. **ANCIENNETÉ EN JOURS** : Calculer pour chaque date par rapport à ${currentDate}
4. **ICE BREAKERS ADAPTATIFS** : Toujours fournir 2 versions (futur/passé) pour les événements
5. **SCORE AJUSTÉ** : Réduire le score si événement/post trop ancien (> 3 mois : -3 points)

Format JSON attendu :
{
  "entreprise_linkedin": {
    "followers": "Nombre d'abonnés si disponible",
    "posts_recents": [
      {
        "date": "YYYY-MM-DD",
        "type": "Annonce | Article | Événement | Recrutement",
        "contenu_resume": "Résumé en 1 phrase",
        "angle_ice_breaker": "Comment utiliser cette info en accroche personnalisée"
      }
    ],
    "evenements_participation": [
      {
        "nom_evenement": "Nom de l'événement",
        "date_debut": "YYYY-MM-DD",
        "date_fin": "YYYY-MM-DD",
        "statut_temporel": "FUTUR | EN_COURS | PASSE | DATE_INCONNUE",
        "type": "Salon | Conférence | Webinar | Table Ronde",
        "lieu": "Ville ou 'En ligne'",
        "ice_breaker_futur": "Si événement futur : 'J'espère vous y rencontrer au salon X'",
        "ice_breaker_passe": "Si événement passé : 'J'ai vu que vous étiez présent au salon X'",
        "ice_breaker_en_cours": "Si événement en cours : 'J'espère que vous profitez du salon X'"
      }
    ],
    "actualites_entreprise": [
      {
        "contenu": "Description de l'actualité",
        "date": "YYYY-MM-DD",
        "anciennete_jours": 15,
        "fraicheur": "TRES_RECENTE | RECENTE | ANCIENNE"
      }
    ],
    "employés_croissance": {
      "recrutements_recents": false,
      "departements_en_croissance": [],
      "signal_expansion": "Non disponible"
    }
  },
  "decisionnaire_linkedin": {
    "anciennete_poste": "X années/mois dans ce poste",
    "parcours_notable": "Ex-entreprises pertinentes, écoles, certifications",
    "posts_recents": [
      {
        "date": "YYYY-MM-DD",
        "anciennete_jours": 5,
        "sujet": "Sujet du post",
        "ice_breaker_suggestion": "Comment rebondir sur ce post",
        "pertinence_temporelle": "TRES_FRAIS | FRAIS | PERIME"
      }
    ],
    "centres_interet_pro": [],
    "points_communs_potentiels": [],
    "style_communication": "Formel | Accessible | Innovant | Conservateur",
    "niveau_activite": "Actif | Modéré | Passif"
  },
  "ice_breakers_generes": [
    {
      "type": "Événement",
      "phrase": "Nous nous croiserons peut-être au salon X",
      "phrase_alternative_si_passe": "J'ai vu que vous étiez présent au salon X",
      "phrase_alternative_si_en_cours": "J'espère que vous profitez du salon X",
      "contexte": "Événement X",
      "date_reference": "YYYY-MM-DD",
      "statut_temporel": "FUTUR | PASSE | EN_COURS",
      "anciennete_jours": 30,
      "score": 9,
      "source": "LinkedIn",
      "validite_temporelle": "Valable jusqu'au YYYY-MM-DD"
    }
  ],
  "insights_strategiques": {
    "meilleur_moment_contact": "Matin | Midi | Après-midi avec justification",
    "ton_recommande": "Formel | Semi-formel | Accessible",
    "angles_prioritaires": [
      "Angle 1 basé sur le profil",
      "Angle 2 basé sur l'actualité"
    ]
  }
}

Retourne UNIQUEMENT le JSON, sans texte avant ou après.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.4
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Pas de réponse de l\'IA pour l\'enrichissement LinkedIn');
      }

      const result = JSON.parse(content) as LinkedInEnrichmentData;
      
      // Mettre en cache si prospectId fourni
      if (prospectId) {
        await ProspectCacheService.setCachedEnrichment(prospectId, 'linkedin', result);
      }

      return result;
      
    } catch (error) {
      console.error('Erreur enrichissement LinkedIn:', error);
      return null;
    }
  }

  /**
   * ÉTAPE 2 : Enrichissement Site Web (avec cache)
   */
  async enrichWebsite(
    companyName: string,
    websiteUrl: string | null,
    scrapedContent: string = '',
    prospectId?: string,
    skipCache: boolean = false
  ): Promise<WebEnrichmentData | null> {
    // Vérifier cache si prospectId fourni
    if (prospectId && !skipCache) {
      const cached = await ProspectCacheService.getCachedEnrichment(prospectId, 'web');
      if (cached) {
        console.log(`💾 Cache Web utilisé pour prospect ${prospectId}`);
        return cached;
      }
    }

    try {
      if (!websiteUrl) {
        return null;
      }

      const prompt = `Tu es un expert en analyse de sites web d'entreprises pour identifier des opportunités commerciales.

📊 DONNÉES FOURNIES :
- Entreprise : ${companyName}
- URL Site Web : ${websiteUrl}
- Contenu Scrapé : 
${scrapedContent || 'Non disponible - Générer des estimations basées sur le secteur'}

🎯 TA MISSION :
Analyse le contenu du site web et fournis une synthèse structurée au format JSON.

Format JSON attendu :
{
  "site_web_analyse": {
    "activites_principales": ["Activité 1", "Activité 2"],
    "valeurs_entreprise": ["Innovation", "RSE", "Excellence"],
    "actualites_site": [
      {
        "titre": "Titre de l'actualité",
        "date": "YYYY-MM-DD ou 'Récent'",
        "type": "Nouveau produit | Partenariat | Certification | Expansion",
        "ice_breaker_suggestion": "Comment utiliser cette info en accroche"
      }
    ],
    "projets_en_cours": [],
    "certifications_labels": [],
    "presence_internationale": {
      "pays": ["France"],
      "bureaux": ["Paris"],
      "signal_expansion": false
    },
    "technologies_utilisees": [],
    "clients_references": []
  },
  "opportunites_profitum": {
    "signaux_eligibilite_ticpe": {
      "score": 0,
      "raison": "Non détecté",
      "preuves": []
    },
    "signaux_eligibilite_cee": {
      "score": 0,
      "raison": "À évaluer",
      "preuves": []
    },
    "signaux_optimisation_sociale": {
      "score": 0,
      "raison": "À évaluer",
      "preuves": []
    }
  },
  "ice_breakers_site_web": [],
  "tone_of_voice": {
    "style_site": "Corporatif | Innovant | Accessible | Technique",
    "recommendation_tone": "Adapter notre ton"
  }
}

⚠️ IMPORTANT : Base-toi UNIQUEMENT sur le contenu fourni, n'invente rien.

Retourne UNIQUEMENT le JSON, sans texte avant ou après.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.4
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Pas de réponse de l\'IA pour l\'enrichissement Web');
      }

      const result = JSON.parse(content) as WebEnrichmentData;
      
      // Mettre en cache si prospectId fourni
      if (prospectId) {
        await ProspectCacheService.setCachedEnrichment(prospectId, 'web', result);
      }

      return result;
      
    } catch (error) {
      console.error('Erreur enrichissement Web:', error);
      return null;
    }
  }

  /**
   * ÉTAPE 3 : Enrichissement Opérationnel Détaillé (avec cache)
   */
  async enrichOperationalData(
    prospectInfo: Prospect,
    linkedinData: LinkedInEnrichmentData | null,
    webData: WebEnrichmentData | null,
    publicData: any = null,
    skipCache: boolean = false
  ): Promise<OperationalEnrichmentData> {
    // Vérifier cache si prospectId disponible
    if (prospectInfo.id && !skipCache) {
      const cached = await ProspectCacheService.getCachedEnrichment(prospectInfo.id, 'operational');
      if (cached) {
        console.log(`💾 Cache Opérationnel utilisé pour prospect ${prospectInfo.id}`);
        return cached;
      }
    }

    try {
      const prompt = `Tu es un analyste d'entreprise expert spécialisé dans l'extraction de données opérationnelles précises pour les entreprises françaises.

📊 INFORMATIONS DU PROSPECT :
- Entreprise : ${prospectInfo.company_name || 'Non renseigné'}
- SIREN : ${prospectInfo.siren || 'non disponible'}
- Code NAF : ${prospectInfo.naf_code || 'non disponible'}
- Libellé NAF : ${prospectInfo.naf_label || 'non disponible'}
- Site web : ${prospectInfo.company_website || 'non disponible'}
- LinkedIn : ${prospectInfo.linkedin_company || 'non disponible'}

📱 DONNÉES LINKEDIN DISPONIBLES :
${linkedinData ? JSON.stringify(linkedinData, null, 2) : 'Non disponibles'}

🌐 DONNÉES SITE WEB SCRAPÉES :
${webData ? JSON.stringify(webData, null, 2) : 'Non disponibles'}

🔍 DONNÉES PUBLIQUES (SIRENE, INPI) :
${publicData ? JSON.stringify(publicData, null, 2) : 'Non disponibles'}

🎯 TA MISSION CRITIQUE :
Extraire ou estimer les données opérationnelles suivantes avec le maximum de précision :

- **Nombre de poids lourds +7.5T** : Essentiel pour TICPE
- **Nombre de chauffeurs** : Calcul via ratio 1.3-1.5 chauffeurs/véhicule
- **Nombre de salariés totaux** : Priorité données LinkedIn/SIRENE
- **Chiffre d'affaires** : Societe.com ou estimation NAF
- **Taille locaux en m²** : Mention site web ou estimation
- **Statut propriété** : PROPRIETAIRE ou LOCATAIRE (par défaut LOCATAIRE pour PME)

Format JSON attendu (structure complète dans le prompt original - je résume pour la brièveté).

⚠️ RÈGLES IMPORTANTES :
1. Prioriser sources fiables (site web > LinkedIn > SIRENE > estimation)
2. Toujours indiquer source et niveau de confiance (1-10)
3. Si estimation, fournir méthode de calcul
4. Vérifier cohérence des données entre elles
5. Calculer potentiels TICPE, CEE, Social avec précision

Retourne UNIQUEMENT le JSON, sans texte avant ou après.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.4
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Pas de réponse de l\'IA pour l\'enrichissement opérationnel');
      }

      const result = JSON.parse(content) as OperationalEnrichmentData;
      
      // Mettre en cache si prospectId disponible
      if (prospectInfo.id) {
        await ProspectCacheService.setCachedEnrichment(prospectInfo.id, 'operational', result);
      }

      return result;
      
    } catch (error) {
      console.error('Erreur enrichissement opérationnel:', error);
      
      // Retourner un fallback minimal
      return this.createFallbackOperationalData(prospectInfo);
    }
  }

  /**
   * ÉTAPE 4 : Analyse Contextuelle Temporelle (avec cache)
   */
  async analyzeContextualTiming(
    prospectInfo: Prospect,
    operationalData: OperationalEnrichmentData,
    defaultNumEmails: number = 3,
    skipCache: boolean = false
  ): Promise<TimingAnalysis> {
    // Vérifier cache si prospectId disponible
    // Note: Timing change quotidiennement, cache plus court (1 jour)
    if (prospectInfo.id && !skipCache) {
      const cached = await ProspectCacheService.getCachedEnrichment(prospectInfo.id, 'timing');
      if (cached) {
        console.log(`💾 Cache Timing utilisé pour prospect ${prospectInfo.id}`);
        return cached;
      }
    }

    try {
      const currentDate = new Date();
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.toLocaleDateString('fr-FR', { weekday: 'long' });
      const month = currentDate.toLocaleDateString('fr-FR', { month: 'long' });
      const quarter = `Q${Math.floor(currentDate.getMonth() / 3) + 1}`;
      
      // ✅ Vérification sécurisée des données opérationnelles
      const scoreAttractivite = operationalData?.potentiel_global_profitum?.score_attractivite_prospect ?? 5;
      const potentielMoyen = operationalData?.potentiel_global_profitum?.economies_annuelles_totales?.moyenne ?? 0;

      const prompt = `Tu es un expert en timing commercial et psychologie des cycles d'affaires B2B.

📅 CONTEXTE TEMPOREL ACTUEL :
- Date actuelle : ${dateStr}
- Jour de la semaine : ${dayOfWeek}
- Mois : ${month}
- Trimestre : ${quarter}

📊 INFORMATIONS DU PROSPECT :
- Entreprise : ${prospectInfo.company_name}
- Secteur : ${prospectInfo.naf_label}
- Score attractivité : ${scoreAttractivite}/10
- Potentiel économies : ${potentielMoyen}€/an

📝 CONFIGURATION ACTUELLE SÉQUENCE :
- Nombre d'emails par défaut : ${defaultNumEmails}

🎯 TA MISSION :
Analyser le contexte et RECOMMANDER le nombre optimal d'emails pour cette séquence.

Considère :
- La période de l'année (fêtes, vacances, périodes fiscales)
- Le score d'attractivité du prospect
- La charge mentale probable des décisionnaires
- Les événements à venir (Noël, Nouvel An, etc.)

Format JSON avec recommandations détaillées sur :
- Nombre optimal d'emails (avec justification)
- Délais entre emails
- Périodes à éviter absolument
- Accroches contextuelles adaptées à la période
- Scoring d'opportunité timing

Retourne UNIQUEMENT le JSON, sans texte avant ou après.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.5
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Pas de réponse de l\'IA pour l\'analyse temporelle');
      }

      const result = JSON.parse(content) as TimingAnalysis;
      
      // Mettre en cache si prospectId disponible
      if (prospectInfo.id) {
        await ProspectCacheService.setCachedEnrichment(prospectInfo.id, 'timing', result);
      }

      return result;
      
    } catch (error) {
      console.error('Erreur analyse temporelle:', error);
      
      // Retourner un fallback minimal
      return this.createFallbackTimingAnalysis(defaultNumEmails);
    }
  }

  /**
   * WORKFLOW COMPLET D'ENRICHISSEMENT (avec cache et détection intelligente)
   */
  async enrichProspectComplete(
    prospectInfo: Prospect,
    defaultNumEmails: number = 3,
    forceReenrichment: boolean = false
  ): Promise<EnrichedProspectDataV4> {
    console.log(`🚀 Enrichissement complet V4 pour ${prospectInfo.company_name}...`);

    // ✅ ÉTAPE 0 : Détection de complétude (NOUVEAU)
    if (!forceReenrichment && prospectInfo.id) {
      const shouldSkip = DataCompletenessDetector.shouldSkipEnrichment(prospectInfo);
      
      if (shouldSkip.skip) {
        console.log(`⏭️ Skip enrichissement: ${shouldSkip.reason}`);
        const existing = DataCompletenessDetector.createEnrichmentFromExisting(prospectInfo);
        if (existing) {
          return existing;
        }
      }

      // Vérifier enrichissement complet en cache
      const cachedFull = await ProspectCacheService.getCachedEnrichment(prospectInfo.id, 'full');
      if (cachedFull && !forceReenrichment) {
        console.log(`💾 Cache complet utilisé pour prospect ${prospectInfo.id}`);
        return cachedFull;
      }
    }

    // ✅ ÉTAPE 0.5 : Déterminer ce qui doit être enrichi (NOUVEAU)
    let needsLinkedin = true;
    let needsWeb = true;
    let needsOperational = true;
    let needsTiming = true;

    let cachedLinkedin: LinkedInEnrichmentData | null = null;
    let cachedWeb: WebEnrichmentData | null = null;
    let cachedOperational: OperationalEnrichmentData | null = null;
    let cachedTiming: TimingAnalysis | null = null;

    if (prospectInfo.id && !forceReenrichment) {
      const needs = await ProspectCacheService.getEnrichmentNeeds(prospectInfo.id);
      
      needsLinkedin = needs.needsLinkedin;
      needsWeb = needs.needsWeb;
      needsOperational = needs.needsOperational;
      needsTiming = needs.needsTiming;
      
      cachedLinkedin = needs.cachedLinkedin;
      cachedWeb = needs.cachedWeb;
      cachedOperational = needs.cachedOperational;
      cachedTiming = needs.cachedTiming;

      console.log(`📊 Besoins enrichissement: LinkedIn=${needsLinkedin}, Web=${needsWeb}, Op=${needsOperational}, Timing=${needsTiming}`);
    }

    // 1. Enrichissement LinkedIn (si nécessaire)
    let linkedinData: LinkedInEnrichmentData | null = cachedLinkedin;
    if (needsLinkedin) {
      console.log('📱 Enrichissement LinkedIn...');
      linkedinData = await this.enrichLinkedIn(
        prospectInfo.company_name || '',
        prospectInfo.siren,
        `${prospectInfo.firstname || ''} ${prospectInfo.lastname || ''}`.trim(),
        prospectInfo.job_title,
        prospectInfo.linkedin_company,
        prospectInfo.linkedin_profile,
        prospectInfo.id,
        forceReenrichment
      );
    } else {
      console.log('⏭️ Skip LinkedIn (cache valide)');
    }

    // 2. Enrichissement Site Web (si nécessaire)
    let webData: WebEnrichmentData | null = cachedWeb;
    if (needsWeb) {
      console.log('🌐 Enrichissement Site Web...');
      webData = await this.enrichWebsite(
        prospectInfo.company_name || '',
        prospectInfo.company_website,
        '', // TODO: Implémenter scraping réel
        prospectInfo.id,
        forceReenrichment
      );
    } else {
      console.log('⏭️ Skip Web (cache valide)');
    }

    // 3. Enrichissement Opérationnel (si nécessaire)
    let operationalData: OperationalEnrichmentData = cachedOperational || this.createFallbackOperationalData(prospectInfo);
    if (needsOperational) {
      console.log('🔍 Enrichissement Opérationnel...');
      operationalData = await this.enrichOperationalData(
        prospectInfo,
        linkedinData,
        webData,
        null, // TODO: Implémenter récupération données publiques
        forceReenrichment
      );
    } else {
      console.log('⏭️ Skip Opérationnel (cache valide)');
    }

    // 4. Analyse Temporelle (si nécessaire)
    let timingAnalysis: TimingAnalysis = cachedTiming || this.createFallbackTimingAnalysis(defaultNumEmails);
    if (needsTiming) {
      console.log('📅 Analyse Temporelle...');
      timingAnalysis = await this.analyzeContextualTiming(
        prospectInfo,
        operationalData,
        defaultNumEmails,
        forceReenrichment
      );
    } else {
      console.log('⏭️ Skip Timing (cache valide)');
    }

    const result: EnrichedProspectDataV4 = {
      linkedin_data: linkedinData,
      web_data: webData,
      operational_data: operationalData,
      timing_analysis: timingAnalysis,
      enriched_at: new Date().toISOString(),
      enrichment_version: 'v4.0'
    };

    // Mettre en cache l'enrichissement complet
    if (prospectInfo.id) {
      await ProspectCacheService.setCachedEnrichment(prospectInfo.id, 'full', result);
    }

    console.log(`✅ Enrichissement V4 terminé pour ${prospectInfo.company_name}`);

    return result;
  }

  /**
   * Fallback : Données opérationnelles minimales
   */
  private createFallbackOperationalData(prospectInfo: Prospect): OperationalEnrichmentData {
    const nafLabel = prospectInfo.naf_label || 'Activité non renseignée';
    const companyName = prospectInfo.company_name || 'l\'entreprise';
    
    return {
      donnees_operationnelles: {
        ressources_humaines: {
          nombre_salaries_total: {
            valeur: 0,
            source: 'Non disponible',
            precision: 'ESTIMÉE',
            confiance: 1
          },
          nombre_chauffeurs: {
            valeur: 0,
            source: 'Non disponible',
            precision: 'ESTIMÉE',
            confiance: 1
          },
          postes_en_recrutement: {
            nombre: 0,
            types: [],
            source: 'Non disponible',
            confiance: 1
          },
          masse_salariale_estimee: {
            valeur_annuelle: 'À évaluer',
            methode_calcul: 'Non disponible',
            fourchette: 'À évaluer',
            confiance: 1
          }
        },
        parc_vehicules: {
          poids_lourds_plus_7_5T: {
            valeur: 0,
            source: 'Non disponible',
            precision: 'ESTIMÉE',
            confiance: 1,
            eligibilite_ticpe: {
              eligible: false,
              potentiel_annuel_estime: 'À évaluer',
              calcul: 'Données insuffisantes'
            }
          },
          vehicules_legers: {
            valeur: 0,
            source: 'Non disponible',
            precision: 'ESTIMÉE',
            confiance: 1
          },
          engins_speciaux: {
            present: false,
            types: [],
            confiance: 1
          }
        },
        infrastructures: {
          locaux_principaux: {
            adresse: prospectInfo.adresse || 'Non renseigné',
            surface_m2: {
              valeur: 0,
              source: 'Non disponible',
              precision: 'ESTIMÉE',
              confiance: 1
            },
            type: 'À déterminer',
            statut_propriete: {
              proprietaire_ou_locataire: 'INCONNU',
              source: 'Non disponible',
              confiance: 1,
              details: 'Aucune donnée disponible'
            }
          },
          autres_sites: {
            nombre: 0,
            localisations: [],
            source: 'Non disponible',
            confiance: 1
          },
          consommation_energetique: {
            niveau: 'MOYENNE',
            justification: 'Estimation par défaut',
            eligibilite_cee: {
              eligible: false,
              potentiel_annuel_estime: 'À évaluer',
              dispositifs_applicables: []
            },
            confiance: 1
          }
        },
        donnees_financieres: {
          chiffre_affaires: {
            valeur: 0,
            annee: new Date().getFullYear().toString(),
            source: 'Non disponible',
            precision: 'ESTIMÉE',
            confiance: 1
          },
          santé_financiere: {
            score: 'MOYENNE',
            justification: 'Données insuffisantes',
            confiance: 1
          }
        },
        signaux_eligibilite_profitum: {
          ticpe: {
            eligible: false,
            score_certitude: 1,
            donnee_cle: 'Données insuffisantes',
            potentiel_economie_annuelle: 'À évaluer',
            calcul_detaille: 'Nécessite enrichissement',
            priorite: 'FAIBLE'
          },
          cee: {
            eligible: false,
            score_certitude: 1,
            donnee_cle: 'Données insuffisantes',
            potentiel_economie_annuelle: 'À évaluer',
            priorite: 'FAIBLE'
          },
          optimisation_sociale: {
            eligible: true,
            score_certitude: 5,
            donnee_cle: 'Potentiellement éligible si salariés',
            dispositifs_applicables: ['À évaluer'],
            potentiel_economie_annuelle: 'À évaluer',
            calcul_detaille: 'Nécessite nombre de salariés',
            priorite: 'MOYENNE'
          },
          autres_dispositifs: {}
        }
      },
      synthese_enrichissement: {
        score_completude_donnees: 10,
        donnees_manquantes_critiques: [
          'Nombre de salariés',
          'Chiffre d\'affaires',
          'Surface locaux',
          'Parc véhicules'
        ],
        donnees_haute_confiance: [],
        recommandations_qualification: [
          'Enrichir via appel de qualification',
          'Consulter bases de données publiques',
          'Scraper site web si disponible'
        ]
      },
      potentiel_global_profitum: {
        economies_annuelles_totales: {
          minimum: 0,
          maximum: 0,
          moyenne: 0,
          details: 'Données insuffisantes pour estimation'
        },
        score_attractivite_prospect: 5,
        justification: 'Score neutre par défaut - nécessite enrichissement'
      }
    };
  }

  /**
   * Fallback : Analyse temporelle minimale
   */
  private createFallbackTimingAnalysis(defaultNumEmails: number): TimingAnalysis {
    const currentDate = new Date();
    const month = currentDate.getMonth();
    
    // Déterminer si période chargée (novembre-décembre, juillet-août)
    const isHighSeason = month === 11 || month === 0 || month === 6 || month === 7;
    
    return {
      analyse_periode: {
        periode_actuelle: isHighSeason ? 'Période chargée' : 'Période normale',
        contexte_business: {
          charge_mentale_prospects: isHighSeason ? 'ELEVEE' : 'MOYENNE',
          raison: isHighSeason ? 'Période de fêtes/vacances' : 'Période normale d\'activité',
          receptivite_estimee: isHighSeason ? 4 : 7,
          score_attention: isHighSeason ? 3 : 7
        },
        evenements_proches: [],
        jours_feries_3_prochaines_semaines: []
      },
      recommandations_sequence: {
        nombre_emails_recommande: defaultNumEmails,
        ajustement_vs_defaut: 0,
        rationale_detaillee: `Maintien de ${defaultNumEmails} emails (configuration par défaut)`,
        justification_nombre: {
          facteurs_reduction: [],
          facteurs_augmentation: [],
          calcul_final: `Base ${defaultNumEmails} emails (standard)`
        },
        matrice_decision: {
          si_score_attractivite_faible_3_5: '2 emails max',
          si_score_attractivite_moyen_5_7: '3 emails',
          si_score_attractivite_eleve_7_9: '4 emails',
          si_score_attractivite_tres_eleve_9_10: '4-5 emails',
          ajustement_periode_defavorable: '-1 email',
          ajustement_periode_tres_favorable: '+1 email'
        },
        nombre_emails_par_scenario: {
          scenario_actuel: {
            nombre: defaultNumEmails,
            delais: [0, 3, 7],
            justification: 'Configuration standard'
          }
        },
        strategie_envoi: {
          email_1: {
            delai_envoi: 'Immédiat',
            jours_semaine_optimaux: ['Mardi', 'Mercredi', 'Jeudi'],
            heures_optimales: ['09h00-10h30', '14h00-15h30'],
            justification: 'Meilleurs jours pour prospection B2B'
          },
          email_2: {
            delai_apres_email_1: 3,
            justification: 'Délai standard de relance'
          },
          email_3: {
            delai_apres_email_2: 4,
            justification: 'Délai prolongé pour dernière tentative'
          }
        },
        ajustements_contextuels: {
          periodes_a_eviter_absolument: [],
          periodes_favorables: []
        },
        personnalisation_temporelle: {
          accroches_contextuelles: [],
          tone_adjustments: {
            periode_actuelle: 'Standard',
            recommandation: 'Ton professionnel mais accessible',
            cta_adapte: 'Cette semaine ou la prochaine'
          }
        }
      },
      scoring_opportunite: {
        score_global_timing: 7,
        explication: 'Période standard d\'activité B2B',
        action_recommandee: 'ENVOYER_MAINTENANT',
        justification_detaillee: 'Pas de contraintes temporelles majeures détectées'
      }
    };
  }
}

export default new ProspectEnrichmentServiceV4();

