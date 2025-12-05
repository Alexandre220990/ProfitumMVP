import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

interface ProtectedRouteProps {
  requiredType?: "client" | "expert" | "admin" | "apporteur";
}

export default function ProtectedRoute({ requiredType }: ProtectedRouteProps) {
  const { user, isLoading, checkAuth } = useAuth();
  const location = useLocation();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Vérifier la session Supabase directement avant de rediriger
  useEffect(() => {
    const verifySession = async () => {
      if (user || isLoading) {
        setIsCheckingSession(false);
        return;
      }

      console.log('🔍 [ProtectedRoute] Vérification session Supabase...');
      
      try {
        // 1. Vérifier si une session existe
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session && !sessionError) {
          console.log('✅ [ProtectedRoute] Session Supabase trouvée, rafraîchissement du contexte...');
          
          // 2. Vérifier si la session est expirée ou va bientôt expirer
          const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
          const now = Date.now();
          const timeUntilExpiry = expiresAt - now;
          
          // Si la session expire dans moins de 5 minutes, essayer de la rafraîchir
          if (timeUntilExpiry < 5 * 60 * 1000) {
            console.log('🔄 [ProtectedRoute] Session expire bientôt, tentative de rafraîchissement...');
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshedSession && !refreshError) {
              console.log('✅ [ProtectedRoute] Session rafraîchie avec succès');
            } else {
              console.log('⚠️ [ProtectedRoute] Impossible de rafraîchir la session:', refreshError?.message);
            }
          }
          
          // 3. Mettre à jour le contexte d'authentification
          await checkAuth(false);
          setIsCheckingSession(false);
          return;
        }
        
        // 4. Si pas de session, vérifier s'il y a un refresh token dans localStorage
        const storedSession = localStorage.getItem('supabase.auth.token');
        if (storedSession) {
          try {
            const parsed = JSON.parse(storedSession);
            if (parsed?.refresh_token) {
              console.log('🔄 [ProtectedRoute] Refresh token trouvé, tentative de restauration...');
              const { data: { session: restoredSession }, error: restoreError } = await supabase.auth.refreshSession();
              
              if (restoredSession && !restoreError) {
                console.log('✅ [ProtectedRoute] Session restaurée depuis refresh token');
                await checkAuth(false);
                setIsCheckingSession(false);
                return;
              }
            }
          } catch (e) {
            console.log('⚠️ [ProtectedRoute] Erreur parsing session:', e);
          }
        }
        
        console.log('❌ [ProtectedRoute] Aucune session valide trouvée');
        setIsCheckingSession(false);
      } catch (error) {
        console.error('❌ [ProtectedRoute] Erreur vérification session:', error);
        setIsCheckingSession(false);
      }
    };

    verifySession();
  }, [user, isLoading, checkAuth]);

  // Log pour déboguer les problèmes d'authentification
  if (requiredType) {
    console.log('🔒 ProtectedRoute - Vérification:', {
      requiredType,
      userType: user?.type,
      hasUser: !!user,
      isLoading,
      isCheckingSession,
      pathname: location.pathname
    });
  }

  // Afficher un loader pendant la vérification de session ou le chargement initial
  if (isLoading || isCheckingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    console.log('❌ ProtectedRoute - Aucun utilisateur, redirection vers connexion');
    
    // Construire l'URL de redirection avec le chemin actuel
    const redirectPath = `${location.pathname}${location.search}${location.hash}`;
    
    // Rediriger vers la bonne page de connexion selon le type requis
    // En passant l'URL de redirection en query param
    if (requiredType === 'expert') {
      return <Navigate to={`/connexion-expert?redirect=${encodeURIComponent(redirectPath)}`} replace />;
    } else if (requiredType === 'admin') {
      return <Navigate to={`/connect-admin?redirect=${encodeURIComponent(redirectPath)}`} replace />;
    } else if (requiredType === 'apporteur') {
      return <Navigate to={`/connexion-apporteur?redirect=${encodeURIComponent(redirectPath)}`} replace />;
    } else {
      return <Navigate to={`/connexion-client?redirect=${encodeURIComponent(redirectPath)}`} replace />;
    }
  }

  if (requiredType && user.type !== requiredType) {
    console.error('❌ ProtectedRoute - Type utilisateur incorrect:', {
      requiredType,
      userType: user.type,
      pathname: location.pathname
    });
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('✅ ProtectedRoute - Accès autorisé');
  return <Outlet />;
} 