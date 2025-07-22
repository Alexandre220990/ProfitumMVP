import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { supabaseMessagingService, MessagingCallbacks } from '@/services/supabase-messaging';
import { 
  Message, 
  Conversation, 
  CreateConversationRequest, 
  SendMessageRequest
} from '@/types/messaging';
import { toast } from '@/hooks/use-toast';

// ============================================================================
// HOOK REACT UNIFIÉ POUR LA MESSAGERIE SUPABASE
// ============================================================================

export interface UseSupabaseMessagingOptions {
  autoConnect?: boolean;
  enableTyping?: boolean;
  enableNotifications?: boolean;
}

export interface UseSupabaseMessagingReturn {
  // État
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  isConnected: boolean;
  
  // Actions
  selectConversation: (conversation: Conversation | null) => void;
  sendMessage: (content: string, files?: File[]) => Promise<void>;
  createConversation: (request: CreateConversationRequest) => Promise<Conversation>;
  markAsRead: (messageId: string) => Promise<void>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  sendTypingIndicator: (isTyping: boolean) => void;
  
  // Utilitaires
  getUnreadCount: (conversationId: string) => number;
  getTotalUnreadCount: () => number;
  isOwnMessage: (message: Message) => boolean;
  formatTime: (timestamp: string) => string;
  getMessageStatus: (message: Message) => 'sent' | 'delivered' | 'read';
  
  // Gestion des erreurs
  clearError: () => void;
  retry: () => void;
}

