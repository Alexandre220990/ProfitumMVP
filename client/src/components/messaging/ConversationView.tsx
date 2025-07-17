import { useRef, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Phone, 
  Video, 
  Info, 
  Check, 
  CheckCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageAttachment } from "@/services/messaging-document-integration";
import DocumentAttachments from './DocumentAttachments';
import DocumentUpload from './DocumentUpload';

interface Message {
  id: string;
  dossierId: string;
  senderId: string;
  senderType: 'client' | 'expert' | 'system';
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
  attachments?: MessageAttachment[];
  documentReferences?: string[];
}

interface Conversation {
  id: string;
  dossierId: string;
  expertId: string;
  expertName: string;
  expertAvatar?: string;
  isActive: boolean;
}

interface ConversationViewProps {
  conversation: Conversation;
  messages: Message[];
  onSendMessage: (content: string, attachments?: MessageAttachment[]) => void;
  currentUserId: string;
  clientId?: string;
}

export const ConversationView: React.FC<ConversationViewProps> = ({ 
  conversation, 
  messages, 
  onSendMessage, 
  currentUserId, 
  clientId 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    
    onSendMessage(newMessage.trim(), attachments);
    setNewMessage('');
    setAttachments([]);
    setShowDocumentUpload(false);
  };

  const handleDocumentUploadComplete = (attachment: MessageAttachment) => {
    setAttachments(prev => [...prev, attachment]);
  };

  const handleDocumentUploadError = (error: string) => {
    console.error('Erreur upload document: ', error);
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (message: Message) => {
    return message.senderId === currentUserId;
  };

  const getMessageStatus = (message: Message) => {
    if (message.read) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    } else {
      return <Check className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header de la conversation */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversation.expertAvatar} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {conversation.expertName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-semibold text-gray-900">{conversation.expertName}</h3>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-500">Dossier {conversation.dossierId}</p>
                {conversation.isActive && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600">En ligne</span>
                  </div>
                )}
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
              <Info className="h-4 w-4" />
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
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex", isOwnMessage(message) ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "max-w-xs lg:max-w-md p-3 rounded-lg", isOwnMessage(message)
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-900"
              )}>
                <div className="flex items-end space-x-2">
                  <p className="text-sm">{message.content}</p>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs opacity-70">
                      {formatTime(message.timestamp)}
                    </span>
                    {isOwnMessage(message) && getMessageStatus(message)}
                  </div>
                </div>
                
                {/* Pièces jointes documentaires */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2">
                    <DocumentAttachments
                      attachments={message.attachments}
                      readonly={true}
                      onViewDocument={(documentId) => {
                        // TODO: Ouvrir le document dans une modal ou nouvelle page
                        console.log('Voir document: ', documentId);
                      }}
                      onShareDocument={(documentId) => {
                        // TODO: Partager le document
                        console.log('Partager document: ', documentId);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Zone de saisie */}
      <div className="p-4 border-t border-gray-200 bg-white">
        {/* Upload de documents */}
        {showDocumentUpload && clientId && (
          <div className="mb-4">
            <DocumentUpload
              conversationId={conversation.id}
              clientId={clientId}
              onUploadComplete={handleDocumentUploadComplete}
              onUploadError={handleDocumentUploadError}
              maxFiles={5}
              maxFileSize={10 * 1024 * 1024} // 10MB
            />
          </div>
        )}

        {/* Prévisualisation des pièces jointes */}
        {attachments.length > 0 && (
          <div className="mb-2">
            <DocumentAttachments
              attachments={attachments}
              onRemoveAttachment={removeAttachment}
              onViewDocument={(documentId) => {
                // TODO: Ouvrir le document dans une modal
                console.log('Voir document: ', documentId);
              }}
              onShareDocument={(documentId) => {
                // TODO: Partager le document
                console.log('Partager document: ', documentId);
              }}
            />
          </div>
        )}

        {/* Zone de saisie du message */}
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              className="min-h-[40px] resize-none"
            />
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDocumentUpload(!showDocumentUpload)}
              className="h-10 w-10 p-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0"
            >
              <Smile className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() && attachments.length === 0}
              className="h-10 px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 