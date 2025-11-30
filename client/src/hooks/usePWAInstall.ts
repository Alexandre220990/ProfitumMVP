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
 * - Si l'app peut être installée (Android/iOS/Desktop)
 * - Si l'app est déjà installée
 * - Le type de plateforme (iOS/Android/Desktop)
 * - Gère l'événement beforeinstallprompt (Chrome/Edge)
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

    // Vérifier les critères d'installabilité de manière proactive
    const checkInstallability = async (): Promise<boolean> => {
      // Vérifier si le manifest existe
      try {
        const manifestResponse = await fetch('/manifest.json');
        if (!manifestResponse.ok) {
          return false;
        }
        const manifest = await manifestResponse.json();
        
        // Vérifier les critères de base
        if (!manifest.name || !manifest.icons || manifest.icons.length === 0) {
          return false;
        }
      } catch (error) {
        console.warn('Erreur lors de la vérification du manifest:', error);
        return false;
      }

      // Vérifier si le service worker est enregistré
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (!registration) {
            return false;
          }
        } catch (error) {
          console.warn('Erreur lors de la vérification du service worker:', error);
          return false;
        }
      } else {
        return false;
      }

      // Sur Chrome Desktop, vérifier si on est en HTTPS ou localhost
      const isSecure = window.location.protocol === 'https:' || 
                       window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '[::1]';

      if (!isSecure) {
        return false;
      }

      return true;
    };

    const isInstalled = checkIfInstalled();

    // Vérifier l'installabilité de manière proactive
    checkInstallability().then((canInstall) => {
      if (canInstall && !isInstalled) {
        // Sur desktop Chrome, permettre l'installation même sans beforeinstallprompt
        // L'utilisateur pourra utiliser le menu du navigateur si nécessaire
        if (platform === 'desktop') {
          setState((prev) => ({
            ...prev,
            isInstallable: true,
            platform,
            isInstalled,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            platform,
            isInstalled,
          }));
        }
      } else {
        setState((prev) => ({
          ...prev,
          platform,
          isInstalled,
        }));
      }
    });

    // Gérer l'événement beforeinstallprompt (Chrome/Edge Desktop et Mobile)
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
      // Confirmer que le type et l'URL sont bien stockés
      const userType = localStorage.getItem('pwa_user_type');
      const startUrl = localStorage.getItem('pwa_start_url');
      
      if (userType && startUrl) {
        console.log(`✅ PWA installée pour type ${userType}, start_url: ${startUrl}`);
      }
      
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
   * Sur Android/Desktop : utilise le prompt natif si disponible
   * Sur iOS : retourne false (l'utilisateur doit utiliser le menu partage)
   * Sur Desktop sans prompt : guide l'utilisateur vers le menu du navigateur
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

    // Si on a un prompt différé, l'utiliser
    if (state.deferredPrompt) {
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
    }

    // Sur Desktop Chrome sans prompt différé, vérifier si on peut quand même installer
    if (state.platform === 'desktop' && state.isInstallable) {
      // Chrome Desktop peut permettre l'installation via le menu du navigateur
      // On retourne true pour indiquer que l'utilisateur peut essayer
      // Le navigateur affichera son propre prompt si disponible
      console.log('Installation disponible via le menu du navigateur Chrome');
      return true;
    }

    console.warn('Aucun prompt d\'installation disponible');
    return false;
  };

  return {
    ...state,
    install,
  };
}

