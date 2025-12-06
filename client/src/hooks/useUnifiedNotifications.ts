/**
 * useUnifiedNotifications
 * Hook unifié pour gérer les notifications pour tous les rôles
 * Utilise le service unifié backend et fournit une interface commune
 */

import { useCallback, useMemo } from 'react';
import { useSupabaseNotifications } from './useSupabaseNotifications';
import { useAuth } from './use-auth';

export interface UnifiedNotificationFilters {
  status?: 'all' | 'unread' | 'read' | 'archived';
  notification_type?: string;
  priority?: string;
  search?: string;
  includeArchived?: boolean;
}

export interface UseUnifiedNotificationsReturn {
  // Données
  notifications: ReturnType<typeof useSupabaseNotifications>['notifications'];
  unreadNotifications: ReturnType<typeof useSupabaseNotifications>['unreadNotifications'];
  readNotifications: ReturnType<typeof useSupabaseNotifications>['readNotifications'];
  archivedNotifications: ReturnType<typeof useSupabaseNotifications>['archivedNotifications'];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  // Actions
  reload: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAsUnread: (notificationId: string) => Promise<void>;
  archiveNotification: (notificationId: string) => Promise<void>;
  unarchiveNotification: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteAllRead: () => Promise<void>;

  // Utilitaires
  filteredNotifications: ReturnType<typeof useSupabaseNotifications>['notifications'];
  deduplicatedNotifications: ReturnType<typeof useSupabaseNotifications>['notifications'];
  groupedByClient: Record<string, ReturnType<typeof useSupabaseNotifications>['notifications']>;
}

/**
 * Hook unifié pour les notifications
 * Fournit une interface commune pour tous les rôles (client, expert, admin, apporteur)
 */
export function useUnifiedNotifications(
  filters: UnifiedNotificationFilters = {}
): UseUnifiedNotificationsReturn {
  const supabaseNotifications = useSupabaseNotifications();

  // Filtrer les notifications selon les critères
  const filteredNotifications = useMemo(() => {
    let filtered = [...supabaseNotifications.notifications];

    // Filtre par statut
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'unread') {
        filtered = filtered.filter(
          (n) => n.status === 'unread' || (!n.is_read && n.status !== 'archived')
        );
      } else if (filters.status === 'read') {
        filtered = filtered.filter(
          (n) => n.status === 'read' || (n.is_read && n.status !== 'archived')
        );
      } else if (filters.status === 'archived') {
        filtered = filtered.filter((n) => n.status === 'archived');
      }
    } else if (!filters.includeArchived) {
      // Par défaut, exclure les archivées
      filtered = filtered.filter((n) => n.status !== 'archived');
    }

    // Filtre par type de notification
    if (filters.notification_type) {
      filtered = filtered.filter((n) => n.notification_type === filters.notification_type);
    }

    // Filtre par priorité
    if (filters.priority) {
      filtered = filtered.filter((n) => n.priority === filters.priority);
    }

    // Recherche textuelle
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          (n.title || '').toLowerCase().includes(searchLower) ||
          n.message.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [supabaseNotifications.notifications, filters]);

  // Dédupliquer les notifications
  const deduplicatedNotifications = useMemo(() => {
    const seen = new Map<string, typeof filteredNotifications[0]>();
    const deduplicated: typeof filteredNotifications = [];

    for (const notif of filteredNotifications) {
      // Créer une clé unique basée sur le type et les métadonnées importantes
      const metadataKey = notif.metadata
        ? JSON.stringify({
            client_id: notif.metadata.client_id,
            client_produit_id: notif.metadata.client_produit_id,
            dossier_id: notif.metadata.dossier_id,
            contact_message_id: notif.metadata.contact_message_id
          })
        : '';

      const key = `${notif.user_id}_${notif.notification_type}_${metadataKey}`;

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
  }, [filteredNotifications]);

  // Grouper par client (utile pour admins et experts)
  const groupedByClient = useMemo(() => {
    const grouped: Record<string, typeof filteredNotifications> = {};

    for (const notif of filteredNotifications) {
      // Extraire l'ID du client depuis les métadonnées
      let clientId: string | null = null;

      if (notif.metadata?.client_id) {
        clientId = String(notif.metadata.client_id);
      } else if (notif.action_data && typeof notif.action_data === 'object' && 'client_id' in notif.action_data) {
        clientId = String(notif.action_data.client_id);
      } else if (notif.metadata?.client_produit_id) {
        clientId = String(notif.metadata.client_produit_id);
      }

      const groupKey = clientId || '_other';

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(notif);
    }

    // Trier chaque groupe par date (plus récentes en premier)
    for (const clientId in grouped) {
      grouped[clientId].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return grouped;
  }, [filteredNotifications]);

  return {
    // Données
    notifications: supabaseNotifications.notifications,
    unreadNotifications: supabaseNotifications.unreadNotifications,
    readNotifications: supabaseNotifications.readNotifications,
    archivedNotifications: supabaseNotifications.archivedNotifications,
    unreadCount: supabaseNotifications.unreadCount,
    loading: supabaseNotifications.loading,
    error: supabaseNotifications.error,

    // Actions (délégation au hook existant)
    reload: supabaseNotifications.reload,
    markAsRead: supabaseNotifications.markAsRead,
    markAsUnread: supabaseNotifications.markAsUnread,
    archiveNotification: supabaseNotifications.archiveNotification,
    unarchiveNotification: supabaseNotifications.unarchiveNotification,
    deleteNotification: supabaseNotifications.deleteNotification,
    markAllAsRead: supabaseNotifications.markAllAsRead,
    deleteAllRead: supabaseNotifications.deleteAllRead,

    // Utilitaires
    filteredNotifications,
    deduplicatedNotifications,
    groupedByClient
  };
}
