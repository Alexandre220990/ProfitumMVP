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
  archiveNotification: (notificationId: string) => Promise<void>;
  unarchiveNotification: (notificationId: string) => Promise<void>;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';

const normalizeNotification = (notification: any): SupabaseNotification => {
  if (!notification) return notification;

  return {
    ...notification,
    status: notification.status || (notification.is_read ? 'read' : 'unread'),
    is_read:
      typeof notification.is_read === 'boolean'
        ? notification.is_read
        : (notification.status && notification.status !== 'unread') || false,
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
    (notificationId: string, action: 'read' | 'archive' | 'unarchive') => {
      if (!notificationId) return null;

      const token = localStorage.getItem('token') || '';
      const defaultHeaders = {
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

        if (action === 'archive') {
          return {
            url: `${API_BASE}/api/admin/notifications/${notificationId}`,
            options: {
              method: 'DELETE',
              headers: defaultHeaders,
            } as RequestInit,
          };
        }

        // Endpoint unarchive admin non disponible
        return null;
      }

      if (user?.type === 'expert') {
        const endpoint = (() => {
          switch (action) {
            case 'read':
              return `/api/expert/notifications/${notificationId}/read`;
            case 'unread':
              return `/api/expert/notifications/${notificationId}/unread`;
            case 'archive':
              return `/api/expert/notifications/${notificationId}/archive`;
            case 'unarchive':
              return `/api/expert/notifications/${notificationId}/unarchive`;
            default:
              return null;
          }
        })();

        if (!endpoint) {
          return null;
        }

        return {
          url: `${API_BASE}${endpoint}`,
          options: {
            method: 'POST',
            headers: {
              ...defaultHeaders,
              'Content-Type': 'application/json',
            },
          } as RequestInit,
        };
      }

      const actionPath = (() => {
        switch (action) {
          case 'read':
            return `${getEndpoint()}/${notificationId}/read`;
          case 'archive':
            return `${getEndpoint()}/${notificationId}/archive`;
          case 'unarchive':
            return `${getEndpoint()}/${notificationId}/unarchive`;
          default:
            return `${getEndpoint()}/${notificationId}`;
        }
      })();

      const methodMap: Record<string, string> = {
        read: 'PUT',
        archive: 'PUT',
        unarchive: 'PUT',
        unread: 'PUT',
      };

      const method = methodMap[action] || 'PUT';

      return {
        url: `${API_BASE}${actionPath}`,
        options: {
          method,
          headers: defaultHeaders,
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

      // Optimistic update
      updateNotificationState(notificationId, (notif) => ({
        ...notif,
        is_read: true,
        status: 'read',
        read_at: new Date().toISOString(),
      }));

      try {
        const request = buildActionRequest(notificationId, 'read');

        if (!request) {
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
        // Rollback si erreur
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
        (notif) => notif.status !== 'archived' && !notif.is_read
      ),
    [notifications]
  );

  const readNotifications = useMemo(
    () =>
      notifications.filter(
        (notif) =>
          notif.status === 'read' ||
          (notif.is_read && notif.status !== 'archived')
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
    archiveNotification,
    unarchiveNotification,
  };
}