/**
 * Service de base pour les rapports
 * Fournit la logique commune : dédoublonnage, groupement, normalisation, constantes
 * Implémenté selon les recommandations 5.1 et 5.2 de l'analyse système notifications
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ===== CONSTANTES =====

/**
 * Types de notifications à exclure des rapports (notifications liées aux RDV)
 */
export const EXCLUDED_NOTIFICATION_TYPES = [
  'rdv_reminder',
  'rdv_confirmed',
  'rdv_cancelled'
] as const;

/**
 * Priorités de notifications pour les rapports
 */
export const NOTIFICATION_PRIORITIES = {
  URGENT: 'urgent',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  NORMAL: 'normal'
} as const;

/**
 * Limites par défaut pour les rapports
 */
export const REPORT_LIMITS = {
  MAX_NOTIFICATIONS: 100,
  MAX_READ_NOTIFICATIONS: 100,
  MAX_OVERDUE_RDVS: 500,
  MAX_PENDING_ACTIONS: 500,
  MAX_PENDING_CONTACTS: 500,
  CACHE_TTL_SECONDS: 300 // 5 minutes par défaut
} as const;

/**
 * Ordre de priorité pour tri
 */
export const PRIORITY_ORDER: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
  normal: 1
};

// ===== INTERFACES =====

export interface RDVData {
  id: string;
  title: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  meeting_type: string;
  location?: string;
  meeting_url?: string;
  Client?: {
    id: string;
    name?: string;
    company_name?: string;
    email?: string;
  };
  Expert?: {
    id: string;
    name?: string;
    email?: string;
  };
  ApporteurAffaires?: {
    id: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
  };
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  priority: string;
  created_at: string;
  is_read?: boolean;
  action_url?: string;
  action_data?: any;
  metadata?: any;
  is_parent?: boolean;
  children_count?: number;
}

export interface GroupedNotifications {
  [clientId: string]: {
    client_id: string;
    client_name: string;
    notifications: NotificationData[];
  };
}

// ===== CLASSE DE BASE =====

export abstract class BaseReportService {
  /**
   * Normaliser les données RDV (Supabase retourne les relations comme tableaux)
   */
  public static normalizeRDV(rdv: any): RDVData {
    return {
      ...rdv,
      Client: Array.isArray(rdv.Client) ? rdv.Client[0] : rdv.Client,
      Expert: Array.isArray(rdv.Expert) ? rdv.Expert[0] : rdv.Expert,
      ApporteurAffaires: Array.isArray(rdv.ApporteurAffaires) 
        ? rdv.ApporteurAffaires[0] 
        : rdv.ApporteurAffaires
    };
  }

  /**
   * Normaliser une liste de RDV
   */
  public static normalizeRDVs(rdvs: any[]): RDVData[] {
    return (rdvs || []).map(this.normalizeRDV);
  }

  /**
   * Dédoublonner les notifications selon des clés métier
   * Utilise une logique intelligente basée sur le type de notification
   */
  public static deduplicateNotifications(
    notifications: any[], 
    limit?: number
  ): NotificationData[] {
    const seen = new Map<string, any>();
    
    for (const notif of notifications) {
      // Créer une clé unique basée sur le type et le contenu métier
      let dedupeKey: string;
      
      // Pour les rdv_sla_reminder : utiliser l'ID du RDV
      if (notif.notification_type === 'rdv_sla_reminder') {
        const rdvId = notif.metadata?.rdv_id || notif.action_data?.rdv_id;
        dedupeKey = `rdv_sla_${rdvId}`;
      }
      // Pour les reminders génériques : utiliser l'original_notification_id
      else if (notif.notification_type === 'reminder') {
        const originalId = notif.metadata?.original_notification_id || notif.action_data?.original_notification_id;
        dedupeKey = originalId ? `reminder_${originalId}` : `reminder_${notif.id}`;
      }
      // Pour les contact_message : utiliser contact_message_id
      else if (notif.notification_type === 'contact_message') {
        const contactMsgId = notif.metadata?.contact_message_id || notif.action_data?.contact_message_id;
        dedupeKey = contactMsgId ? `contact_msg_${contactMsgId}` : `contact_msg_${notif.id}`;
      }
      // Pour les lead_to_treat : utiliser l'ID du contact
      else if (notif.notification_type === 'lead_to_treat') {
        const contactId = notif.metadata?.contact_id || notif.action_data?.contact_id;
        dedupeKey = contactId ? `lead_${contactId}` : `lead_${notif.id}`;
      }
      // Pour les autres : utiliser notification_type + title + message (hash)
      else {
        const hashKey = `${notif.notification_type}_${notif.title}_${notif.message}`.substring(0, 100);
        dedupeKey = hashKey;
      }
      
      // Garder seulement la notification la plus récente (ou la plus prioritaire)
      const existing = seen.get(dedupeKey);
      if (!existing) {
        seen.set(dedupeKey, notif);
      } else {
        // Garder la plus prioritaire ou la plus récente
        const existingPriority = PRIORITY_ORDER[existing.priority] || 1;
        const newPriority = PRIORITY_ORDER[notif.priority] || 1;
        
        if (newPriority > existingPriority || 
            (newPriority === existingPriority && new Date(notif.created_at) > new Date(existing.created_at))) {
          seen.set(dedupeKey, notif);
        }
      }
    }
    
    let result = Array.from(seen.values());
    
    // Appliquer la limite si spécifiée
    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }
    
