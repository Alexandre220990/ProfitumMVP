import { useState, useEffect, useCallback } from 'react';
import { config } from '@/config/env';
import { getSupabaseToken } from '@/lib/auth-helpers';

export interface UsePushNotificationsReturn {
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
  preferences: any;
  updatePreferences: (prefs: any) => Promise<void>;
  
  // Utilitaires
  isQuietHours: boolean;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<any>(null);

  // Vérifier support navigateur
  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Initialiser le service worker
  const initialize = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Les notifications push ne sont pas supportées par ce navigateur');
      return false;
    }

    try {
      setIsLoading(true);
      
      // Enregistrer le service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker enregistré:', registration);
      
      setIsInitialized(true);
      return true;
    } catch (err) {
      console.error('❌ Erreur enregistrement Service Worker:', err);
      setError('Erreur lors de l\'initialisation');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Demander la permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied';
    }

    try {
      setIsLoading(true);
      
      // Initialiser le SW si pas fait
      if (!isInitialized) {
        await initialize();
      }

      // Demander la permission
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        // S'abonner automatiquement
        await subscribe();
      }
      
      return result;
    } catch (err) {
      console.error('❌ Erreur demande permission:', err);
      setError('Erreur lors de la demande de permission');
      return 'denied';
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, isInitialized]);

  // S'abonner aux notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') {
      return false;
    }

    try {
      setIsLoading(true);

      const registration = await navigator.serviceWorker.ready;
      
      // Récupérer la clé VAPID publique
      const token = await getSupabaseToken();
      const vapidResponse = await fetch(`${config.API_URL}/api/notifications/vapid-public-key`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!vapidResponse.ok) {
        throw new Error('Erreur récupération clé VAPID');
      }
      
      const { data } = await vapidResponse.json();
      const vapidPublicKey = data.publicKey;
      
      // S'abonner au push manager
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource
      });
      
      // Envoyer l'abonnement au serveur
      const subscribeResponse = await fetch(`${config.API_URL}/api/notifications/push/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subscription })
      });
      
      if (!subscribeResponse.ok) {
        throw new Error('Erreur enregistrement abonnement');
      }
      
      console.log('✅ Abonnement push créé avec succès');
      return true;
    } catch (err) {
      console.error('❌ Erreur abonnement push:', err);
      setError('Erreur lors de l\'abonnement');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission]);

  // Se désabonner
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }
      
      // Informer le serveur
      const token = await getSupabaseToken();
      await fetch(`${config.API_URL}/api/notifications/push/unsubscribe`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Désabonnement push réussi');
      return true;
    } catch (err) {
      console.error('❌ Erreur désabonnement:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Envoyer une notification de test
  const sendTestNotification = useCallback(async (): Promise<void> => {
    if (permission !== 'granted') {
      alert('Veuillez d\'abord autoriser les notifications');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Test Profitum', {
        body: 'Ceci est une notification de test',
        icon: '/logo.png',
        badge: '/badge.png',
        tag: 'test'
      });
    } catch (err) {
      console.error('❌ Erreur notification test:', err);
    }
  }, [permission]);

  // Mettre à jour les préférences
  const updatePreferences = useCallback(async (newPrefs: any): Promise<void> => {
    try {
      const token = await getSupabaseToken();
      const response = await fetch(`${config.API_URL}/api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPrefs)
      });

      if (response.ok) {
        setPreferences({ ...preferences, ...newPrefs });
      }
    } catch (err) {
      console.error('❌ Erreur mise à jour préférences:', err);
    }
  }, [preferences]);

  // Vérifier heures silencieuses
  const isQuietHours = useCallback((): boolean => {
    if (!preferences?.quiet_hours_enabled) return false;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = preferences.quiet_hours_start || '22:00';
    const end = preferences.quiet_hours_end || '08:00';
    
    if (start < end) {
      // Plage normale (ex: 08:00 - 22:00)
      return currentTime < start || currentTime >= end;
    } else {
      // Plage traversant minuit (ex: 22:00 - 08:00)
      return currentTime >= start && currentTime < end;
    }
  }, [preferences])();

  const isEnabled = permission === 'granted';

  return {
    isSupported,
    isInitialized,
    permission,
    isEnabled,
    isLoading,
    error,
    initialize,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    preferences,
    updatePreferences,
    isQuietHours
  };
}

// Helper pour convertir VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
} 