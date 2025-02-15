import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type User as SelectUser, type InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: LoginMutation;
  logoutMutation: LogoutMutation;
  registerMutation: RegisterMutation;
};

type LoginData = {
  email: string;
  password: string;
};

type LoginMutation = ReturnType<typeof useMutation<SelectUser, Error, LoginData>>;
type LogoutMutation = ReturnType<typeof useMutation<void, Error, void>>;
type RegisterMutation = ReturnType<typeof useMutation<SelectUser, Error, InsertUser>>;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("Attempting login with:", credentials.email);
      const res = await apiRequest("POST", "/api/login", credentials);

      if (!res.ok) {
        const error = await res.text();
        console.error("Login failed:", error);
        throw new Error(error);
      }

      const userData = await res.json();
      console.log("Login successful, received user data:", userData);
      return userData;
    },
    onSuccess: (user: SelectUser) => {
      console.log("Login mutation success, redirecting user:", user);
      queryClient.setQueryData(["/api/user"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });

      setLocation("/dashboard/client");
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur votre espace client",
      });
    },
    onError: (error: Error) => {
      console.error("Login mutation error:", error);
      toast({
        title: "Échec de la connexion",
        description: error.message || "Identifiants invalides",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      console.log("Attempting registration with:", { ...data, password: "[HIDDEN]" });
      const res = await apiRequest("POST", "/api/register", data);

      if (!res.ok) {
        const error = await res.text();
        console.error("Registration failed:", error);
        throw new Error(error);
      }

      const userData = await res.json();
      console.log("Registration successful, received user data:", userData);
      return userData;
    },
    onSuccess: (user: SelectUser) => {
      console.log("Registration mutation success, redirecting user:", user);
      queryClient.setQueryData(["/api/user"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });

      setLocation("/dashboard/client");
      toast({
        title: "Inscription réussie",
        description: "Bienvenue sur votre espace client",
      });
    },
    onError: (error: Error) => {
      console.error("Registration mutation error:", error);
      toast({
        title: "Échec de l'inscription",
        description: error.message || "Une erreur est survenue lors de l'inscription",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Attempting logout");
      const res = await apiRequest("POST", "/api/logout");
      if (!res.ok) {
        const error = await res.text();
        console.error("Logout failed:", error);
        throw new Error(error);
      }
    },
    onSuccess: () => {
      console.log("Logout successful");
      queryClient.setQueryData(["/api/user"], null);
      setLocation("/");
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    },
    onError: (error: Error) => {
      console.error("Logout mutation error:", error);
      toast({
        title: "Échec de la déconnexion",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
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