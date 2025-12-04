/**
 * Service de gestion des réponses prospects
 * Utilise la vue prospect_replies_summary pour les statistiques
 */

import { createClient } from '@supabase/supabase-js';
import type {
  ProspectReplySummary,
  RepliesFilters,
  RepliesGlobalStats,
  ApiResponse
} from '../types/prospects';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class ProspectRepliesService {
  
  /**
   * Récupérer toutes les réponses avec filtres
   */
  static async getRepliesSummary(
    filters?: RepliesFilters
  ): Promise<ApiResponse<ProspectReplySummary[]>> {
    try {
      let query = supabase
        .from('prospect_replies_summary')
        .select('*')
        .order('last_reply_at', { ascending: false });

      // Appliquer les filtres
      if (filters) {
        if (filters.unread_only) {
          query = query.gt('unread_replies', 0);
        }

        if (filters.sequence_id) {
          query = query.eq('sequence_id', filters.sequence_id);
        }

        if (filters.date_from) {
          query = query.gte('first_reply_at', filters.date_from);
        }

        if (filters.date_to) {
          query = query.lte('last_reply_at', filters.date_to);
        }

        if (filters.quick_reply_only) {
          query = query.eq('is_quick_reply', true);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur récupération réponses:', error);
        return {
          success: false,
          error: `Erreur récupération réponses: ${error.message}`
        };
      }

      return {
        success: true,
        data: data as ProspectReplySummary[]
      };
    } catch (error: any) {
      console.error('Exception getRepliesSummary:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }
  
  /**
   * Statistiques globales des réponses
   */
  static async getGlobalStats(): Promise<ApiResponse<RepliesGlobalStats>> {
    try {
      // Récupérer toutes les réponses
      const { data: replies } = await supabase
        .from('prospect_replies_summary')
        .select('*');

      if (!replies || replies.length === 0) {
        return {
          success: true,
          data: {
            total_replies: 0,
            response_rate: 0,
            avg_response_time_hours: 0,
            quick_replies_count: 0,
            replies_today: 0,
            replies_this_week: 0,
            replies_this_month: 0,
            best_sequence: null,
            avg_emails_before_reply: 0
          }
        };
      }

      // Total de réponses
      const totalReplies = replies.length;

      // Calculer le taux de réponse
      const { count: totalProspects } = await supabase
        .from('prospects')
        .select('*', { count: 'exact', head: true })
        .neq('emailing_status', 'pending');

      const responseRate = totalProspects && totalProspects > 0
        ? Math.round((totalReplies / totalProspects) * 100)
        : 0;

      // Calculer temps moyen de réponse
      let totalResponseTimeHours = 0;
      replies.forEach(reply => {
        if (reply.first_reply_at && reply.sequence_start_date) {
          const diff = new Date(reply.first_reply_at).getTime() - 
                       new Date(reply.sequence_start_date).getTime();
          totalResponseTimeHours += diff / (1000 * 60 * 60); // Convertir en heures
        }
      });
      const avgResponseTimeHours = Math.round(totalResponseTimeHours / replies.length);

      // Compter réponses rapides (< 24h)
      const quickRepliesCount = replies.filter(r => r.is_quick_reply).length;

      // Dates de référence
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Compter réponses par période
      const repliesToday = replies.filter(r => 
        new Date(r.last_reply_at) >= today
      ).length;

      const repliesThisWeek = replies.filter(r => 
        new Date(r.last_reply_at) >= weekAgo
      ).length;

      const repliesThisMonth = replies.filter(r => 
        new Date(r.last_reply_at) >= monthAgo
      ).length;

      // Meilleure séquence
      const sequenceStats: Record<string, {
        name: string;
        total: number;
        withSequence: number;
      }> = {};

      replies.forEach(reply => {
        if (reply.sequence_id && reply.sequence_name) {
          if (!sequenceStats[reply.sequence_id]) {
            sequenceStats[reply.sequence_id] = {
              name: reply.sequence_name,
              total: 0,
              withSequence: 0
            };
          }
          sequenceStats[reply.sequence_id].withSequence++;
        }
      });

      // Calculer les taux de réponse par séquence
      for (const sequenceId in sequenceStats) {
        const { count: sequenceTotal } = await supabase
          .from('prospect_email_scheduled')
          .select('prospect_id', { count: 'exact', head: true })
          .eq('sequence_id', sequenceId);

        sequenceStats[sequenceId].total = sequenceTotal || 0;
      }

      // Trouver la meilleure
      let bestSequence: RepliesGlobalStats['best_sequence'] = null;
      let bestRate = 0;

      Object.entries(sequenceStats).forEach(([sequenceId, stats]) => {
        if (stats.total > 0) {
          const rate = (stats.withSequence / stats.total) * 100;
          if (rate > bestRate) {
            bestRate = rate;
            bestSequence = {
              sequence_id: sequenceId,
              sequence_name: stats.name,
              response_rate: Math.round(rate)
            };
          }
        }
      });

      // Moyenne emails avant réponse
      const totalEmailsBeforeReply = replies.reduce(
        (sum, r) => sum + (r.emails_sent_before_reply || 0),
        0
      );
      const avgEmailsBeforeReply = Math.round(totalEmailsBeforeReply / replies.length);

      return {
        success: true,
        data: {
          total_replies: totalReplies,
          response_rate: responseRate,
          avg_response_time_hours: avgResponseTimeHours,
          quick_replies_count: quickRepliesCount,
          replies_today: repliesToday,
          replies_this_week: repliesThisWeek,
          replies_this_month: repliesThisMonth,
          best_sequence: bestSequence,
          avg_emails_before_reply: avgEmailsBeforeReply
        }
      };
    } catch (error: any) {
      console.error('Exception getGlobalStats:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }
  
  /**
   * Marquer toutes les réponses d'un prospect comme lues
   */
  static async markProspectRepliesAsRead(
    prospectId: string
  ): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('prospect_email_received')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('prospect_id', prospectId)
        .eq('is_read', false);

      if (error) {
        console.error('Erreur marquage réponses lues:', error);
        return {
          success: false,
          error: `Erreur marquage réponses lues: ${error.message}`
        };
      }

      console.log(`✅ Réponses marquées comme lues pour prospect ${prospectId}`);

      return {
        success: true,
        data: undefined
      };
    } catch (error: any) {
      console.error('Exception markProspectRepliesAsRead:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Obtenir le nombre de réponses non lues (pour badge)
   */
  static async getUnreadCount(): Promise<ApiResponse<number>> {
    try {
      const { count, error } = await supabase
        .from('prospect_email_received')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) {
        console.error('Erreur comptage non lus:', error);
        return {
          success: false,
          error: `Erreur comptage non lus: ${error.message}`
        };
      }

      return {
        success: true,
        data: count || 0
      };
    } catch (error: any) {
      console.error('Exception getUnreadCount:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }
}

