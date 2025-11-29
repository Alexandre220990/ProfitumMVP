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
        // Compter les notifications non lues (status = 'unread' ou status = 'pending' pour compatibilité)
        // et exclure les archivées
        const { count: adminCount, error } = await supabase
          .from('AdminNotification')
          .select('*', { count: 'exact', head: true })
          .in('status', ['unread', 'pending'])
          .eq('is_read', false);

        if (!error) count = adminCount || 0;
      } else {
        // Autres : table notification
        // Compter les notifications non lues en vérifiant :
        // - status = 'unread' ET is_read = false
        // - status != 'archived'
        // Note: Si status est NULL, on compte aussi si is_read = false (fallback ci-dessous)
        
        // Première requête : compter les notifications avec status = 'unread' et is_read = false
        const { count: notifCountUnread, error: errorUnread } = await supabase
          .from('notification')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'unread')
          .eq('is_read', false);

        if (!errorUnread) {
          count = notifCountUnread || 0;
          
          // Deuxième requête : compter les notifications avec status IS NULL et is_read = false
          // (pour gérer les anciennes notifications qui n'ont pas de status)
          const { count: notifCountNull, error: errorNull } = await supabase
            .from('notification')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .is('status', null)
            .eq('is_read', false);

          if (!errorNull && notifCountNull) {
            count += notifCountNull;
          }
        } else {
          // Fallback : compter simplement status = 'unread' et is_read = false
          const { count: notifCountFallback, error: errorFallback } = await supabase
            .from('notification')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'unread')
            .eq('is_read', false);

          if (!errorFallback) count = notifCountFallback || 0;
        }

        // Note: Les notifications archivées sont exclues car on filtre sur status = 'unread'
        // Note: is_dismissed n'est pas vérifié ici car la colonne peut ne pas exister
        // et les notifications dismissées sont généralement gérées différemment
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

