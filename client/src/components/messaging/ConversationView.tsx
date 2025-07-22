import React, { useEffect, useRef } from 'react';
import { useMessagingState, useMessagingActions, useMessagingUtils } from './MessagingProvider';
import { Conversation } from '@/types/messaging';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft,
  Shield,
  User,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { cn } from '@/lib/utils';

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
  const { messages, loading, sending, error, isConnected } = useMessagingState();
  const { sendMessage, sendTypingIndicator } = useMessagingActions();
  const { isOwnMessage, formatTime, getMessageStatus, isAdminConversation } = useMessagingUtils();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // ========================================
  // AUTO-SCROLL VERS LE BAS
  // ========================================

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ========================================
  // GESTION DE L'ENVOI DE MESSAGE
  // ========================================

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!conversation) return;
    
    try {
      await sendMessage(content, files);
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (!conversation) return;
    sendTypingIndicator(isTyping);
  };

  // ========================================
  // RENDU DU HEADER
  // ========================================

  const renderHeader = () => {
    if (!conversation) return null;

    const isAdmin = isAdminConversation(conversation);
    const participantName = isAdmin ? 'Support Administratif' : conversation.title || 'Conversation';

    return (
      <CardHeader className="border-b bg-gray-50/50">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback className={cn(
              "text-xs",
              isAdmin && "bg-blue-100 text-blue-600"
            )}>
              {isAdmin ? (
                <Shield className="w-3 h-3" />
              ) : (
                <User className="w-3 h-3" />
              )}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate">
              {participantName}
            </CardTitle>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Badge variant="secondary" className="text-xs">
                  Support
                </Badge>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                {isConnected ? (
                  <>
                    <Wifi className="w-3 h-3 text-green-500" />
                    <span>En ligne</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-gray-400" />
                    <span>Hors ligne</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
    );
  };

  // ========================================
  // RENDU DES MESSAGES
  // ========================================

  const renderMessages = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Chargement des messages...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-sm text-red-600 mb-2">Erreur lors du chargement</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {isAdminConversation(conversation) ? 'Support Administratif' : 'Nouvelle conversation'}
          </h3>
          <p className="text-xs text-gray-500">
            {isAdminConversation(conversation) 
              ? 'Nous sommes là pour vous aider. N\'hésitez pas à nous contacter !'
              : 'Commencez la conversation en envoyant un message.'
            }
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4 p-4">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isOwnMessage={isOwnMessage(message)}
            formatTime={formatTime}
            getMessageStatus={getMessageStatus}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    );
  };

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  if (!conversation) {
    return (
      <Card className={cn("h-full flex flex-col", className)}>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Sélectionnez une conversation</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      {renderHeader()}
      
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        {renderMessages()}
      </ScrollArea>
      
      <CardContent className="border-t p-4">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          disabled={!isConnected || sending}
          sending={sending}
          placeholder={
            isAdminConversation(conversation) 
              ? "Tapez votre message au support..."
              : "Tapez votre message..."
          }
        />
      </CardContent>
    </Card>
  );
}; 