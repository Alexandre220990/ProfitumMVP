import { useRef, useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClient } from "@/contexts/ClientContext";
import { Send, Paperclip, File, MoreHorizontal, Search, Phone, Video, Info, Smile, Mic, X, Check, MessageSquare, Image as ImageIcon, FileArchive, FileVideo, FileAudio, FileCode, Reply, Maximize2, Minimize2, ChevronLeft, ChevronRight, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface InstantMessagingProps {
  className?: string;
}

export const InstantMessaging: React.FC<InstantMessagingProps> = ({ 
  className 
}) => { 
  const {
    conversations, messages, loadConversations, loadMessages, sendMessage, markConversationAsRead
  } = useClient();

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [replyTo, setReplyTo] = useState<{ messageId: string; content: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Charger les conversations au montage
  useEffect(() => { 
    loadConversations(); 
  }, [loadConversations]);

  // Charger les messages quand une conversation est sélectionnée
  useEffect(() => { 
    if (selectedConversation) {
      loadMessages(selectedConversation);
      markConversationAsRead(selectedConversation); 
    }
  }, [selectedConversation, loadMessages, markConversationAsRead]);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simuler la frappe
  useEffect(() => { 
    if (messageText.length > 0) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer); 
    }
  }, [messageText]);

  const handleSendMessage = async () => { 
    if (!messageText.trim() && attachments.length === 0) return;
    if (!selectedConversation) return;

    try {
      await sendMessage(selectedConversation, messageText, attachments);
      setMessageText('');
      setAttachments([]);
      setReplyTo(null); 
    } catch (error) { 
      console.error('Erreur lors de l\'envoi du message: ', error); 
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => { 
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]); 
  };

  const removeAttachment = (index: number) => { 
    setAttachments(prev => prev.filter((_, i) => i !== index)); 
  };

  const formatFileSize = (bytes: number) => { 
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]; 
  };

  const getFileIcon = (type: string) => { 
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (type.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (type.includes('zip') || type.includes('rar')) return <FileArchive className="w-4 h-4" />;
    if (type.includes('video')) return <FileVideo className="w-4 h-4" />;
    if (type.includes('audio')) return <FileAudio className="w-4 h-4" />;
    if (type.includes('code') || type.includes('text')) return <FileCode className="w-4 h-4" />;
    return <File className="w-4 h-4" />; 
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

  const filteredConversations = conversations.filter(conv =>
    conv.expertName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.dossierId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentConversation = conversations.find(conv => conv.id === selectedConversation);
  const conversationMessages = messages.filter(msg => msg.dossierId === selectedConversation);

  if (isMinimized) { 
    return (
      <div className={cn("fixed bottom-4 right-4 z-50", className)}>
        <Card className="w-80 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Messagerie</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={ () => setIsMinimized(false) }
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full", className)}>
      { /* Liste des conversations */ }
      <div className={cn("w-80 border-r bg-gray-50 dark:bg-gray-900", isFullscreen && "hidden")}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Conversations</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={ () => setIsMinimized(true) }
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={ () => setIsFullscreen(!isFullscreen) }
              >
                { isFullscreen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" /> }
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={ (e) => setSearchQuery(e.target.value) }
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-2">
            { filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors", 
                  selectedConversation === conversation.id
                    ? "bg-blue-100 dark:bg-blue-900/20"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                onClick={ () => setSelectedConversation(conversation.id) }
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={ conversation.expertAvatar } />
                  <AvatarFallback>
                    { conversation.expertName.split(' ').map(n => n[0]).join('') }
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">
                      { conversation.expertName }
                    </p>
                    { conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    Dossier { conversation.dossierId }
                  </p>
                  
                  { conversation.lastMessage && (
                    <p className="text-xs text-gray-500 truncate">
                      {conversation.lastMessage.content}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col items-end space-y-1">
                  <span className="text-xs text-gray-500">
                    { conversation.lastMessage ? formatTime(conversation.lastMessage.timestamp) : '' }
                  </span>
                  { conversation.isActive && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      { /* Zone de chat */ }
      <div className={cn("flex-1 flex flex-col", isFullscreen && "w-full")}>
        { selectedConversation ? (
          <>
            {/* Header de la conversation */}
            <div className="p-4 border-b bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={currentConversation?.expertAvatar} />
                    <AvatarFallback>
                      { currentConversation?.expertName.split(' ').map(n => n[0]).join('') }
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="font-semibold">{ currentConversation?.expertName }</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Dossier { currentConversation?.dossierId }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Info className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            { /* Messages */ }
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                { conversationMessages
                  .filter(message => message && message.id)
                  .map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex", 
                      message.senderType === 'client' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn("max-w-xs lg:max-w-md p-3 rounded-lg", 
                        message.senderType === 'client'
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800"
                      )}
                    >
                      { /* Reply indicator */ }
                      { replyTo?.messageId === message.id && (
                        <div className="text-xs opacity-70 mb-1">
                          Réponse à: {message.content.substring(0, 50)}...
                        </div>
                      )}
                      
                      <div className="flex items-start space-x-2">
                        { message.senderType !== 'client' && (
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={currentConversation?.expertAvatar} />
                            <AvatarFallback className="text-xs">
                              { message.senderName.split(' ').map(n => n[0]).join('') }
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className="flex-1">
                          <p className="text-sm">{ message.content }</p>
                          
                          { /* Attachments */ }
                          { message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map((attachment) => (
                                <div
                                  key={attachment.id}
                                  className="flex items-center space-x-2 p-2 bg-gray-200 dark:bg-gray-700 rounded"
                                >
                                  { getFileIcon(attachment.type) }
                                  <span className="text-xs flex-1 truncate">
                                    { attachment.name }
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    { formatFileSize(attachment.size) }
                                  </span>
                                  <Button variant="ghost" size="sm">
                                    <Download className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs opacity-70">
                              { formatTime(message.timestamp) }
                            </span>
                            
                            <div className="flex items-center space-x-1">
                              { message.read && (
                                <Check className="w-3 h-3" />
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={ () => setReplyTo({ messageId: message.id, content: message.content })}
                              >
                                <Reply className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                { /* Typing indicator */ }
                { isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={ messagesEndRef } />
              </div>
            </ScrollArea>

            { /* Zone de saisie */ }
            <div className="p-4 border-t bg-white dark:bg-gray-900">
              { /* Reply indicator */}
              { replyTo && (
                <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-600 dark:text-blue-400">
                      Réponse à: {replyTo.content.substring(0, 50)}...
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={ () => setReplyTo(null) }
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              { /* Attachments preview */ }
              { attachments.length > 0 && (
                <div className="mb-2 space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
                    >
                      { getFileIcon(file.type) }
                      <span className="text-sm flex-1 truncate">{ file.name }</span>
                      <span className="text-xs text-gray-500">
                        { formatFileSize(file.size) }
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={ () => removeAttachment(index) }
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <Textarea
                    ref={ textareaRef }
                    placeholder="Tapez votre message..."
                    value={ messageText }
                    onChange={ (e) => setMessageText(e.target.value) }
                    onKeyDown={ (e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(); }
                    }}
                    className="min-h-[60px] max-h-32 resize-none"
                    rows={ 1 }
                  />
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={ () => fileInputRef.current?.click() }
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    onClick={ handleSendMessage }
                    disabled={ !messageText.trim() && attachments.length === 0 }
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (<div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Sélectionnez une conversation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choisissez une conversation pour commencer à échanger
              </p>
            </div>
          </div>
        )}
      </div>

      { /* Input file caché */ }
      <input
        ref={ fileInputRef }
        type="file"
        multiple
        onChange={ handleFileUpload }
        className="hidden"
      />
    </div>
  );
}; 