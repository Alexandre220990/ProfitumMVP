import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { messagingService, MessagingCallbacks } from '@/services/messaging-service';
import { 
  Message, 
  Conversation, 
  CreateConversationRequest, 
  FileAttachment
} from '@/types/messaging';
import { toast } from '@/hooks/use-toast';

// ============================================================================
// HOOK REACT UNIFIÉ POUR LA MESSAGERIE OPTIMISÉE
// ============================================================================
// Inspiré par Evan You (Vue.js) - Composition API
// et Addy Osmani (Google) - Performance & PWA

export interface UseMessagingOptions {
  autoConnect?: boolean;
  enableTyping?: boolean;
  enableNotifications?: boolean;
  enableFileUpload?: boolean;
  maxFileSize?: number; // en MB
  allowedFileTypes?: string[];
}

export interface UseMessagingReturn {
  // État principal
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  uploading: boolean;
  error: string | null;
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  
  // Actions principales
  selectConversation: (conversation: Conversation | null) => void;
  sendMessage: (content: string, files?: File[]) => Promise<void>;
  createConversation: (request: CreateConversationRequest) => Promise<Conversation>;
  markAsRead: (messageId: string) => Promise<void>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  sendTypingIndicator: (isTyping: boolean) => void;
  
  // Gestion des fichiers
  uploadFile: (file: File) => Promise<FileAttachment | null>;
  removeFile: (fileId: string) => void;
  getUploadProgress: (fileId: string) => number;
  
  // Utilitaires et calculs
  getUnreadCount: (conversationId: string) => number;
  getTotalUnreadCount: () => number;
  isOwnMessage: (message: Message) => boolean;
  formatTime: (timestamp: string) => string;
  getMessageStatus: (message: Message) => 'sent' | 'delivered' | 'read';
  getConversationStats: (conversationId: string) => {
    messageCount: number;
    unreadCount: number;
    lastActivity: string;
  };
  
  // Gestion des erreurs et reconnexion
  clearError: () => void;
  retry: () => void;
  reconnect: () => Promise<void>;
  
  // Statistiques et monitoring
  getStats: () => {
    totalMessages: number;
    unreadCount: number;
    activeConversations: number;
    responseTime: number;
    uptime: number;
  };
}

