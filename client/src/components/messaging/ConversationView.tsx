import React, { useState, useEffect, useRef } from 'react';
import { useMessaging } from '@/hooks/use-messaging';
import { useAuth } from '@/hooks/use-auth';
import { Conversation, Message } from '@/types/messaging';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Paperclip, 
  MoreVertical,
  Phone,
  Video,
  Info,
  ArrowLeft
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ============================================================================
// COMPOSANT VUE DE CONVERSATION
// ============================================================================

interface ConversationViewProps {
  conversation: Conversation | null;
  onBack?: () => void;
  className?: string;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  conversation,
  onBack,
  className = ""
}) => {
  const { user } = useAuth();
  const {
    messages,
    loading,
    error,
    isUserOnline,
    isUserTyping,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    selectConversation,
  } = useMessaging();

  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sélectionner la conversation quand elle change
  useEffect(() => {
    if (conversation) {
      selectConversation(conversation.id);
      markAsRead(conversation.id);
    }
  }, [conversation?.id, selectConversation, markAsRead]);

  // Gestion de la frappe
  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;
    
    if (isTyping && conversation) {
      startTyping(conversation.id);
      typingTimeout = setTimeout(() => {
        setIsTyping(false);
        stopTyping(conversation.id);
      }, 3000);
    }

    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      if (conversation) {
        stopTyping(conversation.id);
      }
    };
  }, [isTyping, conversation, startTyping, stopTyping]);

  // Gérer l'envoi de message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    try {
      await sendMessage(newMessage.trim());
      setNewMessage('');
      setIsTyping(false);
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
    }
  };

  // Gérer la frappe
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
    }
  };

  // Gérer la touche Entrée
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Obtenir le nom de l'autre participant
  const getOtherParticipantName = (): string => {
    if (!conversation || !user) return '';
    
    if (conversation.participant1_id === user.id) {
      return conversation.participant2_id;
    }
    return conversation.participant1_id;
  };

  // Obtenir le type de l'autre participant
  const getOtherParticipantType = (): string => {
    if (!conversation || !user) return '';
    
    if (conversation.participant1_id === user.id) {
      return conversation.participant2_type;
    }
    return conversation.participant1_type;
  };

  // Formater la date d'un message
  const formatMessageDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return date.toLocaleTimeString('fr-FR', { minute: '2-digit' });
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  // Vérifier si un message est de l'utilisateur actuel
  const isOwnMessage = (message: Message): boolean => {
    return message.sender_id === user?.id;
  };

  if (!conversation) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium mb-2">Aucune conversation sélectionnée</p>
            <p className="text-sm">Sélectionnez une conversation pour commencer à discuter</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const otherParticipantName = getOtherParticipantName();
  const otherParticipantType = getOtherParticipantType();
  const isOtherUserOnline = isUserOnline(otherParticipantName);
  const isOtherUserTyping = isUserTyping(conversation.id, otherParticipantName);

  return (
    <Card className={className}>
      {/* En-tête de la conversation */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
                <AvatarFallback className="text-sm">
                  {otherParticipantName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOtherUserOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            
            <div>
              <CardTitle className="text-base">
                {conversation.title || otherParticipantName}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {otherParticipantType === 'expert' ? '👨‍💼 Expert' : 
                   otherParticipantType === 'admin' ? '👨‍💻 Admin' : '👤 Client'}
                </Badge>
                <span className="text-xs text-gray-500">
                  {isOtherUserOnline ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Info className="h-4 w-4 mr-2" />
                  Informations
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Zone des messages */}
        <div className="h-96 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                    <div className="max-w-xs bg-gray-200 rounded-lg p-3 animate-pulse">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">Erreur lors du chargement des messages</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Aucun message</p>
                <p className="text-xs mt-1">Commencez la conversation !</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs ${isOwnMessage(message) ? 'order-2' : 'order-1'}`}>
                      {!isOwnMessage(message) && (
                        <Avatar className="h-6 w-6 mb-1">
                          <AvatarImage src="" />
                          <AvatarFallback className="text-xs">
                            {message.sender_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    
                    <div className={`max-w-xs ${isOwnMessage(message) ? 'order-1' : 'order-2'}`}>
                      <div
                        className={`
                          rounded-lg p-3 text-sm
                          ${isOwnMessage(message) 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 text-gray-900'
                          }
                        `}
                      >
                        <p className="break-words">{message.content}</p>
                      </div>
                      
                      <div className={`flex items-center justify-between mt-1 text-xs text-gray-500 ${isOwnMessage(message) ? 'text-right' : 'text-left'}`}>
                        <span>{formatMessageDate(message.created_at)}</span>
                        {isOwnMessage(message) && (
                          <span>
                            {message.is_read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Indicateur de frappe */}
                {isOtherUserTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Zone de saisie */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <Input
                ref={inputRef}
                placeholder="Tapez votre message..."
                value={newMessage}
                onChange={handleTyping}
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={loading}
              />
              
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || loading}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 