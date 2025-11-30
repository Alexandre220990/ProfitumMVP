import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  installing: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
  deferredPrompt: BeforeInstallPromptEvent | null;
}

/**
 * Hook pour gérer l'installation PWA
 * 
 * Détecte automatiquement :
 * - Si l'app peut être installée (Android/iOS)
 * - Si l'app est déjà installée
 * - Le type de plateforme (iOS/Android/Desktop)
 * - Gère l'événement beforeinstallprompt (Android)
 */
export function usePWAInstall() {
  const [state, setState] = useState<PWAInstallState>({
    isInstallable: false,
    isInstalled: false,
    installing: false,
    platform: 'unknown',
    deferredPrompt: null,
  });

  useEffect(() => {
    // Détecter la plateforme
    const detectPlatform = (): 'ios' | 'android' | 'desktop' | 'unknown' => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      const isMobile = isIOS || isAndroid;

      if (isIOS) return 'ios';
      if (isAndroid) return 'android';
      if (!isMobile) return 'desktop';
      return 'unknown';
    };

    const platform = detectPlatform();

    // Vérifier si l'app est déjà installée
    const checkIfInstalled = (): boolean => {
      // Sur mobile, vérifier si on est en mode standalone
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
      }
      // Vérifier aussi via window.navigator.standalone (iOS)
      if ((window.navigator as any).standalone === true) {
        return true;
      }
      return false;
    };

    const isInstalled = checkIfInstalled();

    setState((prev) => ({
      ...prev,
      platform,
      isInstalled,
    }));

    // Gérer l'événement beforeinstallprompt (Android Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Empêcher le prompt automatique
      e.preventDefault();
      
      const promptEvent = e as BeforeInstallPromptEvent;
      
      setState((prev) => ({
        ...prev,
        isInstallable: true,
        deferredPrompt: promptEvent,
      }));
    };

    // Gérer l'événement appinstalled (quand l'app est installée)
    const handleAppInstalled = () => {
      setState((prev) => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        deferredPrompt: null,
      }));
    };

    // Écouter les événements
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Nettoyage
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /**
   * Déclencher l'installation de l'app
   * 
   * Sur Android : utilise le prompt natif
   * Sur iOS : retourne false (l'utilisateur doit utiliser le menu partage)
   */
  const install = async (): Promise<boolean> => {
    if (state.isInstalled) {
      console.log('App déjà installée');
      return false;
    }

    if (state.platform === 'ios') {
      // Sur iOS, on ne peut pas déclencher l'installation programmatiquement
      // L'utilisateur doit utiliser le menu partage
      return false;
    }

    if (!state.deferredPrompt) {
      console.warn('Aucun prompt d\'installation disponible');
      return false;
    }

    setState((prev) => ({ ...prev, installing: true }));

    try {
      // Afficher le prompt d'installation
      await state.deferredPrompt.prompt();

      // Attendre la réponse de l'utilisateur
      const { outcome } = await state.deferredPrompt.userChoice;

      setState((prev) => ({
        ...prev,
        installing: false,
        isInstallable: outcome === 'dismissed',
        deferredPrompt: outcome === 'dismissed' ? prev.deferredPrompt : null,
      }));

      return outcome === 'accepted';
    } catch (error) {
      console.error('Erreur lors de l\'installation:', error);
      setState((prev) => ({ ...prev, installing: false }));
      return false;
    }
  };

  return {
    ...state,
    install,
  };
}

