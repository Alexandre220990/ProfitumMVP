/**
 * Service de Tracking des Performances des Séquences
 * Analyse les métriques : taux d'ouverture, réponse, conversion par ice breaker, ajustement, etc.
 */

import { supabase } from '../lib/supabase';

interface PerformanceMetrics {
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  total_replied: number;
  total_converted: number;
  open_rate: number;
  click_rate: number;
  reply_rate: number;
  conversion_rate: number;
}

interface IceBreakerPerformance {
  type: string;
  source: string;
  total_used: number;
  total_opened: number;
  total_replied: number;
  open_rate: number;
  reply_rate: number;
  avg_score: number;
}

interface AdjustmentPerformance {
  adjustment_type: 'increased' | 'decreased' | 'unchanged';
  original_num: number;
  new_num: number;
  total_sequences: number;
  avg_open_rate: number;
  avg_reply_rate: number;
  avg_conversion_rate: number;
}

interface ScoreCorrelation {
  score_range: string;
  total_prospects: number;
  avg_open_rate: number;
  avg_reply_rate: number;
  avg_conversion_rate: number;
}

export class SequencePerformanceTracker {
  
  /**
   * Calculer les métriques globales
   */
  async getGlobalMetrics(dateFrom?: Date, dateTo?: Date): Promise<PerformanceMetrics> {
    try {
      let query = supabase
        .from('prospect_emails')
        .select('opened, clicked, replied, bounced');

      if (dateFrom) {
        query = query.gte('sent_at', dateFrom.toISOString());
      }
      if (dateTo) {
        query = query.lte('sent_at', dateTo.toISOString());
      }

      const { data: emails, error } = await query.not('sent_at', 'is', null);

      if (error) throw error;

      const total_sent = emails?.length || 0;
      const total_opened = emails?.filter(e => e.opened).length || 0;
      const total_clicked = emails?.filter(e => e.clicked).length || 0;
      const total_replied = emails?.filter(e => e.replied).length || 0;

      // Récupérer les conversions (prospects qui ont converti)
      const { data: conversions } = await supabase
        .from('prospects')
        .select('id')
        .eq('emailing_status', 'replied')
        .gte('updated_at', dateFrom?.toISOString() || '2024-01-01');

      const total_converted = conversions?.length || 0;

      return {
        total_sent,
        total_opened,
        total_clicked,
        total_replied,
        total_converted,
        open_rate: total_sent > 0 ? (total_opened / total_sent) * 100 : 0,
        click_rate: total_sent > 0 ? (total_clicked / total_sent) * 100 : 0,
        reply_rate: total_sent > 0 ? (total_replied / total_sent) * 100 : 0,
        conversion_rate: total_sent > 0 ? (total_converted / total_sent) * 100 : 0
      };

    } catch (error) {
      console.error('❌ Erreur calcul métriques globales:', error);
      return {
        total_sent: 0,
        total_opened: 0,
        total_clicked: 0,
        total_replied: 0,
        total_converted: 0,
        open_rate: 0,
        click_rate: 0,
        reply_rate: 0,
        conversion_rate: 0
      };
    }
  }

  /**
   * Analyser les performances par type d'ice breaker
   */
  async getIceBreakerPerformance(): Promise<IceBreakerPerformance[]> {
    try {
      // Récupérer les emails avec métadonnées ice breakers
      const { data: scheduledEmails, error } = await supabase
        .from('prospect_emails_scheduled')
        .select('prospect_email_id, metadata')
        .eq('status', 'sent')
        .not('prospect_email_id', 'is', null);

      if (error) throw error;

      // Récupérer les performances des emails
      const emailIds = scheduledEmails?.map(e => e.prospect_email_id).filter(Boolean) || [];
      
      const { data: emails } = await supabase
        .from('prospect_emails')
        .select('id, opened, replied')
        .in('id', emailIds);

      // Agréger par type d'ice breaker
      const iceBreakerStats: Record<string, {
        type: string;
        source: string;
        count: number;
        opened: number;
        replied: number;
        scores: number[];
      }> = {};

      scheduledEmails?.forEach(scheduled => {
        const metadata = scheduled.metadata as any;
        const iceBreakers = metadata?.ice_breakers || [];
        const email = emails?.find(e => e.id === scheduled.prospect_email_id);

        iceBreakers.forEach((ib: any) => {
          const key = `${ib.type}_${ib.source}`;
          
          if (!iceBreakerStats[key]) {
            iceBreakerStats[key] = {
              type: ib.type,
              source: ib.source || 'Unknown',
              count: 0,
              opened: 0,
              replied: 0,
              scores: []
            };
          }

          iceBreakerStats[key].count++;
          if (email?.opened) iceBreakerStats[key].opened++;
          if (email?.replied) iceBreakerStats[key].replied++;
          if (ib.score) iceBreakerStats[key].scores.push(ib.score);
        });
      });

      // Convertir en tableau de résultats
      return Object.values(iceBreakerStats).map(stat => ({
        type: stat.type,
        source: stat.source,
        total_used: stat.count,
        total_opened: stat.opened,
        total_replied: stat.replied,
        open_rate: stat.count > 0 ? (stat.opened / stat.count) * 100 : 0,
        reply_rate: stat.count > 0 ? (stat.replied / stat.count) * 100 : 0,
        avg_score: stat.scores.length > 0 
          ? stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length 
          : 0
      }))
      .sort((a, b) => b.reply_rate - a.reply_rate); // Trier par taux de réponse décroissant

    } catch (error) {
      console.error('❌ Erreur analyse ice breakers:', error);
      return [];
    }
  }

