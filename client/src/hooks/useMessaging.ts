import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';
import { useWebSocket } from './useWebSocket';
import api from '@/lib/api';

// Types
export interface Message {
  id: string;
  assignment_id: string;
  sender_type: 'client' | 'expert' | 'admin';
  sender_id: string;
  recipient_type: 'client' | 'expert' | 'admin';
  recipient_id: string;
  content: string;
  message_type: 'text' | 'file' | 'notification' | 'system';
  attachments?: any[];
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  assignment_id: string;
  expert?: {
    id: string;
    name: string;
    email: string;
    company_name: string;
    specializations: string[];
    rating: number;
  };
  client?: {
    id: string;
    email: string;
    company_name: string;
    name: string;
    phone_number: string;
  };
  produit?: {
    id: string;
    nom: string;
    description: string;
    categorie: string;
  };
  status: string;
  assignment_date: string;
  created_at: string;
  updated_at: string;
  lastMessage?: Message | null;
  unreadCount: number;
}

export interface MessagingState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  unreadCount: number;
}

export interface UseMessagingReturn extends MessagingState {
  // Actions
  loadConversations: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  
  // WebSocket
  isConnected: boolean;
  sendTypingIndicator: (isTyping: boolean) => void;
  
  // Utilitaires
  isOwnMessage: (message: Message) => boolean;
  formatTime: (timestamp: string) => string;
  getMessageStatus: (message: Message) => 'sent' | 'delivered' | 'read';
}

