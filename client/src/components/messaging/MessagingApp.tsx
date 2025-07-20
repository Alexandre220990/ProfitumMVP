import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConversationList } from './ConversationList';
import { ConversationView } from './ConversationView';
import { useMessaging } from '@/hooks/use-messaging';
import { Conversation } from '@/types/messaging';
import { 
  MessageSquare, 
  Plus,
  Settings
} from 'lucide-react';

// ============================================================================
// HOOK PERSONNALISÉ POUR LA LOGIQUE MOBILE/DESKTOP
// ============================================================================

const useResponsiveView = () => {
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobileView;
};

// ============================================================================
// COMPOSANT PRINCIPAL DE MESSAGERIE - REFACTORISÉ
// ============================================================================

interface MessagingAppProps {
  className?: string;
}

export const MessagingApp: React.FC<MessagingAppProps> = ({
  className = ""
}) => {
  // Hooks personnalisés
  const isMobileView = useResponsiveView();
  
  // Hook de messagerie avec interface correcte
  const {
    loading,
    error,
    refreshData,
    getTotalUnreadCount
  } = useMessaging();

  // État local optimisé
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Callbacks optimisés avec useCallback
  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedConversation(null);
  }, []);

  // Valeurs mémorisées pour éviter les re-renders
  const totalUnreadCount = useMemo(() => getTotalUnreadCount(), [getTotalUnreadCount]);

  // État de chargement optimisé
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messagerie
            {totalUnreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {totalUnreadCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // État d'erreur optimisé
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messagerie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Erreur lors du chargement de la messagerie</p>
            <Button onClick={refreshData} variant="outline">
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Rendu principal optimisé
  return (
    <div className={`flex h-full ${className}`}>
      {isMobileView ? (
        // Vue mobile simplifiée
        <div className="w-full">
          {selectedConversation ? (
            <ConversationView
              conversation={selectedConversation}
              onBack={handleBackToList}
              className="h-full"
            />
          ) : (
            <ConversationList
              onSelectConversation={handleSelectConversation}
              className="h-full"
            />
          )}
        </div>
      ) : (
        // Vue desktop optimisée
        <>
          <div className="w-80 border-r">
            <ConversationList
              onSelectConversation={handleSelectConversation}
              selectedConversationId={selectedConversation?.id}
              className="h-full border-0 rounded-none"
            />
          </div>
          <div className="flex-1">
            <ConversationView
              conversation={selectedConversation}
              className="h-full border-0 rounded-none"
            />
          </div>
        </>
      )}
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