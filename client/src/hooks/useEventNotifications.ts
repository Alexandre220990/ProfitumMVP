/**
 * Hook pour récupérer les notifications d'événements depuis le système de notifications existant
 * Les notifications sont créées/mises à jour côté backend
 */

import { useMemo } from 'react';
import { useSupabaseNotifications } from '@/hooks/useSupabaseNotifications';

export interface EventNotificationData {
  event_id: string;
  event_title: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: 'proposed' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  location?: string;
  meeting_url?: string;
  meeting_type?: 'physical' | 'video' | 'phone';
}

/**
 * Hook pour filtrer et récupérer les notifications d'événements
 */
export function useEventNotifications() {
  const { notifications } = useSupabaseNotifications();

  // Filtrer uniquement les notifications d'événements
  const eventNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      // Vérifier si c'est une notification d'événement
      const isEventNotification = 
        notification.notification_type === 'event_upcoming' ||
        notification.notification_type === 'event_in_progress' ||
        notification.notification_type === 'event_completed' ||
        notification.notification_type === 'calendar_event_reminder' ||
        notification.metadata?.event_id ||
        notification.action_data?.event_id;
      
      return isEventNotification;
    });
  }, [notifications]);

  // Calculer les statistiques
  const upcomingCount = useMemo(
    () => eventNotifications.filter((n) => 
      n.notification_type === 'event_upcoming' || 
      (n.metadata?.event_status === 'upcoming')
    ).length,
    [eventNotifications]
  );

  const inProgressCount = useMemo(
    () => eventNotifications.filter((n) => 
      n.notification_type === 'event_in_progress' || 
      (n.metadata?.event_status === 'in_progress')
    ).length,
    [eventNotifications]
  );

  const completedCount = useMemo(
    () => eventNotifications.filter((n) => 
      n.notification_type === 'event_completed' || 
      (n.metadata?.event_status === 'completed')
    ).length,
    [eventNotifications]
  );

  return {
    eventNotifications,
    upcomingCount,
    inProgressCount,
    completedCount,
  };
}
