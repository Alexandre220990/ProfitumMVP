import { createContext, ReactNode, useContext, useEffect } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = {
  email: string;
  password: string;
};

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

  useEffect(() => {
    console.log("Current user state:", user);
    if (user) {
      console.log("User is logged in, type:", user.type);
    }
  }, [user]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("Attempting login with credentials:", credentials);
      const res = await apiRequest("POST", "/api/login", {
        username: credentials.email,
        password: credentials.password,
      });

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
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      console.log("Attempting registration with data:", credentials);
      const res = await apiRequest("POST", "/api/register", {
        ...credentials,
        type: "client",
      });

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
        description: error.message,
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
        user: user ?? null,
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