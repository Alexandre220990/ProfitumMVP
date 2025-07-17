import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useMessaging } from "../../hooks/useWebSocket";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { 
  Send, 
  Check, 
  CheckCheck,
  AlertCircle
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderType: 'client' | 'expert';
  timestamp: string;
  readAt?: string;
}

interface RealTimeMessagingProps {
  assignmentId: string;
  currentUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
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

export function RealTimeMessaging({ 
  assignmentId, 
  currentUserId, 
  otherUserName, 
  otherUserAvatar 
}: RealTimeMessagingProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isConnected, 
    sendTextMessage, 
    sendTypingIndicator, 
    markMessageAsRead, 
    lastMessage 
  } = useMessaging(assignmentId);

  // Optimisation : Charger les messages existants avec useCallback
  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/experts/assignments/${assignmentId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erreur chargement messages: ', error);
      setError('Impossible de charger les messages');
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId]);

  // Charger les messages existants
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Optimisation : Traiter les nouveaux messages WebSocket avec useCallback
  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'message':
        if (message.data.unreadMessages) {
          // Messages non lus au démarrage
          setMessages(prev => [...prev, ...message.data.unreadMessages]);
        } else {
          // Nouveau message
          const newMsg = message.data;
          setMessages(prev => [...prev, newMsg]);
          
          // Marquer comme lu si c'est pour nous
          if (newMsg.senderId !== currentUserId) {
            markMessageAsRead(newMsg.id);
          }
        }
        break;
      
      case 'typing':
        if (message.data.userId !== currentUserId) {
          setOtherUserTyping(message.data.isTyping);
        }
        break;
      
      case 'read':
        // Mettre à jour le statut de lecture
        setMessages(prev => prev.map(msg => 
          msg.id === message.data.messageId 
            ? { ...msg, readAt: new Date().toISOString() }
            : msg
        ));
        break;
    }
  }, [currentUserId, markMessageAsRead]);

  // Traiter les nouveaux messages WebSocket
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
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !isConnected) return;

    sendTextMessage(newMessage.trim());
    setNewMessage('');
    
    // Arrêter l'indicateur de frappe
    sendTypingIndicator(false);
    setIsTyping(false);
  }, [newMessage, isConnected, sendTextMessage, sendTypingIndicator]);

  // Optimisation : Gestion de la frappe avec debouncing
  const handleTyping = useCallback((value: string) => {
    setNewMessage(value);
    
    // Debouncing pour l'indicateur de frappe
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (value.trim()) {
      if (!isTyping) {
        setIsTyping(true);
        sendTypingIndicator(true);
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTypingIndicator(false);
      }, 2000);
    } else {
      setIsTyping(false);
      sendTypingIndicator(false);
    }
  }, [isTyping, sendTypingIndicator]);

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
    if (message.senderId !== currentUserId) return null;
    
    if (message.readAt) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    } else {
      return <Check className="w-4 h-4 text-gray-400" />;
    }
  }, [currentUserId]);

  // Optimisation : Messages optimisés avec useMemo
  const optimizedMessages = useMemo(() => {
    return messages.map(message => ({
      ...message,
      isOwnMessage: message.senderId === currentUserId
    }));
  }, [messages, currentUserId]);

  // Optimisation : Nettoyage des timeouts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Optimisation : Retry automatique en cas d'erreur
  const handleRetry = useCallback(() => {
    loadMessages();
  }, [loadMessages]);

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
                  {isConnected ? "En ligne" : "Hors ligne"}
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
            {error ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-sm text-gray-600 mb-2">{error}</p>
                <Button onClick={handleRetry} variant="outline" size="sm">
                  Réessayer
                </Button>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : optimizedMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Aucun message pour le moment</p>
                <p className="text-sm">Commencez la conversation !</p>
              </div>
            ) : (
              optimizedMessages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  isOwnMessage={message.isOwnMessage}
                  formatTime={formatTime}
                  getMessageStatus={getMessageStatus}
                />
              ))
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              disabled={!isConnected || isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isConnected || isLoading}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {isTyping && (
            <div className="mt-2 text-xs text-gray-500">
              Vous êtes en train d'écrire...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 