    return result;
  }

  /**
   * Grouper les notifications par client
   * Utile pour les rapports qui nécessitent une vue groupée
   */
  public static groupNotificationsByClient(
    notifications: NotificationData[],
    clientIdExtractor?: (notif: NotificationData) => string | null
  ): GroupedNotifications {
    const grouped: GroupedNotifications = {};

    for (const notif of notifications) {
      let clientId: string | null = null;
      
      if (clientIdExtractor) {
        clientId = clientIdExtractor(notif);
      } else {
        // Extraction par défaut depuis metadata/action_data
        clientId = notif.metadata?.client_id 
          || notif.action_data?.client_id 
          || notif.metadata?.Client?.id
          || null;
      }

      if (!clientId) continue;

      if (!grouped[clientId]) {
        grouped[clientId] = {
          client_id: clientId,
          client_name: notif.metadata?.Client?.company_name 
            || notif.metadata?.Client?.name 
            || notif.metadata?.client_name 
            || 'Client inconnu',
          notifications: []
        };
      }

      grouped[clientId].notifications.push(notif);
    }

    return grouped;
  }

  /**
   * Filtrer les notifications en excluant certains types
   * Utilise les constantes EXCLUDED_NOTIFICATION_TYPES
   */
  public static filterNotifications(
    notifications: NotificationData[],
    excludeTypes: readonly string[] = EXCLUDED_NOTIFICATION_TYPES
  ): NotificationData[] {
    return notifications.filter(
      notif => !excludeTypes.includes(notif.notification_type)
    );
  }

  /**
   * Trier les notifications par priorité et date
   */
  protected static sortNotificationsByPriority(
    notifications: NotificationData[]
  ): NotificationData[] {
    return [...notifications].sort((a, b) => {
      const priorityA = PRIORITY_ORDER[a.priority] || 1;
      const priorityB = PRIORITY_ORDER[b.priority] || 1;
      
      if (priorityB !== priorityA) {
        return priorityB - priorityA;
      }
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  /**
   * Créer une requête de base pour les notifications admin
   * Facilite la réutilisation et la standardisation
   */
  public static createBaseNotificationQuery(
    userType: string = 'admin',
    additionalFilters?: Record<string, any>
  ) {
    let query = supabase
      .from('notification')
      .select('id, title, message, notification_type, priority, created_at, is_read, action_url, action_data, metadata, is_parent, children_count, status, hidden_in_list')
      .eq('user_type', userType)
      .eq('hidden_in_list', false); // Exclure les notifications enfants masquées

    // Exclure les types de notification RDV
    if (EXCLUDED_NOTIFICATION_TYPES.length > 0) {
      // ✅ CORRECTION: Utiliser la syntaxe correcte pour .not() avec tableau
      query = query.not('notification_type', 'in', [...EXCLUDED_NOTIFICATION_TYPES]);
    }

    // Appliquer les filtres additionnels
    if (additionalFilters) {
      for (const [key, value] of Object.entries(additionalFilters)) {
        if (Array.isArray(value)) {
          // ✅ CORRECTION: Pour is_read avec [true, false], ne pas filtrer (on veut toutes les valeurs)
          if (key === 'is_read' && value.length === 2 && value.includes(true) && value.includes(false)) {
            // Ne pas appliquer de filtre, on veut toutes les valeurs
            continue;
          }
          // Pour les autres tableaux, utiliser .in()
          query = query.in(key, value);
        } else if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      }
    }

    return query;
  }

  /**
   * Créer une requête de base pour les RDV
   */
  public static createBaseRDVQuery() {
    return supabase
      .from('RDV')
      .select(`
        id,
        title,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        status,
        meeting_type,
        location,
        meeting_url,
        Client:client_id(id, name, company_name, email),
        Expert:expert_id(id, name, email),
        ApporteurAffaires:apporteur_id(id, first_name, last_name, company_name)
      `);
  }

  /**
   * Limiter le nombre d'éléments dans un tableau
   */
  public static limitArray<T>(array: T[], limit: number): T[] {
    if (!limit || limit <= 0) return array;
    return array.slice(0, limit);
  }

  /**
   * Calculer les heures de retard depuis une date
   */
  public static calculateHoursOverdue(date: Date, now: Date = new Date()): number {
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  }

  /**
   * Déterminer le seuil de retard (24h, 48h, 120h)
   */
  public static getOverdueThreshold(hoursOverdue: number): '24h' | '48h' | '120h' | null {
    if (hoursOverdue >= 120) return '120h';
    if (hoursOverdue >= 48) return '48h';
    if (hoursOverdue >= 24) return '24h';
    return null;
  }
}
