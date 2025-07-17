import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { post } from "../lib/api";
import { AuthUser } from "../types/auth";
import { AuthData } from "../types/api";
import { redirectToDashboard } from "../lib/navigation";

// Contexte
interface AuthContextType { user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  checkTokenAndAuth: () => Promise<void>; }

const AuthContext = createContext<AuthContextType | null>(null);

// Hook
export const useAuth = (): AuthContextType => { const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  return context; };

// Provider
export const AuthProvider = ({ children }: { children: ReactNode }) => { const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const checkTokenAndAuth = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setIsLoading(false);
      return; }

    try { const headers = { Authorization: `Bearer ${storedToken }` };
      const response = await post<AuthData>('/api/auth/check', { headers });

      if (response.success && response.data) { setToken(response.data.token);
        setUser(response.data.user); } else { logout(); }
    } catch (error) { console.error('Erreur lors de la vérification du token: ', error);
      logout(); } finally { setIsLoading(false); }
  };

  useEffect(() => { checkTokenAndAuth(); }, []);

  const login = async (email: string, password: string) => { try {
      const response = await post<AuthData>('/auth/login', { email, password });
      if (response.data?.token && response.data?.user) { setToken(response.data.token);
        setUser(response.data.user);
        localStorage.setItem('token', response.data.token);
        const redirectPath = redirectToDashboard(response.data.user);
        navigate(redirectPath);
        toast.success('Connexion réussie'); } else { toast.error('Données de connexion invalides'); }
    } catch (error) { console.error('Erreur de connexion: ', error);
      toast.error('Erreur lors de la connexion'); }
  };

  const register = async (userData: any) => { try {
      const response = await post<AuthData>('/auth/register', userData);
      if (response.data?.token && response.data?.user) {
        setToken(response.data.token);
        setUser(response.data.user);
        localStorage.setItem('token', response.data.token);
        const redirectPath = redirectToDashboard(response.data.user);
        navigate(redirectPath);
        toast.success('Inscription réussie'); } else { toast.error('Données d\'inscription invalides'); }
    } catch (error) { console.error('Erreur d\'inscription: ', error);
      toast.error('Erreur lors de l\'inscription'); }
  };

  const logout = () => { setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    navigate('/login'); };

  return (
    <AuthContext.Provider
      value={ {
        user, token, isAuthenticated: !!user, isLoading, login, register, logout, checkTokenAndAuth }}
    >
      { children }
    </AuthContext.Provider>
  );
};
