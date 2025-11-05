/**
 * Hook React pour se connecter au flux SSE de notifications temps réel
 */

import { useEffect, useRef, useState } from 'react';
import { config } from '@/config/env';
import { toast } from 'sonner';

interface SSENotification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

interface SSEEvent {
  type: 'connected' | 'notification' | 'new_notification' | 'initial_notifications' | 'refresh_kpi' | 'ping';
  message?: string;
  data?: any;
  count?: number;
  timestamp: string;
}

export function useNotificationSSE(options?: {
  onNotification?: (notification: SSENotification) => void;
  onKPIRefresh?: () => void;
  enabled?: boolean;
}) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  const enabled = options?.enabled !== false;

  useEffect(() => {
    if (!enabled) return;

    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;

    const connect = async () => {
      try {
        // Essayer de récupérer un token frais depuis Supabase
        let token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
        
        // Si pas de token, essayer de récupérer la session Supabase
        if (!token) {
          console.log('🔄 Tentative récupération session Supabase pour SSE...');
          try {
            const { supabase } = await import('@/lib/supabase');
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.access_token) {
              token = session.access_token;
              localStorage.setItem('token', session.access_token);
              console.log('✅ Token Supabase récupéré pour SSE');
            }
          } catch (error) {
            console.error('❌ Erreur récupération session:', error);
          }
        }
        
        if (!token) {
          console.warn('⚠️ Pas de token, connexion SSE désactivée');
          setError('Non authentifié');
          return;
        }

        console.log('📡 Connexion au flux SSE notifications... (token:', token.substring(0, 20) + '...)');

        // Créer la connexion EventSource
        const eventSource = new EventSource(
          `${config.API_URL}/api/notifications/stream?token=${token}`,
          { withCredentials: true }
        );

        eventSourceRef.current = eventSource;

        // Événement: Connexion établie
        eventSource.onopen = () => {
          console.log('✅ Connexion SSE établie');
          setConnected(true);
          setError(null);
          reconnectAttempts = 0;
        };

        // Événement: Message reçu
        eventSource.onmessage = (event) => {
          try {
            const data: SSEEvent = JSON.parse(event.data);
            
            console.log('📨 SSE event reçu:', data.type);

            switch (data.type) {
              case 'connected':
                console.log('✅ SSE connecté:', data.message);
                break;

              case 'initial_notifications':
                console.log(`📬 ${data.count} notification(s) non lue(s)`);
                setUnreadCount(data.count || 0);
                break;

              case 'new_notification':
                console.log('🔔 Nouvelle notification:', data.data);
                
                // Incrémenter le compteur
                setUnreadCount(prev => prev + 1);

                // Callback personnalisé
                if (options?.onNotification && data.data) {
                  options.onNotification(data.data as SSENotification);
                }

                // Toast notification
                if (data.data) {
                  const notif = data.data as SSENotification;
                  toast(notif.title, {
                    description: notif.message,
                    duration: 5000,
                    action: notif.action_url ? {
                      label: 'Voir',
                      onClick: () => window.location.href = notif.action_url!
                    } : undefined
                  });
                }
                break;

              case 'refresh_kpi':
                console.log('📊 Demande de rafraîchissement KPI');
                if (options?.onKPIRefresh) {
                  options.onKPIRefresh();
                }
                break;

              case 'ping':
                // Heartbeat - ne rien faire
                break;

              default:
                console.log('📨 SSE event inconnu:', data.type);
            }
          } catch (error) {
            console.error('❌ Erreur parsing SSE event:', error);
          }
        };

        // Événement: Erreur
        eventSource.onerror = async (error) => {
          console.error('❌ Erreur SSE:', error);
          setConnected(false);
          setError('Connexion perdue');

          // Fermer la connexion
          eventSource.close();

          // Si c'est potentiellement une erreur 401, essayer de refresh le token
          if (reconnectAttempts === 0) {
            console.log('🔄 Tentative de refresh du token Supabase...');
            try {
              const { supabase } = await import('@/lib/supabase');
              const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
              
              if (session?.access_token && !refreshError) {
                console.log('✅ Token refreshé, reconnexion SSE...');
                localStorage.setItem('token', session.access_token);
                localStorage.setItem('supabase_token', session.access_token);
                
                // Retry immédiatement avec le nouveau token
                setTimeout(() => {
                  reconnectAttempts = 0; // Reset car on a un nouveau token
                  connect();
                }, 500);
                return;
              }
            } catch (refreshError) {
              console.error('❌ Impossible de refresh le token:', refreshError);
            }
          }

          // Tentative de reconnexion avec backoff exponentiel
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`🔄 Reconnexion SSE dans ${delay}ms (tentative ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
            
            reconnectTimeout = setTimeout(() => {
              reconnectAttempts++;
              connect();
            }, delay);
          } else {
            console.error('❌ Nombre maximum de tentatives de reconnexion atteint');
            setError('Impossible de se reconnecter - reconnectez-vous');
            toast.error('Notifications temps réel indisponibles. Veuillez vous reconnecter.');
          }
        };

      } catch (error) {
        console.error('❌ Erreur création EventSource:', error);
        setError('Erreur de connexion');
      }
    };

    // Établir la connexion
    connect();

    // Cleanup
    return () => {
      console.log('🔌 Fermeture connexion SSE');
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setConnected(false);
    };
  }, [enabled, options?.onNotification, options?.onKPIRefresh]);

  return {
    connected,
    error,
    unreadCount
  };
}

