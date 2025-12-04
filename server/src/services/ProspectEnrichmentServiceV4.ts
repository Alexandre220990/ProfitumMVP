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
   * Générer une synthèse complète de l'enrichissement V4
   * Résume toutes les étapes : LinkedIn, Web, Opérationnel, Timing
   */
  static generateEnrichmentSynthesis(enrichedData: EnrichedProspectDataV4, prospectName: string): {
    synthese_complete: string;
    synthese_html: string;
    points_cles: string[];
    recommandations_action: string[];
    score_global: {
      completude: number;
      attractivite: number;
      timing: number;
      qualite_donnees: number;
    };
  } {
    const { linkedin_data, web_data, operational_data, timing_analysis } = enrichedData;
    
    // ============ POINTS CLÉS ============
    const points_cles: string[] = [];
    
    // LinkedIn
    if (linkedin_data) {
      const iceBreakerCount = linkedin_data.ice_breakers_generes?.filter(ib => ib.score >= 7).length || 0;
      if (iceBreakerCount > 0) {
        points_cles.push(`${iceBreakerCount} ice breaker(s) haute qualité identifié(s) sur LinkedIn`);
      }
      if (linkedin_data.decisionnaire_linkedin?.anciennete_poste) {
        points_cles.push(`Décisionnaire en poste depuis ${linkedin_data.decisionnaire_linkedin.anciennete_poste}`);
      }
    }
    
    // Opérationnel
    if (operational_data) {
      const eligibilites = operational_data.donnees_operationnelles.signaux_eligibilite_profitum;
      const dispositifsEligibles = [];
      if (eligibilites.ticpe?.eligible && eligibilites.ticpe.score_certitude >= 7) {
        dispositifsEligibles.push(`TICPE (${eligibilites.ticpe.potentiel_economie_annuelle})`);
      }
      if (eligibilites.cee?.eligible && eligibilites.cee.score_certitude >= 7) {
        dispositifsEligibles.push(`CEE (${eligibilites.cee.potentiel_economie_annuelle})`);
      }
      if (eligibilites.optimisation_sociale?.eligible && eligibilites.optimisation_sociale.score_certitude >= 7) {
        dispositifsEligibles.push(`Optim. Sociale (${eligibilites.optimisation_sociale.potentiel_economie_annuelle})`);
      }
      
      if (dispositifsEligibles.length > 0) {
        points_cles.push(`Éligible à ${dispositifsEligibles.length} dispositif(s) : ${dispositifsEligibles.join(', ')}`);
      }
      
      const potentiel = operational_data.potentiel_global_profitum;
      if (potentiel.economies_annuelles_totales.moyenne > 0) {
        points_cles.push(`Potentiel économies : ${potentiel.economies_annuelles_totales.minimum.toLocaleString()}€ - ${potentiel.economies_annuelles_totales.maximum.toLocaleString()}€/an`);
      }
      
      points_cles.push(`Score attractivité prospect : ${potentiel.score_attractivite_prospect}/10`);
    }
    
    // Timing
    if (timing_analysis) {
      const timingScore = timing_analysis.scoring_opportunite.score_global_timing;
      const action = timing_analysis.scoring_opportunite.action_recommandee;
      points_cles.push(`Timing : ${timingScore}/10 - Action : ${action}`);
    }
    
    // ============ RECOMMANDATIONS ACTION ============
    const recommandations_action: string[] = [];
    
    // Priorité selon score attractivité
    if (operational_data) {
      const scoreAttractivite = operational_data.potentiel_global_profitum.score_attractivite_prospect;
      if (scoreAttractivite >= 8) {
        recommandations_action.push('⭐ PRIORITÉ HAUTE : Prospect à forte valeur, contacter rapidement');
      } else if (scoreAttractivite >= 6) {
        recommandations_action.push('✓ Prospect qualifié, bon potentiel de conversion');
      } else if (scoreAttractivite >= 4) {
        recommandations_action.push('→ Prospect moyen, nécessite qualification approfondie');
      } else {
        recommandations_action.push('⚠ Faible potentiel, évaluer la pertinence d\'une approche');
      }
    }
    
    // Recommandations timing
    if (timing_analysis && timing_analysis.recommandations_sequence) {
      const nbEmailsRecommande = timing_analysis.recommandations_sequence.nombre_emails_recommande;
      const ajustement = timing_analysis.recommandations_sequence.ajustement_vs_defaut;
      
      if (ajustement > 0) {
        recommandations_action.push(`Augmenter la séquence à ${nbEmailsRecommande} emails (contexte favorable)`);
      } else if (ajustement < 0) {
        recommandations_action.push(`Réduire la séquence à ${nbEmailsRecommande} emails (période moins propice)`);
      }
    }
    
    if (timing_analysis && timing_analysis.scoring_opportunite) {
      if (timing_analysis.scoring_opportunite.action_recommandee === 'ENVOYER_MAINTENANT') {
        recommandations_action.push('✉ Envoyer immédiatement, contexte optimal');
      } else if (timing_analysis.scoring_opportunite.action_recommandee === 'ENVOYER_AVEC_PRUDENCE') {
        recommandations_action.push('⏰ Envoyer avec prudence, ajuster le ton');
      } else if (timing_analysis.scoring_opportunite.action_recommandee === 'REPORTER') {
        recommandations_action.push('⏸ Reporter l\'envoi, période peu favorable');
      }
    }
    
    // Recommandations ice breakers
    if (linkedin_data?.ice_breakers_generes) {
      const topIceBreakers = linkedin_data.ice_breakers_generes
        .filter(ib => ib.score >= 7)
        .slice(0, 2);
      
      if (topIceBreakers.length > 0) {
        recommandations_action.push(`Utiliser les ice breakers : "${topIceBreakers.map(ib => ib.type).join('", "')}"`);
      }
    }
    
    // Recommandations données manquantes
    if (operational_data?.synthese_enrichissement) {
      const donneesManquantes = operational_data.synthese_enrichissement.donnees_manquantes_critiques;
      if (donneesManquantes.length > 0) {
        recommandations_action.push(`⚠ Qualifier ces données : ${donneesManquantes.slice(0, 3).join(', ')}`);
      }
    }
    
    // ============ SYNTHÈSE MARKDOWN ============
    let synthese_complete = `# Synthèse Enrichissement V4 - ${prospectName}\n\n`;
    
    // Section 1: Résumé exécutif
    synthese_complete += `## 📊 Résumé Exécutif\n\n`;
    if (operational_data) {
      const potentiel = operational_data.potentiel_global_profitum;
      synthese_complete += `**Score Attractivité** : ${potentiel.score_attractivite_prospect}/10\n`;
      synthese_complete += `**Potentiel Économies** : ${potentiel.economies_annuelles_totales.minimum.toLocaleString()}€ - ${potentiel.economies_annuelles_totales.maximum.toLocaleString()}€/an (moy. ${potentiel.economies_annuelles_totales.moyenne.toLocaleString()}€)\n`;
      synthese_complete += `**Justification** : ${potentiel.justification}\n\n`;
    }
    
    // Section 2: LinkedIn
    synthese_complete += `## 🔗 Enrichissement LinkedIn\n\n`;
    if (linkedin_data) {
      synthese_complete += `### Entreprise\n`;
      if (linkedin_data.entreprise_linkedin) {
        const ent = linkedin_data.entreprise_linkedin;
        if (ent.followers) {
          synthese_complete += `- **Followers** : ${ent.followers}\n`;
        }
        if (ent.posts_recents && ent.posts_recents.length > 0) {
          synthese_complete += `- **Activité récente** : ${ent.posts_recents.length} post(s) identifié(s)\n`;
        }
        if (ent.evenements_participation && ent.evenements_participation.length > 0) {
          synthese_complete += `- **Événements** : ${ent.evenements_participation.length} événement(s)\n`;
        }
      }
      
      synthese_complete += `\n### Décisionnaire\n`;
      if (linkedin_data.decisionnaire_linkedin) {
        const dec = linkedin_data.decisionnaire_linkedin;
        if (dec.anciennete_poste) {
          synthese_complete += `- **Ancienneté au poste** : ${dec.anciennete_poste}\n`;
        }
        if (dec.style_communication) {
          synthese_complete += `- **Style** : ${dec.style_communication}\n`;
        }
        if (dec.niveau_activite) {
          synthese_complete += `- **Activité LinkedIn** : ${dec.niveau_activite}\n`;
        }
      }
      
      synthese_complete += `\n### Ice Breakers\n`;
      if (linkedin_data.ice_breakers_generes && linkedin_data.ice_breakers_generes.length > 0) {
        const topIceBreakers = linkedin_data.ice_breakers_generes
          .filter(ib => ib.score >= 6)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
        
        topIceBreakers.forEach((ib, index) => {
          synthese_complete += `${index + 1}. **[${ib.type}]** (Score: ${ib.score}/10) - Statut: ${ib.statut_temporel}\n`;
          synthese_complete += `   "${ib.phrase}"\n`;
        });
      } else {
        synthese_complete += `Aucun ice breaker de haute qualité identifié.\n`;
      }
    } else {
      synthese_complete += `Données LinkedIn non disponibles.\n`;
    }
    
    // Section 3: Site Web
    synthese_complete += `\n## 🌐 Analyse Site Web\n\n`;
    if (web_data) {
      if (web_data.site_web_analyse) {
        const site = web_data.site_web_analyse;
        synthese_complete += `**Activités principales** : ${site.activites_principales?.join(', ') || 'Non renseignées'}\n`;
        if (site.actualites_site && site.actualites_site.length > 0) {
          synthese_complete += `**Actualités récentes** : ${site.actualites_site.length} actualité(s)\n`;
        }
        if (site.certifications_labels && site.certifications_labels.length > 0) {
          synthese_complete += `**Certifications** : ${site.certifications_labels.join(', ')}\n`;
        }
      }
      
      if (web_data.opportunites_profitum) {
        const opp = web_data.opportunites_profitum;
        synthese_complete += `\n**Opportunités Profitum détectées** :\n`;
        if (opp.signaux_eligibilite_ticpe && opp.signaux_eligibilite_ticpe.score >= 7) {
          synthese_complete += `- ✓ TICPE : ${opp.signaux_eligibilite_ticpe.raison}\n`;
        }
        if (opp.signaux_eligibilite_cee && opp.signaux_eligibilite_cee.score >= 7) {
          synthese_complete += `- ✓ CEE : ${opp.signaux_eligibilite_cee.raison}\n`;
        }
        if (opp.signaux_optimisation_sociale && opp.signaux_optimisation_sociale.score >= 7) {
          synthese_complete += `- ✓ Optim. Sociale : ${opp.signaux_optimisation_sociale.raison}\n`;
        }
      }
    } else {
      synthese_complete += `Données site web non disponibles.\n`;
    }
    
    // Section 4: Données Opérationnelles
    synthese_complete += `\n## 📋 Données Opérationnelles\n\n`;
    if (operational_data) {
      const donnees = operational_data.donnees_operationnelles;
      
      synthese_complete += `### Ressources Humaines\n`;
      if (donnees.ressources_humaines?.nombre_salaries_total) {
        const rh = donnees.ressources_humaines.nombre_salaries_total;
        synthese_complete += `- **Salariés** : ${rh.valeur} (Confiance: ${rh.confiance}/10, Source: ${rh.source})\n`;
      }
      if (donnees.ressources_humaines?.nombre_chauffeurs) {
        const chauffeurs = donnees.ressources_humaines.nombre_chauffeurs;
        synthese_complete += `- **Chauffeurs** : ${chauffeurs.valeur} (Confiance: ${chauffeurs.confiance}/10)\n`;
      }
      
      synthese_complete += `\n### Parc Véhicules\n`;
      if (donnees.parc_vehicules?.poids_lourds_plus_7_5T) {
        const pl = donnees.parc_vehicules.poids_lourds_plus_7_5T;
        synthese_complete += `- **Poids Lourds +7.5T** : ${pl.valeur} (Confiance: ${pl.confiance}/10, Source: ${pl.source})\n`;
      }
      
      synthese_complete += `\n### Infrastructures\n`;
      if (donnees.infrastructures?.locaux_principaux?.surface_m2) {
        const surf = donnees.infrastructures.locaux_principaux.surface_m2;
        const statut = donnees.infrastructures.locaux_principaux.statut_propriete?.proprietaire_ou_locataire || 'INCONNU';
        synthese_complete += `- **Surface** : ${surf.valeur}m² (${statut})\n`;
      }
      
      synthese_complete += `\n### Éligibilité Profitum\n`;
      const eligibilites = donnees.signaux_eligibilite_profitum;
      
      // TICPE
      synthese_complete += `**TICPE**\n`;
      synthese_complete += `- Éligible : ${eligibilites.ticpe.eligible ? 'OUI' : 'NON'} (Certitude: ${eligibilites.ticpe.score_certitude}/10)\n`;
      synthese_complete += `- Potentiel : ${eligibilites.ticpe.potentiel_economie_annuelle}\n`;
      synthese_complete += `- Priorité : ${eligibilites.ticpe.priorite}\n`;
      
      // CEE
      synthese_complete += `\n**CEE**\n`;
      synthese_complete += `- Éligible : ${eligibilites.cee.eligible ? 'OUI' : 'NON'} (Certitude: ${eligibilites.cee.score_certitude}/10)\n`;
      synthese_complete += `- Potentiel : ${eligibilites.cee.potentiel_economie_annuelle}\n`;
      synthese_complete += `- Priorité : ${eligibilites.cee.priorite}\n`;
      
      // Optimisation Sociale
      synthese_complete += `\n**Optimisation Sociale**\n`;
      synthese_complete += `- Éligible : ${eligibilites.optimisation_sociale.eligible ? 'OUI' : 'NON'} (Certitude: ${eligibilites.optimisation_sociale.score_certitude}/10)\n`;
      synthese_complete += `- Potentiel : ${eligibilites.optimisation_sociale.potentiel_economie_annuelle}\n`;
      synthese_complete += `- Dispositifs : ${eligibilites.optimisation_sociale.dispositifs_applicables.join(', ')}\n`;
      
      synthese_complete += `\n### Complétude des Données\n`;
      const synthese_enrich = operational_data.synthese_enrichissement;
      synthese_complete += `- **Score complétude** : ${synthese_enrich.score_completude_donnees}/100\n`;
      if (synthese_enrich.donnees_manquantes_critiques.length > 0) {
        synthese_complete += `- **Données manquantes** : ${synthese_enrich.donnees_manquantes_critiques.join(', ')}\n`;
      }
      if (synthese_enrich.donnees_haute_confiance.length > 0) {
        synthese_complete += `- **Données fiables** : ${synthese_enrich.donnees_haute_confiance.join(', ')}\n`;
      }
    }
    
    // Section 5: Analyse Temporelle
    synthese_complete += `\n## ⏰ Analyse Temporelle\n\n`;
    if (timing_analysis) {
      const periode = timing_analysis.analyse_periode;
      synthese_complete += `**Période actuelle** : ${periode.periode_actuelle}\n`;
      synthese_complete += `**Charge mentale prospects** : ${periode.contexte_business.charge_mentale_prospects}\n`;
      synthese_complete += `**Réceptivité estimée** : ${periode.contexte_business.receptivite_estimee}/10\n`;
      synthese_complete += `**Score attention** : ${periode.contexte_business.score_attention}/10\n\n`;
      
      if (timing_analysis.scoring_opportunite) {
        const scoring = timing_analysis.scoring_opportunite;
        synthese_complete += `**Score Global Timing** : ${scoring.score_global_timing}/10\n`;
        synthese_complete += `**Action recommandée** : ${scoring.action_recommandee}\n`;
        synthese_complete += `**Justification** : ${scoring.justification_detaillee}\n\n`;
      }
      
      if (timing_analysis.recommandations_sequence) {
        const reco = timing_analysis.recommandations_sequence;
        synthese_complete += `**Séquence recommandée** : ${reco.nombre_emails_recommande} email(s)\n`;
        synthese_complete += `**Ajustement** : ${reco.ajustement_vs_defaut > 0 ? '+' : ''}${reco.ajustement_vs_defaut}\n`;
        synthese_complete += `**Raison** : ${reco.rationale_detaillee}\n`;
      }
    }
    
    // Section 6: Recommandations
    synthese_complete += `\n## 💡 Recommandations d'Action\n\n`;
    recommandations_action.forEach(reco => {
      synthese_complete += `- ${reco}\n`;
    });
    
    // ============ SYNTHÈSE HTML ============
    let synthese_html = synthese_complete
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^\*\*(.+?)\*\* : (.+)$/gm, '<p><strong>$1</strong> : $2</p>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n/g, '<br/>');
    
    // ============ SCORES GLOBAUX ============
    const score_global = {
      completude: operational_data?.synthese_enrichissement?.score_completude_donnees || 0,
      attractivite: operational_data?.potentiel_global_profitum?.score_attractivite_prospect || 0,
      timing: timing_analysis?.scoring_opportunite?.score_global_timing || 0,
      qualite_donnees: operational_data ? Math.round(
        operational_data.synthese_enrichissement.donnees_haute_confiance.length * 10
      ) : 0
    };
    
    return {
      synthese_complete,
      synthese_html,
      points_cles,
      recommandations_action,
      score_global
    };
  }
  
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

