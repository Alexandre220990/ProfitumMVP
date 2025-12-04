/**
 * Service de Génération de Séquences V4
 * Avec ajustement automatique du nombre d'emails et fluidité narrative
 */

import OpenAI from 'openai';
import {
  EnrichedProspectDataV4,
  GeneratedSequence,
  EmailStep,
  SequenceAdjustment,
  TimingAnalysis
} from '../types/enrichment-v4';
import { Prospect } from '../types/prospects';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export class SequenceGeneratorServiceV4 {
  
  /**
   * Ajuster automatiquement le nombre d'emails selon recommandations
   */
  adjustSequenceSteps(
    timingAnalysis: TimingAnalysis,
    currentSteps: EmailStep[]
  ): SequenceAdjustment {
    const recommendedNum = timingAnalysis.recommandations_sequence.nombre_emails_recommande;
    const currentNum = currentSteps.length;
    
    if (recommendedNum === currentNum) {
      console.log(`✅ Nombre d'emails optimal : ${currentNum} (aucun ajustement)`);
      return {
        adjusted: false,
        steps: currentSteps,
        message: `${currentNum} emails recommandés (optimal)`
      };
    }
    
    console.log(`🔄 Ajustement : ${currentNum} → ${recommendedNum} emails`);
    console.log(`📋 Raison : ${timingAnalysis.recommandations_sequence.rationale_detaillee}`);
    
    // Ajuster le nombre d'étapes
    let adjustedSteps: EmailStep[] = [];
    
    if (recommendedNum > currentNum) {
      // Ajouter des étapes
      adjustedSteps = [...currentSteps];
      const strategie = timingAnalysis.recommandations_sequence.strategie_envoi;
      
      for (let i = currentNum; i < recommendedNum; i++) {
        const emailKey = `email_${i + 1}`;
        const delayDays = strategie[emailKey]?.delai_apres_email_1 
          || strategie[emailKey]?.delai_apres_email_2 
          || (3 + i * 2);
        
        adjustedSteps.push({
          stepNumber: i + 1,
          delayDays,
          subject: '',
          body: ''
        });
      }
    } else {
      // Réduire les étapes (garder les N premières)
      adjustedSteps = currentSteps.slice(0, recommendedNum);
    }
    
    return {
      adjusted: true,
      steps: adjustedSteps,
      originalNum: currentNum,
      newNum: recommendedNum,
      adjustment: recommendedNum - currentNum,
      rationale: timingAnalysis.recommandations_sequence.rationale_detaillee,
      message: `Ajusté à ${recommendedNum} emails (${recommendedNum > currentNum ? '+' : ''}${recommendedNum - currentNum})`
    };
  }

  /**
   * Générer la séquence d'emails avec fluidité narrative
   */
  async generateSequence(
    prospectInfo: Prospect,
    enrichedData: EnrichedProspectDataV4,
    context: string,
    adjustedSteps: EmailStep[]
  ): Promise<GeneratedSequence> {
    try {
      const numSteps = adjustedSteps.length;
      const companyName = prospectInfo.company_name || 'l\'entreprise';
      const firstName = prospectInfo.firstname || '';
      const lastName = prospectInfo.lastname || '';
      const fullName = `${firstName} ${lastName}`.trim() || 'le décisionnaire';
      
      // Construire le prompt système V4
      const systemPrompt = this.buildSystemPromptV4(enrichedData, numSteps);
      
      // Construire le prompt utilisateur V4
      const userPrompt = this.buildUserPromptV4(
        prospectInfo,
        enrichedData,
        context,
        numSteps
      );
      
      console.log(`✍️ Génération de ${numSteps} emails pour ${companyName}...`);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Pas de réponse de l\'IA pour la génération');
      }

      const generatedSequence = JSON.parse(content);
      
      // Mapper avec les délais recommandés
      const finalSteps: EmailStep[] = generatedSequence.steps.map((step: any, index: number) => ({
        ...step,
        delayDays: adjustedSteps[index]?.delayDays || this.calculateOptimalDelay(index, enrichedData.timing_analysis)
      }));
      
      console.log(`✅ Séquence générée : ${finalSteps.length} emails`);

      return {
        steps: finalSteps,
        meta: {
          nombre_emails: finalSteps.length,
          timing_strategy: enrichedData.timing_analysis.scoring_opportunite.action_recommandee,
          enrichment_completeness: enrichedData.operational_data.synthese_enrichissement.score_completude_donnees,
          potentiel_total: enrichedData.operational_data.potentiel_global_profitum.economies_annuelles_totales.moyenne
        },
        meta_sequence: generatedSequence.meta_sequence
      };
      
    } catch (error) {
      console.error('Erreur génération séquence:', error);
      throw error;
    }
  }

  /**
   * Construire le prompt système V4 (avec ton corrigé et fluidité)
   */
  private buildSystemPromptV4(enrichedData: EnrichedProspectDataV4, numSteps: number): string {
    const currentDate = new Date().toISOString().split('T')[0];
    
    return `Tu es un expert en prospection B2B ultra-personnalisée pour Profitum, plateforme SaaS d'optimisation financière pour entreprises françaises.

🎯 TON RÔLE : CRÉER DES EMAILS QUI RESSEMBLENT À UNE VRAIE CONVERSATION

⚠️ RÈGLE ABSOLUE : Chaque email doit donner l'impression qu'un humain l'a rédigé spécifiquement pour CE prospect.

**Caractéristiques d'un email "humain" :**
- ✅ Longueur naturelle : 200-280 mots pour email 1 (pas des emails de 4 lignes)
- ✅ Phrases variées : courtes ET longues, pas robotique
- ✅ Ton conversationnel : comme si tu écrivais à une connaissance professionnelle
- ✅ Transitions fluides : UN SEUL FLUX NARRATIF du début à la fin
- ✅ Détails personnalisés : montrer qu'on a VRAIMENT regardé le profil
- ✅ Questions ouvertes : inviter au dialogue, pas juste "call to action" sec
- ✅ Contexte et storytelling léger : pas juste "Profitum fait X, voulez-vous Y?"

🌊 PRINCIPE DE FLUIDITÉ NARRATIVE (CRITIQUE)

**❌ CE QU'ON NE VEUT PAS :**
\`\`\`
Bonjour Emma,

J'ai vu que vous étiez au salon X. [BLOC 1]

J'ai lu votre article sur Y. [BLOC 2]

Profitum fait Z. [BLOC 3]

Voulez-vous un appel ? [BLOC 4]
\`\`\`
→ Problème : 4 blocs distincts, aucun lien, robotique

**✅ CE QU'ON VEUT :**
\`\`\`
Bonjour Emma,

En suivant l'actualité de [Entreprise] ces dernières semaines, deux 
choses ont particulièrement retenu mon attention : d'abord [ICE BREAKER 1], 
et surtout [ICE BREAKER 2]. [INSIGHT PERSONNEL].

C'est d'ailleurs en creusant un peu plus [DÉTAIL] que je me suis dit 
qu'on devrait échanger. Parce que [OBSERVATION SECTORIELLE]. Concrètement, 
[SIGNAL OPÉRATIONNEL], [BÉNÉFICE CHIFFRÉ].

Ce qui rend ça intéressant avec Profitum, c'est que nous avons packagé 
toute la complexité réglementaire pour que tout vous soit simplifié. 
Nous travaillons déjà avec [PROOF SOCIAL]. Sur votre profil spécifiquement, 
[ESTIMATION PERSONNALISÉE].

J'imagine que [EMPATHIE CONTEXTE]. Mais vu [ÉLÉMENT UNIQUE], ça vaudrait 
peut-être le coup qu'on se cale 15 minutes [TIMING ADAPTÉ] ?
\`\`\`
→ Solution : UN SEUL flux narratif, liens naturels, storytelling

📊 DONNÉES ENRICHIES DISPONIBLES :

**DATE ACTUELLE : ${currentDate}**

**PROFIL DÉCISIONNAIRE :**
${JSON.stringify(enrichedData.operational_data.donnees_operationnelles, null, 2).substring(0, 1000)}...

**ICE BREAKERS AVEC GESTION TEMPORELLE :**
${enrichedData.linkedin_data ? JSON.stringify(enrichedData.linkedin_data.ice_breakers_generes, null, 2) : 'Non disponibles'}

**ÉLIGIBILITÉ & ARGUMENTS :**
${JSON.stringify(enrichedData.operational_data.donnees_operationnelles.signaux_eligibilite_profitum, null, 2)}

**CONTEXTE TEMPOREL :**
${JSON.stringify(enrichedData.timing_analysis.analyse_periode.contexte_business, null, 2)}

🚨 GESTION CRITIQUE DES DATES DANS LES ICE BREAKERS

Avant d'utiliser un ice breaker basé sur un événement/post :

1. **VÉRIFIER LE STATUT TEMPOREL** :
   - Si statut_temporel = "FUTUR" → Utiliser phrase standard
   - Si statut_temporel = "PASSE" → Utiliser phrase_alternative_si_passe
   - Si statut_temporel = "EN_COURS" → Adapter ("J'espère que vous profitez...")
   - Si statut_temporel = "PERIME" → Éviter ou être très prudent

2. **ADAPTER LA CONJUGAISON ET LE TON** :
   - ✅ Futur : "J'espère vous y rencontrer", "Vous serez présent ?"
   - ✅ Passé : "J'ai vu que vous étiez présent", "Comment s'est passé..."
   - ❌ JAMAIS : "J'espère vous y rencontrer" pour événement passé

🚨 EXPRESSIONS À ÉVITER (TON TROP FAMILIER) :

❌ "On bosse avec" → ✅ "Nous travaillons avec" / "Nous accompagnons"
❌ "On gère" → ✅ "Nous prenons en charge"
❌ "C'est géré en 2-3h" → ✅ "Tout vous est simplifié" / "Le process est entièrement simplifié"
❌ "On fait" → ✅ "Nous proposons" / "Nous mettons en place"
❌ "Ça cartonne" → ✅ "Les résultats sont excellents"

✅ EXPRESSIONS RECOMMANDÉES (CHALEUREUX MAIS PROFESSIONNEL) :

✅ "Nous travaillons avec" / "Nous accompagnons"
✅ "Tout vous est simplifié" / "Le process est entièrement allégé"
✅ "C'est d'ailleurs..." / "Ce qui rend ça intéressant..."
✅ "Particulièrement" / "Vraiment" (dosés)
✅ "Ça vaudrait peut-être le coup" (acceptable)
✅ "J'imagine que" / "Je me doute que" (empathie)

🎯 STRUCTURE NARRATIVE OBLIGATOIRE POUR EMAIL 1 :

1. **Ouverture observation (50-70 mots)** :
   "En [ACTION: parcourant/suivant] [SOURCE] ces dernières [PÉRIODE], 
   [NOMBRE] choses ont [VERBE: retenu mon attention/interpellé] : 
   [ICE BREAKER 1], et [CONNECTEUR: surtout/particulièrement] 
   [ICE BREAKER 2]. [DÉTAIL PRÉCIS ou INSIGHT]."

2. **Transition causale (20-30 mots)** :
   "C'est d'ailleurs en [ACTION: creusant/analysant] [DÉTAIL] que..."
   "Ce contexte m'amène à vous contacter car..."

3. **Connexion valeur (60-80 mots)** :
   "[OBSERVATION SECTORIELLE]. Concrètement, [SIGNAL OPÉRATIONNEL], 
   vous êtes [QUALIFICATION]. Entre [DISPOSITIF 1], [DISPOSITIF 2], 
   c'est souvent [CHIFFRE PERSONNALISÉ]."

4. **Approfondissement (40-60 mots)** :
   "Ce qui rend ça intéressant [PROOF SOCIAL ou PROCESS]. 
   Sur votre profil spécifiquement, [ESTIMATION ULTRA-PERSONNALISÉE]."

5. **Empathie + CTA adapté (30-40 mots)** :
   "J'imagine que [RECONNAISSANCE CONTEXTE]. Mais vu [ÉLÉMENT UNIQUE], 
   ça vaudrait peut-être le coup qu'on se cale 15 minutes [TIMING ADAPTÉ] ?"

6. **P.S. valeur (optionnel, 15-20 mots)** :
   "P.S. : [OFFRE VALEUR GRATUITE] avant même qu'on échange."

💡 LONGUEURS CIBLES :
- Email 1 : 200-280 mots (long, fluide, narratif)
- Email 2 : 120-180 mots
- Email 3 : 100-150 mots
- Dernier : 80-120 mots

🎯 OBJECTIF PRINCIPAL : ENGAGER LA DISCUSSION

Ton objectif n'est PAS de "vendre" dans l'email.
Ton objectif est de **FAIRE AVANCER LE PROCESS** = **ENGAGER LA DISCUSSION**.

Pour cela :
1. Créer de la curiosité (chiffres concrets, insider knowledge)
2. Établir la crédibilité (montrer qu'on connaît son secteur)
3. Réduire le risque perçu ("15 min", "sans engagement")
4. Donner envie de répondre (question ouverte, empathie, valeur)

NOMBRE D'EMAILS À GÉNÉRER : ${numSteps}`;
  }

  /**
   * Construire le prompt utilisateur V4
   */
  private buildUserPromptV4(
    prospectInfo: Prospect,
    enrichedData: EnrichedProspectDataV4,
    context: string,
    numSteps: number
  ): string {
    const currentDate = new Date().toISOString().split('T')[0];
    const companyName = prospectInfo.company_name || 'l\'entreprise';
    const firstName = prospectInfo.firstname || '';
    
    const timingData = enrichedData.timing_analysis;
    const operationalData = enrichedData.operational_data;
    
    return `🎯 OBJECTIF (INSTRUCTIONS UTILISATEUR - PRIORITÉ)

${context || 'Génère une séquence d\'emails professionnelle et personnalisée'}

📅 CONTEXTE TEMPOREL ACTUEL

**Date actuelle :** ${currentDate}
**Période :** ${timingData.analyse_periode.periode_actuelle}
**Charge mentale prospects :** ${timingData.analyse_periode.contexte_business.charge_mentale_prospects}
**Score timing :** ${timingData.scoring_opportunite.score_global_timing}/10

**Recommandations stratégiques :**
- Nombre d'emails optimal : ${numSteps}
- Action recommandée : ${timingData.scoring_opportunite.action_recommandee}

**Accroches contextuelles disponibles :**
${timingData.recommandations_sequence.personnalisation_temporelle.accroches_contextuelles.map(
  a => `- "${a.phrase_suggestion}" (score ${a.score_pertinence})`
).join('\n')}

📋 TA TÂCHE : GÉNÉRATION ULTRA-PERSONNALISÉE, FLUIDE ET TEMPORELLEMENT INTELLIGENTE

**Étape 1 : SÉLECTION ET VALIDATION DES ICE BREAKERS**

Sélectionne 2-3 ice breakers pour l'email 1, que tu vas **FUSIONNER** dans un seul flux narratif.

✅ **VALIDATION TEMPORELLE OBLIGATOIRE** :
1. Lis le champ "statut_temporel" de l'ice breaker
2. Si "FUTUR" : Utilise phrase standard
3. Si "PASSE" : Utilise "phrase_alternative_si_passe"
4. Si "EN_COURS" : Adapte ("J'espère que vous profitez...")
5. Si "PERIME" : Évite, passe au suivant

**Étape 2 : CONSTRUCTION NARRATIVE FLUIDE (CRITIQUE)**

Pour l'email 1, crée **UN SEUL FLUX NARRATIF** qui intègre tous les éléments.

**RÈGLES DE FLUIDITÉ OBLIGATOIRES :**

✅ **UN SEUL flux narratif** du début à la fin
✅ **Connecteurs naturels** ("C'est d'ailleurs...", "Ce qui rend ça intéressant...")
✅ **Pas de paragraphes distincts** type "bloc 1 salon / bloc 2 article / bloc 3 vente"
✅ **Storytelling** : observation → creusage → connexion → valeur → invitation
✅ **Ton chaleureux** mais pas survendeur
✅ **Adaptation temporelle** : reconnaître la période si pertinent

**Étape 3 : ADAPTATION TEMPORELLE**

Intègre les recommandations temporelles :

- **Si période chargée** : Reconnaître ("J'imagine que c'est une période chargée...")
  → CTA adapté : "début janvier" plutôt que "cette semaine"

- **Si fêtes proches** : Utiliser accroche contextuelle
  → CTA : "après la reprise"

**LONGUEURS CIBLES :**
- Email 1 : 200-280 mots (long et humain)
- Email 2 : 120-180 mots
- Email 3+ : 100-150 mots

Génère EXACTEMENT ${numSteps} email${numSteps > 1 ? 's' : ''} au format JSON :

{
  "steps": [
    {
      "stepNumber": 1,
      "subject": "Sujet court (5-7 mots), contextuel",
      "body": "Corps FLUIDE et NARRATIF (200-280 mots, \\n pour sauts de ligne)",
      "ice_breakers_fusionnes": [
        {
          "type": "Événement",
          "phrase_utilisee": "phrase exacte utilisée",
          "position_dans_flux": "Observation initiale",
          "statut_temporel": "PASSE",
          "validation": "✅ Cohérent temporellement"
        }
      ],
      "fluidite_narrative": {
        "connecteurs_utilises": ["En suivant", "C'est d'ailleurs", "Ce qui rend ça intéressant"],
        "structure": "Observation fusionnée → Transition causale → Valeur → Empathie → CTA",
        "score_fluidite": 9
      },
      "adaptation_temporelle": {
        "contexte_reconnu": "Fin d'année chargée",
        "accroche_utilisee": "avec la fin d'année qui approche",
        "cta_adapte": "début janvier, après la reprise",
        "empathie_contexte": "J'imagine que c'est une période chargée"
      },
      "nombre_mots": 245,
      "tone_check": "Chaleureux, fluide, pas survendeur",
      "personalization_score": 10
    }
  ],
  "meta_sequence": {
    "timing_strategy": "${timingData.scoring_opportunite.action_recommandee}",
    "periodes_evitees": [],
    "optimisation_temporelle": "Délais ajustés selon contexte"
  }
}

⚠️ RAPPEL CRITIQUE :
- Email 1 = UN SEUL flux narratif fluide (pas de blocs distincts)
- Fusion naturelle de 2-3 ice breakers dans l'observation initiale
- Connecteurs narratifs entre chaque partie
- Adaptation temporelle selon contexte
- Ton chaleureux, pas survendeur, pas marketeux
- Expressions professionnelles : "Nous travaillons", "Tout vous est simplifié"
- Retourne UNIQUEMENT le JSON`;
  }

  /**
   * Calculer le délai optimal pour une étape
   */
  private calculateOptimalDelay(stepIndex: number, timingAnalysis: TimingAnalysis): number {
    const emailKey = `email_${stepIndex + 1}`;
    const strategie = timingAnalysis.recommandations_sequence.strategie_envoi[emailKey];
    
    if (strategie) {
      return strategie.delai_apres_email_1 
        || strategie.delai_apres_email_2 
        || 3;
    }
    
    // Fallback : délais standards
    if (stepIndex === 0) return 0;
    if (stepIndex === 1) return 3;
    if (stepIndex === 2) return 7;
    return 3 + stepIndex * 2;
  }

  /**
   * Créer les étapes initiales
   */
  createInitialSteps(numSteps: number): EmailStep[] {
    return Array.from({ length: numSteps }, (_, i) => ({
      stepNumber: i + 1,
      delayDays: i === 0 ? 0 : 3 + i,
      subject: '',
      body: ''
    }));
  }

  /**
   * Workflow complet de génération
   */
  async generateOptimalSequence(
    prospectInfo: Prospect,
    enrichedData: EnrichedProspectDataV4,
    context: string,
    defaultSteps: number = 3
  ): Promise<{
    sequence: GeneratedSequence;
    adjustment: SequenceAdjustment;
  }> {
    try {
      console.log(`🚀 Génération séquence optimale pour ${prospectInfo.company_name}`);
      
      // 1. Créer les étapes initiales
      const initialSteps = this.createInitialSteps(defaultSteps);
      
      // 2. Ajuster selon recommandations timing
      const adjustment = this.adjustSequenceSteps(
        enrichedData.timing_analysis,
        initialSteps
      );
      
      if (adjustment.adjusted) {
        console.log(`✨ ${adjustment.message}`);
        console.log(`📋 Raison : ${adjustment.rationale}`);
      }
      
      // 3. Générer la séquence
      const sequence = await this.generateSequence(
        prospectInfo,
        enrichedData,
        context,
        adjustment.steps
      );
      
      console.log(`✅ Séquence générée : ${sequence.steps.length} emails`);
      
      return {
        sequence,
        adjustment
      };
      
    } catch (error) {
      console.error('Erreur génération séquence optimale:', error);
      throw error;
    }
  }
}

export default new SequenceGeneratorServiceV4();

