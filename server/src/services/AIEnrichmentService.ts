/**
 * Service d'enrichissement IA pour les rapports prospects
 * Utilise OpenAI GPT-4 pour analyser et enrichir les rapports
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import type {
  ReportEnrichmentResult,
  ApiResponse
} from '../types/prospects';
import { ProspectService } from './ProspectService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class AIEnrichmentService {
  
  /**
   * Enrichir un rapport prospect avec analyse complète IA
   * @param context Contexte complet du prospect
   */
  static async enrichProspectReport(context: {
    original_report: string;
    prospect_info: {
      name: string;
      company: string | null;
      email: string;
      phone: string | null;
      job_title: string | null;
      linkedin: string | null;
    };
    enrichment: any;
    email_history: Array<{
      sent_at: string;
      subject: string;
      opened: boolean;
      clicked: boolean;
      replied: boolean;
    }>;
    replies: Array<{
      received_at: string;
      subject: string;
      snippet: string | null;
    }>;
  }): Promise<ReportEnrichmentResult> {
    
    try {
      const prompt = `Tu es un expert en prospection B2B et analyse commerciale.

CONTEXTE PROSPECT :
- Nom: ${context.prospect_info.name}
- Entreprise: ${context.prospect_info.company || 'Non renseigné'}
- Email: ${context.prospect_info.email}
- Téléphone: ${context.prospect_info.phone || 'Non renseigné'}
- Poste: ${context.prospect_info.job_title || 'Non renseigné'}
- LinkedIn: ${context.prospect_info.linkedin || 'Non renseigné'}

DONNÉES D'ENRICHISSEMENT :
${JSON.stringify(context.enrichment, null, 2)}

HISTORIQUE EMAILS :
${context.email_history.length} emails envoyés
- Taux d'ouverture: ${this.calculateOpenRate(context.email_history)}%
- Taux de clic: ${this.calculateClickRate(context.email_history)}%
${context.email_history.map((e, i) => `${i+1}. ${e.sent_at}: "${e.subject}" - ${e.opened ? '✓ Ouvert' : '✗ Non ouvert'} ${e.clicked ? '✓ Cliqué' : ''}`).join('\n')}

RÉPONSES REÇUES :
${context.replies.length} réponse(s)
${context.replies.map((r, i) => `${i+1}. ${r.received_at}: "${r.subject}"\n   Extrait: ${r.snippet || 'N/A'}`).join('\n')}

RAPPORT ORIGINAL UTILISATEUR :
"""
${context.original_report}
"""

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MISSION :

1. 📝 REFORMULER le rapport original :
   - Garder TOUS les faits et informations mentionnés
   - Organiser en sections claires et logiques
   - Style professionnel et synthétique
   - Ajouter les informations d'enrichissement pertinentes
   - ⚠️ NE JAMAIS inventer d'informations
   - ⚠️ NE JAMAIS changer le sens des propos

2. 🎯 GÉNÉRER un plan d'action de prospection :

   a) ANALYSE SWOT :
      Forces: Potentiels, atouts, signaux positifs
      Faiblesses: Freins, objections, risques
      Opportunités: Leviers de vente, moments opportuns
      Menaces: Risques de perdre le deal, concurrence

   b) SCORING (0-10 avec justification) :
      - Potentiel de vente
      - Urgence du besoin
      - Adéquation produit/besoin (fit)
      - Probabilité de closing

   c) PLAN D'ACTION CONCRET :
      - Prochaines étapes immédiates
      - Arguments de vente à utiliser
      - Objections anticipées + réponses
      - Timeline optimale
      - Signaux d'achat à surveiller

   d) RECOMMANDATIONS STRATÉGIQUES :
      - Comment optimiser le tunnel
      - Leviers psychologiques
      - Moments clés pour closer
      - Red flags à surveiller

3. 💡 INSIGHTS CLÉS :
   - 3-5 points essentiels à retenir
   - Éléments différenciants
   - Angles d'approche recommandés

FORMAT DE RÉPONSE (JSON strict) :
{
  "enriched_content": "# Rapport Reformulé\\n\\n## Synthèse\\n...",
  "enriched_html": "<h1>Rapport Reformulé</h1><h2>Synthèse</h2>...",
  "action_plan": "# Plan d'Action\\n\\n## 1. Prochaines Étapes\\n...",
  "analysis": {
    "strengths": ["Point fort 1", "Point fort 2", "..."],
    "weaknesses": ["Faiblesse 1", "Faiblesse 2", "..."],
    "opportunities": ["Opportunité 1", "Opportunité 2", "..."],
    "threats": ["Menace 1", "Menace 2", "..."],
    "key_insights": ["Insight 1", "Insight 2", "Insight 3"],
    "potential_score": 8,
    "urgency_score": 7,
    "fit_score": 9,
    "closing_probability": 75
  }
}

IMPORTANT :
- enriched_content et action_plan en Markdown
- enriched_html en HTML propre
- Scores entre 0 et 10
- Closing probability entre 0 et 100
- Justifier chaque score dans les insights`;

      console.log('🤖 Appel OpenAI pour enrichissement rapport...');

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { 
            role: 'system', 
            content: 'Tu es un expert en analyse commerciale B2B et optimisation de tunnels de vente. Tu fournis des analyses approfondies, stratégiques et actionnables orientées conversion.' 
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 4000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      console.log('✅ Enrichissement IA terminé');

      // Valider la structure
      if (!result.enriched_content || !result.action_plan || !result.analysis) {
        throw new Error('Réponse IA incomplète');
      }

      return result as ReportEnrichmentResult;

    } catch (error: any) {
      console.error('❌ Erreur enrichissement IA:', error);
      throw error;
    }
  }

  /**
   * Calculer le taux d'ouverture
   */
  private static calculateOpenRate(emails: any[]): number {
    if (emails.length === 0) return 0;
    const opened = emails.filter(e => e.opened).length;
    return Math.round((opened / emails.length) * 100);
  }

  /**
   * Calculer le taux de clic
   */
  private static calculateClickRate(emails: any[]): number {
    if (emails.length === 0) return 0;
    const clicked = emails.filter(e => e.clicked).length;
    return Math.round((clicked / emails.length) * 100);
  }

  /**
   * Convertir Markdown en HTML simple
   */
  static markdownToHtml(markdown: string): string {
    // Conversion simple (pour une vraie app, utiliser marked ou showdown)
    let html = markdown;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Lists
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    
    return html;
  }
}

