import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from './use-auth';

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Notification {
  id: string;
  user_id: string | null;
  user_type: string;
  title: string;
  message: string;
  notification_type: string;
  priority?: string;
  is_read: boolean;
  read_at: string | null;
  action_url?: string;
  action_data?: Record<string, any>;
  expires_at?: string | null;
  is_dismissed?: boolean;
  dismissed_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  dismissed: number;
  byPriority: {
    low: number;
    normal: number;
    high: number;
    urgent: number;
    critical: number;
  };
  byTime: {
    today: number;
    thisWeek: number;
    older: number;
  };
  byType: Record<string, number>;
  averagePerDay: number;
}

interface UseRealtimeNotificationsEnhancedReturn {
  // État de base
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // Actions de base
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  
  // ✨ NOUVELLES FEATURES - Filtres
  filterByPriority: (priority: string) => Notification[];
  filterByType: (type: string) => Notification[];
  filterByDateRange: (startDate: Date, endDate: Date) => Notification[];
  filterByReadStatus: (isRead: boolean) => Notification[];
  searchNotifications: (query: string) => Notification[];
  
  // ✨ NOUVELLES FEATURES - Groupement
  groupByType: () => Record<string, Notification[]>;
  groupByDate: () => Record<string, Notification[]>;
  groupByPriority: () => Record<string, Notification[]>;
  
  // ✨ NOUVELLES FEATURES - Statistiques
  getStats: () => NotificationStats;
  
  // ✨ NOUVELLES FEATURES - Actions Batch
  markMultipleAsRead: (notificationIds: string[]) => Promise<void>;
  deleteMultiple: (notificationIds: string[]) => Promise<void>;
  dismissMultiple: (notificationIds: string[]) => Promise<void>;
  
  // ✨ NOUVELLES FEATURES - Pagination
  hasMore: boolean;
  loadMore: () => Promise<void>;
  page: number;
  
  // ✨ NOUVELLES FEATURES - Dismiss
  dismissNotification: (notificationId: string) => Promise<void>;
}

