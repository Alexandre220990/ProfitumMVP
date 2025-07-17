import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";

interface Conversation {
  id: string;
  dossierId: string;
  expertId: string;
  expertName: string;
  expertAvatar?: string;
  lastMessage?: {
    id: string;
    content: string;
    timestamp: string;
    read: boolean;
  };
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onConversationSelect: (conversationId: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({ 
  conversations, 
  selectedConversationId, 
  onConversationSelect 
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return date.toLocaleTimeString('fr-FR', { minute: '2-digit' });
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getMessageStatus = (message?: { read: boolean }) => {
    if (!message) return null;
    
    if (message.read) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    } else {
      return <Check className="h-3 w-3 text-gray-400" />;
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center text-gray-500">
          <p className="text-sm">Aucune conversation</p>
          <p className="text-xs mt-1">Vos conversations apparaîtront ici</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-1">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={cn(
              "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50",
              selectedConversationId === conversation.id && "bg-blue-50 border border-blue-200"
            )}
            onClick={() => onConversationSelect(conversation.id)}
          >
            {/* Avatar de l'expert */}
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={conversation.expertAvatar} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                  {conversation.expertName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              {/* Indicateur de statut en ligne */}
              {conversation.isActive && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>

            {/* Contenu de la conversation */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm text-gray-900 truncate">
                  {conversation.expertName}
                </h3>
                <div className="flex items-center space-x-1">
                  {conversation.lastMessage && (
                    <span className="text-xs text-gray-500">
                      {formatTime(conversation.lastMessage.timestamp)}
                    </span>
                  )}
                  {getMessageStatus(conversation.lastMessage)}
                </div>
              </div>
              
              <p className="text-xs text-gray-500 truncate">
                Dossier {conversation.dossierId}
              </p>
              
              {conversation.lastMessage && (
                <p className="text-xs text-gray-600 truncate mt-1">
                  {conversation.lastMessage.content}
                </p>
              )}
            </div>

            {/* Badge de messages non lus */}
            {conversation.unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {conversation.unreadCount}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}; 