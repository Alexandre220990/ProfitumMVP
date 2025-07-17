import { useState, useEffect, useCallback } from 'react';
import pushNotificationService, { 
  NotificationPreferences 
} from '@/services/pushNotificationService';

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
  preferences: NotificationPreferences | null;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  
  // Utilitaires
  isQuietHours: boolean;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  // Initialiser le service
  const initialize = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await pushNotificationService.initialize();
      setIsInitialized(success);
      setIsSupported(success); // Utiliser le résultat de initialize() au lieu de la propriété privée
      
      if (success) {
        setPermission(pushNotificationService.getPermissionStatus());
        setIsEnabled(pushNotificationService.isNotificationEnabled());
        await loadPreferences();
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur d\'initialisation';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Demander la permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newPermission = await pushNotificationService.requestPermission();
      setPermission(newPermission);
      setIsEnabled(newPermission === 'granted');
      
      if (newPermission === 'granted') {
        await loadPreferences();
      }
      
      return newPermission;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de permission';
      setError(errorMessage);
      return 'denied';
    } finally {
      setIsLoading(false);
    }
  }, []);

  // S'abonner
  const subscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const subscription = await pushNotificationService.subscribeToPush();
      setIsEnabled(!!subscription);
      return !!subscription;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur d\'abonnement';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Se désabonner
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await pushNotificationService.unsubscribeFromPush();
      setIsEnabled(!success);
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de désabonnement';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Envoyer une notification de test
  const sendTestNotification = useCallback(async (): Promise<void> => {
    if (!isEnabled) {
      setError('Notifications non activées');
      return;
    }
    
    try {
      await pushNotificationService.sendLocalNotification({
        title: 'Test FinancialTracker',
        body: 'Ceci est une notification de test pour vérifier le fonctionnement.',
        icon: '/images/logo.png',
        tag: 'test',
        requireInteraction: false,
        data: {
          url: '/dashboard',
          notificationId: 'test-' + Date.now()
        },
        actions: [
          {
            action: 'view',
            title: 'Voir'
          },
          {
            action: 'dismiss',
            title: 'Fermer'
          }
        ]
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur envoi test';
      setError(errorMessage);
    }
  }, [isEnabled]);

  // Charger les préférences
  const loadPreferences = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (err) {
      console.error('Erreur chargement préférences:', err);
    }
  }, []);

  // Mettre à jour les préférences
  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>): Promise<void> => {
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newPrefs)
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur mise à jour préférences';
      setError(errorMessage);
    }
  }, []);

  // Vérifier les heures silencieuses
  const isQuietHours = pushNotificationService.isQuietHours();

  // Initialisation automatique
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Écouter les changements de permission
  useEffect(() => {
    const handlePermissionChange = () => {
      setPermission(pushNotificationService.getPermissionStatus());
      setIsEnabled(pushNotificationService.isNotificationEnabled());
    };

    // Écouter les changements de permission (si supporté)
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' }).then((permissionStatus) => {
        permissionStatus.addEventListener('change', handlePermissionChange);
        
        return () => {
          permissionStatus.removeEventListener('change', handlePermissionChange);
        };
      });
    }
  }, []);

  return {
    // État
    isSupported,
    isInitialized,
    permission,
    isEnabled,
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