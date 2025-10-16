import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserDisplayName } from '../../../../shared/utils/user-display';
import { messagingService } from '@/services/messaging-service';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Search,
  ArrowLeft,
  ArrowRight,
  MoreVertical,
  Phone,
  Video,
  Info,
  Users,
  User
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// ============================================================================
// MESSAGERIE ADMIN MODERNE - DESIGN PROFESSIONNEL 2025
// ============================================================================

interface Conversation {
  id: string;
  title: string;
  type: 'admin_support' | 'client' | 'expert';
  last_message?: string;
  unread_count: number;
  updated_at?: string;
  avatar?: string;
  participant?: {
    id: string;
    name: string;
    email: string;
    type: 'client' | 'expert';
  };
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  created_at: string;
  is_read: boolean;
}

interface AdminMessagingAppProps {
  className?: string;
  showHeader?: boolean;
}

export const AdminMessagingApp: React.FC<AdminMessagingAppProps> = ({
  className = ''
}) => {
  const { user } = useAuth();
  
  // État local optimisé
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // ========================================
  // DONNÉES DE TEST POUR L'ADMIN
  // ========================================

  // Charger les vraies conversations depuis le service
  React.useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const conversationsData = await messagingService.getConversations();
        setConversations(conversationsData);
      } catch (error) {
        console.error('❌ Erreur chargement conversations admin:', error);
        toast.error('Erreur lors du chargement des conversations');
      } finally {
        setLoading(false);
      }
    };
    
    loadConversations();
  }, []);

  // ========================================
  // GESTION DES CONVERSATIONS
  // ========================================

  const handleConversationSelect = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    // Simuler des messages de test
    const testMessages: Message[] = [
      {
        id: '1',
        content: `Bonjour ${conversation.participant ? getUserDisplayName(conversation.participant) : 'Utilisateur'}, comment puis-je vous aider ?`,
        sender_id: user?.id || 'admin',
        sender_name: 'Admin',
        created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        is_read: true
      },
      {
        id: '2',
        content: conversation.last_message || 'Bonjour, j\'ai une question.',
        sender_id: conversation.participant?.id || 'user',
        sender_name: conversation.participant ? getUserDisplayName(conversation.participant) : 'Utilisateur',
        created_at: new Date().toISOString(),
        is_read: false
      }
    ];
    
    setMessages(testMessages);
  }, [user?.id]);

  // ========================================
  // GESTION DES MESSAGES
  // ========================================

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: messageInput,
      sender_id: user?.id || 'admin',
      sender_name: 'Admin',
      created_at: new Date().toISOString(),
      is_read: false
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');
  }, [messageInput, selectedConversation, user?.id]);

  // ========================================
  // RENDU DES CONVERSATIONS
  // ========================================

  const renderConversations = useCallback(() => {
    const filteredConversations = conversations.filter(conv => {
      const participantName = conv.participant ? getUserDisplayName(conv.participant) : '';
      return conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             participantName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
      <>
        {filteredConversations.map((conversation, index) => (
          <motion.div
            key={conversation.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ backgroundColor: 'rgb(241 245 249)' }}
            className={`p-4 cursor-pointer transition-colors border-b border-slate-100 ${
              selectedConversation?.id === conversation.id ? 'bg-purple-50 border-purple-200' : ''
            }`}
            onClick={() => handleConversationSelect(conversation)}
          >
            <div className="flex items-start gap-3">
              <Avatar className="w-12 h-12 flex-shrink-0">
                <AvatarImage src={conversation.avatar} />
                <AvatarFallback className={`text-white font-semibold ${
                  conversation.type === 'admin_support' 
                    ? 'bg-gradient-to-br from-purple-500 to-violet-600' 
                    : conversation.type === 'client'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    : 'bg-gradient-to-br from-green-500 to-emerald-600'
                }`}>
                  {conversation.type === 'admin_support' ? '🛠️' : 
                   conversation.type === 'client' ? <User className="w-4 h-4" /> : 
                   <Users className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-slate-900 text-sm truncate">
                      {conversation.title}
                    </h3>
                    {conversation.unread_count > 0 && (
                      <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {conversation.last_message || 'Aucun message récent'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {conversation.updated_at 
                      ? new Date(conversation.updated_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Récemment'
                    }
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        
        {filteredConversations.length === 0 && (
          <div className="flex items-center justify-center h-32 text-slate-500">
            <div className="text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune conversation trouvée</p>
            </div>
          </div>
        )}
      </>
    );
  }, [conversations, searchQuery, selectedConversation, handleConversationSelect, isSidebarOpen]);

  // ========================================
  // RENDU PRINCIPAL - DESIGN MESSAGERIE MODERNE
  // ========================================

  return (
    <div className={`h-full flex bg-white ${className}`}>
      {/* Sidebar des conversations - Design moderne */}
      <motion.div 
        className={`${isSidebarOpen ? 'w-80' : 'w-20'} bg-slate-50 border-r border-slate-200 transition-all duration-300 ease-in-out flex-shrink-0`}
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="h-full flex flex-col">
          {/* Header de la sidebar */}
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <motion.h2 
                className="text-lg font-bold text-slate-900"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {isSidebarOpen ? 'Conversations' : ''}
              </motion.h2>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="h-8 w-8 p-0"
              >
                {isSidebarOpen ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
            
            {/* Barre de recherche */}
            {isSidebarOpen && (
              <motion.div 
                className="relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-100 border-0 focus:bg-white focus:border-slate-300"
                />
              </motion.div>
            )}
          </div>

          {/* Liste des conversations */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence>
              {renderConversations()}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Zone principale de messagerie */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Header de conversation */}
            <div className="p-4 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedConversation.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-violet-600 text-white font-semibold">
                      {selectedConversation.title?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {selectedConversation.title}
                    </h3>
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      En ligne
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <Info className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Zone des messages - Pleine hauteur */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-md lg:max-w-lg p-4 rounded-2xl shadow-sm ${
                      message.sender_id === user?.id 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-white border border-slate-200'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-2 ${
                        message.sender_id === user?.id ? 'text-purple-100' : 'text-slate-500'
                      }`}>
                        {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Zone de saisie - Fixée en bas */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <div className="flex items-end gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => console.log('Upload fichier')}
                  className="h-10 w-10 p-0 flex-shrink-0"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                
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
                    className="min-h-[44px] border-slate-300 focus:border-purple-500"
                  />
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="h-10 px-6 bg-purple-500 hover:bg-purple-600 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <motion.div 
            className="flex-1 flex items-center justify-center bg-slate-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="w-96 p-8 text-center">
              <CardContent className="space-y-6">
                <motion.div
                  className="w-20 h-20 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center mx-auto"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <MessageSquare className="w-10 h-10 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Sélectionnez une conversation
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Choisissez une conversation dans la liste pour commencer à échanger avec les utilisateurs
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};
