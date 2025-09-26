import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/toast-notifications';
import { loginWithSupabase, registerWithSupabase, logoutFromSupabase, checkSupabaseAuth } from '@/lib/supabase-auth';
import { UserType, LoginCredentials } from '@/types/api';

interface AuthContextType {
  user: UserType | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  setUser: (user: UserType | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const checkAuth = async (): Promise<boolean> => {
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
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de l\'authentification:', error);
      setUser(null);
      return false; 
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      console.log('🔐 Tentative de connexion avec Supabase...');
      const response = await loginWithSupabase(credentials);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || "Erreur de connexion");
      }

      const { token, user } = response.data;

      // Stocker le token pour compatibilité (optionnel)
      if (token) {
        localStorage.setItem("token", token);
      }
      
      // Convertir AuthUser vers UserType
      const userData: UserType = {
        ...user,
        experience: user.experience?.toString()
      };
      setUser(userData);

      addToast({
        type: 'success',
        title: "Connexion réussie",
        message: `Bienvenue ${user.username || user.email}`,
        duration: 3000
      });

      // Rediriger vers le dashboard approprié selon le type d'utilisateur
      console.log('🔀 Redirection utilisateur (login):', { type: user.type, email: user.email });
      if (user.type === 'client') {
        console.log('➡️ Redirection vers dashboard client');
        navigate('/dashboard/client');
      } else if (user.type === 'expert') {
        console.log('➡️ Redirection vers dashboard expert');
        navigate('/expert/dashboard');
      } else if (user.type === 'admin') {
        console.log('➡️ Redirection vers dashboard admin optimisé');
        navigate("/admin/dashboard-optimized");
      } else if (user.type === 'apporteur_affaires') {
        console.log('➡️ Redirection vers dashboard apporteur');
        navigate('/apporteur/dashboard');
      } else {
        console.warn('⚠️ Type utilisateur non reconnu:', user.type);
        console.log('➡️ Redirection par défaut vers dashboard client');
        navigate('/dashboard/client'); // Redirection par défaut vers client
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: "Erreur",
        message: error instanceof Error ? error.message : "Erreur de connexion",
        duration: 5000
      });
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

      const { token, user } = response.data;

      // Stocker le token pour compatibilité (optionnel)
      if (token) {
        localStorage.setItem("token", token);
      }
      
      // Convertir AuthUser vers UserType
      const userData: UserType = {
        ...user,
        experience: user.experience?.toString()
      };
      setUser(userData);

      addToast({
        type: 'success',
        title: "Inscription réussie",
        message: response.message || "Votre compte a été créé avec succès",
        duration: 3000
      });

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
      addToast({
        type: 'error',
        title: "Erreur",
        message: error instanceof Error ? error.message : "Erreur d'inscription",
        duration: 5000
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutFromSupabase();
      // Nettoyer tous les tokens
      localStorage.removeItem("token");
      localStorage.removeItem("supabase_token");
      localStorage.removeItem("supabase_refresh_token");
      setUser(null);
      navigate("/");
      addToast({
        type: 'success',
        title: "Déconnexion",
        message: "Vous avez été déconnecté",
        duration: 3000
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion: ', error);
    }
  };

  // Vérifier l'authentification au chargement de l'application
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🚀 Initialisation de l\'authentification...');
      await checkAuth();
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

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
