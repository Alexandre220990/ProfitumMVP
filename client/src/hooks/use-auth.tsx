import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, UseMutationResult } from "@tanstack/react-query";

interface UserType {
  id: string | number;
  email: string;
  type: string;
  username: string;
}

interface AuthContextType {
  user: UserType | null;
  isLoading: boolean;
  loginMutation: UseMutationResult<UserType, Error, { email: string; password: string }, unknown>;
  registerMutation: UseMutationResult<UserType, Error, { email: string; password: string; username: string }, unknown>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  loginMutation: {} as any,
  registerMutation: {} as any,
  logout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<UserType | null>(() => {
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

  const redirectUser = (user: UserType) => {
    if (user.type === "partner") {
      setLocation(`/dashboard/partner/${user.id}`);
    } else if (user.type === "client") {
      setLocation(`/dashboard/client/${user.id}`);
    }
  };

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      console.log("Attempting login with:", email);
      const storedUser = JSON.parse(localStorage.getItem("fakeUser") || "null");

      if (storedUser && storedUser.email === email && storedUser.password === password) {
        return storedUser;
      }

      const testUsers = [
        { id: 1, email: "alex@gmail.com", password: "Profitum", type: "client", username: "Alex" },
        { id: 2, email: "partenaire@gmail.com", password: "partenaire", type: "partner", username: "Partenaire" }
      ];

      const testUser = testUsers.find(u => u.email === email && u.password === password);
      if (testUser) {
        return testUser;
      }

      throw new Error("Email ou mot de passe incorrect");
    },
    onSuccess: (data) => {
      setUser(data);
      toast({ 
        title: "Connexion réussie", 
        description: `Bienvenue ${data.username} !` 
      });
      redirectUser(data);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erreur", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, username }: { email: string; password: string; username: string }) => {
      const newUser = {
        id: Date.now(),
        email,
        type: "client",
        username
      };
      localStorage.setItem("fakeUser", JSON.stringify({ ...newUser, password }));
      return newUser;
    },
    onSuccess: (data) => {
      setUser(data);
      toast({ 
        title: "Inscription réussie", 
        description: `Bienvenue ${data.username} !` 
      });
      redirectUser(data);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erreur", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  const logout = () => {
    setUser(null);
    setLocation("/");
    toast({ title: "Déconnexion réussie", description: "À bientôt !" });
  };

  return (
    <AuthContext.Provider value={{
      user,
      loginMutation,
      registerMutation,
      logout,
      isLoading,
    }}>
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