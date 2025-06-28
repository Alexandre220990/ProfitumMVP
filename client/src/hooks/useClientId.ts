import { useParams } from "react-router-dom";
import { useAuth } from "./use-auth";

export function useClientId(): string | null {
  const { id } = useParams();
  const { user } = useAuth();
  
  const redirectedId = localStorage.getItem('redirect_client_id');
  const sessionId = sessionStorage.getItem('current_client_uuid');

  // Si c'est un client, forcer l'usage de son propre ID
  if (user?.type === 'client') {
    return user?.id || null;
  }

  // Si c'est un expert, autoriser les redirections
  return sessionId || redirectedId || id || user?.id || null;
} 