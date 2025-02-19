import { createContext } from "react";
import { UseMutationResult } from "@tanstack/react-query";

// Définition du type du contexte d'authentification
interface AuthContextType {
  user: { email: string; type: string } | null;
  isLoading: boolean;
  loginMutation: UseMutationResult<
    { email: string; type: string }, 
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
  logout: () => {} 
});
