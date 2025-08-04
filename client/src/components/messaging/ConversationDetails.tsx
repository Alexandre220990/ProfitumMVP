import React from 'react';
import { Conversation } from '../../types/messaging';

interface ConversationDetailsProps {
  conversation: Conversation;
  userType: 'client' | 'expert' | 'admin';
}

export const ConversationDetails: React.FC<ConversationDetailsProps> = ({
  conversation,
  userType
}) => {
  const getConversationTypeLabel = (type: string): string => {
    switch (type) {
      case 'admin_support':
        return 'Support Administratif';
      case 'expert_client':
        return 'Expert-Client';
      case 'internal':
        return 'Interne';
      default:
        return type;
    }
  };

  const getPriorityLabel = (priority?: string): string => {
    switch (priority) {
      case 'urgent':
        return 'Urgent';
      case 'high':
        return 'Élevée';
      case 'medium':
        return 'Moyenne';
      case 'low':
        return 'Faible';
      default:
        return 'Non définie';
    }
  };

  const getAccessLevelLabel = (level?: string): string => {
    switch (level) {
      case 'public':
        return 'Public';
      case 'private':
        return 'Privé';
      case 'restricted':
        return 'Restreint';
      default:
        return 'Non défini';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-6">
        {/* En-tête de la conversation */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {conversation.title || 'Conversation'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {conversation.description || 'Aucune description'}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                conversation.status === 'active' ? 'bg-green-100 text-green-800' :
                conversation.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {conversation.status === 'active' ? 'Active' :
                 conversation.status === 'archived' ? 'Archivée' : 'Bloquée'}
              </span>
            </div>
          </div>
        </div>

        {/* Informations métier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informations générales</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Type</span>
                <span className="text-sm text-gray-900">
                  {getConversationTypeLabel(conversation.type)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Priorité</span>
                <span className={`text-sm font-medium ${
                  conversation.priority === 'urgent' ? 'text-red-600' :
                  conversation.priority === 'high' ? 'text-orange-600' :
                  conversation.priority === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {getPriorityLabel(conversation.priority)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Niveau d'accès</span>
                <span className="text-sm text-gray-900">
                  {getAccessLevelLabel(conversation.access_level)}
                </span>
              </div>
              
              {conversation.category && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Catégorie</span>
                  <span className="text-sm text-gray-900">{conversation.category}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Liens métier</h3>
            
            <div className="space-y-3">
              {conversation.client_id && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Client ID</span>
                  <span className="text-sm text-gray-900 font-mono">{conversation.client_id}</span>
                </div>
              )}
              
              {conversation.expert_id && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Expert ID</span>
                  <span className="text-sm text-gray-900 font-mono">{conversation.expert_id}</span>
                </div>
              )}
              
              {conversation.dossier_id && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Dossier ID</span>
                  <span className="text-sm text-gray-900 font-mono">{conversation.dossier_id}</span>
                </div>
              )}
              
              {conversation.produit_id && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Produit ID</span>
                  <span className="text-sm text-gray-900 font-mono">{conversation.produit_id}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        {conversation.tags && conversation.tags.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {conversation.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Informations temporelles */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Informations temporelles</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Créée le</span>
                <span className="text-sm text-gray-900">
                  {formatDate(conversation.created_at)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Modifiée le</span>
                <span className="text-sm text-gray-900">
                  {formatDate(conversation.updated_at)}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              {conversation.last_message_at && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Dernier message</span>
                  <span className="text-sm text-gray-900">
                    {formatDate(conversation.last_message_at)}
                  </span>
                </div>
              )}
              
              {conversation.created_by && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Créée par</span>
                  <span className="text-sm text-gray-900 font-mono">{conversation.created_by}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Participants */}
        {conversation.otherParticipant && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Participant</h3>
            
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                conversation.otherParticipant.type === 'admin' ? 'bg-red-500' :
                conversation.otherParticipant.type === 'expert' ? 'bg-blue-500' :
                'bg-green-500'
              }`}>
                {conversation.otherParticipant.name.charAt(0).toUpperCase()}
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {conversation.otherParticipant.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {conversation.otherParticipant.type}
                  {conversation.otherParticipant.isOnline && (
                    <span className="ml-2 text-green-600">• En ligne</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 