  /**
   * Analyser les performances selon l'ajustement (augmenté/réduit/inchangé)
   */
  async getAdjustmentPerformance(): Promise<AdjustmentPerformance[]> {
    try {
      // Récupérer les prospects avec enrichissement V4
      const { data: prospects, error } = await supabase
        .from('prospects')
        .select('id, enrichment_data, emailing_status')
        .eq('enrichment_data->>enrichment_version', 'v4.0')
        .not('enrichment_data', 'is', null);

      if (error) throw error;

      // Récupérer les performances des emails pour ces prospects
      const prospectIds = prospects?.map(p => p.id) || [];
      
      const { data: emails } = await supabase
        .from('prospect_emails')
        .select('prospect_id, opened, replied')
        .in('prospect_id', prospectIds);

      // Agréger par type d'ajustement
      const adjustmentStats: Record<string, {
        type: 'increased' | 'decreased' | 'unchanged';
        sequences: number;
        total_emails: number;
        opened: number;
        replied: number;
        converted: number;
        original_nums: number[];
        new_nums: number[];
      }> = {
        increased: {
          type: 'increased',
          sequences: 0,
          total_emails: 0,
          opened: 0,
          replied: 0,
          converted: 0,
          original_nums: [],
          new_nums: []
        },
        decreased: {
          type: 'decreased',
          sequences: 0,
          total_emails: 0,
          opened: 0,
          replied: 0,
          converted: 0,
          original_nums: [],
          new_nums: []
        },
        unchanged: {
          type: 'unchanged',
          sequences: 0,
          total_emails: 0,
          opened: 0,
          replied: 0,
          converted: 0,
          original_nums: [],
          new_nums: []
        }
      };

      prospects?.forEach(prospect => {
        const enrichmentData = prospect.enrichment_data as any;
        const timingAnalysis = enrichmentData?.timing_analysis;
        
        if (!timingAnalysis) return;

        const recommended = timingAnalysis.recommandations_sequence?.nombre_emails_recommande || 3;
        const adjustment = timingAnalysis.recommandations_sequence?.ajustement_vs_defaut || 0;
        
        let adjustmentType: 'increased' | 'decreased' | 'unchanged';
        if (adjustment > 0) {
          adjustmentType = 'increased';
        } else if (adjustment < 0) {
          adjustmentType = 'decreased';
        } else {
          adjustmentType = 'unchanged';
        }

        const stat = adjustmentStats[adjustmentType];
        stat.sequences++;
        stat.original_nums.push(recommended - adjustment);
        stat.new_nums.push(recommended);

        // Compter les emails pour ce prospect
        const prospectEmails = emails?.filter(e => e.prospect_id === prospect.id) || [];
        stat.total_emails += prospectEmails.length;
        stat.opened += prospectEmails.filter(e => e.opened).length;
        stat.replied += prospectEmails.filter(e => e.replied).length;

        if (prospect.emailing_status === 'replied') {
          stat.converted++;
        }
      });

      // Convertir en tableau de résultats
      return Object.values(adjustmentStats)
        .filter(stat => stat.sequences > 0)
        .map(stat => ({
          adjustment_type: stat.type,
          original_num: stat.original_nums.length > 0
            ? Math.round(stat.original_nums.reduce((a, b) => a + b, 0) / stat.original_nums.length)
            : 3,
          new_num: stat.new_nums.length > 0
            ? Math.round(stat.new_nums.reduce((a, b) => a + b, 0) / stat.new_nums.length)
            : 3,
          total_sequences: stat.sequences,
          avg_open_rate: stat.total_emails > 0 ? (stat.opened / stat.total_emails) * 100 : 0,
          avg_reply_rate: stat.total_emails > 0 ? (stat.replied / stat.total_emails) * 100 : 0,
          avg_conversion_rate: stat.sequences > 0 ? (stat.converted / stat.sequences) * 100 : 0
        }));

    } catch (error) {
      console.error('❌ Erreur analyse ajustements:', error);
      return [];
    }
  }

