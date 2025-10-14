import { useEffect, useState, useCallback, useRef } from 'react';
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

interface UseRealtimeNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

/**
 * Hook pour gérer les notifications temps réel avec Supabase Realtime
 * 
 * Remplace le système de notifications WebSocket custom.
 * Les notifications sont automatiquement synchronisées en temps réel.
 * 
 * @returns Fonctions et état des notifications temps réel
 * 
 * @example
 * ```tsx
 * function NotificationBell() {
 *   const { notifications, unreadCount, markAsRead, isConnected } = useRealtimeNotifications();
 * 
 *   return (
 *     <div>
 *       <Badge count={unreadCount}>🔔</Badge>
 *       {notifications.map(notif => (
 *         <div key={notif.id} onClick={() => markAsRead(notif.id)}>
 *           {notif.title}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useRealtimeNotifications(): UseRealtimeNotificationsReturn {
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  /**
   * Calculer le nombre de notifications non lues
   */
  const unreadCount = notifications.filter(n => !n.is_read && !n.is_dismissed).length;

  /**
   * Charger les notifications existantes
   */
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('notification')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100); // Limiter à 100 notifications récentes

      if (fetchError) throw fetchError;

      setNotifications(data || []);
      console.log(`📥 ${data?.length || 0} notifications chargées`);
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
    loadNotifications();

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
  }, [user?.id, loadNotifications]);

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
   * Recharger manuellement les notifications
   */
  const refreshNotifications = useCallback(async (): Promise<void> => {
    await loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
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

