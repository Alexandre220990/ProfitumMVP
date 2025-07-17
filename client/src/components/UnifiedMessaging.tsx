import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, 
  Send, 
  Paperclip, 
  MoreVertical, 
  Trash2, 
  Archive, 
  Check, 
  CheckCheck, 
  FileText,
  Image,
  Download,
  X,
  Loader2,
  MessageSquare
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useUnifiedWebSocket } from "@/hooks/use-unified-websocket";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'client' | 'expert' | 'admin';
  content: string;
  message_type: string;
  attachments?: FileAttachment[];
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

interface FileAttachment {
  id: string;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  description?: string;
}

interface Conversation {
  id: string;
  type: string;
  participant_ids: string[];
  title?: string;
  description?: string;
  status: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
  participants?: Participant[];
  lastMessage?: Message;
  unreadCount?: number;
}

interface Participant {
  id: string;
  name: string;
  type: string;
  company?: string;
  avatar?: string | null;
}

interface UnifiedMessagingProps {
  conversationType: 'expert_client' | 'admin_support';
  participants: Participant[];
  features?: {
    fileUpload?: boolean;
    realTime?: boolean;
    search?: boolean;
    notifications?: boolean;
    typing?: boolean;
  };
  onMessageSent?: (message: Message) => void;
  onConversationSelect?: (conversation: Conversation) => void;
}

const UnifiedMessaging: React.FC<UnifiedMessagingProps> = ({
  conversationType,
  features = {
    fileUpload: true,
    realTime: true,
    search: true,
    notifications: true,
    typing: false
  },
  onMessageSent,
  onConversationSelect
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WebSocket pour temps réel
  const { isConnected: wsConnected } = useUnifiedWebSocket({
    conversationId: selectedConversation?.id,
    onNewMessage: (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      onMessageSent?.(newMessage);
    },
    onMessageRead: (messageId, readAt) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, is_read: true, read_at: readAt }
          : msg
      ));
    },
    onTyping: (userId, isTyping) => {
      // Gérer l'indicateur de frappe
      console.log(`Utilisateur ${userId} ${isTyping ? 'écrit' : 'a arrêté d\'écrire'}`);
    },
    autoConnect: features.realTime
  });

  // Charger les conversations
  useEffect(() => {
    loadConversations();
  }, []);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/unified-messaging/conversations', {
        params: { type: conversationType }
      });

      if (response.data.success) {
        setConversations(response.data.data.conversations);
        if (response.data.data.conversations.length > 0) {
          setSelectedConversation(response.data.data.conversations[0]);
          await loadMessages(response.data.data.conversations[0].id);
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement conversations:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les conversations'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await api.get(`/unified-messaging/conversations/${conversationId}/messages`);
      if (response.data.success) {
        setMessages(response.data.data.messages);
      }
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les messages'
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    if (!selectedConversation) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const formData = new FormData();
      formData.append('content', messageContent);
      formData.append('message_type', selectedFiles.length > 0 ? 'file' : 'text');

      // Ajouter les fichiers
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await api.post(
        `/unified-messaging/conversations/${selectedConversation.id}/messages`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        const newMessageObj = response.data.data;
        setMessages(prev => [...prev, newMessageObj]);
        setSelectedFiles([]);
        onMessageSent?.(newMessageObj);
      }
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'envoyer le message'
      });
      // Remettre le message dans l'input
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast({
          variant: 'destructive',
          title: 'Fichier trop volumineux',
          description: `${file.name} dépasse la limite de 10MB`
        });
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await loadMessages(conversation.id);
    onConversationSelect?.(conversation);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getMessageStatus = (message: Message) => {
    if (message.sender_type !== user?.type) return null;
    
    if (message.read_at) {
      return <CheckCheck className="w-4 h-4 text-blue-500 animate-fade-in" />;
    } else {
      return <Check className="w-4 h-4 text-gray-400" />;
    }
  };

  const isOwnMessage = (message: Message) => {
    return message.sender_type === user?.type;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadFile = async (file: FileAttachment) => {
    try {
      const response = await api.get(`/unified-messaging/files/${file.id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.original_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de télécharger le fichier'
      });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.participants?.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Chargement de la messagerie...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Liste des conversations */}
      <Card className="lg:col-span-1 bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
        <CardHeader>
                      <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              Conversations
              <Badge variant="secondary" className="ml-2">
                {conversations.filter(c => (c.unreadCount || 0) > 0).length}
              </Badge>
              {features.realTime && (
                <div className="flex items-center gap-1 ml-auto">
                  <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-slate-500">
                    {wsConnected ? 'Temps réel' : 'Hors ligne'}
                  </span>
                </div>
              )}
            </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="relative mb-4 group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
            <Input
              placeholder="Rechercher une conversation..."
              className="pl-10 transition-all duration-300 group-hover:shadow-md focus:shadow-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => selectConversation(conversation)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          {conversation.participants?.[0]?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {conversation.title || 'Conversation'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {conversation.participants?.map(p => p.name).join(', ')}
                        </p>
                      </div>
                    </div>
                    {(conversation.unreadCount || 0) > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                  {conversation.lastMessage && (
                    <p className="text-xs text-slate-600 truncate">
                      {conversation.lastMessage.content}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {conversation.last_message_at ? formatTime(conversation.last_message_at) : 'Jamais'}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Zone de chat */}
      <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl flex flex-col">
        {selectedConversation ? (
          <>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>
                      {selectedConversation.participants?.[0]?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {selectedConversation.title || 'Conversation'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedConversation.participants?.map(p => p.name).join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedConversation.type}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Archive className="w-4 h-4 mr-2" />
                        Archiver
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-4">
              {/* Messages */}
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          isOwnMessage(message)
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {!isOwnMessage(message) && (
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {message.sender_type.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex-1">
                            <p className="text-sm">{message.content}</p>
                            
                            {/* Fichiers attachés */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {message.attachments.map((file) => (
                                  <div
                                    key={file.id}
                                    className={`flex items-center gap-2 p-2 rounded ${
                                      isOwnMessage(message)
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {getFileIcon(file.mime_type)}
                                    <span className="text-xs flex-1 truncate">
                                      {file.original_name}
                                    </span>
                                    <span className="text-xs opacity-70">
                                      {formatFileSize(file.file_size)}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => downloadFile(file)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs opacity-70">
                                {formatTime(message.created_at)}
                              </span>
                              {getMessageStatus(message)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Zone de saisie */}
              <div className="space-y-3">
                {/* Fichiers sélectionnés */}
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-lg">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-white rounded border"
                      >
                        {getFileIcon(file.type)}
                        <span className="text-xs truncate max-w-32">
                          {file.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatFileSize(file.size)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-4 w-4 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2">
                  {features.fileUpload && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Input
                    placeholder="Tapez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                    disabled={sending}
                  />
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={sending || (!newMessage.trim() && selectedFiles.length === 0)}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Input fichier caché */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.zip,.rar,.txt"
              />
            </CardContent>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">Sélectionnez une conversation pour commencer</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UnifiedMessaging; 