/**
 * Hook pour gérer les notifications temps réel avec Supabase Realtime - VERSION AMÉLIORÉE
 * 
 * Remplace le système de notifications WebSocket custom.
 * Les notifications sont automatiquement synchronisées en temps réel.
 * 
 * ✨ Nouvelles features :
 * - Filtres avancés (priorité, type, date, statut, recherche)
 * - Groupement (par type, date, priorité)
 * - Statistiques détaillées
 * - Actions batch (marquer plusieurs, supprimer plusieurs)
 * - Pagination (chargement incrémental)
 * - Dismiss notifications
 * 
 * @returns Fonctions et état des notifications temps réel
 * 
 * @example
 * ```tsx
 * function NotificationBell() {
 *   const { 
 *     notifications,
 *     unreadCount,
 *     markAsRead,
 *     filterByPriority,
 *     getStats,
 *     isConnected 
 *   } = useRealtimeNotificationsEnhanced();
 * 
 *   const urgentNotifs = filterByPriority('urgent');
 *   const stats = getStats();
 * 
 *   return (
 *     <div>
 *       <Badge count={unreadCount}>🔔</Badge>
 *       <p>Notifications urgentes : {urgentNotifs.length}</p>
 *       <p>Moyenne par jour : {stats.averagePerDay.toFixed(1)}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRealtimeNotificationsEnhanced(): UseRealtimeNotificationsEnhancedReturn {
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const NOTIFICATIONS_PER_PAGE = 20;
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  /**
   * Calculer le nombre de notifications non lues
   */
  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.is_read && !n.is_dismissed).length,
    [notifications]
  );

  /**
   * Charger les notifications existantes
   */
  const loadNotifications = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const offset = pageNum * NOTIFICATIONS_PER_PAGE;
      const { data, error: fetchError } = await supabase
        .from('notification')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + NOTIFICATIONS_PER_PAGE - 1);

      if (fetchError) throw fetchError;

      if (data) {
        if (append) {
          setNotifications(prev => [...prev, ...data]);
        } else {
          setNotifications(data);
        }
        setHasMore(data.length === NOTIFICATIONS_PER_PAGE);
        console.log(`📥 ${data.length} notifications chargées (page ${pageNum})`);
      }
    } catch (err) {
      console.error('❌ Erreur chargement notifications:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  /**
   * S'abonner aux changements temps réel des notifications
   */
  useEffect(() => {
    if (!user?.id) {
      return;
    }

    console.log(`📡 Supabase Realtime: Connexion aux notifications utilisateur ${user.id}...`);

    // Charger les notifications existantes
    loadNotifications(0, false);

    // Créer le canal Realtime pour les notifications
    const channel = supabase.channel(`notifications:${user.id}`);

    // Écouter les nouvelles notifications (INSERT)
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notification',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        console.log('🔔 Nouvelle notification reçue:', payload.new);
        setNotifications((prev) => {
          // Éviter les doublons
          if (prev.some(n => n.id === payload.new.id)) {
            return prev;
          }
          // Ajouter en début de liste (plus récent en premier)
          return [payload.new as Notification, ...prev];
        });

        // Afficher une notification browser si permis
        if (Notification.permission === 'granted') {
          const notif = payload.new as Notification;
          new Notification(notif.title, {
            body: notif.message,
            icon: '/favicon.ico',
            tag: notif.id
          });
        }
      }
    );

    // Écouter les mises à jour de notifications (UPDATE)
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notification',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        console.log('✏️ Notification mise à jour:', payload.new);
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === payload.new.id ? (payload.new as Notification) : notif
          )
        );
      }
    );

    // Écouter les suppressions de notifications (DELETE)
    channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'notification',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        console.log('🗑️ Notification supprimée:', payload.old);
        setNotifications((prev) =>
          prev.filter((notif) => notif.id !== payload.old.id)
        );
      }
    );

    // S'abonner au canal
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Supabase Realtime: Connecté aux notifications');
        setIsConnected(true);
        setError(null);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Supabase Realtime: Erreur de connexion notifications');
        setIsConnected(false);
        setError(new Error('Erreur de connexion au canal notifications'));
      } else if (status === 'CLOSED') {
        console.log('🔌 Supabase Realtime: Canal notifications fermé');
        setIsConnected(false);
      }
    });

    channelRef.current = channel;

    // Cleanup lors du démontage
    return () => {
      console.log(`🔌 Supabase Realtime: Déconnexion des notifications utilisateur ${user.id}`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ========================================
  // ACTIONS DE BASE
  // ========================================

  /**
   * Marquer une notification comme lue
   */
  const markAsRead = useCallback(
    async (notificationId: string): Promise<void> => {
      try {
        const { error: updateError } = await supabase
          .from('notification')
          .update({ 
            is_read: true,
            read_at: new Date().toISOString() 
          })
          .eq('id', notificationId);

        if (updateError) throw updateError;

        console.log('✅ Notification marquée comme lue:', notificationId);
        // Realtime mettra à jour automatiquement le state
      } catch (err) {
        console.error('❌ Erreur marquage notification lue:', err);
        setError(err as Error);
      }
    },
    []
  );

  /**
   * Marquer toutes les notifications comme lues
   */
  const markAllAsRead = useCallback(
    async (): Promise<void> => {
      if (!user?.id) return;

      try {
        const { error: updateError } = await supabase
          .from('notification')
          .update({ 
            is_read: true,
            read_at: new Date().toISOString() 
          })
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (updateError) throw updateError;

        console.log('✅ Toutes les notifications marquées comme lues');
        // Realtime mettra à jour automatiquement le state
      } catch (err) {
        console.error('❌ Erreur marquage toutes notifications lues:', err);
        setError(err as Error);
      }
    },
    [user?.id]
  );

  /**
   * Supprimer une notification
   */
  const deleteNotification = useCallback(
    async (notificationId: string): Promise<void> => {
      try {
        const { error: deleteError } = await supabase
          .from('notification')
          .delete()
          .eq('id', notificationId);

        if (deleteError) throw deleteError;

        console.log('✅ Notification supprimée:', notificationId);
        // Realtime mettra à jour automatiquement le state
      } catch (err) {
        console.error('❌ Erreur suppression notification:', err);
        setError(err as Error);
      }
    },
    []
  );

  /**
   * Dismiss une notification
   */
  const dismissNotification = useCallback(
    async (notificationId: string): Promise<void> => {
      try {
        const { error: updateError } = await supabase
          .from('notification')
          .update({ 
            is_dismissed: true,
            dismissed_at: new Date().toISOString() 
          })
          .eq('id', notificationId);

        if (updateError) throw updateError;

        console.log('✅ Notification dismissed:', notificationId);
      } catch (err) {
        console.error('❌ Erreur dismiss notification:', err);
        setError(err as Error);
      }
    },
    []
  );

  /**
   * Recharger manuellement les notifications
   */
  const refreshNotifications = useCallback(async (): Promise<void> => {
    setPage(0);
    await loadNotifications(0, false);
  }, [loadNotifications]);

  /**
   * Charger plus de notifications (pagination)
   */
  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || isLoading) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    await loadNotifications(nextPage, true);
  }, [hasMore, isLoading, page, loadNotifications]);

  // ========================================
  // ✨ NOUVELLES FEATURES - FILTRES
  // ========================================

  const filterByPriority = useCallback((priority: string): Notification[] => {
    return notifications.filter(n => n.priority === priority);
  }, [notifications]);

  const filterByType = useCallback((type: string): Notification[] => {
    return notifications.filter(n => n.notification_type === type);
  }, [notifications]);

  const filterByDateRange = useCallback((startDate: Date, endDate: Date): Notification[] => {
    return notifications.filter(n => {
      const date = new Date(n.created_at);
      return date >= startDate && date <= endDate;
    });
  }, [notifications]);

  const filterByReadStatus = useCallback((isRead: boolean): Notification[] => {
    return notifications.filter(n => n.is_read === isRead);
  }, [notifications]);

  const searchNotifications = useCallback((query: string): Notification[] => {
    const lowerQuery = query.toLowerCase();
    return notifications.filter(n => 
      n.title.toLowerCase().includes(lowerQuery) ||
      n.message.toLowerCase().includes(lowerQuery)
    );
  }, [notifications]);

  // ========================================
  // ✨ NOUVELLES FEATURES - GROUPEMENT
  // ========================================

  const groupByType = useCallback((): Record<string, Notification[]> => {
    return notifications.reduce((acc, n) => {
      const type = n.notification_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(n);
      return acc;
    }, {} as Record<string, Notification[]>);
  }, [notifications]);

  const groupByDate = useCallback((): Record<string, Notification[]> => {
    return notifications.reduce((acc, n) => {
      const date = new Date(n.created_at).toLocaleDateString('fr-FR');
      if (!acc[date]) acc[date] = [];
      acc[date].push(n);
      return acc;
    }, {} as Record<string, Notification[]>);
  }, [notifications]);

  const groupByPriority = useCallback((): Record<string, Notification[]> => {
    return notifications.reduce((acc, n) => {
      const priority = n.priority || 'normal';
      if (!acc[priority]) acc[priority] = [];
      acc[priority].push(n);
      return acc;
    }, {} as Record<string, Notification[]>);
  }, [notifications]);

  // ========================================
  // ✨ NOUVELLES FEATURES - STATISTIQUES
  // ========================================

  const getStats = useCallback((): NotificationStats => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const byType = notifications.reduce((acc, n) => {
      const type = n.notification_type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const oldestNotification = notifications[notifications.length - 1];
    const daysSinceOldest = oldestNotification 
      ? Math.ceil((now.getTime() - new Date(oldestNotification.created_at).getTime()) / (24 * 60 * 60 * 1000))
      : 1;
    
    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.is_read).length,
      dismissed: notifications.filter(n => n.is_dismissed).length,
      byPriority: {
        low: notifications.filter(n => n.priority === 'low').length,
        normal: notifications.filter(n => n.priority === 'normal' || !n.priority).length,
        high: notifications.filter(n => n.priority === 'high').length,
        urgent: notifications.filter(n => n.priority === 'urgent').length,
        critical: notifications.filter(n => n.priority === 'critical').length,
      },
      byTime: {
        today: notifications.filter(n => new Date(n.created_at) >= today).length,
        thisWeek: notifications.filter(n => new Date(n.created_at) >= thisWeek && new Date(n.created_at) < today).length,
        older: notifications.filter(n => new Date(n.created_at) < thisWeek).length,
      },
      byType,
      averagePerDay: notifications.length / Math.max(1, daysSinceOldest)
    };
  }, [notifications]);

  // ========================================
  // ✨ NOUVELLES FEATURES - ACTIONS BATCH
  // ========================================

  const markMultipleAsRead = useCallback(
    async (notificationIds: string[]): Promise<void> => {
      if (notificationIds.length === 0) return;
      
      try {
        const { error } = await supabase
          .from('notification')
          .update({ 
            is_read: true, 
            read_at: new Date().toISOString() 
          })
          .in('id', notificationIds);
        
        if (error) throw error;
        console.log(`✅ ${notificationIds.length} notifications marquées comme lues`);
      } catch (err) {
        console.error('❌ Erreur batch markAsRead:', err);
        setError(err as Error);
      }
    },
    []
  );

  const deleteMultiple = useCallback(
    async (notificationIds: string[]): Promise<void> => {
      if (notificationIds.length === 0) return;
      
      try {
        const { error } = await supabase
          .from('notification')
          .delete()
          .in('id', notificationIds);
        
        if (error) throw error;
        console.log(`✅ ${notificationIds.length} notifications supprimées`);
      } catch (err) {
        console.error('❌ Erreur batch delete:', err);
        setError(err as Error);
      }
    },
    []
  );

  const dismissMultiple = useCallback(
    async (notificationIds: string[]): Promise<void> => {
      if (notificationIds.length === 0) return;
      
      try {
        const { error } = await supabase
          .from('notification')
          .update({ 
            is_dismissed: true, 
            dismissed_at: new Date().toISOString() 
          })
          .in('id', notificationIds);
        
        if (error) throw error;
        console.log(`✅ ${notificationIds.length} notifications dismissed`);
      } catch (err) {
        console.error('❌ Erreur batch dismiss:', err);
        setError(err as Error);
      }
    },
    []
  );

  return {
    // État de base
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    
    // Actions de base
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    
    // ✨ Filtres
    filterByPriority,
    filterByType,
    filterByDateRange,
    filterByReadStatus,
    searchNotifications,
    
    // ✨ Groupement
    groupByType,
    groupByDate,
    groupByPriority,
    
    // ✨ Statistiques
    getStats,
    
    // ✨ Actions Batch
    markMultipleAsRead,
    deleteMultiple,
    dismissMultiple,
    
    // ✨ Pagination
    hasMore,
    loadMore,
    page,
    
    // ✨ Dismiss
    dismissNotification
  };
}

/**
 * Hook pour demander la permission des notifications browser
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { hasPermission, requestPermission } = useNotificationPermission();
 *   
 *   return (
 *     <button onClick={requestPermission} disabled={hasPermission}>
 *       Activer les notifications
 *     </button>
 *   );
 * }
 * ```
 */
export function useNotificationPermission() {
  const [hasPermission, setHasPermission] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      console.warn('⚠️ Les notifications ne sont pas supportées par ce navigateur');
      return false;
    }

    if (Notification.permission === 'granted') {
      setHasPermission(true);
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setHasPermission(granted);
      console.log(granted ? '✅ Permission notifications accordée' : '❌ Permission notifications refusée');
      return granted;
    } catch (error) {
      console.error('❌ Erreur demande permission notifications:', error);
      return false;
    }
  }, []);

  return { hasPermission, requestPermission };
}

