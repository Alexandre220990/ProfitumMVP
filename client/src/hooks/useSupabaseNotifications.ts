import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { supabaseNotificationService } from '@/services/supabase-notification-service';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

type NotificationStatus = 'unread' | 'read' | 'archived' | string;

export interface SupabaseNotification {
  id: string;
  user_id: string;
  user_type: string;
  title?: string;
  message: string;
  notification_type: string;
  priority?: string;
  status?: NotificationStatus;
  is_read?: boolean;
  read_at?: string | null;
  archived_at?: string | null;
  action_url?: string;
  action_data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

interface UseSupabaseNotificationsReturn {
  notifications: SupabaseNotification[];
  unreadNotifications: SupabaseNotification[];
  readNotifications: SupabaseNotification[];
  archivedNotifications: SupabaseNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAsUnread: (notificationId: string) => Promise<void>;
  archiveNotification: (notificationId: string) => Promise<void>;
  unarchiveNotification: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteAllRead: () => Promise<void>;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';

const normalizeNotification = (notification: any): SupabaseNotification => {
  if (!notification) return notification;

  // Pour toutes les notifications (AdminNotification et notification), status peut être 'unread', 'read', 'archived'
  const normalizedStatus = notification.status || (notification.is_read ? 'read' : 'unread');
  
  // Déterminer is_read en fonction du status
  let isRead: boolean;
  if (typeof notification.is_read === 'boolean') {
    isRead = notification.is_read;
  } else {
    // Si status est 'read', alors is_read = true
    if (normalizedStatus === 'read') {
      isRead = true;
    } else if (normalizedStatus === 'unread') {
      // Si status est 'unread', alors is_read = false
      isRead = false;
    } else {
      // Pour 'archived' ou autres, considérer comme lu si read_at existe
      isRead = !!notification.read_at || false;
    }
  }

  return {
    ...notification,
    status: normalizedStatus,
    is_read: isRead,
  };
};

export function useSupabaseNotifications(): UseSupabaseNotificationsReturn {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SupabaseNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isSubscribedRef = useRef(false);

  const getEndpoint = useCallback(() => {
    if (!user?.type) return '/api/notifications';
    if (user.type === 'expert') return '/api/expert/notifications';
    if (user.type === 'admin') return '/api/admin/notifications';
    return '/api/notifications';
  }, [user?.type]);

  const buildActionRequest = useCallback(
    (
      notificationId: string,
      action: 'read' | 'unread' | 'archive' | 'unarchive' | 'delete'
    ) => {
      if (!notificationId) return null;

      const token = localStorage.getItem('token') || '';
      const defaultHeaders: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };

      if (user?.type === 'admin') {
        if (action === 'read') {
          return {
            url: `${API_BASE}/api/admin/notifications/${notificationId}/read`,
            options: {
              method: 'PATCH',
              headers: defaultHeaders,
            } as RequestInit,
          };
        }

        if (action === 'archive' || action === 'delete') {
          return {
            url: `${API_BASE}/api/admin/notifications/${notificationId}`,
            options: {
              method: 'DELETE',
              headers: defaultHeaders,
            } as RequestInit,
          };
        }

        // Endpoint unread/unarchive indisponible pour les admins
        return null;
      }

      if (user?.type === 'expert') {
        const endpointMap: Record<string, string | undefined> = {
          read: `/api/expert/notifications/${notificationId}/read`,
          unread: `/api/expert/notifications/${notificationId}/unread`,
          archive: `/api/expert/notifications/${notificationId}/archive`,
          unarchive: `/api/expert/notifications/${notificationId}/unarchive`,
          delete: `/api/expert/notifications/${notificationId}`,
        };

        const endpoint = endpointMap[action];

        if (!endpoint) {
          return null;
        }

        const isDelete = action === 'delete';

        return {
          url: `${API_BASE}${endpoint}`,
          options: {
            method: isDelete ? 'DELETE' : 'POST',
            headers: isDelete
              ? defaultHeaders
              : {
                  ...defaultHeaders,
                  'Content-Type': 'application/json',
                },
          } as RequestInit,
        };
      }

      const actionPathMap: Record<string, string | undefined> = {
        read: `${getEndpoint()}/${notificationId}/read`,
        archive: `${getEndpoint()}/${notificationId}/archive`,
        unarchive: `${getEndpoint()}/${notificationId}/unarchive`,
        delete: `${getEndpoint()}/${notificationId}`,
      };

      const actionPath = actionPathMap[action];

      if (!actionPath) {
        return null;
      }

      const methodMap: Record<string, string> = {
        read: 'PUT',
        archive: 'PUT',
        unarchive: 'PUT',
        delete: 'DELETE',
      };

      const method = methodMap[action] || 'PUT';

      const headers = { ...defaultHeaders };
      if (method !== 'DELETE') {
        headers['Content-Type'] = 'application/json';
      }

      return {
        url: `${API_BASE}${actionPath}`,
        options: {
          method,
          headers,
        } as RequestInit,
      };
    },
    [user?.type, getEndpoint]
  );

