import React, { useState, useEffect } from 'react';
import { Conversation } from '../../types/messaging';
import { messagingService } from '../../services/messaging-service';

interface ConversationListProps {
  onConversationSelect: (conversation: Conversation) => void;
  selectedConversationId?: string;
  userType: 'client' | 'expert' | 'admin';
}

export const ConversationList: React.FC<ConversationListProps> = ({
  onConversationSelect,
  selectedConversationId,
  userType
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      // Utiliser l'instance exportée
      const conversationsData = await messagingService.getConversations();
      setConversations(conversationsData);
    } catch (err) {
      setError('Erreur lors du chargement des conversations');
      console.error('Erreur chargement conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getConversationTitle = (conversation: Conversation): string => {
    // Utiliser le titre de la conversation si disponible
    if (conversation.title) {
      return conversation.title;
    }

    // Utiliser les nouvelles colonnes métier pour générer un titre
    if (conversation.type === 'admin_support') {
      if (conversation.client_id) {
        return `Support Administratif - Client`;
      }
      if (conversation.expert_id) {
        return `Support Administratif - Expert`;
      }
    }

    if (conversation.type === 'expert_client') {
      return `Conversation Expert-Client`;
    }

    return 'Conversation';
  };

  const getConversationIcon = (conversation: Conversation): string => {
    switch (conversation.type) {
      case 'admin_support':
        return '🛠️';
      case 'expert_client':
        return '💬';
      case 'internal':
        return '🏢';
      default:
        return '💬';
    }
  };

  const getPriorityColor = (priority?: string): string => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatLastMessageTime = (lastMessageAt?: string): string => {
    if (!lastMessageAt) return '';
    
    const date = new Date(lastMessageAt);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadConversations}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-500">Aucune conversation trouvée</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => onConversationSelect(conversation)}
          className={`
            p-4 rounded-lg cursor-pointer transition-colors
            ${selectedConversationId === conversation.id 
              ? 'bg-blue-100 border-l-4 border-blue-600' 
              : 'bg-white hover:bg-gray-50 border border-gray-200'
            }
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <span className="text-xl">{getConversationIcon(conversation)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-gray-900 truncate">
                    {getConversationTitle(conversation)}
                  </h3>
                  {conversation.priority && (
                    <span className={`text-xs font-medium ${getPriorityColor(conversation.priority)}`}>
                      {conversation.priority.toUpperCase()}
                    </span>
                  )}
                </div>
                
                {conversation.otherParticipant && (
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.otherParticipant.name}
                  </p>
                )}
                
                {conversation.last_message && (
                  <p className="text-sm text-gray-500 truncate mt-1">
                    {conversation.last_message.content}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-1">
              {conversation.last_message_at && (
                <span className="text-xs text-gray-400">
                  {formatLastMessageTime(conversation.last_message_at)}
                </span>
              )}
              
              {conversation.unread_count > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {conversation.unread_count}
                </span>
              )}
            </div>
          </div>
          
          {/* Métadonnées de la conversation */}
          <div className="mt-2 flex items-center space-x-2 text-xs text-gray-400">
            {conversation.category && (
              <span className="bg-gray-100 px-2 py-1 rounded">
                {conversation.category}
              </span>
            )}
            {conversation.access_level && (
              <span className="bg-gray-100 px-2 py-1 rounded">
                {conversation.access_level}
              </span>
            )}
            {conversation.tags && conversation.tags.length > 0 && (
              <span className="bg-gray-100 px-2 py-1 rounded">
                {conversation.tags[0]}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}; 