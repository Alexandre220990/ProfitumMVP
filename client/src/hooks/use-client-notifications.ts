import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { clientNotificationService, ClientNotification, NotificationStats } from '@/services/client-notification-service';

export const useClientNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<ClientNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    urgent: 0,
    by_type: {} as Record<string, number>
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les notifications
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const [allNotifications, unread, notificationStats] = await Promise.all([
        clientNotificationService.getClientNotifications(user.id),
        clientNotificationService.getUnreadNotifications(user.id),
        clientNotificationService.getNotificationStats(user.id)
      ]);

      setNotifications(allNotifications);
      setUnreadNotifications(unread);
      setStats(notificationStats);
    } catch (err) {
      console.error('Erreur chargement notifications:', err);
      setError('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Marquer comme lu
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const success = await clientNotificationService.markAsRead(notificationId);
      if (success) {
        // Mettre à jour l'état local
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
        );
        setUnreadNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        // Recharger les stats
        if (user?.id) {
          const newStats = await clientNotificationService.getNotificationStats(user.id);
          setStats(newStats);
        }
      }
    } catch (err) {
      console.error('Erreur marquage comme lu:', err);
    }
  }, [user?.id]);

  // Marquer tout comme lu
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      const success = await clientNotificationService.markAllAsRead(user.id);
      if (success) {
        // Mettre à jour l'état local
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
        setUnreadNotifications([]);
        
        // Recharger les stats
        const newStats = await clientNotificationService.getNotificationStats(user.id);
        setStats(newStats);
      }
    } catch (err) {
      console.error('Erreur marquage tout comme lu:', err);
    }
  }, [user?.id]);

  // Rejeter une notification
  const dismissNotification = useCallback(async (notificationId: string) => {
    try {
      const success = await clientNotificationService.dismissNotification(notificationId);
      if (success) {
        // Retirer de l'état local
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        // Recharger les stats
        if (user?.id) {
          const newStats = await clientNotificationService.getNotificationStats(user.id);
          setStats(newStats);
        }
      }
    } catch (err) {
      console.error('Erreur rejet notification:', err);
    }
  }, [user?.id]);

  // Créer une notification (pour les tests)
  const createNotification = useCallback(async (
    type: string,
    title: string,
    message: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    actionData?: any
  ) => {
    if (!user?.id) return null;

    try {
      const notificationId = await clientNotificationService.createNotification(
        user.id,
        type as any,
        title,
        message,
        priority,
        actionData
      );
      
      if (notificationId) {
        // Recharger les notifications
        await loadNotifications();
      }
      
      return notificationId;
    } catch (err) {
      console.error('Erreur création notification:', err);
      return null;
    }
  }, [user?.id, loadNotifications]);

  // Obtenir l'URL de redirection
  const getRedirectUrl = useCallback((notification: ClientNotification) => {
    return clientNotificationService.getNotificationRedirectUrl(notification);
  }, []);

  // Obtenir l'icône
  const getIcon = useCallback((type: string) => {
    return clientNotificationService.getNotificationIcon(type as any);
  }, []);

  // Obtenir la couleur
  const getColor = useCallback((type: string) => {
    return clientNotificationService.getNotificationColor(type as any);
  }, []);

  // Charger les notifications au montage et quand l'utilisateur change
  useEffect(() => {
    if (user?.id && user.type === 'client') {
      loadNotifications();
    }
  }, [user?.id, user?.type, loadNotifications]);

  // Recharger périodiquement (toutes les 30 secondes)
  useEffect(() => {
    if (!user?.id || user.type !== 'client') return;

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id, user?.type, loadNotifications]);

  return {
    // Données
    notifications,
    unreadNotifications,
    stats,
    loading,
    error,
    
    // Actions
    loadNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    createNotification,
    
    // Utilitaires
    getRedirectUrl,
    getIcon,
    getColor
  };
}; 