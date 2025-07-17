import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from '@supabase/supabase-js';
import { IncomingMessage } from 'http';
import { URL } from 'url';

interface WebSocketMessage {
  type: 'auth' | 'new_message' | 'message_read' | 'typing' | 'ping' | 'pong';
  token?: string;
  conversation_id?: string;
  message?: any;
  message_id?: string;
  read_at?: string;
  user_id?: string;
  is_typing?: boolean;
}

interface AuthenticatedConnection {
  ws: WebSocket;
  userId: string;
  userType: 'client' | 'expert' | 'admin';
  conversationIds: string[];
}

class MessagingWebSocketServer {
  private wss: WebSocketServer;
  private connections: Map<string, AuthenticatedConnection> = new Map();
  private supabase: any;

  constructor(port: number = 5002) {
    this.wss = new WebSocketServer({ port: 5002 });
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    this.initialize();
  }

  private initialize() {
    console.log('🔌 WebSocket Server démarré sur le port 5002');

    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      console.log('🔌 Nouvelle connexion WebSocket');
      
      // Authentification initiale
      ws.on('message', async (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          
          switch (message.type) {
            case 'auth':
              await this.handleAuth(ws, message);
              break;
            case 'ping':
              ws.send(JSON.stringify({ type: 'pong' }));
              break;
            default:
              console.log('❌ Type de message non reconnu:', message.type);
          }
        } catch (error) {
          console.error('❌ Erreur traitement message WebSocket:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Erreur de traitement du message' 
          }));
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('❌ Erreur WebSocket:', error);
        this.handleDisconnect(ws);
      });
    });
  }

  private async handleAuth(ws: WebSocket, message: WebSocketMessage) {
    try {
      if (!message.token) {
        ws.send(JSON.stringify({ 
          type: 'auth_error', 
          message: 'Token manquant' 
        }));
        return;
      }

      // Vérifier le token avec Supabase
      const { data: { user }, error } = await this.supabase.auth.getUser(message.token);
      
      if (error || !user) {
        ws.send(JSON.stringify({ 
          type: 'auth_error', 
          message: 'Token invalide' 
        }));
        return;
      }

      // Récupérer le type d'utilisateur
      const userType = await this.getUserType(user.id);
      
      // Enregistrer la connexion
      const connectionId = this.generateConnectionId();
      this.connections.set(connectionId, {
        ws,
        userId: user.id,
        userType,
        conversationIds: []
      });

      // Associer la connexion au WebSocket
      (ws as any).connectionId = connectionId;

      console.log(`✅ Utilisateur authentifié: ${user.id} (${userType})`);
      
      ws.send(JSON.stringify({ 
        type: 'auth_success', 
        user_id: user.id,
        user_type: userType
      }));

    } catch (error) {
      console.error('❌ Erreur authentification WebSocket:', error);
      ws.send(JSON.stringify({ 
        type: 'auth_error', 
        message: 'Erreur d\'authentification' 
      }));
    }
  }

  private async getUserType(userId: string): Promise<'client' | 'expert' | 'admin'> {
    try {
      // Vérifier dans la table Client
      const { data: client } = await this.supabase
        .from('Client')
        .select('id')
        .eq('id', userId)
        .single();

      if (client) return 'client';

      // Vérifier dans la table Expert
      const { data: expert } = await this.supabase
        .from('Expert')
        .select('id')
        .eq('id', userId)
        .single();

      if (expert) return 'expert';

      // Par défaut admin
      return 'admin';
    } catch (error) {
      console.error('❌ Erreur détermination type utilisateur:', error);
      return 'admin';
    }
  }

  private handleDisconnect(ws: WebSocket) {
    const connectionId = (ws as any).connectionId;
    if (connectionId) {
      this.connections.delete(connectionId);
      console.log(`🔌 Connexion fermée: ${connectionId}`);
    }
  }

  private generateConnectionId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Méthodes publiques pour le broadcasting

  public broadcastNewMessage(conversationId: string, message: any) {
    const messageData = {
      type: 'new_message',
      conversation_id: conversationId,
      message
    };

    this.broadcastToConversation(conversationId, messageData);
  }

  public broadcastMessageRead(messageId: string, readAt: string) {
    const messageData = {
      type: 'message_read',
      message_id: messageId,
      read_at: readAt
    };

    // Broadcast à tous les participants de la conversation
    this.broadcastToAll(messageData);
  }

  public broadcastTyping(conversationId: string, userId: string, isTyping: boolean) {
    const messageData = {
      type: 'typing',
      conversation_id: conversationId,
      user_id: userId,
      is_typing: isTyping
    };

    this.broadcastToConversation(conversationId, messageData);
  }

  private broadcastToConversation(conversationId: string, message: any) {
    this.connections.forEach((connection) => {
      if (connection.conversationIds.includes(conversationId)) {
        try {
          connection.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('❌ Erreur envoi message WebSocket:', error);
          this.handleDisconnect(connection.ws);
        }
      }
    });
  }

  private broadcastToAll(message: any) {
    this.connections.forEach((connection) => {
      try {
        connection.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('❌ Erreur envoi message WebSocket:', error);
        this.handleDisconnect(connection.ws);
      }
    });
  }

  public addUserToConversation(userId: string, conversationId: string) {
    this.connections.forEach((connection) => {
      if (connection.userId === userId && !connection.conversationIds.includes(conversationId)) {
        connection.conversationIds.push(conversationId);
      }
    });
  }

  public removeUserFromConversation(userId: string, conversationId: string) {
    this.connections.forEach((connection) => {
      if (connection.userId === userId) {
        connection.conversationIds = connection.conversationIds.filter(id => id !== conversationId);
      }
    });
  }

  public getConnectionCount(): number {
    return this.connections.size;
  }

  public getActiveUsers(): string[] {
    return Array.from(this.connections.values()).map(conn => conn.userId);
  }
}

// Instance singleton
let wsServer: MessagingWebSocketServer | null = null;

export const initializeWebSocketServer = () => {
  if (!wsServer) {
    wsServer = new MessagingWebSocketServer(5002);
  }
  return wsServer;
};

export const getWebSocketServer = () => {
  if (!wsServer) {
    throw new Error('WebSocket Server non initialisé. Appelez initializeWebSocketServer() d\'abord.');
  }
  return wsServer;
};

export default MessagingWebSocketServer; 