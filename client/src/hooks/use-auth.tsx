import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

interface AuthContextType {
  user: { email: string; type: string } | null;
  loginMutation: any;
  registerMutation: any;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<{ email: string; type: string } | null>(() => {
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

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      console.log("Attempting login with:", email);
      const storedUser = JSON.parse(localStorage.getItem("fakeUser") || "null");

      if (storedUser && storedUser.email === email && storedUser.password === password) {
        return { email, type: storedUser.type || "client" };
      }

      // Check against test users from storage.ts
      const testUsers = [
        {
          email: "alex@gmail.com",
          password: "Profitum",
          type: "client"
        },
        {
          email: "partenaire@gmail.com",
          password: "partenaire",
          type: "partner"
        }
      ];

      const testUser = testUsers.find(u => u.email === email && u.password === password);
      if (testUser) {
        return { email: testUser.email, type: testUser.type };
      }

      throw new Error("Email ou mot de passe incorrect");
    },
    onSuccess: (data) => {
      setUser(data);
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur votre espace",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Registering new user:", data.email);
      localStorage.setItem("fakeUser", JSON.stringify({ ...data, type: "client" }));
      return { email: data.email, type: "client" };
    },
    onSuccess: (data) => {
      setUser(data);
      toast({
        title: "Inscription réussie",
        description: "Bienvenue sur votre espace",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logout = () => {
    setUser(null);
    setLocation("/");
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt !",
    });
  };

  return (
    <AuthContext.Provider value={{ user, loginMutation, registerMutation, logout }}>
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