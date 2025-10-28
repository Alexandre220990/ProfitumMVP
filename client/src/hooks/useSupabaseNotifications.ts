import { useEffect, useState, useCallback, useRef } from 'react';
import { supabaseNotificationService } from '@/services/supabase-notification-service';
import { useAuth } from '@/hooks/use-auth';

export function useSupabaseNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isSubscribedRef = useRef(false);

  // Chargement initial (API REST) - optimisé
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';
      let endpoint = '/api/notifications';
      if (user.type === 'expert') endpoint = '/api/expert/notifications';
      if (user.type === 'admin') endpoint = '/api/admin/notifications';
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
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
  }, [user?.id, user?.type]);

  // Souscription realtime - optimisée
  useEffect(() => {
    if (!user?.id || isSubscribedRef.current) return;
    
    const setupNotifications = async () => {
      try {
        // Charger les notifications initiales
        await loadNotifications();
        
        // Configurer la subscription realtime selon le type d'utilisateur
        if (user.type === 'admin') {
          // ✅ ADMIN : Écouter AdminNotification
          console.log('🔔 Activation realtime admin sur AdminNotification');
          await supabaseNotificationService.subscribeAdmin({
            onInsert: (notif) => {
              console.log('✅ Nouvelle notification admin reçue:', notif);
              setNotifications(prev => [notif, ...prev]);
            },
            onUpdate: (notif) => {
              console.log('✅ Notification admin mise à jour:', notif);
              setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, ...notif } : n));
            },
            onDelete: (id) => {
              console.log('✅ Notification admin supprimée:', id);
              setNotifications(prev => prev.filter(n => n.id !== id));
            },
            onError: (err) => setError(err.message)
          });
        } else {
          // Client/Expert/Apporteur : table notification standard
          await supabaseNotificationService.subscribe(user.id, {
            onInsert: (notif) => setNotifications(prev => [notif, ...prev]),
            onUpdate: (notif) => setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, ...notif } : n)),
            onDelete: (id) => setNotifications(prev => prev.filter(n => n.id !== id)),
            onError: (err) => setError(err.message)
          });
        }
        
        isSubscribedRef.current = true;
      } catch (error) {
        console.error('Erreur setup notifications:', error);
        setError('Erreur configuration notifications');
      }
    };
    
    setupNotifications();
    
    return () => {
      isSubscribedRef.current = false;
      supabaseNotificationService.unsubscribe();
    };
  }, [user?.id, user?.type, loadNotifications]);

  return { notifications, loading, error, reload: loadNotifications };
} 