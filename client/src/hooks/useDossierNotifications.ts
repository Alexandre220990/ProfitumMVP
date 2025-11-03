/**
 * Hook pour gérer les notifications spécifiques aux dossiers
 * - Compte les notifications non lues par dossier
 * - Détecte les nouveaux statuts (< 24h)
 * - Identifie les actions requises
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  metadata?: {
    dossier_id?: string;
    client_produit_id?: string;
    action_required?: boolean;
    status_change?: string;
  };
}

interface DossierNotificationData {
  unreadCount: number;
  hasActionRequired: boolean;
  isNewStatus: boolean; // < 24h
  latestNotification?: Notification;
}

export function useDossierNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les notifications
  useEffect(() => {
    if (!user?.id) return;

    const loadNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notification')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setNotifications(data || []);
      } catch (error) {
        console.error('Erreur chargement notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // S'abonner aux nouvelles notifications en temps réel
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Nouvelle notification reçue:', payload.new);
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notification',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  // Calculer les données par dossier
  const notificationsByDossier = useMemo(() => {
    const map = new Map<string, DossierNotificationData>();

    notifications.forEach((notif) => {
      const dossierId = notif.metadata?.client_produit_id || notif.metadata?.dossier_id;
      if (!dossierId) return;

      const existing = map.get(dossierId) || {
        unreadCount: 0,
        hasActionRequired: false,
        isNewStatus: false,
        latestNotification: undefined
      };

      // Compter les non lues
      if (!notif.read) {
        existing.unreadCount++;
      }

      // Détecter action requise
      if (notif.metadata?.action_required) {
        existing.hasActionRequired = true;
      }

      // Détecter nouveau statut (< 24h)
      const notifDate = new Date(notif.created_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - notifDate.getTime()) / (1000 * 60 * 60);
      if (hoursDiff < 24 && notif.metadata?.status_change) {
        existing.isNewStatus = true;
      }

      // Garder la plus récente
      if (!existing.latestNotification || notif.created_at > existing.latestNotification.created_at) {
        existing.latestNotification = notif;
      }

      map.set(dossierId, existing);
    });

    return map;
  }, [notifications]);

  // Fonction pour obtenir les données d'un dossier spécifique
  const getDossierNotifications = (dossierId: string): DossierNotificationData => {
    return notificationsByDossier.get(dossierId) || {
      unreadCount: 0,
      hasActionRequired: false,
      isNewStatus: false,
      latestNotification: undefined
    };
  };

  // Fonction pour marquer une notification comme lue
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await (supabase
        .from('notification')
        .update as any)({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Erreur marquage notification comme lue:', error);
    }
  };

  // Fonction pour marquer toutes les notifications d'un dossier comme lues
  const markDossierAsRead = async (dossierId: string) => {
    const dossierNotifs = notifications.filter(
      (n) => (n.metadata?.client_produit_id || n.metadata?.dossier_id) === dossierId && !n.read
    );

    try {
      const promises = dossierNotifs.map((n) =>
        (supabase.from('notification').update as any)({ read: true }).eq('id', n.id)
      );

      await Promise.all(promises);

      setNotifications((prev) =>
        prev.map((n) =>
          dossierNotifs.some((dn) => dn.id === n.id) ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Erreur marquage dossier comme lu:', error);
    }
  };

  return {
    notifications,
    loading,
    notificationsByDossier,
    getDossierNotifications,
    markAsRead,
    markDossierAsRead,
    totalUnread: notifications.filter((n) => !n.read).length
  };
}

