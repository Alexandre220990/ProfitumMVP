import { useParams, Navigate } from "react-router-dom";
import { useClient } from "@/contexts/ClientContext";
import { useMemo } from "react";
import MessagerieClient from '../../messagerie-client';
import LoadingScreen from '@/components/LoadingScreen';

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
    return <LoadingScreen />;
  }

  // Redirection si conversation non trouvée
  if (!conversation) {
    return <Navigate to="/messagerie-client" replace />;
  }

  // Rediriger vers la page principale avec la conversation sélectionnée
  return <MessagerieClient />;
} 