  /**
   * Analyser la corrélation score attractivité / conversion
   */
  async getScoreCorrelation(): Promise<ScoreCorrelation[]> {
    try {
      // Récupérer les prospects avec enrichissement V4
      const { data: prospects, error } = await supabase
        .from('prospects')
        .select('id, enrichment_data, emailing_status')
        .eq('enrichment_data->>enrichment_version', 'v4.0')
        .not('enrichment_data', 'is', null);

      if (error) throw error;

      // Récupérer les performances des emails
      const prospectIds = prospects?.map(p => p.id) || [];
      
      const { data: emails } = await supabase
        .from('prospect_emails')
        .select('prospect_id, opened, replied')
        .in('prospect_id', prospectIds);

      // Agréger par plages de score
      const scoreRanges = [
        { min: 0, max: 3, label: '0-3 (Faible)' },
        { min: 3, max: 5, label: '3-5 (Moyen-faible)' },
        { min: 5, max: 7, label: '5-7 (Moyen)' },
        { min: 7, max: 9, label: '7-9 (Élevé)' },
        { min: 9, max: 10, label: '9-10 (Très élevé)' }
      ];

      const correlations: ScoreCorrelation[] = scoreRanges.map(range => {
        const prospectsInRange = prospects?.filter(p => {
          const enrichmentData = p.enrichment_data as any;
          const score = enrichmentData?.operational_data?.potentiel_global_profitum?.score_attractivite_prospect || 0;
          return score >= range.min && score < range.max;
        }) || [];

        const prospectIdsInRange = prospectsInRange.map(p => p.id);
        const emailsInRange = emails?.filter(e => prospectIdsInRange.includes(e.prospect_id)) || [];
        const converted = prospectsInRange.filter(p => p.emailing_status === 'replied').length;

        return {
          score_range: range.label,
          total_prospects: prospectsInRange.length,
          avg_open_rate: emailsInRange.length > 0
            ? (emailsInRange.filter(e => e.opened).length / emailsInRange.length) * 100
            : 0,
          avg_reply_rate: emailsInRange.length > 0
            ? (emailsInRange.filter(e => e.replied).length / emailsInRange.length) * 100
            : 0,
          avg_conversion_rate: prospectsInRange.length > 0
            ? (converted / prospectsInRange.length) * 100
            : 0
        };
      });

      return correlations.filter(c => c.total_prospects > 0);

    } catch (error) {
      console.error('❌ Erreur analyse corrélation scores:', error);
      return [];
    }
  }

  /**
   * Générer un rapport complet de performances
   */
  async generatePerformanceReport(dateFrom?: Date, dateTo?: Date): Promise<{
    global_metrics: PerformanceMetrics;
    ice_breaker_performance: IceBreakerPerformance[];
    adjustment_performance: AdjustmentPerformance[];
    score_correlation: ScoreCorrelation[];
    top_performing_ice_breakers: IceBreakerPerformance[];
    insights: string[];
  }> {
    try {
      console.log('📊 Génération rapport de performances...');

      const [globalMetrics, iceBreakerPerf, adjustmentPerf, scoreCorr] = await Promise.all([
        this.getGlobalMetrics(dateFrom, dateTo),
        this.getIceBreakerPerformance(),
        this.getAdjustmentPerformance(),
        this.getScoreCorrelation()
      ]);

      // Top 5 ice breakers performants
      const topIceBreakers = iceBreakerPerf
        .sort((a, b) => b.reply_rate - a.reply_rate)
        .slice(0, 5);

      // Générer des insights
      const insights: string[] = [];

      // Insight 1 : Meilleur type d'ice breaker
      if (topIceBreakers.length > 0) {
        insights.push(
          `Le type d'ice breaker le plus performant est "${topIceBreakers[0].type}" ` +
          `avec un taux de réponse de ${topIceBreakers[0].reply_rate.toFixed(1)}%`
        );
      }

      // Insight 2 : Impact ajustement
      const increasedAdj = adjustmentPerf.find(a => a.adjustment_type === 'increased');
      const unchangedAdj = adjustmentPerf.find(a => a.adjustment_type === 'unchanged');
      
      if (increasedAdj && unchangedAdj) {
        const diff = increasedAdj.avg_reply_rate - unchangedAdj.avg_reply_rate;
        if (diff > 0) {
          insights.push(
            `Les séquences avec augmentation du nombre d'emails performent ` +
            `${diff.toFixed(1)}% mieux en taux de réponse`
          );
        }
      }

      // Insight 3 : Corrélation score
      const highScoreRange = scoreCorr.find(s => s.score_range.includes('9-10'));
      const lowScoreRange = scoreCorr.find(s => s.score_range.includes('0-3'));
      
      if (highScoreRange && lowScoreRange) {
        const diff = highScoreRange.avg_conversion_rate - lowScoreRange.avg_conversion_rate;
        insights.push(
          `Les prospects avec score attractivité élevé (9-10) convertissent ` +
          `${diff.toFixed(1)}% mieux que les scores faibles (0-3)`
        );
      }

      // Insight 4 : Performance globale
      insights.push(
        `Taux de réponse global : ${globalMetrics.reply_rate.toFixed(1)}% ` +
        `(${globalMetrics.total_replied}/${globalMetrics.total_sent} emails)`
      );

      console.log('✅ Rapport généré avec succès');

      return {
        global_metrics: globalMetrics,
        ice_breaker_performance: iceBreakerPerf,
        adjustment_performance: adjustmentPerf,
        score_correlation: scoreCorr,
        top_performing_ice_breakers: topIceBreakers,
        insights
      };

    } catch (error) {
      console.error('❌ Erreur génération rapport:', error);
      throw error;
    }
  }