export function useMessaging(assignmentId?: string): UseMessagingReturn {
  const { user } = useAuth();
  const { isConnected, sendMessage: wsSendMessage, lastMessage } = useWebSocket();
  
  // État local
  const [state, setState] = useState<MessagingState>({
    conversations: [],
    currentConversation: null,
    messages: [],
    loading: false,
    sending: false,
    error: null,
    unreadCount: 0
  });

  // Références
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentPageRef = useRef(1);
  const hasMoreMessagesRef = useRef(true);

  // ========================================
  // ACTIONS PRINCIPALES
  // ========================================

  // Charger les conversations
  const loadConversations = useCallback(async () => {
    if (!user?.id) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await api.get('/messaging/conversations');
      
      if (response.data.success) {
        setState(prev => ({
          ...prev,
          conversations: response.data.data.conversations || [],
          loading: false
        }));

        // Calculer le nombre total de messages non lus
        const totalUnread = response.data.data.conversations.reduce(
          (sum: number, conv: Conversation) => sum + conv.unreadCount, 0
        );
        
        setState(prev => ({ ...prev, unreadCount: totalUnread }));
      } else {
        throw new Error(response.data.message || 'Erreur lors du chargement des conversations');
      }
    } catch (error) {
      console.error('❌ Erreur chargement conversations:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Impossible de charger les conversations'
      }));
    }
  }, [user?.id]);

  // Sélectionner une conversation
  const selectConversation = useCallback(async (conversationId: string) => {
    const conversation = state.conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    setState(prev => ({ 
      ...prev, 
      currentConversation: conversation,
      messages: [],
      error: null 
    }));

    currentPageRef.current = 1;
    hasMoreMessagesRef.current = true;

    await loadMessages(conversationId);
    await markConversationAsRead(conversationId);
  }, [state.conversations]);

  // Charger les messages d'une conversation
  const loadMessages = useCallback(async (conversationId: string, page = 1) => {
    if (!conversationId) return;

    try {
      const response = await api.get(`/messaging/conversations/${conversationId}/messages`, {
        params: { page, limit: 50 }
      });

      if (response.data.success) {
        const newMessages = response.data.data.messages || [];
        
        setState(prev => ({
          ...prev,
          messages: page === 1 ? newMessages : [...prev.messages, ...newMessages]
        }));

        // Vérifier s'il y a plus de messages
        hasMoreMessagesRef.current = newMessages.length === 50;
        
        // Auto-scroll vers le bas si c'est la première page
        if (page === 1) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error);
      setState(prev => ({
        ...prev,
        error: 'Impossible de charger les messages'
      }));
    }
  }, []);

  // Envoyer un message
  const sendMessage = useCallback(async (content: string, attachments: File[] = []) => {
    if (!content.trim() || !state.currentConversation || !user?.id) return;

    const messageContent = content.trim();
    setState(prev => ({ ...prev, sending: true, error: null }));

    try {
      // Optimistic update - ajouter le message immédiatement
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        assignment_id: state.currentConversation.assignment_id,
        sender_type: user.type as 'client' | 'expert' | 'admin',
        sender_id: user.id,
        recipient_type: user.type === 'client' ? 'expert' : 'client',
        recipient_id: '', // Sera rempli par le serveur
        content: messageContent,
        message_type: 'text',
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, optimisticMessage]
      }));

      // Envoyer via API
      const response = await api.post(`/messaging/conversations/${state.currentConversation.id}/messages`, {
        content: messageContent,
        message_type: 'text',
        attachments: attachments.length > 0 ? attachments : []
      });

      if (response.data.success) {
        // Remplacer le message optimiste par le vrai message
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === optimisticMessage.id ? response.data.data : msg
          )
        }));

        // Mettre à jour la conversation dans la liste
        setState(prev => ({
          ...prev,
          conversations: prev.conversations.map(conv => 
            conv.id === state.currentConversation?.id 
              ? { ...conv, lastMessage: response.data.data, updated_at: new Date().toISOString() }
              : conv
          )
        }));

        // Envoyer via WebSocket pour temps réel
        if (isConnected) {
          wsSendMessage({
            type: 'message',
            data: {
              assignmentId: state.currentConversation.assignment_id,
              content: messageContent,
              messageType: 'text'
            },
            timestamp: new Date().toISOString()
          });
        }

        // Auto-scroll
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      
      // Retirer le message optimiste en cas d'erreur
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => !msg.id.startsWith('temp-')),
        error: 'Impossible d\'envoyer le message'
      }));
    } finally {
      setState(prev => ({ ...prev, sending: false }));
    }
  }, [state.currentConversation, user, isConnected, wsSendMessage]);

  // Marquer un message comme lu
  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      await api.put(`/messaging/messages/${messageId}/read`);
      
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true, read_at: new Date().toISOString() } : msg
        )
      }));
    } catch (error) {
      console.error('❌ Erreur marquage message:', error);
    }
  }, []);

  // Marquer une conversation comme lue
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    try {
      setState(prev => ({
        ...prev,
        conversations: prev.conversations.map(conv => 
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      }));

      // Mettre à jour le compteur global
      const totalUnread = state.conversations.reduce(
        (sum, conv) => sum + (conv.id === conversationId ? 0 : conv.unreadCount), 0
      );
      
      setState(prev => ({ ...prev, unreadCount: totalUnread }));
    } catch (error) {
      console.error('❌ Erreur marquage conversation:', error);
    }
  }, [state.conversations]);

  // Recharger les messages
  const refreshMessages = useCallback(async () => {
    if (state.currentConversation) {
      currentPageRef.current = 1;
      await loadMessages(state.currentConversation.id, 1);
    }
  }, [state.currentConversation, loadMessages]);

  // Charger plus de messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (state.currentConversation && hasMoreMessagesRef.current) {
      currentPageRef.current += 1;
      await loadMessages(state.currentConversation.id, currentPageRef.current);
    }
  }, [state.currentConversation, loadMessages]);

  // ========================================
  // WEBSOCKET HANDLING
  // ========================================

  // Gérer les nouveaux messages WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'message') {
      const messageData = lastMessage.data;
      
      // Vérifier si le message appartient à la conversation actuelle
      if (state.currentConversation && messageData.assignment_id === state.currentConversation.assignment_id) {
        // Éviter les doublons
        const messageExists = state.messages.some(msg => msg.id === messageData.id);
        if (!messageExists) {
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, messageData]
          }));

          // Auto-scroll si c'est un message reçu
          if (messageData.sender_id !== user?.id) {
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        }
      }

      // Mettre à jour la conversation dans la liste
      setState(prev => ({
        ...prev,
        conversations: prev.conversations.map(conv => 
          conv.assignment_id === messageData.assignment_id 
            ? { 
                ...conv, 
                lastMessage: messageData, 
                updated_at: new Date().toISOString(),
                unreadCount: messageData.sender_id === user?.id ? conv.unreadCount : conv.unreadCount + 1
              }
            : conv
        )
      }));
    }
  }, [lastMessage, state.currentConversation, state.messages, user?.id]);

  // Envoyer un indicateur de frappe
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (isConnected && state.currentConversation) {
      wsSendMessage({
        type: 'typing',
        data: {
          assignmentId: state.currentConversation.assignment_id,
          isTyping,
          userId: user?.id
        },
        timestamp: new Date().toISOString()
      });
    }
  }, [isConnected, state.currentConversation, wsSendMessage, user?.id]);

  // ========================================
  // UTILITAIRES
  // ========================================

  // Vérifier si c'est notre message
  const isOwnMessage = useCallback((message: Message) => {
    return message.sender_id === user?.id;
  }, [user?.id]);

  // Formater l'heure
  const formatTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  }, []);

  // Obtenir le statut d'un message
  const getMessageStatus = useCallback((message: Message) => {
    if (message.is_read) return 'read';
    if (message.created_at) return 'delivered';
    return 'sent';
  }, []);

  // ========================================
  // EFFETS
  // ========================================

  // Charger les conversations au montage
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Charger les messages si un assignmentId est fourni
  useEffect(() => {
    if (assignmentId) {
      const conversation = state.conversations.find(c => c.assignment_id === assignmentId);
      if (conversation) {
        selectConversation(conversation.id);
      }
    }
  }, [assignmentId, state.conversations, selectConversation]);

  // Nettoyer les timeouts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    loadConversations,
    selectConversation,
    sendMessage,
    markMessageAsRead,
    markConversationAsRead,
    refreshMessages,
    loadMoreMessages,
    isConnected,
    sendTypingIndicator,
    isOwnMessage,
    formatTime,
    getMessageStatus
  };
} 