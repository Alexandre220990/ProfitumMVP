import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Search,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useMessaging } from '@/hooks/use-messaging';
import { Conversation } from '@/types/messaging';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ============================================================================
// MESSAGERIE CLIENT OPTIMISÉE - DESIGN MODERNE 2025
// ============================================================================

interface OptimizedMessagingAppProps {
  className?: string;
  showHeader?: boolean;
}

export const OptimizedMessagingApp: React.FC<OptimizedMessagingAppProps> = ({
  className = ''
}) => {
  const { user } = useAuth();
  
  // État local optimisé
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Nouveaux états pour les colonnes métier
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Hook de messagerie optimisé avec toutes les fonctionnalités
  const messaging = useMessaging({
    autoConnect: true,
    enableTyping: true,
    enableNotifications: true,
    enableFileUpload: true,
    maxFileSize: 10, // 10MB
    allowedFileTypes: ['image/*', 'application/pdf', 'text/*'],
    enableAutoConversations: true // Conversations automatiques avec experts
  });

  // ========================================
  // GESTION DES CONVERSATIONS
  // ========================================

  const handleConversationSelect = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
    messaging.selectConversation(conversation);
  }, [messaging]);

  // ========================================
  // GESTION DES MESSAGES
  // ========================================

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() && selectedFiles.length === 0) return;

    try {
      await messaging.sendMessage(messageInput, selectedFiles);
      setMessageInput('');
      setSelectedFiles([]);
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  }, [messageInput, selectedFiles, messaging]);

  // ========================================
  // RENDU PRINCIPAL AVEC DESIGN MODERNE
  // ========================================

  return (
    <div className={`h-full flex ${className}`}>
      {/* Sidebar des conversations avec design moderne */}
      <motion.div 
        className={`${isSidebarOpen ? 'w-80' : 'w-20'} bg-white/90 backdrop-blur-sm border-r border-slate-200/60 transition-all duration-300 ease-in-out`}
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="h-full flex flex-col">
          {/* Header de la sidebar */}
          <div className="p-4 border-b border-slate-200/60">
            <div className="flex items-center justify-between">
              <motion.h2 
                className="text-lg font-bold text-slate-900"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Conversations
              </motion.h2>
              
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  {isSidebarOpen ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </motion.button>
              </div>
            </div>
            
            {/* Barre de recherche moderne */}
            <motion.div 
              className="mt-4 relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Rechercher une conversation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200 focus:bg-white"
              />
            </motion.div>
          </div>

          {/* Liste des conversations avec animations */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence>
              {messaging.conversations?.map((conversation, index) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => handleConversationSelect(conversation)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={conversation.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        {conversation.title?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {conversation.title}
                        </h3>
                        {conversation.unread_count > 0 && (
                          <Badge className="bg-red-500 text-white text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 truncate">
                        {typeof conversation.last_message === 'string' ? conversation.last_message : 'Aucun message'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Zone principale de messagerie */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-white">
        {selectedConversation ? (
          <div className="h-full flex flex-col">
            {/* Header de conversation */}
            <div className="p-4 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedConversation.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {selectedConversation.title?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-slate-900">{selectedConversation.title}</h3>
                    <p className="text-sm text-slate-500">En ligne</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone des messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messaging.messages?.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                      message.sender_id === user?.id 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white border border-slate-200'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === user?.id ? 'text-blue-100' : 'text-slate-500'
                      }`}>
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Zone de saisie */}
            <div className="p-4 border-t border-slate-200/60 bg-white/80 backdrop-blur-sm">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Tapez votre message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="min-h-[44px]"
                  />
                </div>
                
                <Button
                  onClick={() => console.log('Upload fichier')}
                  variant="outline"
                  size="sm"
                  className="h-[44px] px-3"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() && selectedFiles.length === 0}
                  className="h-[44px] px-4 bg-blue-500 hover:bg-blue-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <motion.div 
            className="flex-1 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-center space-y-4">
              <motion.div
                className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <MessageSquare className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold text-slate-900">
                Sélectionnez une conversation
              </h3>
              <p className="text-slate-500">
                Choisissez une conversation pour commencer à échanger
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}; 