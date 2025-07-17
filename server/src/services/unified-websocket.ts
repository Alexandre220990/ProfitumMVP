import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

interface UnifiedWebSocketMessage {
  type: 'auth' | 'new_message' | 'message_read' | 'typing' | 'ping' | 'pong';
  conversation_id?: string;
  message?: any;
  message_id?: string;
  read_at?: string;
  user_id?: string;
  is_typing?: boolean;
  data?: any;
  timestamp: string;
  token?: string;
  user_type?: string;
}

interface UnifiedConnection {
  ws: WebSocket;
  userId: string;
  userType: 'client' | 'expert' | 'admin';
  conversationIds: string[];
  isAlive: boolean;
}

export class UnifiedWebSocketService {
  private wss: WebSocketServer;
  private connections: Map<string, UnifiedConnection> = new Map();
  private supabase: any;

  constructor(server?: any) {
    this.wss = new WebSocketServer({ port: 5003 });
    console.log('🔌 Unified WebSocket Server démarré sur le port 5003');
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    this.initialize();
  }

  private initialize() {
    console.log('🔌 Unified WebSocket Server démarré');

    this.wss.on('connection', (ws: WebSocket, request: any) => {
      console.log('🔌 Nouvelle connexion Unified WebSocket');
      
      ws.on('message', async (data: Buffer) => {
        try {
          const message: UnifiedWebSocketMessage = JSON.parse(data.toString());
          
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

  private async handleAuth(ws: WebSocket, message: UnifiedWebSocketMessage) {
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
        conversationIds: [],
        isAlive: true
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

  private handleDisconnect(ws: WebSocket) {
    const connectionId = (ws as any).connectionId;
    if (connectionId) {
      this.connections.delete(connectionId);
      console.log(`🔌 Connexion fermée: ${connectionId}`);
    }
  }

  // Méthodes utilitaires manquantes
  private async getUserType(userId: string): Promise<'client' | 'expert' | 'admin'> {
    try {
      // Vérifier d'abord dans la table Client
      const { data: client, error: clientError } = await this.supabase
        .from('Client')
        .select('type')
        .eq('id', userId)
        .single();

      if (!clientError && client) {
        return (client.type as 'client' | 'expert' | 'admin') || 'client';
      }

      // Vérifier dans la table Expert
      const { data: expert, error: expertError } = await this.supabase
        .from('Expert')
        .select('type')
        .eq('id', userId)
        .single();

      if (!expertError && expert) {
        return (expert.type as 'client' | 'expert' | 'admin') || 'expert';
      }

      // Par défaut, considérer comme client
      return 'client';
    } catch (error) {
      console.error('❌ Erreur récupération type utilisateur:', error);
      return 'client';
    }
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Méthodes publiques pour le broadcasting

  public broadcastNewMessage(conversationId: string, message: any) {
    const messageData: UnifiedWebSocketMessage = {
      type: 'new_message',
      conversation_id: conversationId,
      message,
      timestamp: new Date().toISOString()
    };

    this.broadcastToConversation(conversationId, messageData);
  }

  public broadcastMessageRead(messageId: string, readAt: string) {
    const messageData: UnifiedWebSocketMessage = {
      type: 'message_read',
      message_id: messageId,
      read_at: readAt,
      timestamp: new Date().toISOString()
    };

    this.broadcastToAll(messageData);
  }

  public broadcastTyping(conversationId: string, userId: string, isTyping: boolean) {
    const messageData: UnifiedWebSocketMessage = {
      type: 'typing',
      conversation_id: conversationId,
      user_id: userId,
      is_typing: isTyping,
      timestamp: new Date().toISOString()
    };

    this.broadcastToConversation(conversationId, messageData);
  }

  private broadcastToConversation(conversationId: string, message: UnifiedWebSocketMessage) {
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

  private broadcastToAll(message: UnifiedWebSocketMessage) {
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
let unifiedWsService: UnifiedWebSocketService | null = null;

export const initializeUnifiedWebSocket = (server?: any) => {
  if (!unifiedWsService) {
    unifiedWsService = new UnifiedWebSocketService(server);
  }
  return unifiedWsService;
};

export const getUnifiedWebSocket = () => {
  if (!unifiedWsService) {
    throw new Error('Unified WebSocket Service non initialisé');
  }
  return unifiedWsService;
};

export default UnifiedWebSocketService; 