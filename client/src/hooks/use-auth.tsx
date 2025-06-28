import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { UserType, LoginCredentials, RegisterCredentials } from "@/types/api";
import { 
  loginWithSupabase, 
  registerWithSupabase, 
  logoutFromSupabase, 
  checkSupabaseAuth 
} from "@/lib/supabase-auth";

interface AuthContextType {
  user: UserType | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterCredentials) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  setUser: (user: UserType | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async (): Promise<boolean> => {
    try {
      console.log('🔍 Vérification de l\'authentification Supabase...');
      const response = await checkSupabaseAuth();
      
      if (response.success && response.data?.user) {
        console.log('✅ Utilisateur authentifié avec Supabase:', response.data.user);
        setUser(response.data.user);
        return true;
      }
      
      console.log('❌ Aucun utilisateur authentifié');
      setUser(null);
      return false;
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
      
      setUser(user);

      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${user.name || user.email}`,
      });

      // Rediriger vers le dashboard approprié selon le type d'utilisateur
      if (user.type === 'client') {
        navigate(`/dashboard/client/${user.id}`);
      } else if (user.type === 'expert') {
        navigate(`/dashboard/expert/${user.id}`);
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur de connexion",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterCredentials) => {
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
      
      setUser(user);

      toast({
        title: "Inscription réussie",
        description: response.message || "Votre compte a été créé avec succès",
      });

      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur d'inscription",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutFromSupabase();
      localStorage.removeItem("token"); // Supprimer aussi l'ancien token
      setUser(null);
      navigate("/");
      toast({
        title: "Déconnexion",
        description: "Vous avez été déconnecté",
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        checkAuth,
        setUser,
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
