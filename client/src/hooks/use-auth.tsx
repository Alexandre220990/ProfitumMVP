import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: { email: string } | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<{ email: string } | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const login = async ({ email, password }: { email: string; password: string }) => {
    console.log("Attempting login with:", email);
    const storedUser = JSON.parse(localStorage.getItem("fakeUser") || "null");

    if (storedUser && storedUser.email === email && storedUser.password === password) {
      setUser({ email });
      setLocation("/dashboard/client");
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur votre espace client",
      });
    } else {
      throw new Error("Email ou mot de passe incorrect");
    }
  };

  const register = async ({ email, password }: { email: string; password: string }) => {
    console.log("Registering new user:", email);
    localStorage.setItem("fakeUser", JSON.stringify({ email, password }));
    setUser({ email });
    setLocation("/dashboard/client");
    toast({
      title: "Inscription réussie",
      description: "Bienvenue sur votre espace client",
    });
  };

  const logout = () => {
    setUser(null);
    setLocation("/");
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt !",
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