export const useSupabaseMessaging = (options: UseSupabaseMessagingOptions = {}): UseSupabaseMessagingReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // État local
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  // const [typingUsers, setTypingUsers] = useState<Map<string, TypingIndicator>>(new Map());
  
  // Références
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef<MessagingCallbacks>({});

  // ========================================
  // QUERIES REACT QUERY
  // ========================================

  // Query pour les conversations
  const {
    data: conversations = [],
    isLoading: conversationsLoading,
    error: conversationsError,
    refetch: refetchConversations
  } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => supabaseMessagingService.getConversations(),
    enabled: !!user?.id && isConnected,
    staleTime: 30000, // 30 secondes
    refetchOnWindowFocus: false,
    retry: 3
  });

  // Query pour les messages de la conversation actuelle
  const {
    data: messages = [],
    isLoading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['messages', currentConversation?.id],
    queryFn: () => supabaseMessagingService.getMessages(currentConversation!.id),
    enabled: !!currentConversation?.id && isConnected,
    staleTime: 10000, // 10 secondes
    refetchOnWindowFocus: false,
    retry: 3
  });

  // ========================================
  // MUTATIONS REACT QUERY
  // ========================================

  // Mutation pour envoyer un message
  const sendMessageMutation = useMutation({
    mutationFn: (request: SendMessageRequest) => supabaseMessagingService.sendMessage(request),
    onSuccess: (newMessage) => {
      // Mettre à jour le cache des messages
      queryClient.setQueryData(
        ['messages', currentConversation?.id],
        (oldMessages: Message[] = []) => [...oldMessages, newMessage]
      );
      
      // Mettre à jour le cache des conversations
      queryClient.setQueryData(
        ['conversations', user?.id],
        (oldConversations: Conversation[] = []) => 
          oldConversations.map(conv => 
            conv.id === currentConversation?.id 
              ? { ...conv, last_message_at: newMessage.created_at }
              : conv
          )
      );
    },
    onError: (error: Error) => {
      console.error('❌ Erreur envoi message:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'envoyer le message'
      });
    }
  });

  // Mutation pour créer une conversation
  const createConversationMutation = useMutation({
    mutationFn: (request: CreateConversationRequest) => supabaseMessagingService.createConversation(request),
    onSuccess: (newConversation) => {
      // Ajouter la nouvelle conversation au cache
      queryClient.setQueryData(
        ['conversations', user?.id],
        (oldConversations: Conversation[] = []) => [newConversation, ...oldConversations]
      );
      
      // Sélectionner automatiquement la nouvelle conversation
      setCurrentConversation(newConversation);
    },
    onError: (error: Error) => {
      console.error('❌ Erreur création conversation:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer la conversation'
      });
    }
  });

  // Mutation pour marquer comme lu
  const markAsReadMutation = useMutation({
    mutationFn: (messageId: string) => supabaseMessagingService.markMessageAsRead(messageId),
    onSuccess: (_, messageId) => {
      // Mettre à jour le cache des messages
      queryClient.setQueryData(
        ['messages', currentConversation?.id],
        (oldMessages: Message[] = []) => 
          oldMessages.map(msg => 
            msg.id === messageId 
              ? { ...msg, is_read: true, read_at: new Date().toISOString() }
              : msg
          )
      );
    }
  });

  // ========================================
  // CALLBACKS SUPABASE REALTIME
  // ========================================

  const setupCallbacks = useCallback(() => {
    callbacksRef.current = {
      onNewMessage: (message: Message) => {
        // Mettre à jour le cache des messages si c'est la conversation actuelle
        if (message.conversation_id === currentConversation?.id) {
          queryClient.setQueryData(
            ['messages', currentConversation.id],
            (oldMessages: Message[] = []) => [...oldMessages, message]
          );
        }
        
        // Mettre à jour le cache des conversations
        queryClient.setQueryData(
          ['conversations', user?.id],
          (oldConversations: Conversation[] = []) => 
            oldConversations.map(conv => 
              conv.id === message.conversation_id 
                ? { ...conv, last_message_at: message.created_at }
                : conv
            )
        );
        
        // Notification si activée
        if (options.enableNotifications && message.sender_id !== user?.id) {
          toast({
            title: 'Nouveau message',
            description: message.content.length > 50 
              ? message.content.substring(0, 50) + '...' 
              : message.content
          });
        }
      },
      
      onMessageRead: (messageId: string, readAt: string) => {
        queryClient.setQueryData(
          ['messages', currentConversation?.id],
          (oldMessages: Message[] = []) => 
            oldMessages.map(msg => 
              msg.id === messageId 
                ? { ...msg, is_read: true, read_at: readAt }
                : msg
            )
        );
      },
      
      onTyping: (userId: string, isTyping: boolean) => {
        if (!options.enableTyping) return;
        
        // TODO: Implémenter la gestion des indicateurs de frappe
        console.log(`User ${userId} is ${isTyping ? 'typing' : 'not typing'}`);
      },
      
      onConversationUpdate: (conversation: Conversation) => {
        queryClient.setQueryData(
          ['conversations', user?.id],
          (oldConversations: Conversation[] = []) => 
            oldConversations.map(conv => 
              conv.id === conversation.id ? conversation : conv
            )
        );
      },
      
      onError: (error: Error) => {
        console.error('❌ Erreur Supabase Messaging:', error);
        setError(error.message);
      }
    };
    
    supabaseMessagingService.setCallbacks(callbacksRef.current);
  }, [currentConversation?.id, user?.id, queryClient, options.enableNotifications, options.enableTyping]);

  // ========================================
  // INITIALISATION ET CONNEXION
  // ========================================

  const initializeService = useCallback(async () => {
    if (!user?.id || !user?.type) return;
    
    try {
      setError(null);
      await supabaseMessagingService.initialize(user.id, user.type as 'client' | 'expert' | 'admin');
      setIsConnected(true);
      setupCallbacks();
    } catch (error) {
      console.error('❌ Erreur initialisation service:', error);
      setError('Erreur de connexion au service de messagerie');
    }
  }, [user?.id, user?.type, setupCallbacks]);

  // Initialisation automatique
  useEffect(() => {
    if (options.autoConnect !== false) {
      initializeService();
    }
    
    return () => {
      supabaseMessagingService.disconnect();
    };
  }, [initializeService, options.autoConnect]);

  // ========================================
  // ACTIONS UTILISATEUR
  // ========================================

  const selectConversation = useCallback((conversation: Conversation | null) => {
    setCurrentConversation(conversation);
    
    // Marquer la conversation comme lue
    if (conversation) {
      supabaseMessagingService.markConversationAsRead(conversation.id);
    }
  }, []);

  const sendMessage = useCallback(async (content: string, files: File[] = []) => {
    if (!currentConversation || !content.trim()) return;
    
    setSending(true);
    try {
      await sendMessageMutation.mutateAsync({
        conversation_id: currentConversation.id,
        content: content.trim(),
        message_type: files.length > 0 ? 'file' : 'text'
      });
    } finally {
      setSending(false);
    }
  }, [currentConversation, sendMessageMutation]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!currentConversation || !options.enableTyping) return;
    
    // Nettoyer le timeout précédent
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Envoyer l'indicateur
    supabaseMessagingService.sendTypingIndicator(currentConversation.id, isTyping);
    
    // Arrêter automatiquement après 3 secondes
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        supabaseMessagingService.sendTypingIndicator(currentConversation.id, false);
      }, 3000);
    }
  }, [currentConversation, options.enableTyping]);

  const markAsRead = useCallback(async (messageId: string) => {
    await markAsReadMutation.mutateAsync(messageId);
  }, [markAsReadMutation]);

  const markConversationAsRead = useCallback(async (conversationId: string) => {
    await supabaseMessagingService.markConversationAsRead(conversationId);
  }, []);

  // ========================================
  // UTILITAIRES
  // ========================================

  const getUnreadCount = useCallback((conversationId: string) => {
    return messages.filter(msg => 
      msg.conversation_id === conversationId && 
      !msg.is_read && 
      msg.sender_id !== user?.id
    ).length;
  }, [messages, user?.id]);

  const getTotalUnreadCount = useCallback(() => {
    return conversations.reduce((total, conv) => total + getUnreadCount(conv.id), 0);
  }, [conversations, getUnreadCount]);

  const isOwnMessage = useCallback((message: Message) => {
    return message.sender_id === user?.id;
  }, [user?.id]);

  const formatTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  }, []);

  const getMessageStatus = useCallback((message: Message) => {
    if (message.is_read) return 'read';
    if (message.sender_id === user?.id) return 'delivered';
    return 'sent';
  }, [user?.id]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retry = useCallback(() => {
    refetchConversations();
    if (currentConversation) {
      refetchMessages();
    }
  }, [refetchConversations, refetchMessages, currentConversation]);

  // ========================================
  // ÉTAT COMPUTÉ
  // ========================================

  const loading = conversationsLoading || messagesLoading;
  const currentError = conversationsError || messagesError || error;

  return {
    // État
    conversations,
    currentConversation,
    messages,
    loading,
    sending,
    error: typeof currentError === 'string' ? currentError : currentError?.message || error,
    isConnected,
    
    // Actions
    selectConversation,
    sendMessage,
    createConversation: createConversationMutation.mutateAsync,
    markAsRead,
    markConversationAsRead,
    sendTypingIndicator,
    
    // Utilitaires
    getUnreadCount,
    getTotalUnreadCount,
    isOwnMessage,
    formatTime,
    getMessageStatus,
    
    // Gestion des erreurs
    clearError,
    retry
  };
}; 