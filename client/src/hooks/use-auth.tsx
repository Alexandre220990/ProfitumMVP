import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UserType, LoginCredentials } from '@/types/api';
import { supabase } from '@/lib/supabase';
import { config } from '@/config/env';
import { useSessionRefresh } from './use-session-refresh';

/**
 * ✅ SYSTÈME D'AUTHENTIFICATION ULTRA-SIMPLIFIÉ
 * 
 * Architecture :
 * - Authentification DIRECTE avec Supabase (supabase.auth.signInWithPassword)
 * - Récupération profil depuis /api/auth/me
 * - Tout intégré dans ce hook (pas de fichiers externes)
 * - Timeouts de sécurité pour éviter blocages
 */

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
  
  useSessionRefresh();

  // ============================================================================
  // FONCTION DE VÉRIFICATION - LOGIQUE INTÉGRÉE DIRECTEMENT
  // ============================================================================
  const checkAuth = async (shouldNavigate: boolean = true): Promise<boolean> => {
    try {
      console.log('🔍 [use-auth] Vérification session Supabase...');
      
      // 1️⃣ Vérifier la session Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.log('⚠️ Pas de session active');
        setUser(null);
        return false;
      }

      console.log('✅ Session Supabase:', session.user?.email);

      // 2️⃣ Récupérer le profil depuis le backend (avec timeout de sécurité)
      console.log(`🌐 Appel ${config.API_URL}/api/auth/me...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('⏱️ TIMEOUT 5s sur /api/auth/me - Annulation');
        controller.abort();
      }, 5000);

      try {
        const profileResponse = await fetch(`${config.API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!profileResponse.ok) {
          console.error(`❌ Erreur /api/auth/me: ${profileResponse.status} ${profileResponse.statusText}`);
          setUser(null);
          return false;
        }

        const profileData = await profileResponse.json();
        console.log('✅ Profil récupéré:', profileData);

        if (!profileData.success || !profileData.data?.user) {
          console.error('❌ Profil invalide');
          setUser(null);
          return false;
        }

        const userData: UserType = {
          ...profileData.data.user,
          experience: profileData.data.user.experience?.toString()
        };
        
        setUser(userData);
        console.log('✅ User authentifié:', userData.email, userData.type);
        
        // Mettre à jour le manifest PWA
        if (typeof window !== 'undefined' && (window as any).updatePWAManifest) {
          (window as any).updatePWAManifest(userData.type);
          localStorage.setItem('pwa_user_type', userData.type);
        }
        
        // Redirection selon type (si demandé)
        if (shouldNavigate) {
          const routes: Record<string, string> = {
            client: '/dashboard/client',
            expert: '/expert/dashboard',
            admin: '/admin/dashboard-optimized',
            apporteur: '/apporteur/dashboard'
          };
          navigate(routes[userData.type] || '/dashboard/client');
        }
        
        return true;

      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.error('⏱️ Timeout fetch /api/auth/me');
        } else {
          console.error('❌ Erreur fetch:', fetchError);
        }
        
        setUser(null);
        return false;
      }

    } catch (error) {
      console.error('❌ Erreur checkAuth:', error);
      setUser(null);
      return false;
    }
  };

  // ============================================================================
  // FONCTION DE LOGIN - LOGIQUE INTÉGRÉE DIRECTEMENT
  // ============================================================================
  const login = async (credentials: LoginCredentials) => {
    console.log('🎯 [use-auth] Login:', credentials.email);
    setIsLoading(true);
    
    try {
      // 1️⃣ Authentification DIRECTE avec Supabase
      console.log('🔐 Authentification Supabase directe...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (authError || !authData.session || !authData.user) {
        console.error('❌ Erreur auth Supabase:', authError);
        throw new Error(authError?.message || 'Erreur de connexion');
      }

      console.log('✅ Auth Supabase réussie:', authData.user.email);

      // 2️⃣ Récupérer le profil depuis le backend
      console.log('📥 Récupération profil...');
      const profileResponse = await fetch(`${config.API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authData.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.error('❌ Erreur profil:', profileResponse.status, errorText);
        throw new Error('Erreur lors de la récupération du profil');
      }

      const profileData = await profileResponse.json();
      console.log('✅ Profil reçu:', profileData);
      
      if (!profileData.success || !profileData.data?.user) {
        throw new Error('Profil utilisateur introuvable');
      }

      const userData: UserType = {
        ...profileData.data.user,
        experience: profileData.data.user.experience?.toString()
      };
      
      setUser(userData);
      toast.success(`Bienvenue ${userData.first_name || userData.email}`);

      // Vérification statut expert si nécessaire
      if (userData.type === 'expert') {
        try {
          const { get } = await import('@/lib/api');
          const approvalResponse = await get('/experts/approval-status');
          
          if (approvalResponse.success && approvalResponse.data) {
            const approvalStatus = (approvalResponse.data as any).status;
            if (approvalStatus !== 'approved') {
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
      navigate(routes[userData.type] || '/dashboard/client');

    } catch (error) {
      console.error('❌ Erreur login:', error);
      toast.error(error instanceof Error ? error.message : "Erreur de connexion");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // FONCTION D'INSCRIPTION - LOGIQUE INTÉGRÉE DIRECTEMENT
  // ============================================================================
  const register = async (data: any) => {
    setIsLoading(true);
    try {
      console.log('📝 Inscription Supabase...');
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            type: data.type,
            ...data.user_metadata
          }
        }
      });

      if (error || !authData.user) {
        throw new Error(error?.message || "Erreur d'inscription");
      }

      if (!authData.session) {
        toast.success("Vérifiez votre email pour confirmer votre compte");
        return;
      }

      // Récupérer le profil si session disponible
      try {
        const profileResponse = await fetch(`${config.API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${authData.session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.success && profileData.data?.user) {
            const userData: UserType = {
              ...profileData.data.user,
              experience: profileData.data.user.experience?.toString()
            };
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('⚠️ Erreur récupération profil (non bloquant):', error);
      }

      toast.success("Inscription réussie !");
      
      const routes: Record<string, string> = {
        client: '/dashboard/client',
        expert: '/expert/dashboard',
        admin: '/admin/dashboard-optimized',
        apporteur: '/apporteur/dashboard'
      };
      navigate(routes[data.type] || '/dashboard/client');

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur d'inscription");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // FONCTION DE DÉCONNEXION - LOGIQUE INTÉGRÉE DIRECTEMENT
  // ============================================================================
  const logout = async () => {
    try {
      console.log('👋 Déconnexion...');
      await supabase.auth.signOut();
      setUser(null);
      navigate("/");
      toast.success("Déconnexion réussie !");
    } catch (error) {
      console.error('❌ Erreur logout:', error);
    }
  };

  // ============================================================================
  // INITIALISATION AU CHARGEMENT - AVEC TIMEOUT DE SÉCURITÉ
  // ============================================================================
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🚀 [use-auth] Initialisation authentification...');
      
      try {
        // Petit délai pour laisser Supabase restaurer la session
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Vérifier session avec timeout de sécurité
        const checkPromise = checkAuth(false);
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => {
            console.error('⏱️ TIMEOUT 8s sur checkAuth! Forçage fin');
            resolve(false);
          }, 8000);
        });
        
        await Promise.race([checkPromise, timeoutPromise]);
        console.log('✅ Check auth terminé');
        
      } catch (error) {
        console.error('❌ Erreur initialisation:', error);
      } finally {
        setIsLoading(false);
        console.log('✅ setIsLoading(false) - Init terminée');
      }
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // LISTENER ÉVÉNEMENTS SUPABASE
  // ============================================================================
  useEffect(() => {
    console.log('👂 Configuration listener Supabase...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Event Supabase:', event, { hasSession: !!session });
      
      switch (event) {
        case 'SIGNED_IN':
          console.log('✅ SIGNED_IN');
          await checkAuth(false);
          break;
          
        case 'SIGNED_OUT':
          console.log('👋 SIGNED_OUT');
          setUser(null);
          if (typeof window !== 'undefined' && (window as any).updatePWAManifest) {
            (window as any).updatePWAManifest('client');
            localStorage.setItem('pwa_user_type', 'client');
          }
          break;
          
        case 'TOKEN_REFRESHED':
          console.log('🔄 TOKEN_REFRESHED');
          await checkAuth(false);
          break;
          
        case 'USER_UPDATED':
          console.log('👤 USER_UPDATED');
          await checkAuth(false);
          break;
      }
    });

    return () => {
      console.log('🧹 Cleanup listener Supabase');
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
