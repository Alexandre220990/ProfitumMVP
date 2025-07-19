import { io, Socket } from 'socket.io-client';
import { 
  Message, 
  Conversation, 
  MessageNotification,
  CreateConversationRequest,
  SendMessageRequest,
  GetConversationsRequest,
  GetMessagesRequest,
  TypingIndicator,
  OnlineStatus
} from '../types/messaging';

// ============================================================================
// SERVICE CLIENT DE MESSAGERIE
// ============================================================================

export class MessagingClientService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Callbacks pour les événements
  private messageCallbacks: ((message: Message) => void)[] = [];
  private typingCallbacks: ((data: TypingIndicator) => void)[] = [];
  private readCallbacks: ((data: { conversationId: string; userId: string; timestamp: string }) => void)[] = [];
  private onlineCallbacks: ((data: OnlineStatus) => void)[] = [];
  private notificationCallbacks: ((notification: MessageNotification) => void)[] = [];
  private conversationCallbacks: ((conversation: Conversation) => void)[] = [];

  constructor() {
    this.initializeSocket();
  }

  // ===== INITIALISATION SOCKET =====

  private initializeSocket(): void {
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5001';
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay
    });

    this.setupSocketEvents();
  }

  private setupSocketEvents(): void {
    if (!this.socket) return;

    // Connexion
    this.socket.on('connect', () => {
      console.log('🔌 Connecté au serveur de messagerie');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    // Déconnexion
    this.socket.on('disconnect', () => {
      console.log('🔌 Déconnecté du serveur de messagerie');
      this.isConnected = false;
    });

    // Erreur de connexion
    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur connexion Socket.IO:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Nombre maximum de tentatives de reconnexion atteint');
      }
    });

    // Reconnexion
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnexion réussie (tentative ${attemptNumber})`);
      this.isConnected = true;
    });

    // Événements de messagerie
    this.socket.on('message-received', (message: Message) => {
      this.messageCallbacks.forEach(callback => callback(message));
    });

    this.socket.on('typing-indicator', (data: TypingIndicator) => {
      this.typingCallbacks.forEach(callback => callback(data));
    });

    this.socket.on('message-read', (data: { conversationId: string; userId: string; timestamp: string }) => {
      this.readCallbacks.forEach(callback => callback(data));
    });

    this.socket.on('user-online', (data: OnlineStatus) => {
      this.onlineCallbacks.forEach(callback => callback(data));
    });

    this.socket.on('user-offline', (data: OnlineStatus) => {
      this.onlineCallbacks.forEach(callback => callback(data));
    });

    this.socket.on('notification', (notification: MessageNotification) => {
      this.notificationCallbacks.forEach(callback => callback(notification));
    });

    this.socket.on('conversation-updated', (conversation: Conversation) => {
      this.conversationCallbacks.forEach(callback => callback(conversation));
    });

    // Erreurs
    this.socket.on('error', (error) => {
      console.error('❌ Erreur Socket.IO:', error);
    });
  }

  // ===== AUTHENTIFICATION =====

  /**
   * Authentifier l'utilisateur avec le serveur Socket.IO
   */
  authenticate(userId: string, userType: 'client' | 'expert' | 'admin'): void {
    if (!this.socket) {
      console.error('❌ Socket non initialisé');
      return;
    }

    this.socket.emit('authenticate', { userId, userType });
  }

  // ===== GESTION DES CONVERSATIONS =====

  /**
   * Rejoindre une conversation
   */
  joinConversation(conversationId: string): void {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket non connecté');
      return;
    }

    this.socket.emit('join-conversation', conversationId);
  }

  /**
   * Quitter une conversation
   */
  leaveConversation(conversationId: string): void {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket non connecté');
      return;
    }

    this.socket.emit('leave-conversation', conversationId);
  }

  /**
   * Créer une conversation
   */
  async createConversation(request: CreateConversationRequest): Promise<string> {
    try {
      const response = await fetch('/api/messaging/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la conversation');
      }

      const data = await response.json();
      return data.data.conversation_id;
    } catch (error) {
      console.error('❌ Erreur création conversation:', error);
      throw error;
    }
  }

  /**
   * Récupérer les conversations
   */
  async getConversations(request: GetConversationsRequest): Promise<Conversation[]> {
    try {
      const params = new URLSearchParams({
        user_id: request.user_id,
        user_type: request.user_type,
        limit: (request.limit || 50).toString(),
        offset: (request.offset || 0).toString(),
        include_archived: (request.include_archived || false).toString()
      });

      const response = await fetch(`/api/messaging/conversations?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des conversations');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('❌ Erreur récupération conversations:', error);
      throw error;
    }
  }

  /**
   * Récupérer une conversation
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const response = await fetch(`/api/messaging/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Erreur lors de la récupération de la conversation');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('❌ Erreur récupération conversation:', error);
      throw error;
    }
  }

  /**
   * Archiver une conversation
   */
  async archiveConversation(conversationId: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/messaging/conversations/${conversationId}/archive`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'archivage de la conversation');
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur archivage conversation:', error);
      throw error;
    }
  }

  // ===== GESTION DES MESSAGES =====

  /**
   * Envoyer un message
   */
  async sendMessage(request: SendMessageRequest): Promise<Message> {
    try {
      const response = await fetch('/api/messaging/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      throw error;
    }
  }

  /**
   * Envoyer un message via Socket.IO (temps réel)
   */
  sendMessageRealTime(data: { conversationId: string; content: string; messageType?: string; metadata?: any }): void {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket non connecté');
      return;
    }

    this.socket.emit('send-message', data);
  }

  /**
   * Récupérer les messages d'une conversation
   */
  async getMessages(request: GetMessagesRequest): Promise<Message[]> {
    try {
      const params = new URLSearchParams({
        limit: (request.limit || 50).toString(),
        offset: (request.offset || 0).toString()
      });

      if (request.before_date) {
        params.append('before_date', request.before_date);
      }

      const response = await fetch(`/api/messaging/conversations/${request.conversation_id}/messages?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des messages');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('❌ Erreur récupération messages:', error);
      throw error;
    }
  }

  /**
   * Marquer les messages comme lus
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/messaging/conversations/${conversationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du marquage des messages');
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur marquage messages:', error);
      throw error;
    }
  }

  /**
   * Marquer comme lu via Socket.IO
   */
  markAsReadRealTime(conversationId: string): void {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket non connecté');
      return;
    }

    this.socket.emit('mark-read', conversationId);
  }

  // ===== INDICATEURS DE FRAPPE =====

  /**
   * Démarrer l'indicateur de frappe
   */
  startTyping(conversationId: string): void {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket non connecté');
      return;
    }

    this.socket.emit('typing-start', conversationId);
  }

  /**
   * Arrêter l'indicateur de frappe
   */
  stopTyping(conversationId: string): void {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket non connecté');
      return;
    }

    this.socket.emit('typing-stop', conversationId);
  }

  // ===== NOTIFICATIONS =====

  /**
   * Récupérer les notifications
   */
  async getNotifications(userId: string, userType: string, limit: number = 20): Promise<MessageNotification[]> {
    try {
      const params = new URLSearchParams({
        user_id: userId,
        user_type: userType,
        limit: limit.toString()
      });

      const response = await fetch(`/api/messaging/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des notifications');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('❌ Erreur récupération notifications:', error);
      throw error;
    }
  }

  /**
   * Marquer une notification comme lue
   */
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/messaging/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du marquage de la notification');
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur marquage notification:', error);
      throw error;
    }
  }

  // ===== GESTION DU STATUT EN LIGNE =====

  /**
   * Mettre à jour le statut en ligne
   */
  updateOnlineStatus(isOnline: boolean): void {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket non connecté');
      return;
    }

    this.socket.emit('online-status', isOnline);
  }

  // ===== CALLBACKS ET ÉVÉNEMENTS =====

  /**
   * Ajouter un callback pour les nouveaux messages
   */
  onMessage(callback: (message: Message) => void): void {
    this.messageCallbacks.push(callback);
  }

  /**
   * Ajouter un callback pour les indicateurs de frappe
   */
  onTyping(callback: (data: TypingIndicator) => void): void {
    this.typingCallbacks.push(callback);
  }

  /**
   * Ajouter un callback pour les messages lus
   */
  onMessageRead(callback: (data: { conversationId: string; userId: string; timestamp: string }) => void): void {
    this.readCallbacks.push(callback);
  }

  /**
   * Ajouter un callback pour les changements de statut en ligne
   */
  onOnlineStatus(callback: (data: OnlineStatus) => void): void {
    this.onlineCallbacks.push(callback);
  }

  /**
   * Ajouter un callback pour les notifications
   */
  onNotification(callback: (notification: MessageNotification) => void): void {
    this.notificationCallbacks.push(callback);
  }

  /**
   * Ajouter un callback pour les mises à jour de conversation
   */
  onConversationUpdate(callback: (conversation: Conversation) => void): void {
    this.conversationCallbacks.push(callback);
  }

  // ===== UTILITAIRES =====

  /**
   * Se connecter au serveur Socket.IO
   */
  connect(): void {
    if (this.socket && !this.isConnected) {
      this.socket.connect();
    }
  }

  /**
   * Se déconnecter du serveur Socket.IO
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  /**
   * Vérifier si connecté
   */
  isSocketConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Récupérer le token d'authentification
   */
  private getAuthToken(): string {
    // TODO: Implémenter avec votre système d'authentification
    return localStorage.getItem('authToken') || '';
  }
}

// Instance singleton
export const messagingClientService = new MessagingClientService(); 