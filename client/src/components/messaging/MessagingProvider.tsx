import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseMessaging, UseSupabaseMessagingOptions } from '@/hooks/use-supabase-messaging';
import { supabaseMessagingService } from '@/services/supabase-messaging';

// ============================================================================
// CONTEXT POUR LA MESSAGERIE SUPABASE
// ============================================================================

interface MessagingContextType extends ReturnType<typeof useSupabaseMessaging> {
  // Méthodes supplémentaires spécifiques au provider
  ensureAdminConversation: () => Promise<void>;
  getConversationById: (id: string) => any;
  isAdminConversation: (conversation: any) => boolean;
}

const MessagingContext = createContext<MessagingContextType | null>(null);

// ============================================================================
// PROVIDER COMPOSANT
// ============================================================================

interface MessagingProviderProps {
  children: ReactNode;
  options?: UseSupabaseMessagingOptions;
}

export const MessagingProvider: React.FC<MessagingProviderProps> = ({ 
  children, 
  options = {} 
}) => {
  const messagingHook = useSupabaseMessaging({
    autoConnect: true,
    enableTyping: true,
    enableNotifications: true,
    ...options
  });

  // ========================================
  // MÉTHODES SUPPLÉMENTAIRES
  // ========================================

  const ensureAdminConversation = async () => {
    try {
      // Vérifier si une conversation admin existe déjà
      const adminConversation = messagingHook.conversations.find(conv => 
        conv.conversation_type === 'support' && 
        (conv.participant1_id === '00000000-0000-0000-0000-000000000000' || 
         conv.participant2_id === '00000000-0000-0000-0000-000000000000')
      );

      if (!adminConversation) {
        // Créer une conversation admin si elle n'existe pas
        const currentUser = supabaseMessagingService.getCurrentUser();
        await messagingHook.createConversation({
          participant1_id: currentUser?.id || '',
          participant1_type: currentUser?.type || 'client',
          participant2_id: '00000000-0000-0000-0000-000000000000',
          participant2_type: 'admin',
          conversation_type: 'support',
          title: 'Support Administratif'
        });
      }
    } catch (error) {
      console.error('❌ Erreur création conversation admin:', error);
    }
  };

  const getConversationById = (id: string) => {
    return messagingHook.conversations.find(conv => conv.id === id);
  };

  const isAdminConversation = (conversation: any) => {
    return conversation?.conversation_type === 'support' && 
           (conversation?.participant1_id === '00000000-0000-0000-0000-000000000000' || 
            conversation?.participant2_id === '00000000-0000-0000-0000-000000000000');
  };

  // ========================================
  // VALEUR DU CONTEXT
  // ========================================

  const contextValue: MessagingContextType = {
    ...messagingHook,
    ensureAdminConversation,
    getConversationById,
    isAdminConversation
  };

  return (
    <MessagingContext.Provider value={contextValue}>
      {children}
    </MessagingContext.Provider>
  );
};

// ============================================================================
// HOOK PERSONNALISÉ POUR UTILISER LE CONTEXT
// ============================================================================

export const useMessaging = (): MessagingContextType => {
  const context = useContext(MessagingContext);
  
  if (!context) {
    throw new Error('useMessaging doit être utilisé dans un MessagingProvider');
  }
  
  return context;
};

// ============================================================================
// HOOK SPÉCIALISÉ POUR LES COMPOSANTS ENFANTS
// ============================================================================

export const useMessagingState = () => {
  const context = useMessaging();
  
  return {
    conversations: context.conversations,
    currentConversation: context.currentConversation,
    messages: context.messages,
    loading: context.loading,
    sending: context.sending,
    error: context.error,
    isConnected: context.isConnected
  };
};

export const useMessagingActions = () => {
  const context = useMessaging();
  
  return {
    selectConversation: context.selectConversation,
    sendMessage: context.sendMessage,
    createConversation: context.createConversation,
    markAsRead: context.markAsRead,
    markConversationAsRead: context.markConversationAsRead,
    sendTypingIndicator: context.sendTypingIndicator,
    ensureAdminConversation: context.ensureAdminConversation
  };
};

export const useMessagingUtils = () => {
  const context = useMessaging();
  
  return {
    getUnreadCount: context.getUnreadCount,
    getTotalUnreadCount: context.getTotalUnreadCount,
    isOwnMessage: context.isOwnMessage,
    formatTime: context.formatTime,
    getMessageStatus: context.getMessageStatus,
    getConversationById: context.getConversationById,
    isAdminConversation: context.isAdminConversation
  };
}; 