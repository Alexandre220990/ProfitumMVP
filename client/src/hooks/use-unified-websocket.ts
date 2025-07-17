import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface WebSocketMessage {
  type: 'new_message' | 'message_read' | 'typing' | 'ping' | 'pong';
  conversation_id?: string;
  message?: any;
  message_id?: string;
  read_at?: string;
  user_id?: string;
  is_typing?: boolean;
  timestamp: string;
}

interface UseUnifiedWebSocketOptions {
  conversationId?: string;
  onNewMessage?: (message: any) => void;
  onMessageRead?: (messageId: string, readAt: string) => void;
  onTyping?: (userId: string, isTyping: boolean) => void;
  autoConnect?: boolean;
}

export const useUnifiedWebSocket = (options: UseUnifiedWebSocketOptions = {}) => {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!user?.id || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token d\'authentification manquant');
        setIsConnecting(false);
        return;
      }

      // Connexion au WebSocket unifié
      const ws = new WebSocket(`ws://[::1]:5003`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔌 WebSocket unifié connecté');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);

        // Authentification
        ws.send(JSON.stringify({
          type: 'auth',
          token,
          user_id: user.id,
          user_type: user.type
        }));

        // Démarrer le heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping toutes les 30 secondes
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          
          switch (data.type) {
            case 'new_message':
              if (data.conversation_id === options.conversationId) {
                options.onNewMessage?.(data.message);
              }
              break;
              
            case 'message_read':
              options.onMessageRead?.(data.message_id!, data.read_at!);
              break;
              
            case 'typing':
              if (data.conversation_id === options.conversationId) {
                options.onTyping?.(data.user_id!, data.is_typing!);
              }
              break;
              
            case 'pong':
              // Heartbeat reçu
              break;
              
            default:
              console.log('📨 Message WebSocket reçu:', data);
          }
        } catch (err) {
          console.error('❌ Erreur parsing message WebSocket:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket unifié déconnecté:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        
        // Nettoyer les intervalles
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Reconnexion automatique si pas de fermeture volontaire
        if (event.code !== 1000 && event.code !== 1001) {
          console.log('🔄 Tentative de reconnexion dans 5 secondes...');
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Erreur WebSocket unifié:', error);
        setError('Erreur de connexion WebSocket');
        setIsConnecting(false);
      };

    } catch (err) {
      console.error('❌ Erreur création WebSocket:', err);
      setError('Impossible de créer la connexion WebSocket');
      setIsConnecting(false);
    }
  }, [user?.id, user?.type, options.conversationId, options.onNewMessage, options.onMessageRead, options.onTyping]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Déconnexion volontaire');
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket non connecté, message non envoyé');
    }
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (options.conversationId) {
      sendMessage({
        type: 'typing',
        conversation_id: options.conversationId,
        user_id: user?.id,
        is_typing: isTyping,
        timestamp: new Date().toISOString()
      });
    }
  }, [options.conversationId, user?.id, sendMessage]);

  // Connexion automatique
  useEffect(() => {
    if (options.autoConnect !== false) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, options.autoConnect]);

  // Reconnexion quand l'utilisateur change
  useEffect(() => {
    if (user?.id && isConnected) {
      // Reconnecter avec le nouvel utilisateur
      disconnect();
      setTimeout(() => connect(), 1000);
    }
  }, [user?.id, user?.type]);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendMessage,
    sendTyping
  };
}; 