/**
 * Hook pour gérer les notifications FCM (Firebase Cloud Messaging)
 * 
 * Ce hook permet de :
 * - Demander les permissions de notifications
 * - Enregistrer le token FCM sur le serveur
 * - Recevoir les notifications en foreground
 * - Gérer le cycle de vie du token
 * 
 * Les notifications en background sont gérées par le Service Worker
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { 
  getFCMToken, 
  onForegroundMessage, 
  isFCMSupported 
} from '@/config/firebase';
import { config } from '@/config/env';
import { getSupabaseToken } from '@/lib/auth-helpers';
import { toast } from 'sonner';

export interface UseFCMNotificationsReturn {
  // État
  isSupported: boolean;
  isInitialized: boolean;
  fcmToken: string | null;
  permission: NotificationPermission;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  requestPermission: () => Promise<boolean>;
  registerToken: () => Promise<boolean>;
  unregisterToken: () => Promise<boolean>;
  
  // Utilitaires
  refreshToken: () => Promise<boolean>;
}

export function useFCMNotifications(): UseFCMNotificationsReturn {
  const { user } = useAuth();
  
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // VÉRIFIER LE SUPPORT FCM
  // ============================================================================

  useEffect(() => {
    const checkSupport = async () => {
      const supported = await isFCMSupported();
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // ============================================================================
  // DEMANDER LA PERMISSION
  // ============================================================================

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (!isSupported) {
        setError('Les notifications ne sont pas supportées sur cet appareil');
        return false;
      }

      setIsLoading(true);
      setError(null);

      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        console.log('✅ Permission notifications accordée');
        // Automatiquement enregistrer le token
        await registerToken();
        return true;
      } else {
        console.log('❌ Permission notifications refusée');
        setError('Permission notifications refusée');
        return false;
      }
    } catch (err) {
      console.error('❌ Erreur demande permission:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // ============================================================================
  // ENREGISTRER LE TOKEN FCM
  // ============================================================================

  const registerToken = useCallback(async (): Promise<boolean> => {
    try {
      if (!user?.id) {
        console.log('⚠️ Pas d\'utilisateur connecté');
        return false;
      }

      if (!isSupported) {
        return false;
      }

      setIsLoading(true);
      setError(null);

      // Obtenir le token FCM
      const token = await getFCMToken();
      
      if (!token) {
        setError('Impossible d\'obtenir le token FCM');
        return false;
      }

      setFcmToken(token);

      // Envoyer le token au backend pour le sauvegarder
      const authToken = await getSupabaseToken();
      if (!authToken) {
        console.error('❌ Token d\'authentification manquant');
        return false;
      }

      const response = await fetch(`${config.API_URL}/api/notifications/fcm/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fcm_token: token,
          device_info: {
            user_agent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur enregistrement token');
      }

      const result = await response.json();
      console.log('✅ Token FCM enregistré sur le serveur:', result);

      setIsInitialized(true);
      
      toast.success('Notifications push activées !', {
        description: 'Vous recevrez désormais les notifications même quand l\'app est fermée.'
      });

      return true;
    } catch (err) {
      console.error('❌ Erreur enregistrement token FCM:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      toast.error('Impossible d\'activer les notifications push');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isSupported]);

  // ============================================================================
  // DÉSENREGISTRER LE TOKEN FCM
  // ============================================================================

  const unregisterToken = useCallback(async (): Promise<boolean> => {
    try {
      if (!fcmToken || !user?.id) {
        return false;
      }

      setIsLoading(true);

      const authToken = await getSupabaseToken();
      if (!authToken) {
        return false;
      }

      const response = await fetch(`${config.API_URL}/api/notifications/fcm/unregister`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fcm_token: fcmToken
        })
      });

      if (response.ok) {
        setFcmToken(null);
        setIsInitialized(false);
        // Toast supprimé pour éviter les logs redondants
        return true;
      }

      return false;
    } catch (err) {
      console.error('❌ Erreur désenregistrement token:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fcmToken, user?.id]);

  // ============================================================================
  // RAFRAÎCHIR LE TOKEN (si expiré ou changé)
  // ============================================================================

  const refreshToken = useCallback(async (): Promise<boolean> => {
    console.log('🔄 Rafraîchissement du token FCM...');
    return await registerToken();
  }, [registerToken]);

  // ============================================================================
  // ÉCOUTER LES MESSAGES FOREGROUND
  // ============================================================================

  useEffect(() => {
    if (!isInitialized || !fcmToken) {
      return;
    }

    console.log('📡 Écoute des messages FCM en foreground...');

    let unsubscribe: (() => void) | null = null;

    // onForegroundMessage est async, donc on doit l'attendre
    onForegroundMessage((payload: any) => {
      console.log('📬 Message FCM reçu (foreground):', payload);

      // Afficher une notification toast
      toast(payload?.notification?.title || 'Notification', {
        description: payload?.notification?.body || payload?.data?.message,
        action: payload?.data?.action_url ? {
          label: 'Voir',
          onClick: () => window.location.href = payload.data.action_url
        } : undefined
      });
    }).then((unsub) => {
      unsubscribe = unsub;
    }).catch((err) => {
      console.error('Erreur écoute messages FCM:', err);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [isInitialized, fcmToken]);

  // ============================================================================
  // AUTO-ENREGISTREMENT AU CHARGEMENT
  // ============================================================================

  useEffect(() => {
    // Si l'utilisateur a déjà accordé la permission, enregistrer automatiquement
    if (user?.id && isSupported && permission === 'granted' && !isInitialized) {
      registerToken();
    }
  }, [user?.id, isSupported, permission, isInitialized, registerToken]);

  // ============================================================================
  // RETOUR DU HOOK
  // ============================================================================

  return {
    isSupported,
    isInitialized,
    fcmToken,
    permission,
    isLoading,
    error,
    requestPermission,
    registerToken,
    unregisterToken,
    refreshToken
  };
}

