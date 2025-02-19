console.log("Rendering useAuth hook");

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, UseMutationResult } from "@tanstack/react-query";

// Définition du type du contexte d'authentification
interface UserType {
  email: string;
  type: string;
  id?: string; // Ajout de l'ID pour la redirection client
  username: string; // ✅ Ajout du champ username
}

interface AuthContextType {
  user: UserType | null;
  isLoading: boolean;
  loginMutation: UseMutationResult<UserType, Error, { email: string; password: string }, unknown>;
  registerMutation: UseMutationResult<UserType, Error, { email: string; password: string; username: string }, unknown>;
  logout: () => void;
}

interface RegisterResponse {
  success: boolean;
  userId: string;
  message?: string;
}

// **Création du contexte avec une valeur par défaut**
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

// **AuthProvider : Composant fournisseur du contexte**
export function AuthProvider({ children }: AuthProviderProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<UserType | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Sauvegarde de l'utilisateur dans le localStorage à chaque mise à jour
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // **Redirection dynamique selon le type et l'ID**
  const redirectUser = (user: UserType) => {
    if (user.type === "client" && user.id) {
      setLocation(`/dashboard/client/${user.id}`);
    } else if (user.type === "partner") {
      setLocation("/dashboard/partner");
    } else if (user.type === "admin") {
      setLocation("/admin");
    } else {
      setLocation("/dashboard");
    }
  };

  // **Mutation pour la connexion**
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      console.log("Attempting login with:", email);
      const storedUser = JSON.parse(localStorage.getItem("fakeUser") || "null");

      if (storedUser && storedUser.email === email && storedUser.password === password) {
        return { 
          email, 
          type: storedUser.type || "client", 
          id: storedUser.id || "123",
          username: storedUser.username || email.split("@")[0] // ✅ Définit un username par défaut
        };
      }

      // Vérification des comptes tests
      const testUsers = [
        { email: "alex@gmail.com", password: "Profitum", type: "client", id: "42", username: "Alex" },
        { email: "partenaire@gmail.com", password: "partenaire", type: "partner", username: "Partenaire" }
      ];

      const testUser = testUsers.find(u => u.email === email && u.password === password);
      if (testUser) {
        return { 
          email: testUser.email, 
          type: testUser.type, 
          id: testUser.id, 
          username: testUser.username 
        };
      }

      throw new Error("Email ou mot de passe incorrect");
    },
    onSuccess: (data) => {
      setUser(data);
      toast({ title: "Connexion réussie", description: `Bienvenue ${data.username} !` });
      redirectUser(data);
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // **Mutation pour l'inscription**
  const registerMutation = useMutation({
    mutationFn: async ({ email, password, username }: { email: string; password: string; username: string }) => {
      console.log("Registering new user:", email);
      const newUser = { 
        email, 
        type: "client", 
        id: "99", // ID fictif
        username // ✅ Ajout du username
      };
      localStorage.setItem("fakeUser", JSON.stringify({ ...newUser, password }));
      return newUser;
    },
    onSuccess: (data) => {
      setUser(data);
      toast({ title: "Inscription réussie", description: `Bienvenue ${data.username} !` });
      redirectUser(data);
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const isLoading = loginMutation.isPending || registerMutation.isPending;
  
  // **Fonction de déconnexion**
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
      isLoading, // ✅ Correction : `isLoading` bien défini
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// **Hook `useAuth` pour accéder au contexte**
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
