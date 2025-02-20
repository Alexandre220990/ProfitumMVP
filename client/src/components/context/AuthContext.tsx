import { createContext, useState, useEffect } from "react";
import { UseMutationResult } from "@tanstack/react-query";

// Définition du type du contexte d'authentification
interface User {
  email: string;
  type: string;
  id: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginMutation: UseMutationResult<
    { email: string; type: string; id: string }, 
    Error, 
    { email: string; password: string }, 
    unknown
  >;
  registerMutation: UseMutationResult<any, Error, any, unknown>;
  logout: () => void;
}

// Création du contexte
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  loginMutation: {} as any,
  registerMutation: {} as any,
  logout: () => {},
});

// ✅ Fournisseur du contexte d'authentification
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Charger l'utilisateur depuis localStorage au démarrage (sans rediriger)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // ✅ Mutation de connexion
  const loginMutation = {
    mutateAsync: async ({ email, password }: { email: string; password: string }) => {
      // Simulation d'une API (à remplacer par ton vrai appel)
      const response = await new Promise<{ success: boolean; data?: User }>((resolve) =>
        setTimeout(() => {
          if (email === "test@profitum.com" && password === "password") {
            resolve({ success: true, data: { email, type: "partner", id: "123" } });
          } else {
            resolve({ success: false });
          }
        }, 1000)
      );

      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data)); // ✅ Stocke l'utilisateur après connexion
        return response.data;
      } else {
        throw new Error("Identifiants invalides");
      }
    },
  } as UseMutationResult<{ email: string; type: string; id: string }, Error, { email: string; password: string }, unknown>;

  // ✅ Fonction de déconnexion
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginMutation, registerMutation: {} as any, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
