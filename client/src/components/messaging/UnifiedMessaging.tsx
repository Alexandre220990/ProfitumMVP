import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useMessaging } from "../../hooks/useWebSocket";
import { useAuth } from "../../hooks/use-auth";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Send, Check, CheckCheck, AlertCircle, Wifi, WifiOff } from "lucide-react";
import api from "../../lib/api";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_type: 'client' | 'expert';
  timestamp: string;
  read_at?: string;
}

interface Assignment {
  id: string;
  client_id: string;
  expert_id: string;
  produit_id: string;
  statut: string;
  created_at: string;
  client?: {
    company_name: string;
    first_name: string;
    last_name: string;
  };
  expert?: {
    first_name: string;
    last_name: string;
    specializations: string[];
  };
}

interface UnifiedMessagingProps {
  assignmentId: string;
}

// Optimisation : Composant Message optimisé avec React.memo
const MessageItem = React.memo(({
  message,
  isOwnMessage,
  formatTime,
  getMessageStatus
}: {
  message: Message;
  isOwnMessage: boolean;
  formatTime: (timestamp: string) => string;
  getMessageStatus: (message: Message) => React.ReactNode;
}) => (
  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`max-w-[70%] rounded-lg px-4 py-2 ${
        isOwnMessage
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-900'
      }`}
    >
      <div className="flex items-end space-x-2">
        <p className="text-sm">{message.content}</p>
        <div className="flex items-center space-x-1">
          <span className="text-xs opacity-70">
            {formatTime(message.timestamp)}
          </span>
          {getMessageStatus(message)}
        </div>
      </div>
    </div>
  </div>
));

MessageItem.displayName = 'MessageItem';

