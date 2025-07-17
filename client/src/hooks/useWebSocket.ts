import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { useAuth } from "./use-auth";

interface WebSocketMessage {
  type: 'message' | 'typing' | 'read' | 'notification' | 'assignment_update';
  data: any;
  timestamp: string;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = useMemo(() => 5, []);
  const [isWebSocketEnabled] = useState<boolean>(true); // Réactivé

  const connect = useCallback(() => {
    if (!isWebSocketEnabled) {
      console.log('🔌 WebSocket: Désactivé temporairement');
      return;
    }

    const token = localStorage.getItem('token');
    
    if (!user || !token) {
      console.log('🔌 WebSocket: Utilisateur non authentifié');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔌 WebSocket: Déjà connecté');
      return;
    }

    try {
      const wsUrl = `ws://[::1]:5002?token=${token}`;
      console.log('🔌 WebSocket: Tentative de connexion...');
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket: Connexion établie');
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket: Message reçu: ', message.type);
          setLastMessage(message);
          
          // Traiter les différents types de messages
          handleMessage(message);
        } catch (error) {
          console.error('❌ WebSocket: Erreur parsing message: ', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket: Connexion fermée: ', event.code, event.reason);
        setIsConnected(false);
        
        // Reconnexion automatique avec backoff exponentiel optimisé
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`🔄 WebSocket: Reconnexion dans ${delay}ms (tentative ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else {
          console.error('❌ WebSocket: Nombre maximum de tentatives de reconnexion atteint');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket: Erreur: ', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('❌ WebSocket: Erreur création connexion: ', error);
      setIsConnected(false);
    }
  }, [user, isWebSocketEnabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    reconnectAttempts.current = 0;
    console.log('🔌 WebSocket: Déconnexion manuelle');
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (!isWebSocketEnabled) {
      console.log('🔌 WebSocket: Désactivé, message ignoré');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      console.log('📤 WebSocket: Message envoyé: ', message.type);
    } else {
      console.warn('⚠️ WebSocket: Impossible d\'envoyer le message - connexion fermée');
    }
  }, [isWebSocketEnabled]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    // Gestionnaire de messages optimisé avec switch
    switch (message.type) {
      case 'message':
        console.log('💬 Nouveau message reçu: ', message.data);
        // Ici vous pouvez dispatcher vers un store global ou mettre à jour l'état local
        break;
      
      case 'typing':
        console.log('⌨️ Indicateur de frappe: ', message.data);
        break;
      
      case 'read':
        console.log('👁️ Message lu: ', message.data);
        break;
      
      case 'notification':
        console.log('🔔 Notification reçue: ', message.data);
        // Ici vous pouvez afficher une notification toast
        break;
      
      case 'assignment_update':
        console.log('📋 Mise à jour assignation: ', message.data);
        break;
      
      default:
        console.warn('⚠️ Type de message WebSocket inconnu: ', message.type);
    }
  }, []);

  // Connexion automatique optimisée quand l'utilisateur est authentifié
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (user && token && isWebSocketEnabled) {
      connect();
    } else {
      disconnect();
    }

    // Nettoyage à la déconnexion
    return () => {
      disconnect();
    };
  }, [user, connect, disconnect, isWebSocketEnabled]);

  // Nettoyage au démontage du composant
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { isConnected, sendMessage, lastMessage, connect, disconnect };
}

// Hook spécialisé pour la messagerie optimisé
export function useMessaging(assignmentId?: string) {
  const { isConnected, sendMessage, lastMessage } = useWebSocket();

  const sendTextMessage = useCallback((content: string) => {
    if (!assignmentId) {
      console.warn('⚠️ AssignmentId requis pour envoyer un message');
      return;
    }

    sendMessage({
      type: 'message',
      data: {
        assignmentId,
        content,
        messageType: 'text'
      },
      timestamp: new Date().toISOString()
    });
  }, [assignmentId, sendMessage]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!assignmentId) return;

    sendMessage({
      type: 'typing',
      data: {
        assignmentId,
        isTyping
      },
      timestamp: new Date().toISOString()
    });
  }, [assignmentId, sendMessage]);

  const markMessageAsRead = useCallback((messageId: string) => {
    sendMessage({
      type: 'read',
      data: { messageId },
      timestamp: new Date().toISOString()
    });
  }, [sendMessage]);

  return { isConnected, sendTextMessage, sendTypingIndicator, markMessageAsRead, lastMessage };
} 