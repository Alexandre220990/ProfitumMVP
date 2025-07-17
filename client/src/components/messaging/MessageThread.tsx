import { useRef, useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/use-auth";
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Phone, 
  Video, 
  Info
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_type: 'client' | 'expert' | 'admin';
  sender_name?: string;
  timestamp: string;
  read_at?: string;
  message_type: 'text' | 'file' | 'image';
}

interface MessageThreadProps {
  assignmentId: string;
  expertName: string;
  onClose?: () => void;
}

export default function MessageThread({ 
  assignmentId, 
  expertName, 
  onClose 
}: MessageThreadProps) {
  const { user } = useAuth();
  const { isConnected, sendMessage, lastMessage } = useWebSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Déterminer si l'utilisateur actuel est l'expéditeur
  const isCurrentUserSender = (message: Message) => {
    return message.sender_id === user?.id;
  };

  // Charger les messages existants
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/messages/${assignmentId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des messages: ', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [assignmentId]);

  // Gérer les nouveaux messages WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'message') {
      const messageData = lastMessage.data;
      
      // Vérifier si le message appartient à cette conversation
      if (messageData.assignmentId === assignmentId) {
        setMessages(prev => [...prev, messageData]);
        
        // Marquer comme lu si c'est l'utilisateur actuel qui reçoit
        if (messageData.senderId !== user?.id) {
          markMessageAsRead(messageData.id);
        }
      }
    }
  }, [lastMessage, assignmentId, user?.id]);

  // Gérer les indicateurs de frappe
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'typing') {
      const typingData = lastMessage.data;
      if (typingData.assignmentId === assignmentId && typingData.senderId !== user?.id) {
        setIsTyping(true);
        
        // Arrêter l'indicateur après 3 secondes
        setTimeout(() => setIsTyping(false), 3000);
      }
    }
  }, [lastMessage, assignmentId, user?.id]);

  // Auto-scroll vers le bas
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendNewMessage = async () => {
    if (!newMessage.trim() || !isConnected) return;

    const messageData = {
      type: 'message' as const,
      data: {
        assignmentId,
        content: newMessage.trim(),
        messageType: 'text'
      },
      timestamp: new Date().toISOString()
    };

    try {
      sendMessage(messageData);
      setNewMessage('');
      
      // Envoyer l'indicateur de frappe
      sendTypingIndicator(false);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message: ', error);
    }
  };

  const sendTypingIndicator = (isTyping: boolean) => {
    if (!isConnected) return;

    const typingData = {
      type: 'typing' as const,
      data: {
        assignmentId,
        isTyping
      },
      timestamp: new Date().toISOString()
    };

    sendMessage(typingData);
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Erreur lors du marquage comme lu: ', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendNewMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Gérer l'indicateur de frappe
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    sendTypingIndicator(true);
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 1000);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="" />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {getInitials(expertName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{expertName}</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={isConnected ? "default" : "secondary"}
                  className={isConnected ? "bg-green-100 text-green-800" : ""}
                >
                  {isConnected ? "En ligne" : "Hors ligne"}
                </Badge>
                {isTyping && (
                  <span className="text-sm text-gray-500">écrit...</span>
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
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUserSender(message) ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isCurrentUserSender(message) ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {!isCurrentUserSender(message) && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                          {getInitials(message.sender_name || '')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`rounded-lg px-3 py-2 ${
                      isCurrentUserSender(message)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        isCurrentUserSender(message)
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                        {isCurrentUserSender(message) && message.read_at && (
                          <span className="ml-2">✓✓</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Smile className="h-4 w-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              className="flex-1"
              disabled={!isConnected}
            />
            <Button 
              onClick={sendNewMessage}
              disabled={!newMessage.trim() || !isConnected}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
} 