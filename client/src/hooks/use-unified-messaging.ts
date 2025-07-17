import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'client' | 'expert' | 'admin';
  content: string;
  message_type: string;
  attachments?: FileAttachment[];
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

interface FileAttachment {
  id: string;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  description?: string;
}

interface Conversation {
  id: string;
  type: string;
  participant_ids: string[];
  title?: string;
  description?: string;
  status: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
  participants?: Participant[];
  lastMessage?: Message;
  unreadCount?: number;
}

interface Participant {
  id: string;
  name: string;
  type: string;
  company?: string;
  avatar?: string | null;
}

interface UseUnifiedMessagingOptions {
  conversationType?: 'expert_client' | 'admin_support';
  autoLoad?: boolean;
  realTime?: boolean;
}

export const useUnifiedMessaging = (options: UseUnifiedMessagingOptions = {}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Charger les conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/unified-messaging/conversations', {
        params: { 
          type: options.conversationType,
          limit: 50 
        }
      });

      if (response.data.success) {
        setConversations(response.data.data.conversations);
        
        // Sélectionner la première conversation si aucune n'est sélectionnée
        if (!selectedConversation && response.data.data.conversations.length > 0) {
          setSelectedConversation(response.data.data.conversations[0]);
        }
      }
    } catch (err) {
      console.error('❌ Erreur chargement conversations:', err);
      setError('Impossible de charger les conversations');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les conversations'
      });
    } finally {
      setLoading(false);
    }
  }, [options.conversationType, selectedConversation]);

  // Charger les messages d'une conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/unified-messaging/conversations/${conversationId}/messages`);
      
      if (response.data.success) {
        setMessages(response.data.data.messages);
      }
    } catch (err) {
      console.error('❌ Erreur chargement messages:', err);
      setError('Impossible de charger les messages');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les messages'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Envoyer un message
  const sendMessage = useCallback(async (
    conversationId: string, 
    content: string, 
    files: File[] = []
  ) => {
    try {
      setSending(true);
      setError(null);

      const formData = new FormData();
      formData.append('content', content);
      formData.append('message_type', files.length > 0 ? 'file' : 'text');

      // Ajouter les fichiers
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await api.post(
        `/unified-messaging/conversations/${conversationId}/messages`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        const newMessage = response.data.data;
        setMessages(prev => [...prev, newMessage]);
        
        // Mettre à jour la conversation avec le dernier message
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, lastMessage: newMessage, last_message_at: newMessage.created_at }
            : conv
        ));

        return newMessage;
      }
    } catch (err) {
      console.error('❌ Erreur envoi message:', err);
      setError('Impossible d\'envoyer le message');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'envoyer le message'
      });
      throw err;
    } finally {
      setSending(false);
    }
  }, []);

  // Créer une nouvelle conversation
  const createConversation = useCallback(async (
    type: string,
    participantIds: string[],
    title?: string,
    description?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/unified-messaging/conversations', {
        type,
        participant_ids: participantIds,
        title,
        description
      });

      if (response.data.success) {
        const newConversation = response.data.data;
        setConversations(prev => [newConversation, ...prev]);
        setSelectedConversation(newConversation);
        return newConversation;
      }
    } catch (err) {
      console.error('❌ Erreur création conversation:', err);
      setError('Impossible de créer la conversation');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer la conversation'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sélectionner une conversation
  const selectConversation = useCallback(async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await loadMessages(conversation.id);
  }, [loadMessages]);

  // Marquer les messages comme lus
  const markAsRead = useCallback(async (messageIds: string[]) => {
    try {
      await Promise.all(
        messageIds.map(id => 
          api.put(`/unified-messaging/messages/${id}/read`)
        )
      );
      
      setMessages(prev => prev.map(msg => 
        messageIds.includes(msg.id) 
          ? { ...msg, is_read: true, read_at: new Date().toISOString() }
          : msg
      ));
    } catch (err) {
      console.error('❌ Erreur marquage lu:', err);
    }
  }, []);

  // Télécharger un fichier
  const downloadFile = useCallback(async (fileId: string, filename: string) => {
    try {
      setUploading(true);
      
      const response = await api.get(`/unified-messaging/files/${fileId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('❌ Erreur téléchargement:', err);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de télécharger le fichier'
      });
    } finally {
      setUploading(false);
    }
  }, []);

  // Rechercher dans les conversations
  const searchConversations = useCallback(async (query: string) => {
    try {
      setLoading(true);
      
      const response = await api.get('/unified-messaging/conversations', {
        params: { 
          search: query,
          type: options.conversationType 
        }
      });

      if (response.data.success) {
        setConversations(response.data.data.conversations);
      }
    } catch (err) {
      console.error('❌ Erreur recherche:', err);
      setError('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  }, [options.conversationType]);

  // WebSocket pour temps réel
  const connectWebSocket = useCallback(() => {
    if (!options.realTime || !user) return;

    try {
      const ws = new WebSocket(`ws://[::1]:5003`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔌 WebSocket connecté');
        ws.send(JSON.stringify({
          type: 'auth',
          token: localStorage.getItem('token')
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'new_message':
            if (data.conversation_id === selectedConversation?.id) {
              setMessages(prev => [...prev, data.message]);
            }
            // Mettre à jour le compteur de conversations non lues
            setConversations(prev => prev.map(conv => 
              conv.id === data.conversation_id 
                ? { ...conv, unreadCount: (conv.unreadCount || 0) + 1 }
                : conv
            ));
            break;
            
          case 'message_read':
            setMessages(prev => prev.map(msg => 
              msg.id === data.message_id 
                ? { ...msg, is_read: true, read_at: data.read_at }
                : msg
            ));
            break;
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error);
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket déconnecté');
        // Reconnexion automatique après 5 secondes
        setTimeout(() => connectWebSocket(), 5000);
      };
    } catch (err) {
      console.error('❌ Erreur connexion WebSocket:', err);
    }
  }, [options.realTime, user, selectedConversation]);

  // Initialisation
  useEffect(() => {
    if (options.autoLoad) {
      loadConversations();
    }
  }, [loadConversations, options.autoLoad]);

  // WebSocket
  useEffect(() => {
    if (options.realTime) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket, options.realTime]);

  return {
    // État
    conversations,
    selectedConversation,
    messages,
    loading,
    sending,
    uploading,
    error,
    
    // Actions
    loadConversations,
    loadMessages,
    sendMessage,
    createConversation,
    selectConversation,
    markAsRead,
    downloadFile,
    searchConversations,
    
    // Utilitaires
    clearError: () => setError(null)
  };
}; 