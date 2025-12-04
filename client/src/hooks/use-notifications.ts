import { useState, useEffect, useCallback } from 'react';
import { getSupabaseToken } from '@/lib/auth-helpers';

export interface Notification {
  id: string;
  titre: string;
  message: string;
  type_notification: string;
  priorite: string;
  lue: boolean;
  created_at: string;
  updated_at: string;
  type_couleur: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const token = await getSupabaseToken();

      const response = await fetch(`${baseUrl}/api/apporteur/views/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // S'assurer que result.data est un tableau
        const notificationsData = Array.isArray(result.data) ? result.data : [];
        setNotifications(notificationsData);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Erreur fetchNotifications:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Optimistic update
      setNotifications(prev => {
        if (!Array.isArray(prev)) return [];
        return prev.map(notif =>
          notif.id === notificationId ? { ...notif, lue: true } : notif
        );
      });

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const token = await getSupabaseToken();

      await fetch(`${baseUrl}/api/apporteur/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      console.error('Erreur markAsRead:', err);
      // Rollback on error
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      // Optimistic update
      setNotifications(prev => {
        if (!Array.isArray(prev)) return [];
        return prev.map(notif => ({ ...notif, lue: true }));
      });

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const token = await getSupabaseToken();

      await fetch(`${baseUrl}/api/apporteur/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      console.error('Erreur markAllAsRead:', err);
      // Rollback on error
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const getStats = useCallback((): NotificationStats => {
    const byType: Record<string, number> = {};
    
    if (!Array.isArray(notifications)) {
      return {
        total: 0,
        unread: 0,
        byType
      };
    }
    
    notifications.forEach(notif => {
      byType[notif.type_notification] = (byType[notif.type_notification] || 0) + 1;
    });

    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.lue).length,
      byType
    };
  }, [notifications]);

  const getUnreadCount = useCallback(() => {
    if (!Array.isArray(notifications)) return 0;
    return notifications.filter(n => !n.lue).length;
  }, [notifications]);

  return {
    notifications,
    loading,
    error,
    unreadCount: getUnreadCount(),
    stats: getStats(),
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
}

