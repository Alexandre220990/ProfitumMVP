/**
 * UnifiedNotificationService
 * Service unifié pour gérer les notifications pour tous les rôles
 * Centralise la logique commune de récupération, filtrage et traitement des notifications
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface Notification {
  id: string;
  user_id: string;
  user_type: string;
  title?: string;
  message: string;
  notification_type: string;
  priority?: string;
  status?: 'unread' | 'read' | 'archived';
  is_read?: boolean;
  read_at?: string | null;
  archived_at?: string | null;
  action_url?: string;
  action_data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export interface FilterOptions {
  status?: 'all' | 'unread' | 'read' | 'archived';
  notification_type?: string;
  priority?: string;
  search?: string;
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
  startDate?: string;
  endDate?: string;
}

export class UnifiedNotificationService {
  /**
   * Récupérer les notifications pour un utilisateur avec filtres
   */
  static async getNotifications(
    userId: string,
    userType: string,
    filters: FilterOptions = {}
  ): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notification')
        .select('*')
        .eq('user_id', userId)
        .eq('user_type', userType);

      // Filtre par statut
      if (filters.status && filters.status !== 'all') {
        if (filters.status === 'unread') {
          query = query.eq('is_read', false).neq('status', 'archived');
        } else if (filters.status === 'read') {
          query = query.eq('is_read', true).neq('status', 'archived');
        } else if (filters.status === 'archived') {
          query = query.eq('status', 'archived');
        }
      } else if (!filters.includeArchived) {
        // Par défaut, exclure les archivées sauf si explicitement demandé
        query = query.neq('status', 'archived');
      }

      // Filtre par type de notification
      if (filters.notification_type) {
        query = query.eq('notification_type', filters.notification_type);
      }

      // Filtre par priorité
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      // Recherche textuelle
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(`title.ilike.${searchTerm},message.ilike.${searchTerm}`);
      }

      // Filtre par date
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      // Tri par date de création (plus récentes en premier)
      query = query.order('created_at', { ascending: false });

      // Pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erreur récupération notifications:', error);
        return [];
      }

      // Normaliser les notifications
      return (data || []).map((notif: any) => this.normalizeNotification(notif));
    } catch (error) {
      console.error('❌ Erreur getNotifications:', error);
      return [];
    }
  }

  /**
   * Marquer une notification comme lue
   */
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification')
        .update({
          is_read: true,
          status: 'read',
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Erreur markAsRead:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur markAsRead:', error);
      return false;
    }
  }

  /**
   * Dédupliquer les notifications (supprimer les doublons)
   * Basé sur user_id, notification_type, et metadata similaire
   */
  static async deduplicateNotifications(
    notifications: Notification[]
  ): Promise<Notification[]> {
    try {
      const seen = new Map<string, Notification>();
      const deduplicated: Notification[] = [];

      for (const notif of notifications) {
        // Créer une clé unique basée sur le type et les métadonnées importantes
        const key = this.getNotificationKey(notif);

        if (!seen.has(key)) {
          seen.set(key, notif);
          deduplicated.push(notif);
        } else {
          // Garder la notification la plus récente
          const existing = seen.get(key)!;
          if (new Date(notif.created_at) > new Date(existing.created_at)) {
            const index = deduplicated.indexOf(existing);
            deduplicated[index] = notif;
            seen.set(key, notif);
          }
        }
      }

      return deduplicated;
    } catch (error) {
      console.error('❌ Erreur deduplicateNotifications:', error);
      return notifications;
    }
  }

  /**
   * Grouper les notifications par client
   * Utile pour les admins et experts qui gèrent plusieurs clients
   */
  static async groupByClient(
    notifications: Notification[]
  ): Promise<Record<string, Notification[]>> {
    try {
      const grouped: Record<string, Notification[]> = {};

      for (const notif of notifications) {
        // Extraire l'ID du client depuis les métadonnées ou action_data
        const clientId = this.extractClientId(notif);

        if (clientId) {
          if (!grouped[clientId]) {
            grouped[clientId] = [];
          }
          grouped[clientId].push(notif);
        } else {
          // Notifications sans client associé
          if (!grouped['_other']) {
            grouped['_other'] = [];
          }
          grouped['_other'].push(notif);
        }
      }

      // Trier chaque groupe par date (plus récentes en premier)
      for (const clientId in grouped) {
        grouped[clientId].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

      return grouped;
    } catch (error) {
      console.error('❌ Erreur groupByClient:', error);
      return {};
    }
  }

  /**
   * Normaliser une notification pour garantir la cohérence
   */
  private static normalizeNotification(notif: any): Notification {
    // Déterminer le statut
    let status: 'unread' | 'read' | 'archived' = 'unread';
    if (notif.status === 'archived' || notif.archived_at) {
      status = 'archived';
    } else if (notif.status === 'read' || notif.is_read) {
      status = 'read';
    }

    // Déterminer is_read
    const isRead = status === 'read' || notif.is_read === true;

    return {
      id: notif.id,
      user_id: notif.user_id,
      user_type: notif.user_type,
      title: notif.title,
      message: notif.message,
      notification_type: notif.notification_type,
      priority: notif.priority,
      status,
      is_read: isRead,
      read_at: notif.read_at,
      archived_at: notif.archived_at,
      action_url: notif.action_url,
      action_data: notif.action_data,
      metadata: notif.metadata,
      created_at: notif.created_at,
      updated_at: notif.updated_at
    };
  }

  /**
   * Créer une clé unique pour la déduplication
   */
  private static getNotificationKey(notif: Notification): string {
    const metadataKey = notif.metadata
      ? JSON.stringify({
          client_id: notif.metadata.client_id,
          client_produit_id: notif.metadata.client_produit_id,
          dossier_id: notif.metadata.dossier_id,
          contact_message_id: notif.metadata.contact_message_id
        })
      : '';

    return `${notif.user_id}_${notif.notification_type}_${metadataKey}`;
  }

  /**
   * Extraire l'ID du client depuis une notification
   */
  private static extractClientId(notif: Notification): string | null {
    // Essayer depuis metadata
    if (notif.metadata?.client_id) {
      return String(notif.metadata.client_id);
    }

    // Essayer depuis action_data
    if (notif.action_data?.client_id) {
      return String(notif.action_data.client_id);
    }

    // Essayer depuis client_produit_id
    if (notif.metadata?.client_produit_id) {
      return String(notif.metadata.client_produit_id);
    }

    // Pour les notifications de contact, essayer depuis contact_message_id
    if (notif.notification_type === 'contact_message' && notif.metadata?.contact_message_id) {
      // On ne peut pas extraire directement le client_id, retourner null
      return null;
    }

    return null;
  }
}
