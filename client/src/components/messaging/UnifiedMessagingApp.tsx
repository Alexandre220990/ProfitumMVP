import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical,
  Search,
  Phone,
  Video,
  Info,
  Volume2,
  VolumeX,
  Settings,
  Check,
  CheckCheck
} from 'lucide-react';
import { useMessaging } from '@/hooks/use-messaging';
import { Message, Conversation, FileAttachment } from '@/types/messaging';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';


// ============================================================================
// COMPOSANT MESSAGERIE UNIFIÉE OPTIMISÉ
// ============================================================================
// Inspiré par Sarah Drasner (Netlify) - Micro-interactions
// et Brian Chesky (Airbnb) - 11-Star Experience

interface UnifiedMessagingAppProps {
  userType: 'client' | 'expert' | 'admin';
  headerTitle?: string;
  showHeader?: boolean;
  className?: string;
  theme?: 'blue' | 'green' | 'purple';
}

export const UnifiedMessagingApp: React.FC<UnifiedMessagingAppProps> = ({
  headerTitle = 'Messagerie',
  showHeader = true,
  className = '',
  theme = 'blue'
}) => {
  // État local optimisé
  const [searchQuery, setSearchQuery] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Références pour optimisations
  const messageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hook de messagerie optimisé
  const messaging = useMessaging({
    autoConnect: true,
    enableTyping: true,
    enableNotifications: true,
    enableFileUpload: true,
    maxFileSize: 10, // 10MB
    allowedFileTypes: ['image/*', 'application/pdf', 'text/*']
  });

  // ========================================
  // THÈMES ET COULEURS (Sarah Drasner)
  // ========================================

  const themeConfig = {
    blue: {
      primary: 'from-blue-500 to-indigo-600',
      secondary: 'bg-blue-50',
      accent: 'text-blue-600',
      border: 'border-blue-200',
      hover: 'hover:bg-blue-100'
    },
    green: {
      primary: 'from-green-500 to-emerald-600',
      secondary: 'bg-green-50',
      accent: 'text-green-600',
      border: 'border-green-200',
      hover: 'hover:bg-green-100'
    },
    purple: {
      primary: 'from-purple-500 to-violet-600',
      secondary: 'bg-purple-50',
      accent: 'text-purple-600',
      border: 'border-purple-200',
      hover: 'hover:bg-purple-100'
    }
  };

  const currentTheme = themeConfig[theme];

  // ========================================
  // GESTION DES MESSAGES
  // ========================================

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() && selectedFiles.length === 0) return;

    try {
      await messaging.sendMessage(messageInput, selectedFiles);
      setMessageInput('');
      setSelectedFiles([]);
      setShowFileUpload(false);
      
      // Focus sur l'input pour continuer la conversation
      messageInputRef.current?.focus();
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
    }
  }, [messageInput, selectedFiles, messaging]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleTyping = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    // Gestion des indicateurs de frappe
    if (!isTyping) {
      setIsTyping(true);
      messaging.sendTypingIndicator(true);
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing indicator after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      messaging.sendTypingIndicator(false);
    }, 2000);
  }, [isTyping, messaging]);

  // ========================================
  // GESTION DES FICHIERS
  // ========================================

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    setShowFileUpload(true);
  }, []);

  const handleFileRemove = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ========================================
  // RECHERCHE ET FILTRES
  // ========================================

  const filteredConversations = messaging.conversations.filter(conv => {
    if (!searchQuery) return true;
    return conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conv.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredMessages = messaging.messages.filter(msg => {
    if (!searchQuery) return true;
    return msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
           msg.sender_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // ========================================
  // AUTO-SCROLL ET ANIMATIONS
  // ========================================

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messaging.messages, scrollToBottom]);

  // ========================================
  // COMPOSANTS D'INTERFACE
  // ========================================

  const ConversationItem: React.FC<{ conversation: Conversation }> = ({ conversation }) => {
    const stats = messaging.getConversationStats(conversation.id);
    const unreadCount = messaging.getUnreadCount(conversation.id);
    const isActive = messaging.currentConversation?.id === conversation.id;
    const isAdminConversation = conversation.conversation_type === 'support' || conversation.type === 'admin_support';

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
          ${isActive ? `bg-${currentTheme.accent} text-white` : currentTheme.hover}
          ${isAdminConversation ? 'border-l-4 border-orange-500' : ''}
        `}
        onClick={() => messaging.selectConversation(conversation)}
      >
        <Avatar className="w-10 h-10">
          <AvatarImage src={conversation.avatar} />
          <AvatarFallback className={currentTheme.accent}>
            {isAdminConversation ? '🛡️' : conversation.title?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium truncate">
              {isAdminConversation ? 'Support Administratif' : conversation.title}
            </h4>
            {stats.lastActivity && (
              <span className="text-xs opacity-70">
                {messaging.formatTime(stats.lastActivity)}
              </span>
            )}
          </div>
          
          <p className="text-sm opacity-70 truncate">
            {conversation.description || `${stats.messageCount} messages`}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Badge variant="destructive" className="ml-auto">
            {unreadCount}
          </Badge>
        )}
      </motion.div>
    );
  };

  const MessageItem: React.FC<{ message: Message }> = ({ message }) => {
    const isOwn = messaging.isOwnMessage(message);
    const status = messaging.getMessageStatus(message);
    const hasAttachments = message.metadata?.attachments && message.metadata.attachments.length > 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex items-end gap-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : ''}`}>
          {!isOwn && (
            <Avatar className="w-8 h-8">
              <AvatarImage src={message.avatar} />
              <AvatarFallback className="text-xs">
                {message.sender_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          )}
          
          <div className={`
            p-3 rounded-lg shadow-sm
            ${isOwn 
              ? `bg-gradient-to-r ${currentTheme.primary} text-white` 
              : 'bg-gray-100 text-gray-900'
            }
          `}>
            {!isOwn && (
              <p className="text-xs opacity-70 mb-1">{message.sender_name}</p>
            )}
            
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            
            {hasAttachments && (
              <div className="mt-2 space-y-1">
                {message.metadata?.attachments?.map((attachment: FileAttachment, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-white/20 rounded">
                    <Paperclip className="w-4 h-4" />
                    <span className="text-xs truncate">{attachment.name}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <span className="text-xs opacity-70">
                {messaging.formatTime(message.created_at)}
              </span>
              
              {isOwn && (
                <div className="flex items-center">
                  {status === 'sent' && <Check className="w-3 h-3" />}
                  {status === 'delivered' && <CheckCheck className="w-3 h-3" />}
                  {status === 'read' && <CheckCheck className="w-3 h-3 text-blue-500" />}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <div className={`flex h-full ${className}`}>
      {/* Sidebar des conversations */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {showHeader && (
          <div className={`p-4 bg-gradient-to-r ${currentTheme.primary} text-white`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{headerTitle}</h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowSettings(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
                    {isMuted ? 'Activer sons' : 'Désactiver sons'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Barre de recherche */}
            <div className="mt-3 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/20 border-white/30 text-white placeholder-white/70"
              />
            </div>
          </div>
        )}
        
        {/* Liste des conversations */}
        <div className="flex-1 overflow-y-auto p-2">
          <AnimatePresence>
            {filteredConversations.map((conversation) => (
              <ConversationItem key={conversation.id} conversation={conversation} />
            ))}
          </AnimatePresence>
        </div>
        
        {/* Statistiques */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600">
            {messaging.getTotalUnreadCount()} messages non lus
          </div>
        </div>
      </div>
      
      {/* Zone de chat principale */}
      <div className="flex-1 flex flex-col">
        {messaging.currentConversation ? (
          <>
            {/* Header de conversation */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={messaging.currentConversation.avatar} />
                    <AvatarFallback>
                      {messaging.currentConversation.title?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="font-semibold">
                      {(messaging.currentConversation.conversation_type === 'support' || messaging.currentConversation.type === 'admin_support')
                        ? 'Support Administratif' 
                        : messaging.currentConversation.title
                      }
                    </h3>
                    <p className="text-sm text-gray-600">
                      {messaging.isConnected ? 'En ligne' : 'Hors ligne'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Info className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <AnimatePresence>
                {filteredMessages.map((message) => (
                  <MessageItem key={message.id} message={message} />
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
            
            {/* Zone de saisie */}
            <div className="p-4 bg-white border-t border-gray-200">
              {/* Fichiers sélectionnés */}
              {showFileUpload && selectedFiles.length > 0 && (
                <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                        <Paperclip className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileRemove(index)}
                          className="h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <Input
                    ref={messageInputRef}
                    value={messageInput}
                    onChange={handleTyping}
                    onKeyPress={handleKeyPress}
                    placeholder="Tapez votre message..."
                    className="pr-20"
                    disabled={messaging.sending}
                  />
                  
                  <div className="absolute right-2 bottom-2 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 w-8 p-0"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="h-8 w-8 p-0"
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={(!messageInput.trim() && selectedFiles.length === 0) || messaging.sending}
                  className={`bg-gradient-to-r ${currentTheme.primary} text-white`}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* État vide */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sélectionnez une conversation
              </h3>
              <p className="text-gray-600">
                Choisissez une conversation pour commencer à discuter
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,application/pdf,text/*"
      />
      
      {/* Dialog paramètres */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paramètres de messagerie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Notifications</span>
              <Button
                variant={isMuted ? "outline" : "default"}
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? 'Désactivées' : 'Activées'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 