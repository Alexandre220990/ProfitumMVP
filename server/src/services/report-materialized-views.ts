/**
 * Service pour créer et gérer les vues matérialisées pour les statistiques de rapports
 * Implémenté selon la recommandation 5.2 de l'analyse système notifications
 * 
 * Note: Supabase ne supporte pas directement les vues matérialisées PostgreSQL
 * On utilise donc des fonctions SQL stockées qui peuvent être appelées pour obtenir
 * des statistiques précalculées
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface NotificationStats {
  total_unread: number;
  total_high_priority: number;
  total_urgent: number;
  total_overdue: number;
  total_by_type: Record<string, number>;
  last_updated: string;
}

export interface RDVStats {
  total_today: number;
  total_overdue: number;
  total_by_status: Record<string, number>;
  last_updated: string;
}

/**
 * Service pour gérer les vues matérialisées (simulées via fonctions SQL)
 */
export class ReportMaterializedViewsService {
  /**
   * Initialiser les fonctions SQL nécessaires pour les statistiques
   * Cette fonction doit être appelée une fois lors de la configuration de la base
   */
  static async initializeViews(): Promise<void> {
    const functions = [
      // Fonction pour obtenir les statistiques de notifications
      `
      CREATE OR REPLACE FUNCTION get_notification_stats()
      RETURNS TABLE (
        total_unread bigint,
        total_high_priority bigint,
        total_urgent bigint,
        total_overdue bigint,
        stats_json jsonb,
        last_updated timestamp with time zone
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          COUNT(*) FILTER (WHERE is_read = false AND hidden_in_list = false)::bigint as total_unread,
          COUNT(*) FILTER (WHERE priority = 'high' AND hidden_in_list = false)::bigint as total_high_priority,
          COUNT(*) FILTER (WHERE priority = 'urgent' AND hidden_in_list = false)::bigint as total_urgent,
          COUNT(*) FILTER (WHERE status = 'late' AND hidden_in_list = false)::bigint as total_overdue,
          jsonb_object_agg(
            notification_type,
            COUNT(*)
          ) FILTER (WHERE hidden_in_list = false) as stats_json,
          NOW() as last_updated
        FROM notification
        WHERE user_type = 'admin'
          AND notification_type NOT IN ('rdv_reminder', 'rdv_confirmed', 'rdv_cancelled')
          AND status != 'replaced';
      END;
      $$ LANGUAGE plpgsql;
      `,
      
      // Fonction pour obtenir les statistiques de RDV
      `
      CREATE OR REPLACE FUNCTION get_rdv_stats()
      RETURNS TABLE (
        total_today bigint,
        total_overdue bigint,
        stats_json jsonb,
        last_updated timestamp with time zone
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          COUNT(*) FILTER (WHERE scheduled_date = CURRENT_DATE)::bigint as total_today,
          COUNT(*) FILTER (
            WHERE status IN ('proposed', 'scheduled')
            AND (scheduled_date || ' ' || scheduled_time)::timestamp < NOW()
          )::bigint as total_overdue,
          jsonb_object_agg(
            status,
            COUNT(*)
          ) as stats_json,
          NOW() as last_updated
        FROM "RDV";
      END;
      $$ LANGUAGE plpgsql;
      `
    ];

    for (const func of functions) {
      try {
        // Utiliser RPC pour exécuter les fonctions SQL
        // Note: Supabase ne permet pas d'exécuter directement du SQL DDL via le client
        // Il faudrait utiliser l'API SQL de Supabase ou un client PostgreSQL direct
        // Pour l'instant, on simule avec des requêtes normales
        console.log('⚠️ Les fonctions SQL doivent être créées manuellement dans Supabase SQL Editor');
        console.log('SQL à exécuter:', func.substring(0, 100) + '...');
      } catch (error) {
        console.error('❌ Erreur création fonction SQL:', error);
      }
    }
  }

  /**
   * Obtenir les statistiques de notifications (via fonction SQL si disponible, sinon calcul direct)
   */
  static async getNotificationStats(): Promise<NotificationStats> {
    try {
      // Essayer d'utiliser la fonction SQL si elle existe
      const { data, error } = await supabase.rpc('get_notification_stats');

      if (!error && data && data.length > 0) {
        const stats = data[0];
        return {
          total_unread: Number(stats.total_unread || 0),
          total_high_priority: Number(stats.total_high_priority || 0),
          total_urgent: Number(stats.total_urgent || 0),
          total_overdue: Number(stats.total_overdue || 0),
          total_by_type: stats.stats_json || {},
          last_updated: stats.last_updated
        };
      }
    } catch (error) {
      // Fonction non disponible, calculer directement
      console.log('ℹ️ Fonction SQL non disponible, calcul direct des statistiques');
    }

    // Calcul direct si fonction non disponible
    const [
      { count: totalUnread },
      { count: totalHighPriority },
      { count: totalUrgent },
      { count: totalOverdue },
      { data: byType }
    ] = await Promise.all([
      supabase
        .from('notification')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'admin')
        .eq('is_read', false)
        .eq('hidden_in_list', false)
        .not('notification_type', 'in', ['rdv_reminder', 'rdv_confirmed', 'rdv_cancelled'])
        .neq('status', 'replaced'),
      
      supabase
        .from('notification')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'admin')
        .eq('priority', 'high')
        .eq('hidden_in_list', false),
      
      supabase
        .from('notification')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'admin')
        .eq('priority', 'urgent')
        .eq('hidden_in_list', false),
      
