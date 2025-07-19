import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { messagingService } from './messaging-service';
import { supabase } from '../lib/supabase';
import { 
  ClientToServerEvents, 
  ServerToClientEvents,
  TypingIndicator,
  OnlineStatus,
  Message
} from '../types/messaging';

// ============================================================================
// SERVICE SOCKET.IO POUR LA MESSAGERIE TEMPS RÉEL
// ============================================================================

export class SocketService {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
  private onlineUsers: Map<string, OnlineStatus> = new Map();
  private typingUsers: Map<string, TypingIndicator> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  // ===== CONFIGURATION DES GESTIONNAIRES D'ÉVÉNEMENTS =====

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Nouvelle connexion Socket.IO: ${socket.id}`);

      // Authentification de l'utilisateur
      socket.on('authenticate', async (data: { userId: string; userType: 'client' | 'expert' | 'admin' }) => {
        await this.handleAuthentication(socket, data);
      });

      // Rejoindre une conversation
      socket.on('join-conversation', (conversationId: string) => {
        this.handleJoinConversation(socket, conversationId);
      });

      // Quitter une conversation
      socket.on('leave-conversation', (conversationId: string) => {
        this.handleLeaveConversation(socket, conversationId);
      });

      // Envoyer un message
      socket.on('send-message', async (data) => {
        await this.handleSendMessage(socket, data);
      });

      // Indicateur de frappe
      socket.on('typing-start', (conversationId: string) => {
        this.handleTypingStart(socket, conversationId);
      });

      socket.on('typing-stop', (conversationId: string) => {
        this.handleTypingStop(socket, conversationId);
      });

      // Marquer comme lu
      socket.on('mark-read', async (conversationId: string) => {
        await this.handleMarkRead(socket, conversationId);
      });

      // Statut en ligne
      socket.on('online-status', (isOnline: boolean) => {
        this.handleOnlineStatus(socket, isOnline);
      });

      // Déconnexion
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  // ===== GESTIONNAIRES D'ÉVÉNEMENTS =====

  private async handleAuthentication(
    socket: any,
    data: { userId: string; userType: 'client' | 'expert' | 'admin' }
  ): Promise<void> {
    try {
      // Vérifier l'authentification avec Supabase
      // TODO: Implémenter la vérification JWT
      
      // Stocker les informations utilisateur dans le socket
      socket.userId = data.userId;
      socket.userType = data.userType;

      // Mettre à jour le statut en ligne
      this.updateOnlineStatus(data.userId, data.userType, true);

      // Notifier les autres utilisateurs
      this.io.emit('user-online', {
        user_id: data.userId,
        user_type: data.userType,
        is_online: true,
        last_seen: new Date().toISOString()
      });

      console.log(`✅ Utilisateur authentifié: ${data.userId} (${data.userType})`);
    } catch (error) {
      console.error('❌ Erreur authentification Socket.IO:', error);
      socket.emit('error', { message: 'Authentification échouée' });
    }
  }

  private handleJoinConversation(socket: any, conversationId: string): void {
    if (!socket.userId) {
      socket.emit('error', { message: 'Utilisateur non authentifié' });
      return;
    }

    socket.join(`conversation:${conversationId}`);
    console.log(`👥 ${socket.userId} a rejoint la conversation ${conversationId}`);
  }

  private handleLeaveConversation(socket: any, conversationId: string): void {
    socket.leave(`conversation:${conversationId}`);
    console.log(`👋 ${socket.userId} a quitté la conversation ${conversationId}`);
  }

  private async handleSendMessage(socket: any, data: any): Promise<void> {
    if (!socket.userId) {
      socket.emit('error', { message: 'Utilisateur non authentifié' });
      return;
    }

    try {
      // Envoyer le message via le service de messagerie
      const message = await messagingService.sendMessage({
        conversation_id: data.conversationId,
        content: data.content,
        message_type: data.messageType,
        metadata: data.metadata
      });

      // Diffuser le message à tous les participants de la conversation
      this.io.to(`conversation:${data.conversationId}`).emit('message-received', message);

      console.log(`💬 Message envoyé dans la conversation ${data.conversationId}`);
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      socket.emit('error', { message: 'Impossible d\'envoyer le message' });
    }
  }

  private handleTypingStart(socket: any, conversationId: string): void {
    if (!socket.userId) return;

    const typingIndicator: TypingIndicator = {
      conversation_id: conversationId,
      user_id: socket.userId,
      user_type: socket.userType,
      is_typing: true
    };

    this.typingUsers.set(`${conversationId}:${socket.userId}`, typingIndicator);

    // Diffuser l'indicateur de frappe
    socket.to(`conversation:${conversationId}`).emit('typing-indicator', typingIndicator);
  }

  private handleTypingStop(socket: any, conversationId: string): void {
    if (!socket.userId) return;

    const typingIndicator: TypingIndicator = {
      conversation_id: conversationId,
      user_id: socket.userId,
      user_type: socket.userType,
      is_typing: false
    };

    this.typingUsers.delete(`${conversationId}:${socket.userId}`);

    // Diffuser l'arrêt de frappe
    socket.to(`conversation:${conversationId}`).emit('typing-indicator', typingIndicator);
  }

  private async handleMarkRead(socket: any, conversationId: string): Promise<void> {
    if (!socket.userId) return;

    try {
      await messagingService.markMessagesAsRead(conversationId, socket.userId);

      // Notifier les autres participants
      socket.to(`conversation:${conversationId}`).emit('message-read', {
        conversationId,
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erreur marquage lu:', error);
    }
  }

  private handleOnlineStatus(socket: any, isOnline: boolean): void {
    if (!socket.userId) return;

    this.updateOnlineStatus(socket.userId, socket.userType, isOnline);

    // Diffuser le changement de statut
    this.io.emit(isOnline ? 'user-online' : 'user-offline', {
      user_id: socket.userId,
      user_type: socket.userType,
      is_online: isOnline,
      last_seen: isOnline ? undefined : new Date().toISOString()
    });
  }

  private handleDisconnect(socket: any): void {
    if (socket.userId) {
      // Mettre à jour le statut hors ligne
      this.updateOnlineStatus(socket.userId, socket.userType, false);

      // Notifier les autres utilisateurs
      this.io.emit('user-offline', {
        user_id: socket.userId,
        user_type: socket.userType,
        is_online: false,
        last_seen: new Date().toISOString()
      });

      console.log(`🔌 Déconnexion: ${socket.userId}`);
    }
  }

  // ===== MÉTHODES PUBLIQUES =====

  /**
   * Mettre à jour le statut en ligne d'un utilisateur
   */
  private updateOnlineStatus(userId: string, userType: 'client' | 'expert' | 'admin', isOnline: boolean): void {
    const status: OnlineStatus = {
      user_id: userId,
      user_type: userType,
      is_online: isOnline,
      last_seen: isOnline ? undefined : new Date().toISOString()
    };

    if (isOnline) {
      this.onlineUsers.set(userId, status);
    } else {
      this.onlineUsers.delete(userId);
    }
  }

  /**
   * Récupérer le statut en ligne d'un utilisateur
   */
  getUserOnlineStatus(userId: string): OnlineStatus | undefined {
    return this.onlineUsers.get(userId);
  }

  /**
   * Récupérer tous les utilisateurs en ligne
   */
  getAllOnlineUsers(): OnlineStatus[] {
    return Array.from(this.onlineUsers.values());
  }

  /**
   * Envoyer une notification à un utilisateur spécifique
   */
  sendNotificationToUser(userId: string, notification: any): void {
    this.io.emit('notification', notification);
  }

  /**
   * Envoyer une notification à tous les utilisateurs d'un type spécifique
   */
  sendNotificationToUserType(userType: 'client' | 'expert' | 'admin', notification: any): void {
    this.io.emit('notification', notification);
  }

  /**
   * Diffuser un message système
   */
  broadcastSystemMessage(message: string, targetUserType?: 'client' | 'expert' | 'admin'): void {
    const systemNotification = {
      id: `system-${Date.now()}`,
      user_id: 'system',
      user_type: 'admin' as const,
      conversation_id: 'system',
      message_id: `system-${Date.now()}`,
      title: 'Message système',
      body: message,
      is_read: false,
      created_at: new Date().toISOString()
    };

    if (targetUserType) {
      // Envoyer seulement aux utilisateurs du type spécifié
      this.io.emit('notification', systemNotification);
    } else {
      // Envoyer à tous
      this.io.emit('notification', systemNotification);
    }
  }

  /**
   * Obtenir les statistiques du serveur Socket.IO
   */
  getServerStats(): any {
    return {
      connectedUsers: this.io.engine.clientsCount,
      onlineUsers: this.onlineUsers.size,
      typingUsers: this.typingUsers.size,
      conversations: this.io.sockets.adapter.rooms.size
    };
  }
} 