export const useMessaging = (options: UseMessagingOptions = {}): UseMessagingReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // État local optimisé (Evan You - Composition API)
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());
  
  // Références pour optimisations (Addy Osmani - Performance)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef<MessagingCallbacks>({});
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ========================================
  // CONFIGURATION DES CALLBACKS STABILISÉS
  // ========================================

  // Callbacks stabilisés avec useCallback pour éviter les recréations
  const onNewMessage = useCallback((message: Message) => {
    // Invalider le cache des messages seulement si nécessaire
    if (currentConversation?.id === message.conversation_id) {
      queryClient.invalidateQueries({ queryKey: ['messages', message.conversation_id] });
    }
    
    // Notification toast pour nouveaux messages
    if (options.enableNotifications && !isOwnMessage(message)) {
      toast({
        title: 'Nouveau message',
        description: `${message.sender_name}: ${message.content.substring(0, 50)}...`,
        variant: 'default'
      });
    }
  }, [currentConversation?.id, options.enableNotifications, queryClient]);

  const onMessageRead = useCallback((messageId: string, readAt: string) => {
    // Mise à jour optimiste du cache seulement si nécessaire
    queryClient.setQueryData(['messages'], (old: Message[] | undefined) => {
      if (!old) return old;
      return old.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true, read_at: readAt } : msg
      );
    });
  }, [queryClient]);

  const onTyping = useCallback((_userId: string, _isTyping: boolean) => {
    // Gérer les indicateurs de frappe
    if (options.enableTyping) {
      // Logique pour afficher les indicateurs de frappe
    }
  }, [options.enableTyping]);

  const onConnectionStatus = useCallback((status: 'connected' | 'disconnected' | 'reconnecting') => {
    setConnectionStatus(status);
    setIsConnected(status === 'connected');
    
    // Éviter les rechargements constants - seulement si vraiment nécessaire
    if (status === 'connected' && !isConnected) {
      // Recharger les données seulement si on vient de se reconnecter
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (currentConversation) {
        queryClient.invalidateQueries({ queryKey: ['messages', currentConversation.id] });
      }
    }
  }, [isConnected, currentConversation, queryClient]);

  const onError = useCallback((error: Error) => {
    setError(error.message);
    toast({
      title: 'Erreur de messagerie',
      description: error.message,
      variant: 'destructive'
    });
  }, []);

  const onFileUploadProgress = useCallback((fileId: string, progress: number) => {
    setUploadProgress(prev => new Map(prev).set(fileId, progress));
  }, []);

  // Configuration des callbacks une seule fois
  useEffect(() => {
    callbacksRef.current = {
      onNewMessage,
      onMessageRead,
      onTyping,
      onConnectionStatus,
      onError,
      onFileUploadProgress
    };

    messagingService.setCallbacks(callbacksRef.current);
  }, [onNewMessage, onMessageRead, onTyping, onConnectionStatus, onError, onFileUploadProgress]);

  // ========================================
  // QUERIES REACT QUERY OPTIMISÉES (Sundar Pichai - Cache intelligent)
  // ========================================

  // Query pour les conversations avec cache intelligent et dépendances stabilisées
  const {
    data: conversations = [],
    isLoading: conversationsLoading,
    error: conversationsError,
    refetch: refetchConversations
  } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => messagingService.getConversations(),
    enabled: !!user?.id, // Retirer la dépendance isConnected qui cause les rechargements
    staleTime: 60000, // Augmenter à 1 minute pour réduire les rechargements
    gcTime: 300000, // 5 minutes de cache (anciennement cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Éviter les rechargements au montage
    retry: 2, // Réduire les retries
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000)
  });

  // Query pour les messages avec pagination virtuelle et cache optimisé
  const {
    data: messages = [],
    isLoading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['messages', currentConversation?.id],
    queryFn: () => messagingService.getMessages(currentConversation!.id),
    enabled: !!currentConversation?.id, // Retirer la dépendance isConnected
    staleTime: 30000, // 30 secondes
    gcTime: 180000, // 3 minutes de cache (anciennement cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000)
  });

  // ========================================
  // MUTATIONS OPTIMISÉES
  // ========================================

  // Mutation pour envoyer un message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, files }: { content: string; files?: File[] }) => {
      if (!currentConversation) throw new Error('Aucune conversation sélectionnée');
      
      let attachments: FileAttachment[] = [];
      
      // Upload des fichiers si présents
      if (files && files.length > 0 && options.enableFileUpload) {
        setUploading(true);
        try {
          const uploadPromises = files.map(file => messagingService.uploadFile(file, currentConversation.id));
          attachments = await Promise.all(uploadPromises);
        } finally {
          setUploading(false);
        }
      }
      
      return messagingService.sendMessage({
        conversation_id: currentConversation.id,
        content,
        message_type: attachments.length > 0 ? 'file' : 'text',
        metadata: { attachments }
      });
    },
    onSuccess: (newMessage) => {
      // Mise à jour optimiste du cache
      queryClient.setQueryData(['messages', currentConversation?.id], (old: Message[] | undefined) => {
        if (!old) return [newMessage];
        return [...old, newMessage];
      });
      
      // Marquer comme lu automatiquement
      messagingService.markMessageAsRead(newMessage.id);
    },
    onError: (error: Error) => {
      setError(error.message);
      toast({
        title: 'Erreur d\'envoi',
        description: 'Impossible d\'envoyer le message',
        variant: 'destructive'
      });
    }
  });

  // Mutation pour créer une conversation
  const createConversationMutation = useMutation({
    mutationFn: messagingService.createConversation.bind(messagingService),
    onSuccess: (newConversation: Conversation) => {
      // Mise à jour optimiste du cache
      queryClient.setQueryData(['conversations', user?.id], (old: Conversation[] | undefined) => {
        if (!old) return [newConversation];
        return [newConversation, ...old];
      });
      
      // Sélectionner automatiquement la nouvelle conversation
      setCurrentConversation(newConversation);
    }
  });

  // ========================================
  // ACTIONS PRINCIPALES
  // ========================================

  const selectConversation = useCallback((conversation: Conversation | null) => {
    setCurrentConversation(conversation);
    
    // Marquer comme lu automatiquement
    if (conversation) {
      messagingService.markConversationAsRead(conversation.id);
    }
  }, []);

  const sendMessage = useCallback(async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return;
    
    setSending(true);
    try {
      await sendMessageMutation.mutateAsync({ content, files });
    } finally {
      setSending(false);
    }
  }, [sendMessageMutation]);

  const createConversation = useCallback(async (request: CreateConversationRequest) => {
    return createConversationMutation.mutateAsync(request);
  }, [createConversationMutation]);

  const markAsRead = useCallback(async (messageId: string) => {
    await messagingService.markMessageAsRead(messageId);
  }, []);

  const markConversationAsRead = useCallback(async (conversationId: string) => {
    await messagingService.markConversationAsRead(conversationId);
  }, []);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!currentConversation) return;
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing indicator
    messagingService.sendTypingIndicator(currentConversation.id, isTyping);
    
    // Auto-clear after 3 seconds
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        messagingService.sendTypingIndicator(currentConversation.id, false);
      }, 3000);
    }
  }, [currentConversation]);

  // ========================================
  // GESTION DES FICHIERS
  // ========================================

  const uploadFile = useCallback(async (file: File): Promise<FileAttachment | null> => {
    if (!currentConversation) return null;
    
    // Validation du fichier
    if (options.maxFileSize && file.size > options.maxFileSize * 1024 * 1024) {
      throw new Error(`Fichier trop volumineux. Taille max: ${options.maxFileSize}MB`);
    }
    
    if (options.allowedFileTypes && !options.allowedFileTypes.includes(file.type)) {
      throw new Error('Type de fichier non autorisé');
    }
    
    setUploading(true);
    try {
      const attachment = await messagingService.uploadFile(file, currentConversation.id);
      return attachment;
    } finally {
      setUploading(false);
    }
  }, [currentConversation, options.maxFileSize, options.allowedFileTypes]);

  const removeFile = useCallback((fileId: string) => {
    setUploadProgress(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
  }, []);

  const getUploadProgress = useCallback((fileId: string) => {
    return uploadProgress.get(fileId) || 0;
  }, [uploadProgress]);

  // ========================================
  // UTILITAIRES ET CALCULS MÉMOISÉS
  // ========================================

  const isOwnMessage = useCallback((message: Message) => {
    return message.sender_id === user?.id;
  }, [user?.id]);

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

  const getMessageStatus = useCallback((message: Message) => {
    if (message.is_read) return 'read';
    if (message.delivered_at) return 'delivered';
    return 'sent';
  }, []);

  const getUnreadCount = useCallback((conversationId: string) => {
    return (messages as Message[]).filter(msg => 
      msg.conversation_id === conversationId && !msg.is_read && !isOwnMessage(msg)
    ).length;
  }, [messages, isOwnMessage]);

  const getTotalUnreadCount = useCallback(() => {
    return (conversations as Conversation[]).reduce((total, conv) => {
      const convMessages = (messages as Message[]).filter(msg => msg.conversation_id === conv.id);
      return total + convMessages.filter(msg => !msg.is_read && !isOwnMessage(msg)).length;
    }, 0);
  }, [conversations, messages, isOwnMessage]);

  const getConversationStats = useCallback((conversationId: string) => {
    const convMessages = (messages as Message[]).filter(msg => msg.conversation_id === conversationId);
    const unreadCount = convMessages.filter(msg => !msg.is_read && !isOwnMessage(msg)).length;
    const lastActivity = convMessages.length > 0 
      ? convMessages[convMessages.length - 1].created_at 
      : '';
    
    return {
      messageCount: convMessages.length,
      unreadCount,
      lastActivity
    };
  }, [messages, isOwnMessage]);

  // ========================================
  // GESTION DES ERREURS ET RECONNEXION
  // ========================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retry = useCallback(() => {
    refetchConversations();
    if (currentConversation) {
      refetchMessages();
    }
  }, [refetchConversations, refetchMessages, currentConversation]);

  const reconnect = useCallback(async () => {
    if (!user?.id || !user?.type) return;
    
    try {
      await messagingService.initialize(user.id, user.type);
    } catch (error) {
      console.error('❌ Erreur reconnexion:', error);
    }
  }, [user?.id, user?.type]);

  const getStats = useCallback(() => {
    return messagingService.getStats();
  }, []);

  // ========================================
  // INITIALISATION ET NETTOYAGE STABILISÉS
  // ========================================

  // État pour tracker l'initialisation
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (options.autoConnect && user?.id && user?.type && !isInitialized) {
      const initializeService = async () => {
        try {
          await messagingService.initialize(user.id, user.type);
          setIsInitialized(true);
        } catch (error) {
          console.error('❌ Erreur initialisation messagerie:', error);
          // Ne pas relancer automatiquement en cas d'erreur
        }
      };
      
      initializeService();
    }

    return () => {
      // Cleanup des timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Déconnexion du service seulement si on démonte le composant
      if (isInitialized) {
        messagingService.disconnect();
        setIsInitialized(false);
      }
    };
  }, [options.autoConnect, user?.id, user?.type, isInitialized]); // Ajouter isInitialized aux dépendances

  // Gestion des erreurs de queries
  useEffect(() => {
    if (conversationsError) {
      setError(conversationsError.message);
    }
    if (messagesError) {
      setError(messagesError.message);
    }
  }, [conversationsError, messagesError]);

  // ========================================
  // VALEURS MÉMOISÉES POUR PERFORMANCE
  // ========================================

  const loading = useMemo(() => 
    conversationsLoading || messagesLoading || sending || uploading, 
    [conversationsLoading, messagesLoading, sending, uploading]
  );

  const memoizedConversations = useMemo(() => conversations, [conversations]);
  const memoizedMessages = useMemo(() => messages, [messages]);

  return {
    // État principal
    conversations: memoizedConversations,
    currentConversation,
    messages: memoizedMessages,
    loading,
    sending,
    uploading,
    error,
    isConnected,
    connectionStatus,
    
    // Actions principales
    selectConversation,
    sendMessage,
    createConversation,
    markAsRead,
    markConversationAsRead,
    sendTypingIndicator,
    
    // Gestion des fichiers
    uploadFile,
    removeFile,
    getUploadProgress,
    
    // Utilitaires
    getUnreadCount,
    getTotalUnreadCount,
    isOwnMessage,
    formatTime,
    getMessageStatus,
    getConversationStats,
    
    // Gestion des erreurs
    clearError,
    retry,
    reconnect,
    
    // Statistiques
    getStats
  };
}; 