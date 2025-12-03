import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { loginWithSupabase, registerWithSupabase, logoutFromSupabase, checkSupabaseAuth } from '@/lib/supabase-auth';
import { loginClient, loginExpert, loginApporteur } from '@/lib/auth-distinct';
import { UserType, LoginCredentials } from '@/types/api';
import { supabase } from '@/lib/supabase';
import { useSessionRefresh } from './use-session-refresh';

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
  
  // Utiliser le hook de refresh de session
  useSessionRefresh();

  const checkAuth = async (shouldNavigate: boolean = true): Promise<boolean> => {
    try {
      console.log('🔍 Vérification de l\'authentification avec Supabase...');
      
      const response = await checkSupabaseAuth();
      
      if (!response.success || !response.data) {
        console.log('❌ Authentification échouée:', response.message);
        setUser(null);
        return false;
      }

      const { user } = response.data;
      
      // Convertir AuthUser vers UserType
      const userData: UserType = {
        ...user,
        experience: user.experience?.toString()
      };
      
      setUser(userData);
      console.log('✅ Utilisateur authentifié:', user.email, user.type);
      
      // Mettre à jour le manifest PWA selon le type d'utilisateur
      if (typeof window !== 'undefined' && (window as any).updatePWAManifest) {
        (window as any).updatePWAManifest(user.type);
        // Stocker le type d'utilisateur dans localStorage pour l'installation PWA
        localStorage.setItem('pwa_user_type', user.type);
      }
      
      // Rediriger vers le dashboard approprié selon le type d'utilisateur (seulement si demandé)
      if (shouldNavigate) {
        console.log('🔀 Redirection utilisateur (checkAuth):', { type: user.type, email: user.email });
        if (user.type === 'client') {
          console.log('➡️ Redirection vers dashboard client');
          navigate('/dashboard/client');
        } else if (user.type === 'expert') {
          console.log('➡️ Redirection vers dashboard expert');
          navigate('/expert/dashboard');
        } else if (user.type === 'admin') {
          console.log('➡️ Redirection vers dashboard admin optimisé');
          navigate("/admin/dashboard-optimized");
        } else if (user.type === 'apporteur') {
          console.log('➡️ Redirection vers dashboard apporteur');
          navigate('/apporteur/dashboard');
        } else {
          console.warn('⚠️ Type utilisateur non reconnu:', user.type);
          console.log('➡️ Redirection par défaut vers dashboard client');
          navigate('/dashboard/client');
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de l\'authentification:', error);
      setUser(null);
      return false; 
    }
  };

  const login = async (credentials: LoginCredentials) => {
    console.log('🎯 [use-auth] login() appelé avec:', { email: credentials.email, type: credentials.type });
    setIsLoading(true);
    try {
      console.log('🔐 [use-auth] Tentative de connexion avec services distincts...');
      
      // Supabase gère automatiquement le nettoyage de session
      
      // Utiliser la fonction d'authentification appropriée selon le type
      let response;
      if (credentials.type === 'client') {
        console.log('→ [use-auth] Route CLIENT');
        response = await loginClient(credentials);
      } else if (credentials.type === 'expert') {
        console.log('→ [use-auth] Route EXPERT');
        response = await loginExpert(credentials);
      } else if (credentials.type === 'apporteur') {
        console.log('→ [use-auth] Route APPORTEUR');
        response = await loginApporteur(credentials);
      } else if (credentials.type === 'admin') {
        console.log('→ [use-auth] Route ADMIN, import loginAdmin...');
        const { loginAdmin } = await import('@/lib/auth-distinct');
        console.log('→ [use-auth] loginAdmin importé, appel en cours...');
        response = await loginAdmin(credentials);
        console.log('→ [use-auth] loginAdmin terminé, response:', response);
      } else {
        console.log('→ [use-auth] Route FALLBACK');
        // Fallback vers l'ancienne méthode pour compatibilité
        response = await loginWithSupabase(credentials);
      }
      
      console.log('📥 Réponse authentification reçue:', { 
        success: response.success, 
        hasData: !!response.data,
        hasUser: !!response.data?.user
      });

      if (!response.success || !response.data) {
        console.error('❌ Échec authentification:', response);
        throw new Error(response.message || "Erreur de connexion");
      }

      const { user } = response.data;
      console.log('👤 Données utilisateur:', { 
        email: user?.email, 
        type: user?.type,
        id: user?.id,
        database_id: user?.database_id
      });

      // ✅ Supabase gère automatiquement le stockage du token (session persistante)
      
      // Convertir AuthUser vers UserType
      const userData: UserType = {
        ...user,
        experience: user.experience?.toString()
      };
      
      console.log('💾 Mise à jour du state user...');
      setUser(userData);
      console.log('✅ State user mis à jour');

      toast.success(`Connexion réussie ! Bienvenue ${user.first_name || user.email}`);

      // Rediriger vers le dashboard approprié selon le type d'utilisateur
      console.log('🔀 Redirection utilisateur (login):', { type: user.type, email: user.email });
      if (user.type === 'client') {
        console.log('➡️ Redirection vers dashboard client');
        navigate('/dashboard/client');
      } else if (user.type === 'expert') {
        // Vérifier le statut d'approbation de l'expert
        try {
          const { get } = await import('@/lib/api');
          const approvalResponse = await get('/experts/approval-status');
          
          if (approvalResponse.success && approvalResponse.data) {
            const approvalStatus = (approvalResponse.data as any).status;
            if (approvalStatus !== 'approved') {
              console.log('⚠️ Expert non approuvé, redirection vers page pending-approval');
              navigate('/expert-pending-approval');
              return;
            }
          }
        } catch (error) {
          console.error('⚠️ Erreur vérification statut approbation (non bloquant):', error);
          // En cas d'erreur, on continue vers le dashboard
        }
        
        console.log('➡️ Redirection vers dashboard expert');
        navigate('/expert/dashboard');
      } else if (user.type === 'admin') {
        console.log('➡️ Redirection vers dashboard admin optimisé');
        navigate("/admin/dashboard-optimized");
      } else if (user.type === 'apporteur') {
        console.log('➡️ Redirection vers dashboard apporteur');
        navigate('/apporteur/dashboard');
      } else {
        console.warn('⚠️ Type utilisateur non reconnu:', user.type);
        console.log('➡️ Redirection par défaut vers dashboard client');
        navigate('/dashboard/client'); // Redirection par défaut vers client
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur de connexion");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      console.log('📝 Tentative d\'inscription avec Supabase...');
      const response = await registerWithSupabase(data);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || "Erreur d'inscription");
      }

      const { user } = response.data;

      // ✅ Supabase gère automatiquement le stockage du token (session persistante)
      
      // Convertir AuthUser vers UserType
      const userData: UserType = {
        ...user,
        experience: user.experience?.toString()
      };
      setUser(userData);

      toast.success(response.message || "Inscription réussie ! Votre compte a été créé avec succès");

      // Rediriger vers le dashboard approprié selon le type d'utilisateur
      console.log('🔀 Redirection utilisateur (register):', { type: user.type, email: user.email });
      if (user.type === 'client') {
        console.log('➡️ Redirection vers dashboard client');
        navigate('/dashboard/client');
      } else if (user.type === 'expert') {
        console.log('➡️ Redirection vers dashboard expert');
        navigate('/expert/dashboard');
      } else if (user.type === 'admin') {
        console.log('➡️ Redirection vers dashboard admin optimisé');
        navigate("/admin/dashboard-optimized");
      } else {
        console.warn('⚠️ Type utilisateur non reconnu:', user.type);
        console.log('➡️ Redirection par défaut vers dashboard client');
        navigate('/dashboard/client'); // Redirection par défaut vers client
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur d'inscription");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutFromSupabase();
      // ✅ Supabase gère automatiquement le nettoyage de session et des tokens
      
      setUser(null);
      navigate("/");
      toast.success("Déconnexion réussie ! Vous avez été déconnecté");
    } catch (error) {
      console.error('Erreur lors de la déconnexion: ', error);
    }
  };

  // Vérifier l'authentification au chargement de l'application
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🚀 Initialisation de l\'authentification...');
      
      // Attendre un peu pour laisser Supabase restaurer la session depuis localStorage
      // Supabase le fait automatiquement avec persistSession: true, mais il faut un peu de temps
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Supabase restaure automatiquement la session depuis localStorage
      // Vérifier simplement si elle existe
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('✅ Session Supabase trouvée au démarrage:', {
            userId: session.user?.id,
            email: session.user?.email,
            expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'
          });
        } else {
          console.log('⚠️ Aucune session Supabase trouvée au démarrage');
        }
      } catch (error) {
        console.error('❌ Erreur lors de la vérification de session au démarrage:', error);
      }
      
      // Ne pas naviguer automatiquement lors de l'initialisation pour éviter les boucles
      await checkAuth(false);
      setIsLoading(false);
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Écouter les changements d'état d'authentification Supabase
  useEffect(() => {
    console.log('👂 Configuration du listener onAuthStateChange...');
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Événement auth Supabase:', event, {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email
      });

      switch (event) {
        case 'SIGNED_IN':
          console.log('✅ Utilisateur connecté via onAuthStateChange');
          // Supabase gère automatiquement le stockage de session
          // Vérifier l'authentification pour mettre à jour l'état utilisateur
          await checkAuth(false);
          break;

        case 'SIGNED_OUT':
          console.log('👋 Utilisateur déconnecté via onAuthStateChange');
          setUser(null);
          // Supabase gère automatiquement le nettoyage de session
          // Réinitialiser le manifest PWA à "client" par défaut
          if (typeof window !== 'undefined' && (window as any).updatePWAManifest) {
            (window as any).updatePWAManifest('client');
            localStorage.setItem('pwa_user_type', 'client');
          }
          break;

        case 'TOKEN_REFRESHED':
          console.log('🔄 Token rafraîchi via onAuthStateChange');
          // Supabase met automatiquement à jour le token dans localStorage
          console.log('✅ Token automatiquement mis à jour par Supabase');
          // Vérifier l'authentification pour s'assurer que l'utilisateur est toujours valide
          await checkAuth(false);
          break;

        case 'USER_UPDATED':
          console.log('👤 Utilisateur mis à jour via onAuthStateChange');
          // Vérifier l'authentification pour mettre à jour les données utilisateur
          await checkAuth(false);
          break;

        case 'PASSWORD_RECOVERY':
          console.log('🔑 Récupération de mot de passe');
          // Pas besoin de faire quoi que ce soit ici
          break;

        default:
          console.log('ℹ️ Événement auth non géré:', event);
      }
    });

    // Cleanup
    return () => {
      console.log('🧹 Nettoyage du listener onAuthStateChange');
      subscription.unsubscribe();
    };
  }, []);

  // Mettre à jour le manifest PWA quand l'utilisateur change
  useEffect(() => {
    if (user?.type && typeof window !== 'undefined') {
      // Mettre à jour le manifest selon le type d'utilisateur
      if ((window as any).updatePWAManifest) {
        (window as any).updatePWAManifest(user.type);
        localStorage.setItem('pwa_user_type', user.type);
        console.log('✅ Manifest PWA mis à jour pour type:', user.type);
      }
    } else if (!user && typeof window !== 'undefined') {
      // Si pas d'utilisateur, utiliser "client" par défaut
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
