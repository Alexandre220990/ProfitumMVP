import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UserType, LoginCredentials } from '@/types/api';
import { supabase } from '@/lib/supabase';
import { useSessionRefresh } from './use-session-refresh';

// ============================================================================
// ✅ AUTHENTIFICATION 100% SUPABASE - VERSION ULTRA-SIMPLIFIÉE
// ============================================================================
// Pas de backend pour l'authentification - Tout via Supabase directement
// user_metadata contient TOUTES les infos nécessaires
// ============================================================================

console.log('📦 [use-auth.tsx] Module chargé - Version Supabase Native');

interface AuthContextType {
  user: UserType | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  checkAuth: (shouldNavigate?: boolean) => Promise<boolean>;
  setUser: (user: UserType | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  console.log('🏗️ [AuthProvider] Initialisation du Provider');
  
  useSessionRefresh();

  // ============================================================================
  // VÉRIFICATION D'AUTHENTIFICATION - 100% SUPABASE
  // ============================================================================
  const checkAuth = async (shouldNavigate: boolean = true): Promise<boolean> => {
    try {
      console.log('🔍 [checkAuth] Début vérification...');
      
      // Vérifier la session Supabase
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        console.log('⚠️ [checkAuth] Pas de session:', error?.message);
        setUser(null);
        return false;
      }

      console.log('✅ [checkAuth] Session trouvée:', session.user.email);

      // Créer l'objet user depuis user_metadata
      const supabaseUser = session.user;
      const userData: UserType = {
        id: supabaseUser.id,
        auth_user_id: supabaseUser.id,
        email: supabaseUser.email || '',
        type: (supabaseUser.user_metadata?.type as any) || 'client',
        username: supabaseUser.user_metadata?.username || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0],
        first_name: supabaseUser.user_metadata?.first_name || supabaseUser.user_metadata?.name?.split(' ')[0],
        last_name: supabaseUser.user_metadata?.last_name || supabaseUser.user_metadata?.name?.split(' ').slice(1).join(' '),
        company_name: supabaseUser.user_metadata?.company_name,
        phone: supabaseUser.user_metadata?.phone || supabaseUser.user_metadata?.phone_number,
        database_id: supabaseUser.user_metadata?.database_id || supabaseUser.id,
        ...supabaseUser.user_metadata
      };
      
      setUser(userData);
      console.log('✅ [checkAuth] User défini:', userData.email, userData.type);
      
      // PWA manifest
      if (typeof window !== 'undefined' && (window as any).updatePWAManifest) {
        (window as any).updatePWAManifest(userData.type);
        localStorage.setItem('pwa_user_type', userData.type);
      }
      
      // Redirection si demandé
      if (shouldNavigate) {
        const routes: Record<string, string> = {
          client: '/dashboard/client',
          expert: '/expert/dashboard',
          admin: '/admin/dashboard-optimized',
          apporteur: '/apporteur/dashboard'
        };
        console.log('🔀 [checkAuth] Redirection vers:', routes[userData.type]);
        navigate(routes[userData.type] || '/dashboard/client');
      }
      
      return true;

    } catch (error) {
      console.error('❌ [checkAuth] Erreur:', error);
      setUser(null);
      return false;
    }
  };

  // ============================================================================
  // CONNEXION - 100% SUPABASE
  // ============================================================================
  const login = async (credentials: LoginCredentials) => {
    console.log('🎯 [login] Début connexion:', credentials.email);
    setIsLoading(true);
    
    try {
      // Authentification Supabase
      console.log('🔐 [login] signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        console.error('❌ [login] Erreur Supabase:', error.message);
        throw new Error(error.message);
      }

      if (!data.session || !data.user) {
        console.error('❌ [login] Pas de session/user');
        throw new Error('Connexion échouée');
      }

      console.log('✅ [login] Auth réussie:', data.user.email);

      // Créer l'objet user depuis user_metadata
      const supabaseUser = data.user;
      const userData: UserType = {
        id: supabaseUser.id,
        auth_user_id: supabaseUser.id,
        email: supabaseUser.email || '',
        type: (supabaseUser.user_metadata?.type as any) || 'client',
        username: supabaseUser.user_metadata?.username || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0],
        first_name: supabaseUser.user_metadata?.first_name || supabaseUser.user_metadata?.name?.split(' ')[0],
        last_name: supabaseUser.user_metadata?.last_name || supabaseUser.user_metadata?.name?.split(' ').slice(1).join(' '),
        company_name: supabaseUser.user_metadata?.company_name,
        phone: supabaseUser.user_metadata?.phone || supabaseUser.user_metadata?.phone_number,
        database_id: supabaseUser.user_metadata?.database_id || supabaseUser.id,
        ...supabaseUser.user_metadata
      };
      
      setUser(userData);
      console.log('✅ [login] User défini:', userData.email, userData.type);
      
      toast.success(`Bienvenue ${userData.first_name || userData.username || userData.email}`);

      // Vérification statut expert si nécessaire
      if (userData.type === 'expert') {
        try {
          const { get } = await import('@/lib/api');
          const approvalResponse = await get('/experts/approval-status');
          
          if (approvalResponse.success && approvalResponse.data) {
            const approvalStatus = (approvalResponse.data as any).status;
            if (approvalStatus !== 'approved') {
              console.log('⚠️ Expert non approuvé');
              navigate('/expert-pending-approval');
              return;
            }
          }
        } catch (error) {
          console.error('⚠️ Erreur vérification approbation:', error);
        }
      }

      // Redirection selon type
      const routes: Record<string, string> = {
        client: '/dashboard/client',
        expert: '/expert/dashboard',
        admin: '/admin/dashboard-optimized',
        apporteur: '/apporteur/dashboard'
      };
      console.log('🔀 [login] Redirection:', routes[userData.type]);
      navigate(routes[userData.type] || '/dashboard/client');

    } catch (error) {
      console.error('❌ [login] Erreur:', error);
      toast.error(error instanceof Error ? error.message : "Erreur de connexion");
      throw error;
    } finally {
      setIsLoading(false);
      console.log('✅ [login] setIsLoading(false)');
    }
  };

  // ============================================================================
  // INSCRIPTION - 100% SUPABASE
  // ============================================================================
  const register = async (data: any) => {
    console.log('📝 [register] Début inscription:', data.email);
    setIsLoading(true);
    
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            type: data.type,
            username: data.username,
            first_name: data.first_name,
            last_name: data.last_name,
            name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
            company_name: data.company_name,
            phone: data.phone,
            phone_number: data.phone,
            ...data.user_metadata
          }
        }
      });

      if (error || !authData.user) {
        console.error('❌ [register] Erreur:', error?.message);
        throw new Error(error?.message || "Erreur d'inscription");
      }

      console.log('✅ [register] Inscription réussie');

      if (!authData.session) {
        toast.success("Vérifiez votre email pour confirmer votre compte");
        return;
      }

      // Créer user depuis metadata
      const supabaseUser = authData.user;
      const userData: UserType = {
        id: supabaseUser.id,
        auth_user_id: supabaseUser.id,
        email: supabaseUser.email || '',
        type: data.type,
        username: data.username || supabaseUser.email?.split('@')[0],
        first_name: data.first_name,
        last_name: data.last_name,
        company_name: data.company_name,
        phone: data.phone,
        database_id: supabaseUser.id,
        ...data.user_metadata
      };
      
      setUser(userData);
      toast.success("Inscription réussie !");
      
      const routes: Record<string, string> = {
        client: '/dashboard/client',
        expert: '/expert/dashboard',
        admin: '/admin/dashboard-optimized',
        apporteur: '/apporteur/dashboard'
      };
      navigate(routes[data.type] || '/dashboard/client');

    } catch (error) {
      console.error('❌ [register] Erreur:', error);
      toast.error(error instanceof Error ? error.message : "Erreur d'inscription");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // DÉCONNEXION - 100% SUPABASE
  // ============================================================================
  const logout = async () => {
    try {
      console.log('👋 [logout] Déconnexion...');
      await supabase.auth.signOut();
      setUser(null);
      navigate("/");
      toast.success("Déconnexion réussie !");
      console.log('✅ [logout] Terminé');
    } catch (error) {
      console.error('❌ [logout] Erreur:', error);
    }
  };

  // ============================================================================
  // INITIALISATION AU CHARGEMENT
  // ============================================================================
  useEffect(() => {
    console.log('🚀 [useEffect:init] DÉBUT Initialisation authentification...');
    
    const initializeAuth = async () => {
      try {
        console.log('⏳ [init] Attente 100ms pour restauration session...');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('🔍 [init] Vérification session Supabase...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('✅ [init] Session trouvée:', session.user?.email);
        } else {
          console.log('⚠️ [init] Pas de session');
        }
        
        // Vérifier auth avec timeout de sécurité
        console.log('🔍 [init] Appel checkAuth(false)...');
        const checkPromise = checkAuth(false);
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => {
            console.error('⏱️ [init] TIMEOUT 5s sur checkAuth!');
            resolve(false);
          }, 5000);
        });
        
        await Promise.race([checkPromise, timeoutPromise]);
        console.log('✅ [init] checkAuth terminé');
        
      } catch (error) {
        console.error('❌ [init] Erreur:', error);
      } finally {
        setIsLoading(false);
        console.log('✅ [init] setIsLoading(false) - FIN INITIALISATION');
      }
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // LISTENER ÉVÉNEMENTS SUPABASE
  // ============================================================================
  useEffect(() => {
    console.log('👂 [useEffect:listener] Configuration listener Supabase...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 [onAuthStateChange] Event:', event, { hasSession: !!session });
      
      switch (event) {
        case 'SIGNED_IN':
          console.log('✅ [onAuthStateChange] SIGNED_IN - checkAuth...');
          await checkAuth(false);
          break;
          
        case 'SIGNED_OUT':
          console.log('👋 [onAuthStateChange] SIGNED_OUT');
          setUser(null);
          if (typeof window !== 'undefined' && (window as any).updatePWAManifest) {
            (window as any).updatePWAManifest('client');
            localStorage.setItem('pwa_user_type', 'client');
          }
          break;
          
        case 'TOKEN_REFRESHED':
          console.log('🔄 [onAuthStateChange] TOKEN_REFRESHED - checkAuth...');
          await checkAuth(false);
          break;
          
        case 'USER_UPDATED':
          console.log('👤 [onAuthStateChange] USER_UPDATED - checkAuth...');
          await checkAuth(false);
          break;
          
        default:
          console.log('ℹ️ [onAuthStateChange] Event non géré:', event);
      }
    });

    return () => {
      console.log('🧹 [useEffect:listener] Cleanup listener');
      subscription.unsubscribe();
    };
  }, []);

  // Mettre à jour le manifest PWA quand l'utilisateur change
  useEffect(() => {
    if (user?.type && typeof window !== 'undefined') {
      if ((window as any).updatePWAManifest) {
        (window as any).updatePWAManifest(user.type);
        localStorage.setItem('pwa_user_type', user.type);
      }
    } else if (!user && typeof window !== 'undefined') {
      if ((window as any).updatePWAManifest) {
        (window as any).updatePWAManifest('client');
        localStorage.setItem('pwa_user_type', 'client');
      }
    }
  }, [user?.type]);

  console.log('🏁 [AuthProvider] Rendu Provider, isLoading:', isLoading, 'user:', user?.email || 'null');

  return (
    <AuthContext.Provider
      value={{
        user, isLoading, login, register, logout, checkAuth, setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
}
