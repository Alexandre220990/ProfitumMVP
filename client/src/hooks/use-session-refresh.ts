import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Hook pour rafraîchir automatiquement la session Supabase
 * 
 * Fonctionnalités :
 * - Rafraîchit la session avant expiration (proactif)
 * - Vérifie la session périodiquement (toutes les heures)
 * - Gère les erreurs silencieusement pour éviter les déconnexions
 * - Fonctionne même quand l'app est en arrière-plan (PWA)
 */
export function useSessionRefresh() {
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(Date.now());
  const isRefreshingRef = useRef<boolean>(false);

  /**
   * Rafraîchit la session Supabase de manière sécurisée
   */
  const refreshSession = async (silent: boolean = true): Promise<boolean> => {
    // Éviter les refresh simultanés
    if (isRefreshingRef.current) {
      console.log('🔄 Refresh déjà en cours, skip...');
      return false;
    }

    try {
      isRefreshingRef.current = true;
      
      console.log('🔄 Rafraîchissement proactif de la session...');
      
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Erreur lors du rafraîchissement:', error);
        
        // Si le refresh token est expiré, on ne peut rien faire
        if (error.message?.includes('refresh_token_not_found') || 
            error.message?.includes('invalid_grant') ||
            error.message?.includes('token_expired')) {
          console.log('⚠️ Refresh token expiré, session invalide');
          if (!silent) {
            toast.error('Votre session a expiré. Veuillez vous reconnecter.');
          }
          return false;
        }
        
        // Pour les autres erreurs, on continue (peut être temporaire)
        return false;
      }

      if (session?.access_token) {
        // Mettre à jour les tokens dans localStorage
        localStorage.setItem('supabase_token', session.access_token);
        localStorage.setItem('supabase_refresh_token', session.refresh_token || '');
        localStorage.setItem('token', session.access_token);
        
        lastRefreshRef.current = Date.now();
        
        console.log('✅ Session rafraîchie avec succès', {
          expires_at: session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A',
          expires_in: session.expires_in ? `${Math.floor(session.expires_in / 3600)}h` : 'N/A'
        });
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erreur inattendue lors du rafraîchissement:', error);
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  };

  /**
   * Vérifie si la session doit être rafraîchie
   * Rafraîchit si elle expire dans moins de 2 heures
   */
  const checkAndRefreshIfNeeded = async (): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.expires_at) {
        console.log('⚠️ Pas de session ou pas de date d\'expiration');
        return;
      }

      const expiresAt = session.expires_at * 1000; // Convertir en millisecondes
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      const twoHours = 2 * 60 * 60 * 1000; // 2 heures en millisecondes

      // Si la session expire dans moins de 2 heures, rafraîchir
      if (timeUntilExpiry < twoHours && timeUntilExpiry > 0) {
        console.log(`⏰ Session expire dans ${Math.floor(timeUntilExpiry / 60000)} minutes, rafraîchissement...`);
        await refreshSession(true);
      } else if (timeUntilExpiry <= 0) {
        // Session déjà expirée, essayer de rafraîchir
        console.log('⚠️ Session expirée, tentative de rafraîchissement...');
        await refreshSession(true);
      } else {
        const hoursUntilExpiry = Math.floor(timeUntilExpiry / (60 * 60 * 1000));
        console.log(`✅ Session valide pour encore ${hoursUntilExpiry}h`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de la session:', error);
    }
  };

  useEffect(() => {
    // Vérifier immédiatement au montage
    checkAndRefreshIfNeeded();

    // Vérifier toutes les heures (3600000 ms)
    const CHECK_INTERVAL = 60 * 60 * 1000; // 1 heure
    
    refreshIntervalRef.current = setInterval(() => {
      console.log('⏰ Vérification périodique de la session...');
      checkAndRefreshIfNeeded();
    }, CHECK_INTERVAL);

    // Vérifier aussi quand la page devient visible (retour de l'arrière-plan)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Page visible, vérification de la session...');
        checkAndRefreshIfNeeded();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Vérifier aussi quand la fenêtre reprend le focus (pour PWA)
    const handleFocus = () => {
      console.log('🎯 Fenêtre en focus, vérification de la session...');
      checkAndRefreshIfNeeded();
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return {
    refreshSession,
    checkAndRefreshIfNeeded
  };
}

