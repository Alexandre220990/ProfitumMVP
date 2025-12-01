import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import LoadingScreen from '@/components/LoadingScreen';

/**
 * Page de redirection automatique pour les admins en PWA
 * Redirige vers /connect-admin si pas connecté, sinon vers le dashboard admin
 * 
 * Gère la restauration de session Supabase au démarrage de l'app
 */
export default function AdminRedirect() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [sessionRestored, setSessionRestored] = useState(false);
  const [maxWaitReached, setMaxWaitReached] = useState(false);

  // Attendre que la session Supabase soit restaurée
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let checkInterval: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 10; // 5 secondes max (10 * 500ms)

    const checkSession = async () => {
      attempts++;
      console.log(`🔍 Vérification de la session Supabase (tentative ${attempts}/${maxAttempts})...`);
      
      try {
        // Vérifier si une session existe
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && !error) {
          console.log('✅ Session Supabase restaurée:', {
            userId: session.user?.id,
            email: session.user?.email,
            expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'
          });
          setSessionRestored(true);
          if (checkInterval) clearInterval(checkInterval);
          if (timeoutId) clearTimeout(timeoutId);
          return;
        }

        // Si pas de session mais qu'on a un refresh token, essayer de rafraîchir
        const refreshToken = localStorage.getItem('supabase_refresh_token');
        if (refreshToken && !session) {
          console.log('🔄 Tentative de rafraîchissement de session avec refresh token...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshData?.session && !refreshError) {
            console.log('✅ Session rafraîchie avec succès');
            setSessionRestored(true);
            if (checkInterval) clearInterval(checkInterval);
            if (timeoutId) clearTimeout(timeoutId);
            return;
          } else {
            console.log('⚠️ Impossible de rafraîchir la session:', refreshError?.message);
          }
        }

        // Si on a atteint le maximum d'essais, arrêter
        if (attempts >= maxAttempts) {
          console.log('⏰ Temps d\'attente maximum atteint, arrêt de la vérification');
          setMaxWaitReached(true);
          setSessionRestored(true); // On considère qu'on a fini d'attendre
          if (checkInterval) clearInterval(checkInterval);
          if (timeoutId) clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la vérification de session:', error);
        if (attempts >= maxAttempts) {
          setMaxWaitReached(true);
          setSessionRestored(true);
          if (checkInterval) clearInterval(checkInterval);
          if (timeoutId) clearTimeout(timeoutId);
        }
      }
    };

    // Commencer la vérification immédiatement
    checkSession();
    
    // Vérifier toutes les 500ms
    checkInterval = setInterval(checkSession, 500);

    // Timeout de sécurité après 5 secondes
    timeoutId = setTimeout(() => {
      console.log('⏰ Timeout de sécurité atteint (5s)');
      setMaxWaitReached(true);
      setSessionRestored(true);
      if (checkInterval) clearInterval(checkInterval);
    }, 5000);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Rediriger une fois que la session est restaurée (ou qu'on a fini d'attendre) et que l'auth est chargée
  useEffect(() => {
    // Attendre que la session soit restaurée ET que l'auth soit chargée
    if (!sessionRestored || isLoading) {
      return;
    }

    console.log('🔀 Redirection après restauration de session:', {
      hasUser: !!user,
      userType: user?.type,
      maxWaitReached
    });

    if (user?.type === 'admin') {
      // Admin connecté, rediriger vers le dashboard
      console.log('✅ Admin connecté, redirection vers dashboard');
      navigate('/admin/dashboard-optimized', { replace: true });
    } else {
      // Pas d'admin connecté, rediriger vers la page de connexion
      console.log('⚠️ Pas d\'admin connecté, redirection vers /connect-admin');
      navigate('/connect-admin', { replace: true });
    }
  }, [user, isLoading, navigate, sessionRestored, maxWaitReached]);

  return <LoadingScreen />;
}

