import React, { useState, useCallback, useMemo } from 'react';
import { useMessagingState, useMessagingActions } from './MessagingProvider';
import { Conversation } from '@/types/messaging';
import { ConversationList } from './ConversationList';
import { ConversationView } from './ConversationView';
// import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  ArrowLeft,
  Loader2,
  Plus,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// COMPOSANT PRINCIPAL DE MESSAGERIE
// ============================================================================

interface MessagingAppProps {
  className?: string;
  showHeader?: boolean;
  headerTitle?: string;
}

export const MessagingApp: React.FC<MessagingAppProps> = ({
  className = "",
  showHeader = true,
  headerTitle = "Messagerie"
}) => {
  const { conversations, currentConversation, loading, error } = useMessagingState();
  const { selectConversation } = useMessagingActions();
  
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  // ========================================
  // DÉTECTION MOBILE
  // ========================================

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ========================================
  // GESTION DE LA SÉLECTION
  // ========================================

  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
    selectConversation(conversation);
  }, [selectConversation]);

  const handleBackToList = useCallback(() => {
    setSelectedConversation(null);
    selectConversation(null);
  }, [selectConversation]);

  // ========================================
  // ÉTAT COMPUTÉ
  // ========================================

  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((total: number, conv: Conversation) => {
      return total + (conv.unread_count || 0);
    }, 0);
  }, [conversations]);
  const currentConv = selectedConversation || currentConversation;

  // ========================================
  // RENDU DU HEADER
  // ========================================

  const renderHeader = () => {
    if (!showHeader) return null;

    return (
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-3">
          {isMobileView && currentConv && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToList}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h1 className="text-lg font-semibold text-gray-900">{headerTitle}</h1>
            {totalUnreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {totalUnreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // RENDU DU CONTENU PRINCIPAL
  // ========================================

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Chargement de la messagerie...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-sm text-red-600 mb-2">Erreur lors du chargement</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        </div>
      );
    }

    if (isMobileView) {
      // Vue mobile : une conversation à la fois
      return currentConv ? (
        <ConversationView
          conversation={currentConv}
          onBack={handleBackToList}
          className="h-full"
        />
      ) : (
        <ConversationList
          onSelectConversation={handleSelectConversation}
          className="h-full"
        />
      );
    }

    // Vue desktop : sidebar + conversation
    return (
      <div className="flex h-full">
        <div className="w-80 border-r">
          <ConversationList
            onSelectConversation={handleSelectConversation}
            selectedConversationId={currentConv?.id}
            className="h-full border-0 rounded-none"
          />
        </div>
        <div className="flex-1">
          <ConversationView
            conversation={currentConv}
            className="h-full border-0 rounded-none"
          />
        </div>
      </div>
    );
  };

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <div className={cn("h-full flex flex-col bg-gray-50", className)}>
      {renderHeader()}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

// ============================================================================
// COMPOSANT EN-TÊTE DE MESSAGERIE - SÉPARÉ
// ============================================================================

interface MessagingHeaderProps {
  totalUnreadCount: number;
  onNewConversation: () => void;
  onSettings: () => void;
}

export const MessagingHeader: React.FC<MessagingHeaderProps> = ({
  totalUnreadCount,
  onNewConversation,
  onSettings
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Messagerie</h2>
        {totalUnreadCount > 0 && (
          <Badge variant="destructive" className="text-xs">
            {totalUnreadCount}
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onNewConversation}>
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onSettings}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// COMPOSANT NOTIFICATION DE MESSAGERIE - SÉPARÉ
// ============================================================================

interface MessagingNotificationProps {
  conversation: Conversation;
  message: string;
  onOpen: () => void;
  onDismiss: () => void;
}

export const MessagingNotification: React.FC<MessagingNotificationProps> = ({
  conversation,
  message,
  onOpen,
  onDismiss
}) => {
  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white border rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium">{conversation.title}</h4>
            <p className="text-xs text-gray-600 truncate">{message}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onOpen}>
            Ouvrir
          </Button>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            ✕
          </Button>
        </div>
      </div>
    </div>
  );
}; 