  /**
   * Exporter les données pour A/B testing
   */
  async exportABTestingData(): Promise<{
    v4_prospects: Array<{
      prospect_id: string;
      enrichment_version: string;
      adjustment_applied: boolean;
      num_emails: number;
      open_rate: number;
      reply_rate: number;
      converted: boolean;
    }>;
    legacy_prospects: Array<{
      prospect_id: string;
      num_emails: number;
      open_rate: number;
      reply_rate: number;
      converted: boolean;
    }>;
  }> {
    try {
      console.log('📤 Export données A/B testing...');

      // Prospects V4
      const { data: v4Prospects } = await supabase
        .from('prospects')
        .select('id, enrichment_data, emailing_status')
        .eq('enrichment_data->>enrichment_version', 'v4.0');

      // Prospects legacy (sans V4)
      const { data: legacyProspects } = await supabase
        .from('prospects')
        .select('id, emailing_status')
        .or('enrichment_data.is.null,enrichment_data->>enrichment_version.neq.v4.0');

      // Récupérer tous les emails
      const allProspectIds = [
        ...(v4Prospects?.map(p => p.id) || []),
        ...(legacyProspects?.map(p => p.id) || [])
      ];

      const { data: allEmails } = await supabase
        .from('prospect_emails')
        .select('prospect_id, opened, replied')
        .in('prospect_id', allProspectIds);

      // Formater données V4
      const v4Data = v4Prospects?.map(p => {
        const emails = allEmails?.filter(e => e.prospect_id === p.id) || [];
        const enrichmentData = p.enrichment_data as any;
        const timingAnalysis = enrichmentData?.timing_analysis;
        
        return {
          prospect_id: p.id,
          enrichment_version: 'v4.0',
          adjustment_applied: timingAnalysis?.recommandations_sequence?.ajustement_vs_defaut !== 0,
          num_emails: emails.length,
          open_rate: emails.length > 0 ? (emails.filter(e => e.opened).length / emails.length) * 100 : 0,
          reply_rate: emails.length > 0 ? (emails.filter(e => e.replied).length / emails.length) * 100 : 0,
          converted: p.emailing_status === 'replied'
        };
      }) || [];

      // Formater données legacy
      const legacyData = legacyProspects?.map(p => {
        const emails = allEmails?.filter(e => e.prospect_id === p.id) || [];
        
        return {
          prospect_id: p.id,
          num_emails: emails.length,
          open_rate: emails.length > 0 ? (emails.filter(e => e.opened).length / emails.length) * 100 : 0,
          reply_rate: emails.length > 0 ? (emails.filter(e => e.replied).length / emails.length) * 100 : 0,
          converted: p.emailing_status === 'replied'
        };
      }) || [];

      console.log(`✅ Export terminé : ${v4Data.length} V4, ${legacyData.length} legacy`);

      return {
        v4_prospects: v4Data,
        legacy_prospects: legacyData
      };

    } catch (error) {
      console.error('❌ Erreur export A/B testing:', error);
      return {
        v4_prospects: [],
        legacy_prospects: []
      };
    }
  }
}

export default new SequencePerformanceTracker();

