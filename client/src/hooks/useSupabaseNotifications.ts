import { useEffect, useState, useCallback } from 'react';
import { supabaseNotificationService } from '@/services/supabase-notification-service';
import { useAuth } from '@/hooks/use-auth';

export function useSupabaseNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chargement initial (API REST)
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = '/api/notifications';
      if (user?.type === 'expert') endpoint = '/api/expert/notifications';
      if (user?.type === 'admin') endpoint = '/api/admin/notifications';
      
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data?.notifications || data.notifications || data.data || []);
      }
    } catch (err) {
      setError('Erreur chargement notifications');
    } finally {
      setLoading(false);
    }
  }, [user?.type]);

  // Souscription realtime
  useEffect(() => {
    if (!user?.id) return;
    loadNotifications();
    supabaseNotificationService.subscribe(user.id, {
      onInsert: (notif) => setNotifications(prev => [notif, ...prev]),
      onUpdate: (notif) => setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, ...notif } : n)),
      onDelete: (id) => setNotifications(prev => prev.filter(n => n.id !== id)),
      onError: (err) => setError(err.message)
    });
    return () => { supabaseNotificationService.unsubscribe(); };
  }, [user?.id, loadNotifications]);

  return { notifications, loading, error, reload: loadNotifications };
} 