export default function UnifiedMessaging({ assignmentId }: UnifiedMessagingProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { isConnected, sendTextMessage, sendTypingIndicator, markMessageAsRead, lastMessage } = useMessaging(assignmentId);

  // Optimisation : Charger l'assignation avec useCallback
  const loadAssignment = useCallback(async () => {
    try {
      const response = await api.get(`/experts/assignments/${assignmentId}`);
      if (response.data.success) {
        setAssignment(response.data.data.assignment);
      }
    } catch (error) {
      console.error('❌ Erreur chargement assignation: ', error);
      setError('Erreur lors du chargement de l\'assignation');
    }
  }, [assignmentId]);

  // Optimisation : Charger les messages avec useCallback
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/experts/assignments/${assignmentId}/messages`);
      if (response.data.success) {
        setMessages(response.data.data.messages || []);
      }
    } catch (error) {
      console.error('❌ Erreur chargement messages: ', error);
      setError('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  // Charger l'assignation et les messages
  useEffect(() => {
    loadAssignment();
    loadMessages();
  }, [loadAssignment, loadMessages]);

  // Optimisation : Traiter les messages WebSocket avec useCallback
  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'message':
        if (message.data.unreadMessages) {
          // Messages non lus au démarrage
          setMessages((prev: Message[]) => [...prev, ...message.data.unreadMessages]);
        } else {
          // Nouveau message
          const newMsg = message.data;
          setMessages((prev: Message[]) => [...prev, newMsg]);
          
          // Marquer comme lu si c'est pour nous
          if (newMsg.sender_id !== user?.id) {
            markMessageAsRead(newMsg.id);
          }
        }
        break;
      
      case 'typing':
        if (message.data.userId !== user?.id) {
          setOtherUserTyping(message.data.isTyping);
        }
        break;
      
      case 'read':
        // Mettre à jour le statut de lecture
        setMessages((prev: Message[]) => prev.map((msg: Message) => 
          msg.id === message.data.messageId 
            ? { ...msg, read_at: new Date().toISOString() }
            : msg
        ));
        break;
    }
  }, [user?.id, markMessageAsRead]);

  // Traiter les messages WebSocket
  useEffect(() => {
    if (lastMessage) {
      handleWebSocketMessage(lastMessage);
    }
  }, [lastMessage, handleWebSocketMessage]);

  // Optimisation : Auto-scroll vers le bas avec useCallback
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, []);

  // Auto-scroll vers le bas
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Optimisation : Gestion des messages avec useCallback
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      // Envoyer via WebSocket si connecté
      if (isConnected) {
        sendTextMessage(messageContent);
      } else {
        // Fallback vers API REST
        const response = await api.post(`/experts/assignments/${assignmentId}/messages`, {
          content: messageContent,
          message_type: 'text'
        });

        if (response.data.success) {
          // Recharger les messages pour avoir l'ID
          await loadMessages();
        }
      }

      // Arrêter l'indicateur de frappe
      sendTypingIndicator(false);
    } catch (error) {
      console.error('❌ Erreur envoi message: ', error);
      setError('Erreur lors de l\'envoi du message');
      // Remettre le message dans l'input
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  }, [newMessage, isConnected, sendTextMessage, assignmentId, loadMessages, sendTypingIndicator]);

  // Optimisation : Gestion de la frappe avec useCallback
  const handleTyping = useCallback((value: string) => {
    setNewMessage(value);
    
    // Gérer l'indicateur de frappe
    if (isConnected) {
      if (!typingTimeoutRef.current && value.trim()) {
        sendTypingIndicator(true);
      } else if (typingTimeoutRef.current && !value.trim()) {
        sendTypingIndicator(false);
      }

      // Reset du timeout de frappe
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (value.trim()) {
        typingTimeoutRef.current = setTimeout(() => {
          sendTypingIndicator(false);
        }, 2000);
      }
    }
  }, [isConnected, sendTypingIndicator]);

  // Optimisation : Gestion des touches avec useCallback
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Optimisation : Formatage du temps avec useCallback
  const formatTime = useCallback((timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Optimisation : Statut des messages avec useCallback
  const getMessageStatus = useCallback((message: Message) => {
    if (message.sender_id !== user?.id) return null;
    
    if (message.read_at) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    } else {
      return <Check className="w-4 h-4 text-gray-400" />;
    }
  }, [user?.id]);

  // Optimisation : Vérification des messages avec useCallback
  const isOwnMessage = useCallback((message: Message) => {
    return message.sender_id === user?.id;
  }, [user?.id]);

  // Optimisation : Nom de l'autre utilisateur avec useMemo
  const otherUserName = useMemo(() => {
    if (!assignment) return 'Chargement...';
    
    if (user?.type === 'client' && assignment.expert) {
      return `${assignment.expert.first_name} ${assignment.expert.last_name}`;
    } else if (user?.type === 'expert' && assignment.client) {
      return assignment.client.company_name || `${assignment.client.first_name} ${assignment.client.last_name}`;
    }
    
    return 'Utilisateur';
  }, [assignment, user?.type]);

  // Optimisation : Avatar de l'autre utilisateur avec useMemo
  const otherUserAvatar = useMemo(() => {
    // Placeholder - à remplacer par les vraies photos
    return '';
  }, []);

  // Optimisation : Messages optimisés avec useMemo
  const optimizedMessages = useMemo(() => {
    return messages.map(message => ({
      ...message,
      isOwnMessage: isOwnMessage(message)
    }));
  }, [messages, isOwnMessage]);

  // Optimisation : Nettoyage des timeouts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadMessages}>Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={otherUserAvatar} />
              <AvatarFallback>{otherUserName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{otherUserName}</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? (
                    <>
                      <Wifi className="w-3 h-3 mr-1" />
                      En ligne
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 mr-1" />
                      Hors ligne
                    </>
                  )}
                </Badge>
                {otherUserTyping && (
                  <span className="text-sm text-gray-500 italic">
                    {otherUserName} est en train d'écrire...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {optimizedMessages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                isOwnMessage={message.isOwnMessage}
                formatTime={formatTime}
                getMessageStatus={getMessageStatus}
              />
            ))}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              disabled={sending}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {!isConnected && (
            <div className="mt-2 text-xs text-orange-600 flex items-center">
              <WifiOff className="w-3 h-3 mr-1" />
              Mode hors ligne - les messages peuvent être retardés
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 