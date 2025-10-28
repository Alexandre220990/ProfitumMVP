/**
 * ============================================================================
 * HOOK NOTIFICATION BADGE
 * ============================================================================
 * 
 * Hook pour récupérer le nombre de notifications non lues
 * Utilisé dans les layouts pour afficher les badges sur les menus
 * 
 * Fonctionne en realtime avec Supabase
 * 
 * Date: 27 Octobre 2025
 */

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/lib/supabase';

export function useNotificationBadge() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Charger le compteur initial
  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    loadUnreadCount();
  }, [user?.id]);

  // Setup realtime
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notification-badge-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: user.type === 'admin' ? 'AdminNotification' : 'notification',
          filter: user.type === 'admin' ? undefined : `user_id=eq.${user.id}`
        },
        () => {
          // Recharger le compteur à chaque changement
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.type]);

  const loadUnreadCount = async () => {
    if (!user?.id) return;

    try {
      let count = 0;

      if (user.type === 'admin') {
        // Admin : table AdminNotification
        const { count: adminCount, error } = await supabase
          .from('AdminNotification')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        if (!error) count = adminCount || 0;
      } else {
        // Autres : table notification
        const { count: notifCount, error } = await supabase
          .from('notification')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'unread');

        if (!error) count = notifCount || 0;
      }

      setUnreadCount(count);
    } catch (error) {
      console.error('❌ Erreur chargement badge notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    unreadCount,
    loading,
    reload: loadUnreadCount
  };
}