  // Chargement initial (API REST)
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
        const response = await fetch(`${API_BASE}${getEndpoint()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      const payload =
        data.data?.notifications || data.notifications || data.data || [];

      const normalized = Array.isArray(payload)
        ? payload.map(normalizeNotification)
        : [];

      setNotifications(normalized);
    } catch (err) {
      console.error('Erreur chargement notifications:', err);
      setError('Erreur chargement notifications');
    } finally {
      setLoading(false);
    }
  }, [user?.id, getEndpoint]);

  const updateNotificationState = useCallback(
    (notificationId: string, updater: (notif: SupabaseNotification) => SupabaseNotification) => {
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? updater(notif) : notif
        )
      );
    },
    []
  );

  // Actions REST
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!notificationId) return;

      updateNotificationState(notificationId, (notif) => ({
        ...notif,
        is_read: true,
        status: 'read',
        read_at: new Date().toISOString(),
      }));

      try {
        const request = buildActionRequest(notificationId, 'read');

        if (!request) {
          toast.info('Action indisponible pour ce rôle.');
          await loadNotifications();
          return;
        }

        const response = await fetch(request.url, request.options);

        if (response.status === 404) {
          toast.info('Notification introuvable ou déjà traitée.');
          return;
        }

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`);
        }
      } catch (err) {
        console.error('Erreur markAsRead:', err);
        await loadNotifications();
      }
    },
    [buildActionRequest, loadNotifications, updateNotificationState]
  );

  const markAsUnread = useCallback(
    async (notificationId: string) => {
      if (!notificationId) return;

      updateNotificationState(notificationId, (notif) => ({
        ...notif,
        is_read: false,
        status: 'unread',
        read_at: null,
      }));

      try {
        const request = buildActionRequest(notificationId, 'unread');

        if (!request) {
          toast.info('Action indisponible pour ce rôle.');
          await loadNotifications();
          return;
        }

        const response = await fetch(request.url, request.options);

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`);
        }
      } catch (err) {
        console.error('Erreur markAsUnread:', err);
        await loadNotifications();
      }
    },
    [buildActionRequest, loadNotifications, updateNotificationState]
  );

  const archiveNotification = useCallback(
    async (notificationId: string) => {
      if (!notificationId) return;

      updateNotificationState(notificationId, (notif) => ({
        ...notif,
        status: 'archived',
        archived_at: new Date().toISOString(),
      }));

      try {
        const request = buildActionRequest(notificationId, 'archive');

        if (!request) {
          toast.info('Action indisponible pour ce rôle.');
          await loadNotifications();
          return;
        }

        const response = await fetch(request.url, request.options);

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`);
        }
      } catch (err) {
        console.error('Erreur archiveNotification:', err);
        await loadNotifications();
      }
    },
    [buildActionRequest, loadNotifications, updateNotificationState]
  );

  const unarchiveNotification = useCallback(
    async (notificationId: string) => {
      if (!notificationId) return;

      updateNotificationState(notificationId, (notif) => ({
        ...notif,
        status: 'read',
        archived_at: null,
      }));

      try {
        const request = buildActionRequest(notificationId, 'unarchive');

        if (!request) {
          toast.info('Action indisponible pour ce rôle.');
          await loadNotifications();
          return;
        }

        const response = await fetch(request.url, request.options);

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`);
        }
      } catch (err) {
        console.error('Erreur unarchiveNotification:', err);
        await loadNotifications();
      }
    },
    [buildActionRequest, loadNotifications, updateNotificationState]
  );

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!notificationId) return;

      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));

      try {
        const request = buildActionRequest(notificationId, 'delete');

        if (!request) {
          toast.info('Suppression indisponible pour ce rôle.');
          await loadNotifications();
          return;
        }

        const response = await fetch(request.url, request.options);

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`);
        }
      } catch (err) {
        console.error('Erreur deleteNotification:', err);
        await loadNotifications();
      }
    },
    [buildActionRequest, loadNotifications]
  );

  const markAllAsRead = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    let url: string | null = null;
    let method: string = 'PUT';

    if (user?.type === 'admin') {
      toast.info('Marquage global indisponible pour les administrateurs.');
      return;
    } else if (user?.type === 'expert') {
      url = `${API_BASE}/api/expert/notifications/mark-all-read`;
      method = 'POST';
    } else {
      url = `${API_BASE}/api/notifications/mark-all-read`;
      method = 'PUT';
    }

    try {
      const response = await fetch(url, { method, headers });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      await loadNotifications();
    } catch (err) {
      console.error('Erreur markAllAsRead:', err);
      toast.error('Impossible de marquer toutes les notifications comme lues.');
    }
  }, [user?.type, loadNotifications]);

  const deleteAllRead = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    let url: string | null = null;
    let method: string = 'DELETE';

    if (user?.type && user.type !== 'client') {
      toast.info('La suppression en masse est réservée aux clients.');
      return;
    }

    url = `${API_BASE}/api/notifications/delete-all-read`;

    try {
      const response = await fetch(url, { method, headers });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      await loadNotifications();
    } catch (err) {
      console.error('Erreur deleteAllRead:', err);
      toast.error('Impossible de supprimer les notifications lues.');
    }
  }, [user?.type, loadNotifications]);

  // Souscription realtime
  useEffect(() => {
    if (!user?.id || isSubscribedRef.current) return;

    const setupNotifications = async () => {
      try {
        await loadNotifications();

        if (user.type === 'admin') {
          await supabaseNotificationService.subscribeAdmin({
            onInsert: (notif) => {
              setNotifications((prev) => [normalizeNotification(notif), ...prev]);
            },
            onUpdate: (notif) => {
              setNotifications((prev) =>
                prev.map((n) => (n.id === notif.id ? normalizeNotification(notif) : n))
              );
            },
            onDelete: (id) => {
              setNotifications((prev) => prev.filter((n) => n.id !== id));
            },
            onError: (err) => setError(err.message),
          });
        } else {
          await supabaseNotificationService.subscribe(user.id, {
            onInsert: (notif) =>
              setNotifications((prev) => [normalizeNotification(notif), ...prev]),
            onUpdate: (notif) =>
              setNotifications((prev) =>
                prev.map((n) => (n.id === notif.id ? normalizeNotification(notif) : n))
              ),
            onDelete: (id) =>
              setNotifications((prev) => prev.filter((n) => n.id !== id)),
            onError: (err) => setError(err.message),
          });
        }

        isSubscribedRef.current = true;
      } catch (error) {
        console.error('Erreur setup notifications:', error);
        setError('Erreur configuration notifications');
      }
    };

    setupNotifications();

    return () => {
      isSubscribedRef.current = false;
      supabaseNotificationService.unsubscribe();
    };
  }, [user?.id, user?.type, loadNotifications]);

  const unreadNotifications = useMemo(
    () =>
      notifications.filter(
        (notif) => {
          // Pour toutes les notifications: 'unread' = non lu
          const isUnread = notif.status === 'unread' || (!notif.is_read && notif.status !== 'read' && notif.status !== 'archived');
          return notif.status !== 'archived' && isUnread;
        }
      ),
    [notifications]
  );

  const readNotifications = useMemo(
    () =>
      notifications.filter(
        (notif) => {
          // Pour AdminNotification: 'read' = lu, pour notification: 'read' = lu
          return (notif.status === 'read' || notif.is_read) && notif.status !== 'archived';
        }
      ),
    [notifications]
  );

  const archivedNotifications = useMemo(
    () => notifications.filter((notif) => notif.status === 'archived'),
    [notifications]
  );

  const unreadCount = unreadNotifications.length;

  return {
    notifications,
    unreadNotifications,
    readNotifications,
    archivedNotifications,
    unreadCount,
    loading,
    error,
    reload: loadNotifications,
    markAsRead,
    markAsUnread,
    archiveNotification,
    unarchiveNotification,
    deleteNotification,
    markAllAsRead,
    deleteAllRead,
  };
}