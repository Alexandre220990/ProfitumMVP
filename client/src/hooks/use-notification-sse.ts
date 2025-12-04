/**
 * Hook React pour se connecter au flux SSE de notifications temps réel
 */

import { useEffect, useRef, useState } from 'react';
import { config } from '@/config/env';
import { getSupabaseToken } from '@/lib/auth-helpers';
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
  silent?: boolean; // Si true, ne pas afficher les toasts d'erreur (pour dashboard)
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
    const MAX_RECONNECT_ATTEMPTS = 3; // Réduit de 5 à 3 pour éviter les boucles
    let lastRefreshAttempt = 0;
    const MIN_REFRESH_INTERVAL = 60000; // 1 minute minimum entre refreshs
    let refreshFailed = false; // Flag pour arrêter si refresh échoue

    const connect = async () => {
      try {
        // Vérifier si on a déjà échoué à refresh le token
        if (refreshFailed) {
          console.warn('⚠️ Refresh token échoué précédemment, connexion SSE désactivée');
          setError('Session expirée - veuillez vous reconnecter');
          return;
        }

        // Essayer de récupérer un token frais depuis Supabase
        let token = await getSupabaseToken();
        
        // Toujours essayer de récupérer une session fraîche depuis Supabase pour s'assurer que le token n'est pas expiré
        console.log('🔄 Vérification session Supabase pour SSE...');
        try {
          const { supabase } = await import('@/lib/supabase');
          
          // Récupérer la session actuelle (peut rafraîchir automatiquement si nécessaire)
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('❌ Erreur récupération session Supabase:', sessionError);
            // Continuer avec le token en localStorage si disponible
          } else if (session?.access_token) {
            // Utiliser le token de la session fraîche
            token = session.access_token;
            localStorage.setItem('token', session.access_token);
            localStorage.setItem('supabase_token', session.access_token);
            console.log('✅ Token Supabase frais récupéré pour SSE');
          } else {
            console.warn('⚠️ Pas de session Supabase active');
            // Continuer avec le token en localStorage si disponible
          }
        } catch (error) {
          console.error('❌ Erreur récupération session:', error);
          // Continuer avec le token en localStorage si disponible
        }
        
        // Si toujours pas de token après avoir essayé Supabase
        if (!token) {
          console.warn('⚠️ Pas de token disponible, connexion SSE désactivée');
          setError('Non authentifié - veuillez vous reconnecter');
          return;
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
          refreshFailed = false; // Reset le flag si connexion réussie
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
          // Mais seulement si on n'a pas déjà tenté récemment (rate limiting)
          const now = Date.now();
          const timeSinceLastRefresh = now - lastRefreshAttempt;
          
          if (reconnectAttempts === 0 && timeSinceLastRefresh >= MIN_REFRESH_INTERVAL) {
            console.log('🔄 Tentative de refresh du token Supabase...');
            lastRefreshAttempt = now;
            
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
                  refreshFailed = false; // Reset le flag
                  connect();
                }, 500);
                return;
              } else {
                console.error('❌ Refresh token échoué:', refreshError);
                refreshFailed = true; // Marquer comme échoué
                setError('Session expirée - veuillez vous reconnecter');
                // Ne pas afficher le toast si silent est activé (dashboard)
                if (!options?.silent) {
                  toast.error('Session expirée. Veuillez vous reconnecter pour activer les notifications.');
                }
                return; // Ne pas continuer les reconnexions
              }
            } catch (refreshError: any) {
              console.error('❌ Impossible de refresh le token:', refreshError);
              // Si erreur 429 (rate limiting), arrêter complètement
              if (refreshError?.status === 429 || refreshError?.message?.includes('429')) {
                console.error('❌ Rate limiting Supabase (429), arrêt des tentatives');
                refreshFailed = true;
                setError('Trop de tentatives - veuillez attendre quelques minutes');
                // Ne pas afficher le toast si silent est activé (dashboard)
                if (!options?.silent) {
                  toast.error('Trop de tentatives de connexion. Veuillez attendre quelques minutes.');
                }
                return;
              }
              refreshFailed = true;
              setError('Session expirée - veuillez vous reconnecter');
              return; // Ne pas continuer les reconnexions
            }
          }

          // Si refresh échoué, ne pas tenter de reconnexion
          if (refreshFailed) {
            console.warn('⚠️ Refresh échoué, arrêt des reconnexions');
            return;
          }

          // Tentative de reconnexion avec backoff exponentiel (seulement si pas de refresh échoué)
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
            // Ne pas afficher le toast si silent est activé (dashboard)
            if (!options?.silent) {
              toast.error('Notifications temps réel indisponibles. Veuillez vous reconnecter.');
            }
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

