import { useParams, Navigate } from "react-router-dom";
import { useClient } from "@/contexts/ClientContext";
import { useMemo } from "react";
import MessagerieClient from '../../messagerie-client';

export default function ConversationPage() {
  const { id: conversationId } = useParams();
  const { conversations, loading } = useClient();

  // Mémoriser la recherche de conversation
  const conversation = useMemo(() => {
    if (!conversationId || !conversations) return null;
    return conversations.find(conv => conv.id === conversationId);
  }, [conversationId, conversations]);

  // Gestion du loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Chargement de la conversation...</span>
      </div>
    );
  }

  // Redirection si conversation non trouvée
  if (!conversation) {
    return <Navigate to="/messagerie-client" replace />;
  }

  // Rediriger vers la page principale avec la conversation sélectionnée
  return <MessagerieClient />;
} 