      supabase
        .from('notification')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'admin')
        .eq('status', 'late')
        .eq('hidden_in_list', false),
      
      supabase
        .from('notification')
        .select('notification_type')
        .eq('user_type', 'admin')
        .eq('hidden_in_list', false)
    ]);

    // Compter par type
    const totalByType: Record<string, number> = {};
    if (byType) {
      for (const notif of byType) {
        totalByType[notif.notification_type] = (totalByType[notif.notification_type] || 0) + 1;
      }
    }

    return {
      total_unread: totalUnread || 0,
      total_high_priority: totalHighPriority || 0,
      total_urgent: totalUrgent || 0,
      total_overdue: totalOverdue || 0,
      total_by_type: totalByType,
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Obtenir les statistiques de RDV (via fonction SQL si disponible, sinon calcul direct)
   */
  static async getRDVStats(): Promise<RDVStats> {
    try {
      // Essayer d'utiliser la fonction SQL si elle existe
      const { data, error } = await supabase.rpc('get_rdv_stats');

      if (!error && data && data.length > 0) {
        const stats = data[0];
        return {
          total_today: Number(stats.total_today || 0),
          total_overdue: Number(stats.total_overdue || 0),
          total_by_status: stats.stats_json || {},
          last_updated: stats.last_updated
        };
      }
    } catch (error) {
      // Fonction non disponible, calculer directement
      console.log('ℹ️ Fonction SQL non disponible, calcul direct des statistiques RDV');
    }

    // Calcul direct si fonction non disponible
    const today = new Date().toISOString().split('T')[0];
    
    const [
      { count: totalToday },
      { count: totalOverdue },
      { data: allRDVs }
    ] = await Promise.all([
      supabase
        .from('RDV')
        .select('*', { count: 'exact', head: true })
        .eq('scheduled_date', today),
      
      supabase
        .from('RDV')
        .select('*', { count: 'exact', head: true })
        .in('status', ['proposed', 'scheduled'])
        .lt('scheduled_date', today),
      
      supabase
        .from('RDV')
        .select('status')
    ]);

    // Compter par statut
    const totalByStatus: Record<string, number> = {};
    if (allRDVs) {
      for (const rdv of allRDVs) {
        totalByStatus[rdv.status] = (totalByStatus[rdv.status] || 0) + 1;
      }
    }

    return {
      total_today: totalToday || 0,
      total_overdue: totalOverdue || 0,
      total_by_status: totalByStatus,
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Instructions pour créer les fonctions SQL dans Supabase
   */
  static getSQLInstructions(): string {
    return `
-- Instructions pour créer les vues matérialisées dans Supabase SQL Editor
-- 
-- 1. Aller dans Supabase Dashboard > SQL Editor
-- 2. Exécuter les fonctions SQL ci-dessous
-- 3. Les fonctions seront disponibles via supabase.rpc()

-- Fonction pour statistiques de notifications
CREATE OR REPLACE FUNCTION get_notification_stats()
RETURNS TABLE (
  total_unread bigint,
  total_high_priority bigint,
  total_urgent bigint,
  total_overdue bigint,
  stats_json jsonb,
  last_updated timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE is_read = false AND hidden_in_list = false)::bigint as total_unread,
    COUNT(*) FILTER (WHERE priority = 'high' AND hidden_in_list = false)::bigint as total_high_priority,
    COUNT(*) FILTER (WHERE priority = 'urgent' AND hidden_in_list = false)::bigint as total_urgent,
    COUNT(*) FILTER (WHERE status = 'late' AND hidden_in_list = false)::bigint as total_overdue,
    jsonb_object_agg(
      notification_type,
      COUNT(*)
    ) FILTER (WHERE hidden_in_list = false) as stats_json,
    NOW() as last_updated
  FROM notification
  WHERE user_type = 'admin'
    AND notification_type NOT IN ('rdv_reminder', 'rdv_confirmed', 'rdv_cancelled')
    AND status != 'replaced';
END;
$$ LANGUAGE plpgsql;

-- Fonction pour statistiques de RDV
CREATE OR REPLACE FUNCTION get_rdv_stats()
RETURNS TABLE (
  total_today bigint,
  total_overdue bigint,
  stats_json jsonb,
  last_updated timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE scheduled_date = CURRENT_DATE)::bigint as total_today,
    COUNT(*) FILTER (
      WHERE status IN ('proposed', 'scheduled')
      AND (scheduled_date || ' ' || scheduled_time)::timestamp < NOW()
    )::bigint as total_overdue,
    jsonb_object_agg(
      status,
      COUNT(*)
    ) as stats_json,
    NOW() as last_updated
  FROM "RDV";
END;
$$ LANGUAGE plpgsql;
    `;
  }
}
