import { useState, useEffect, useCallback, useRef } from 'react';
import { messagingClientService } from '@/services/messaging-service';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/toast-notifications';
import {
  Message,
  Conversation,
  MessageNotification,
  TypingIndicator,
  OnlineStatus,
  MessagingState,
  CreateConversationRequest,
  SendMessageRequest
} from '@/types/messaging';

// ============================================================================
// HOOK REACT POUR LA MESSAGERIE
// ============================================================================

export const useMessaging = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  // État local
  const [state, setState] = useState<MessagingState>({
    conversations: [],
    currentConversation: null,
    messages: [],
    notifications: [],
    onlineUsers: new Map(),
    typingUsers: new Map(),
    loading: false,
    error: null
  });

  // Références pour éviter les re-renders inutiles
  const onlineUsersRef = useRef(new Map<string, OnlineStatus>());
  const typingUsersRef = useRef(new Map<string, TypingIndicator>());

  // ===== INITIALISATION =====

  useEffect(() => {
    if (!user?.id) return;

    // Connecter au service de messagerie
    messagingClientService.connect();

          // Authentifier l'utilisateur
      messagingClientService.authenticate(user.id, user.type);

    // Configurer les callbacks
    setupCallbacks();

    // Charger les données initiales
    loadInitialData();

    // Nettoyer à la déconnexion
    return () => {
      messagingClientService.disconnect();
    };
  }, [user?.id, user?.type]);

  // ===== CONFIGURATION DES CALLBACKS =====

  const setupCallbacks = useCallback(() => {
    // Nouveaux messages
    messagingClientService.onMessage((message: Message) => {
      setState(prev => {
        const newMessages = [...prev.messages];
        const existingIndex = newMessages.findIndex(m => m.id === message.id);
        
        if (existingIndex >= 0) {
          newMessages[existingIndex] = message;
        } else {
          newMessages.push(message);
        }

        // Mettre à jour le compteur de messages non lus
        const updatedConversations = prev.conversations.map(conv => {
          if (conv.id === message.conversation_id && message.sender_id !== user?.id) {
            return { ...conv, unread_count: conv.unread_count + 1 };
          }
          return conv;
        });

        return {
          ...prev,
          messages: newMessages,
          conversations: updatedConversations
        };
      });

      // Notification toast pour les nouveaux messages
      if (message.sender_id !== user?.id) {
        addToast({
          type: 'info',
          title: `Nouveau message de ${message.sender_name}`,
          message: message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content,
          duration: 5000
        });
      }
    });

    // Indicateurs de frappe
    messagingClientService.onTyping((data: TypingIndicator) => {
      typingUsersRef.current.set(`${data.conversation_id}:${data.user_id}`, data);
      setState(prev => ({
        ...prev,
        typingUsers: new Map(typingUsersRef.current)
      }));
    });

    // Messages lus
    messagingClientService.onMessageRead((data) => {
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.conversation_id === data.conversationId ? { ...msg, is_read: true } : msg
        )
      }));
    });

    // Statut en ligne
    messagingClientService.onOnlineStatus((data: OnlineStatus) => {
      onlineUsersRef.current.set(data.user_id, data);
      setState(prev => ({
        ...prev,
        onlineUsers: new Map(onlineUsersRef.current)
      }));
    });

    // Notifications
    messagingClientService.onNotification((notification: MessageNotification) => {
      setState(prev => ({
        ...prev,
        notifications: [notification, ...prev.notifications]
      }));
    });

    // Mises à jour de conversation
    messagingClientService.onConversationUpdate((conversation: Conversation) => {
      setState(prev => ({
        ...prev,
        conversations: prev.conversations.map(conv => 
          conv.id === conversation.id ? conversation : conv
        )
      }));
    });
  }, [user?.id, addToast]);

  // ===== CHARGEMENT DES DONNÉES =====

  const loadInitialData = useCallback(async () => {
    if (!user?.id) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Charger les conversations
      const conversations = await messagingClientService.getConversations({
        user_id: user.id,
        user_type: user.type as 'client' | 'expert' | 'admin'
      });

      // Charger les notifications
      const notifications = await messagingClientService.getNotifications(
        user.id,
        user.type as 'client' | 'expert' | 'admin'
      );

      setState(prev => ({
        ...prev,
        conversations,
        notifications,
        loading: false
      }));
    } catch (error) {
      console.error('❌ Erreur chargement données initiales:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erreur lors du chargement des données'
      }));
    }
  }, [user?.id, user?.type]);

  // ===== GESTION DES CONVERSATIONS =====

  const createConversation = useCallback(async (request: CreateConversationRequest): Promise<string> => {
    try {
      const conversationId = await messagingClientService.createConversation(request);
      
      // Recharger les conversations
      await loadInitialData();
      
      addToast({
        type: 'success',
        title: 'Conversation créée',
        message: 'La conversation a été créée avec succès',
        duration: 3000
      });

      return conversationId;
    } catch (error) {
      console.error('❌ Erreur création conversation:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de créer la conversation',
        duration: 5000
      });
      throw error;
    }
  }, [loadInitialData, addToast]);

  const selectConversation = useCallback(async (conversationId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      // Récupérer la conversation
      const conversation = await messagingClientService.getConversation(conversationId);
      if (!conversation) {
        throw new Error('Conversation non trouvée');
      }

      // Rejoindre la conversation Socket.IO
      messagingClientService.joinConversation(conversationId);

      // Charger les messages
      const messages = await messagingClientService.getMessages({
        conversation_id: conversationId
      });

      // Marquer comme lu
      if (user?.id) {
        await messagingClientService.markMessagesAsRead(conversationId, user.id);
      }

      setState(prev => ({
        ...prev,
        currentConversation: conversation,
        messages,
        loading: false
      }));
    } catch (error) {
      console.error('❌ Erreur sélection conversation:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erreur lors de la sélection de la conversation'
      }));
    }
  }, [user?.id]);

  const leaveConversation = useCallback((conversationId: string) => {
    messagingClientService.leaveConversation(conversationId);
    setState(prev => ({
      ...prev,
      currentConversation: null,
      messages: []
    }));
  }, []);

  const archiveConversation = useCallback(async (conversationId: string) => {
    if (!user?.id) return;

    try {
      await messagingClientService.archiveConversation(conversationId, user.id);
      
      // Mettre à jour l'état local
      setState(prev => ({
        ...prev,
        conversations: prev.conversations.map(conv => 
          conv.id === conversationId ? { ...conv, is_archived: true } : conv
        )
      }));

      addToast({
        type: 'success',
        title: 'Conversation archivée',
        message: 'La conversation a été archivée',
        duration: 3000
      });
    } catch (error) {
      console.error('❌ Erreur archivage conversation:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'archiver la conversation',
        duration: 5000
      });
    }
  }, [user?.id, addToast]);

  // ===== GESTION DES MESSAGES =====

  const sendMessage = useCallback(async (content: string, messageType: string = 'text', metadata?: any) => {
    if (!state.currentConversation || !content.trim()) return;

    try {
      const request: SendMessageRequest = {
        conversation_id: state.currentConversation.id,
        content: content.trim(),
        message_type: messageType as any,
        metadata
      };

      // Envoyer via Socket.IO pour le temps réel
      messagingClientService.sendMessageRealTime({
        conversationId: request.conversation_id,
        content: request.content,
        messageType: request.message_type,
        metadata: request.metadata
      });

      // Optionnel : envoyer aussi via API pour la persistance
      // await messagingClientService.sendMessage(request);

    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'envoyer le message',
        duration: 5000
      });
    }
  }, [state.currentConversation, addToast]);

  const markAsRead = useCallback((conversationId: string) => {
    if (!user?.id) return;

    messagingClientService.markAsReadRealTime(conversationId);
    
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => 
        msg.conversation_id === conversationId ? { ...msg, is_read: true } : msg
      )
    }));
  }, [user?.id]);

  // ===== GESTION DES NOTIFICATIONS =====

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await messagingClientService.markNotificationAsRead(notificationId);
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== notificationId)
      }));
    } catch (error) {
      console.error('❌ Erreur marquage notification:', error);
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: []
    }));
  }, []);

  // ===== INDICATEURS DE FRAPPE =====

  const startTyping = useCallback((conversationId: string) => {
    messagingClientService.startTyping(conversationId);
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    messagingClientService.stopTyping(conversationId);
  }, []);

  // ===== UTILITAIRES =====

  const isUserOnline = useCallback((userId: string): boolean => {
    return state.onlineUsers.get(userId)?.is_online || false;
  }, [state.onlineUsers]);

  const isUserTyping = useCallback((conversationId: string, userId: string): boolean => {
    return state.typingUsers.get(`${conversationId}:${userId}`)?.is_typing || false;
  }, [state.typingUsers]);

  const getUnreadCount = useCallback((conversationId: string): number => {
    return state.conversations.find(c => c.id === conversationId)?.unread_count || 0;
  }, [state.conversations]);

  const getTotalUnreadCount = useCallback((): number => {
    return state.conversations.reduce((total, conv) => total + conv.unread_count, 0);
  }, [state.conversations]);

  const refreshData = useCallback(() => {
    loadInitialData();
  }, [loadInitialData]);

  // ===== RETOUR DU HOOK =====

  return {
    // État
    conversations: state.conversations,
    currentConversation: state.currentConversation,
    messages: state.messages,
    notifications: state.notifications,
    onlineUsers: state.onlineUsers,
    typingUsers: state.typingUsers,
    loading: state.loading,
    error: state.error,
    isConnected: messagingClientService.isSocketConnected(),

    // Actions
    createConversation,
    selectConversation,
    leaveConversation,
    archiveConversation,
    sendMessage,
    markAsRead,
    markNotificationAsRead,
    clearNotifications,
    startTyping,
    stopTyping,
    refreshData,

    // Utilitaires
    isUserOnline,
    isUserTyping,
    getUnreadCount,
    getTotalUnreadCount
  };
}; 