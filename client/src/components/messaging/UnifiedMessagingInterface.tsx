import React, { useState, useRef, useEffect } from 'react';
import { useMessaging } from '@/hooks/useMessaging';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Search,
  MoreVertical,
  Phone,
  Video,
  Check,
  CheckCheck,
  MessageSquare,
  Building,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnifiedMessagingInterfaceProps {
  className?: string;
  initialAssignmentId?: string;
}

export function UnifiedMessagingInterface({ 
  className,
  initialAssignmentId 
}: UnifiedMessagingInterfaceProps) {
  const {
    conversations,
    currentConversation,
    messages,
    loading,
    sending,
    unreadCount,
    selectConversation,
    sendMessage,
    isConnected,
    sendTypingIndicator,
    isOwnMessage,
    formatTime,
    getMessageStatus
  } = useMessaging(initialAssignmentId);

  // État local
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [otherUserTyping] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  // Références
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ========================================
  // EFFETS
  // ========================================

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Gérer la frappe
  useEffect(() => {
    if (newMessage.length > 0) {
      sendTypingIndicator(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
      }, 1000);
    } else {
      sendTypingIndicator(false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage, sendTypingIndicator]);

  // ========================================
  // HANDLERS
  // ========================================

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    
    await sendMessage(newMessage.trim(), attachments);
    setNewMessage('');
    setAttachments([]);
    setShowAttachments(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleConversationSelect = async (conversation: any) => {
    await selectConversation(conversation.id);
  };

  // ========================================
  // FILTRES
  // ========================================

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      conv.expert?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.expert?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.client?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.produit?.nom?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // ========================================
  // RENDU
  // ========================================

  if (loading && conversations.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-96", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la messagerie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full bg-white rounded-lg shadow-sm border", className)}>
      {/* Sidebar - Liste des conversations */}
      <div className="w-80 border-r bg-gray-50">
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Messagerie</h2>
            <div className="flex items-center space-x-2">
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connecté" : "Déconnecté"}
              </Badge>
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount}</Badge>
              )}
            </div>
          </div>
          
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Liste des conversations */}
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune conversation</p>
                <p className="text-sm text-gray-400">Commencez par créer une assignation</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation)}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-colors mb-2",
                    currentConversation?.id === conversation.id
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {conversation.expert?.name?.charAt(0) || conversation.client?.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm truncate">
                          {conversation.expert?.name || conversation.client?.name}
                        </h3>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-500 truncate">
                        {conversation.produit?.nom || "Produit non spécifié"}
                      </p>
                      
                      {conversation.lastMessage && (
                        <p className="text-xs text-gray-600 truncate mt-1">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">
                          {conversation.lastMessage 
                            ? formatTime(conversation.lastMessage.created_at)
                            : formatTime(conversation.updated_at)
                          }
                        </span>
                        <div className="flex items-center space-x-1">
                          {conversation.status === 'active' && (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Zone principale - Messages */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Header de la conversation */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {currentConversation.expert?.name?.charAt(0) || currentConversation.client?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="font-semibold">
                      {currentConversation.expert?.name || currentConversation.client?.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Building className="h-4 w-4" />
                      <span>{currentConversation.expert?.company_name || currentConversation.client?.company_name}</span>
                      <span>•</span>
                      <FileText className="h-4 w-4" />
                      <span>{currentConversation.produit?.nom}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Zone des messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun message dans cette conversation</p>
                    <p className="text-sm text-gray-400">Commencez la conversation !</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        isOwnMessage(message) ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "max-w-xs lg:max-w-md p-3 rounded-lg",
                        isOwnMessage(message)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      )}>
                        <p className="text-sm">{message.content}</p>
                        
                        {/* Pièces jointes */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((attachment, index) => (
                              <div key={index} className="flex items-center space-x-2 text-xs">
                                <Paperclip className="h-3 w-3" />
                                <span>{attachment.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className={cn(
                          "flex items-center justify-between mt-2",
                          isOwnMessage(message) ? "text-blue-100" : "text-gray-500"
                        )}>
                          <span className="text-xs">
                            {formatTime(message.created_at)}
                          </span>
                          {isOwnMessage(message) && (
                            <div className="ml-2">
                              {getMessageStatus(message) === 'read' ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {/* Indicateur de frappe */}
                {otherUserTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                      <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs text-gray-500">écrit...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Zone de saisie */}
            <div className="p-4 border-t bg-white">
              {/* Pièces jointes */}
              {attachments.length > 0 && (
                <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-white px-2 py-1 rounded border">
                        <Paperclip className="h-3 w-3 text-gray-500" />
                        <span className="text-xs">{file.name}</span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tapez votre message..."
                    className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={1}
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAttachments(!showAttachments)}
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={sending || (!newMessage.trim() && attachments.length === 0)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Input caché pour les fichiers */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </>
        ) : (
          /* État vide - Aucune conversation sélectionnée */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sélectionnez une conversation
              </h3>
              <p className="text-gray-500">
                Choisissez une conversation dans la liste pour commencer à discuter
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 