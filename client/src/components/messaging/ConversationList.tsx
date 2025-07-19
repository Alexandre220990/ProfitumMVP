import React, { useState } from 'react';
import { useMessaging } from '@/hooks/use-messaging';
import { useAuth } from '@/hooks/use-auth';
import { Conversation, Message } from '@/types/messaging';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Search, 
  Plus, 
  MoreVertical,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ============================================================================
// COMPOSANT LISTE DES CONVERSATIONS
// ============================================================================

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
  className?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation,
  selectedConversationId,
  className = ""
}) => {
  const { user } = useAuth();
  const {
    conversations,
    loading,
    error,
    isUserOnline,
    getUnreadCount,
    archiveConversation,
    refreshData
  } = useMessaging();

  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Filtrer les conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.participant1_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.participant2_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesArchive = showArchived ? conv.is_archived : !conv.is_archived;
    
    return matchesSearch && matchesArchive;
  });

  // Obtenir le nom de l'autre participant
  const getOtherParticipantName = (conversation: Conversation): string => {
    if (conversation.participant1_id === user?.id) {
      return conversation.participant2_id;
    }
    return conversation.participant1_id;
  };

  // Obtenir le type de l'autre participant
  const getOtherParticipantType = (conversation: Conversation): string => {
    if (conversation.participant1_id === user?.id) {
      return conversation.participant2_type;
    }
    return conversation.participant1_type;
  };

  // Formater la date du dernier message
  const formatLastMessageDate = (dateString?: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 168) { // 7 jours
      return `${Math.floor(diffInHours / 24)}j`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  // Gérer l'archivage d'une conversation
  const handleArchive = async (conversationId: string) => {
    try {
      await archiveConversation(conversationId);
    } catch (error) {
      console.error('❌ Erreur archivage:', error);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Erreur lors du chargement des conversations</p>
            <Button onClick={refreshData} variant="outline">
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversations
          </div>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
        
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher une conversation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtres */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={showArchived ? "outline" : "default"}
            onClick={() => setShowArchived(false)}
          >
            Actives
          </Button>
          <Button
            size="sm"
            variant={showArchived ? "default" : "outline"}
            onClick={() => setShowArchived(true)}
          >
            Archivées
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">
              {showArchived ? 'Aucune conversation archivée' : 'Aucune conversation'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => {
              const otherParticipantName = getOtherParticipantName(conversation);
              const otherParticipantType = getOtherParticipantType(conversation);
              const isOnline = isUserOnline(otherParticipantName);
              const unreadCount = getUnreadCount(conversation.id);
              const isSelected = selectedConversationId === conversation.id;

              return (
                <div
                  key={conversation.id}
                  className={`
                    flex items-center space-x-3 p-3 cursor-pointer transition-colors
                    ${isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : 'hover:bg-gray-50'}
                    ${conversation.is_archived ? 'opacity-60' : ''}
                  `}
                  onClick={() => onSelectConversation(conversation)}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-sm">
                        {otherParticipantName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium truncate">
                        {conversation.title || otherParticipantName}
                      </h4>
                      <div className="flex items-center space-x-1">
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {unreadCount}
                          </Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleArchive(conversation.id)}>
                              {conversation.is_archived ? 'Désarchiver' : 'Archiver'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 truncate">
                        {otherParticipantType === 'expert' ? '👨‍💼 Expert' : 
                         otherParticipantType === 'admin' ? '👨‍💻 Admin' : '👤 Client'}
                      </p>
                      {conversation.last_message_at && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatLastMessageDate(conversation.last_message_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 