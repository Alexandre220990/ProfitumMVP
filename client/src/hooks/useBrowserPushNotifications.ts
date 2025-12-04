import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { getSupabaseToken } from '@/lib/auth-helpers';

/**
 * Hook pour les notifications push BROWSER UNIQUEMENT
 * 
 * ✅ Fonctionne : Notifications natives quand l'onglet est ouvert
 * ❌ Ne fonctionne PAS : Notifications en arrière-plan (nécessite FCM)
 * 
 * Utilise l'API Notification du navigateur (pas de service externe)
 * Sauvegarde les préférences dans UserNotificationPreferences
 * 
 * @example
 * ```tsx
 * function NotificationSettings() {
 *   const { 
 *     isSupported, 
 *     permission, 
 *     requestPermission,
 *     sendTestNotification 
 *   } = useBrowserPushNotifications();
 *   
 *   return (
 *     <div>
 *       {isSupported ? (
 *         <button onClick={requestPermission} disabled={permission === 'granted'}>
 *           {permission === 'granted' ? '✅ Activé' : 'Activer les notifications'}
 *         </button>
 *       ) : (
 *         <p>Notifications non supportées sur cet appareil</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

export interface UseBrowserPushNotificationsReturn {
  // État
  isSupported: boolean;
  isInitialized: boolean;
  permission: NotificationPermission;
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendTestNotification: () => Promise<void>;
  
  // Préférences
  preferences: { push_enabled: boolean } | null;
  updatePreferences: (enabled: boolean) => Promise<void>;
  
  // Utilitaires
  isQuietHours: boolean;
}

export function useBrowserPushNotifications(): UseBrowserPushNotificationsReturn {
  const { user } = useAuth();
  
  // État
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isSupported] = useState(typeof Notification !== 'undefined' && 'serviceWorker' in navigator);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<{ push_enabled: boolean } | null>(null);

  // Charger les préférences au montage
  useEffect(() => {
    if (!user?.id) return;
    
    const loadPreferences = async () => {
      try {
        const token = await getSupabaseToken();
        const response = await fetch(`/api/user-preferences/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setPreferences({ push_enabled: data.push_enabled || false });
        }
      } catch (err) {
        console.error('Erreur chargement préférences:', err);
      }
    };
    
    loadPreferences();
  }, [user?.id]);

  // Initialiser et demander permission
  const initialize = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Les notifications ne sont pas supportées par ce navigateur');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      
      if (perm === 'granted') {
        console.log('✅ Permission notifications accordée');
        // Sauvegarder dans les préférences
        await updatePreferences(true);
        return true;
      } else {
        setError('Permission refusée par l\'utilisateur');
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur demande permission';
      setError(message);
      console.error('❌ Erreur permission notifications:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Demander permission (alias de initialize)
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    await initialize();
    return permission;
  }, [initialize, permission]);

  // S'abonner (pour compatibilité API)
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (permission !== 'granted') {
      return await initialize();
    }
    return true;
  }, [permission, initialize]);

  // Se désabonner
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      // Mettre à jour les préférences
      await updatePreferences(false);
      console.log('✅ Désabonné des notifications');
      return true;
    } catch (err) {
      console.error('❌ Erreur désabonnement:', err);
      return false;
    }
  }, []);

  // Envoyer une notification de test
  const sendTestNotification = useCallback(async (): Promise<void> => {
    if (permission !== 'granted') {
      setError('Permission non accordée');
      return;
    }

    try {
      new Notification('Test de notification', {
        body: 'Les notifications fonctionnent correctement ! 🎉',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'test-notification',
        requireInteraction: false,
        vibrate: [200, 100, 200]
      });
      
      console.log('✅ Notification de test envoyée');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur envoi notification';
      setError(message);
      console.error('❌ Erreur notification test:', err);
    }
  }, [permission]);

  // Mettre à jour les préférences
  const updatePreferences = useCallback(async (enabled: boolean): Promise<void> => {
    if (!user?.id) return;

    try {
      const token = await getSupabaseToken();
      const response = await fetch(`/api/user-preferences/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ push_enabled: enabled })
      });

      if (response.ok) {
        setPreferences({ push_enabled: enabled });
        console.log(`✅ Préférence push mise à jour: ${enabled}`);
      }
    } catch (err) {
      console.error('❌ Erreur mise à jour préférences:', err);
    }
  }, [user?.id]);

  // Vérifier heures calmes (simpliste pour browser-only)
  const isQuietHours = false; // TODO: Implémenter avec UserNotificationPreferences

  return {
    // État
    isSupported,
    isInitialized: permission !== 'default',
    permission,
    isEnabled: permission === 'granted',
    isLoading,
    error,
    
    // Actions
    initialize,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    
    // Préférences
    preferences,
    updatePreferences,
    
    // Utilitaires
    isQuietHours
  };
}

