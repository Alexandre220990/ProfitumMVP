import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/lib/supabase';

export const useNotificationBadge = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Fonction pour récupérer le nombre de notifications non lues
    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('Notification')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false)
          .eq('is_dismissed', false);

        if (error) {
          console.error('Erreur récupération notifications non lues:', error);
          return;
        }

        setUnreadCount(count || 0);
      } catch (error) {
        console.error('Erreur hook notification badge:', error);
      } finally {
        setLoading(false);
      }
    };

    // Récupérer le nombre initial
    fetchUnreadCount();

    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel('notification-badge')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Notification',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Rafraîchir le compteur quand il y a un changement
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    unreadCount,
    loading,
    hasNotifications: unreadCount > 0
  };
}; 