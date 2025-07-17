import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import jwt from 'jsonwebtoken';

interface WebSocketMessage {
  type: 'message' | 'typing' | 'read' | 'notification' | 'assignment_update';
  data: any;
  timestamp: string;
}

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  userType: 'client' | 'expert' | 'admin';
  assignmentId?: string;
  isAlive: boolean;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, ClientConnection> = new Map();
  private supabase: ReturnType<typeof createClient<Database>>;

  constructor(server: any) {
    this.wss = new WebSocketServer({ server });
    this.supabase = createClient<Database>(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    this.setupWebSocketServer();
    this.setupHeartbeat();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', async (ws: WebSocket, request: any) => {
      console.log('🔌 Nouvelle connexion WebSocket');

      try {
        // Authentification via token JWT
        const token = this.extractToken(request);
        if (!token) {
          ws.close(1008, 'Token manquant');
          return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
        const userId = decoded.userId;
        const userType = decoded.userType;

        // Enregistrer la connexion
        const connection: ClientConnection = {
          ws,
          userId,
          userType,
          isAlive: true
        };

        this.clients.set(userId, connection);

        console.log(`✅ Client connecté: ${userId} (${userType})`);

        // Envoyer les messages non lus
        await this.sendUnreadMessages(userId, userType);

        // Gestion des messages
        ws.on('message', async (data: Buffer) => {
          try {
            const message: WebSocketMessage = JSON.parse(data.toString());
            await this.handleMessage(userId, userType, message);
          } catch (error) {
            console.error('❌ Erreur traitement message WebSocket:', error);
            this.sendError(ws, 'Erreur traitement message');
          }
        });

        // Gestion de la déconnexion
        ws.on('close', () => {
          console.log(`🔌 Client déconnecté: ${userId}`);
          this.clients.delete(userId);
        });

        // Gestion des erreurs
        ws.on('error', (error) => {
          console.error(`❌ Erreur WebSocket pour ${userId}:`, error);
          this.clients.delete(userId);
        });

        // Ping/Pong pour maintenir la connexion
        ws.on('pong', () => {
          const client = this.clients.get(userId);
          if (client) {
            client.isAlive = true;
          }
        });

      } catch (error) {
        console.error('❌ Erreur authentification WebSocket:', error);
        ws.close(1008, 'Authentification échouée');
      }
    });
  }

  private extractToken(request: any): string | null {
    // Extraire le token depuis les headers ou query params
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    const url = new URL(request.url, 'http://[::1]');
    return url.searchParams.get('token');
  }

  private async handleMessage(userId: string, userType: string, message: WebSocketMessage) {
    console.log(`📨 Message reçu de ${userId}:`, message.type);

    switch (message.type) {
      case 'message':
        await this.handleNewMessage(userId, userType, message.data);
        break;
      
      case 'typing':
        await this.handleTyping(userId, userType, message.data);
        break;
      
      case 'read':
        await this.handleMessageRead(userId, userType, message.data);
        break;
      
      case 'assignment_update':
        await this.handleAssignmentUpdate(userId, userType, message.data);
        break;
      
      default:
        console.warn(`⚠️ Type de message inconnu: ${message.type}`);
    }
  }

  private async handleNewMessage(userId: string, userType: string, data: any) {
    try {
      const { assignmentId, content, messageType = 'text' } = data;

      // Sauvegarder le message en base
      const { data: savedMessage, error } = await this.supabase
        .from('message')
        .insert({
          assignment_id: assignmentId,
          content,
          message_type: messageType,
          sender_id: userId,
          sender_type: userType,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur sauvegarde message:', error);
        return;
      }

      // Récupérer les détails de l'assignation
      const { data: assignment } = await this.supabase
        .from('expertassignment')
        .select('expert_id, client_id')
        .eq('id', assignmentId)
        .single();

      if (!assignment) {
        console.error('❌ Assignation non trouvée:', assignmentId);
        return;
      }

      // Déterminer les destinataires
      const recipients = userType === 'expert' 
        ? [assignment.client_id] 
        : [assignment.expert_id];

      // Envoyer le message aux destinataires
      const messageToSend: WebSocketMessage = {
        type: 'message',
        data: {
          id: savedMessage.id,
          assignmentId,
          content,
          messageType,
          senderId: userId,
          senderType: userType,
          timestamp: savedMessage.timestamp
        },
        timestamp: new Date().toISOString()
      };

      recipients.forEach(recipientId => {
        this.sendToUser(recipientId, messageToSend);
      });

      // Créer une notification
      await this.createNotification(recipients[0], userType === 'expert' ? 'client' : 'expert', {
        title: 'Nouveau message',
        message: `Nouveau message dans l'assignation ${assignmentId}`,
        notification_type: 'message',
        related_id: assignmentId
      });

    } catch (error) {
      console.error('❌ Erreur traitement nouveau message:', error);
    }
  }

  private async handleTyping(userId: string, userType: string, data: any) {
    const { assignmentId, isTyping } = data;

    // Récupérer les destinataires
    const { data: assignment } = await this.supabase
      .from('expertassignment')
      .select('expert_id, client_id')
      .eq('id', assignmentId)
      .single();

    if (!assignment) return;

    const recipients = userType === 'expert' 
      ? [assignment.client_id] 
      : [assignment.expert_id];

    const typingMessage: WebSocketMessage = {
      type: 'typing',
      data: { assignmentId, userId, isTyping },
      timestamp: new Date().toISOString()
    };

    recipients.forEach(recipientId => {
      this.sendToUser(recipientId, typingMessage);
    });
  }

  private async handleMessageRead(userId: string, userType: string, data: any) {
    const { messageId } = data;

    // Marquer le message comme lu
    await this.supabase
      .from('message')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId);

    // Notifier l'expéditeur
    const { data: message } = await this.supabase
      .from('message')
      .select('sender_id, assignment_id')
      .eq('id', messageId)
      .single();

    if (message) {
      const readMessage: WebSocketMessage = {
        type: 'read',
        data: { messageId, readBy: userId },
        timestamp: new Date().toISOString()
      };

      this.sendToUser(message.sender_id, readMessage);
    }
  }

  private async handleAssignmentUpdate(userId: string, userType: string, data: any) {
    const { assignmentId, status, notes } = data;

    // Mettre à jour l'assignation
    const { data: updatedAssignment } = await this.supabase
      .from('expertassignment')
      .update({ status, notes, updated_at: new Date().toISOString() })
      .eq('id', assignmentId)
      .select('expert_id, client_id')
      .single();

    if (!updatedAssignment) return;

    // Notifier les deux parties
    const updateMessage: WebSocketMessage = {
      type: 'assignment_update',
      data: { assignmentId, status, notes },
      timestamp: new Date().toISOString()
    };

    this.sendToUser(updatedAssignment.expert_id, updateMessage);
    this.sendToUser(updatedAssignment.client_id, updateMessage);
  }

  private async sendUnreadMessages(userId: string, userType: string) {
    try {
      // Récupérer les messages non lus
      const { data: unreadMessages } = await this.supabase
        .from('message')
        .select('*')
        .eq('recipient_id', userId)
        .is('read_at', null)
        .order('timestamp', { ascending: true });

      if (unreadMessages && unreadMessages.length > 0) {
        const message: WebSocketMessage = {
          type: 'message',
          data: { unreadMessages },
          timestamp: new Date().toISOString()
        };

        this.sendToUser(userId, message);
      }
    } catch (error) {
      console.error('❌ Erreur envoi messages non lus:', error);
    }
  }

  private async createNotification(userId: string, userType: string, data: any) {
    try {
      await this.supabase
        .from('notification')
        .insert({
          user_id: userId,
          user_type: userType,
          title: data.title,
          message: data.message,
          notification_type: data.notification_type,
          related_id: data.related_id,
          priority: 'normal'
        });
    } catch (error) {
      console.error('❌ Erreur création notification:', error);
    }
  }

  private sendToUser(userId: string, message: WebSocketMessage) {
    const client = this.clients.get(userId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string) {
    const errorMessage: WebSocketMessage = {
      type: 'notification',
      data: { error },
      timestamp: new Date().toISOString()
    };
    ws.send(JSON.stringify(errorMessage));
  }

  private setupHeartbeat() {
    // Vérifier les connexions toutes les 30 secondes
    setInterval(() => {
      this.clients.forEach((client, userId) => {
        if (!client.isAlive) {
          console.log(`💀 Client inactif supprimé: ${userId}`);
          client.ws.terminate();
          this.clients.delete(userId);
          return;
        }

        client.isAlive = false;
        client.ws.ping();
      });
    }, 30000);
  }

  // Méthodes publiques pour utilisation externe
  public broadcastToExperts(message: WebSocketMessage) {
    this.clients.forEach((client, userId) => {
      if (client.userType === 'expert') {
        this.sendToUser(userId, message);
      }
    });
  }

  public broadcastToClients(message: WebSocketMessage) {
    this.clients.forEach((client, userId) => {
      if (client.userType === 'client') {
        this.sendToUser(userId, message);
      }
    });
  }

  public getConnectedUsers() {
    const users = {
      clients: 0,
      experts: 0,
      admins: 0
    };

    this.clients.forEach(client => {
      switch (client.userType) {
        case 'client':
          users.clients++;
          break;
        case 'expert':
          users.experts++;
          break;
        case 'admin':
          users.admins++;
          break;
      }
    });

    return users;
  }
} 