import React from 'react';
import { Message } from '@/types/messaging';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Check, CheckCheck, Clock, FileText, Image, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// COMPOSANT MESSAGE ITEM
// ============================================================================

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
  formatTime: (timestamp: string) => string;
  getMessageStatus: (message: Message) => 'sent' | 'delivered' | 'read';
  className?: string;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwnMessage,
  formatTime,
  getMessageStatus,
  className = ""
}) => {
  const messageStatus = getMessageStatus(message);
  const isFileMessage = message.message_type === 'file';
  const isImageMessage = message.metadata?.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  // ========================================
  // RENDU DU STATUT DU MESSAGE
  // ========================================

  const renderMessageStatus = () => {
    switch (messageStatus) {
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      default:
        return <Clock className="w-3 h-3 text-gray-300" />;
    }
  };

  // ========================================
  // RENDU DU CONTENU DU MESSAGE
  // ========================================

  const renderMessageContent = () => {
    if (isFileMessage) {
      return (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
          {isImageMessage ? (
            <Image className="w-4 h-4 text-blue-500" />
          ) : (
            <FileText className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-sm font-medium text-gray-700">
            {message.metadata?.file_name || 'Fichier'}
          </span>
          <Download className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600" />
        </div>
      );
    }

    return (
      <div className="text-sm leading-relaxed whitespace-pre-wrap">
        {message.content}
      </div>
    );
  };

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isOwnMessage ? "flex-row-reverse" : "flex-row",
      className
    )}>
      {/* Avatar */}
      <Avatar className={cn(
        "w-8 h-8",
        isOwnMessage ? "order-2" : "order-1"
      )}>
        <AvatarImage 
          src={message.sender_type === 'admin' ? '/images/admin-avatar.png' : undefined} 
        />
        <AvatarFallback className={cn(
          "text-xs font-medium",
          message.sender_type === 'admin' && "bg-blue-100 text-blue-600"
        )}>
          {message.sender_type === 'admin' ? 'A' : (typeof message.sender_name === 'string' && message.sender_name.length > 0 ? message.sender_name.charAt(0).toUpperCase() : 'U')}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={cn(
        "flex flex-col max-w-[70%]",
        isOwnMessage ? "order-1 items-end" : "order-2 items-start"
      )}>
        {/* Message Card */}
        <Card className={cn(
          "border-0 shadow-sm",
          isOwnMessage 
            ? "bg-blue-500 text-white" 
            : "bg-white border border-gray-200"
        )}>
          <CardContent className="p-3">
            {/* Sender Name (only for admin or non-own messages) */}
            {(!isOwnMessage || message.sender_type === 'admin') && (
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "text-xs font-medium",
                  isOwnMessage ? "text-blue-100" : "text-gray-600"
                )}>
                  {message.sender_type === 'admin' ? 'Support Administratif' : message.sender_name}
                </span>
                {message.sender_type === 'admin' && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    Support
                  </Badge>
                )}
              </div>
            )}

            {/* Message Content */}
            <div className={cn(
              isOwnMessage ? "text-white" : "text-gray-900"
            )}>
              {renderMessageContent()}
            </div>
          </CardContent>
        </Card>

        {/* Message Footer */}
        <div className={cn(
          "flex items-center gap-1 mt-1",
          isOwnMessage ? "flex-row-reverse" : "flex-row"
        )}>
          {/* Time */}
          <span className={cn(
            "text-xs",
            isOwnMessage ? "text-gray-500" : "text-gray-400"
          )}>
            {formatTime(message.created_at)}
          </span>

          {/* Status (only for own messages) */}
          {isOwnMessage && (
            <div className="flex items-center">
              {renderMessageStatus()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 