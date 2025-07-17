import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import HeaderExpert from "@/components/HeaderExpert";
import { Search, Send, Paperclip, MoreVertical, Star, Trash2, Archive, Filter, ChevronDown, ChevronUp, MessageSquare, Building2, Clock, User, ArrowRight, Check, CheckCheck, Wifi, WifiOff } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Message { 
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments?: string[]; 
}

interface Conversation { 
  id: string;
  clientName: string;
  clientCompany: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  messages: Message[];
  isStarred: boolean; 
}

const MessagerieExpert = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sending, setSending] = useState(false);
  const [isConnected] = useState(true); // Simulation WebSocket
  const [conversationsState, setConversationsState] = useState<Conversation[]>([]);

  // Données de démonstration
  const initialConversations: Conversation[] = [
    { 
      id: "admin-support", 
      clientName: "Support Administratif", 
      clientCompany: "Plateforme", 
      lastMessage: "Bonjour ! Je suis votre assistant administratif. Je suis là pour vous aider avec toute question concernant la plateforme, vos missions, la facturation ou tout autre sujet. N'hésitez pas à me contacter à tout moment !", 
      timestamp: "Maintenant", 
      unreadCount: 0, 
      isStarred: true, 
      messages: [
        {
          id: "admin-welcome", 
          sender: "admin", 
          content: "Bonjour ! Je suis votre assistant administratif. Je suis là pour vous aider avec toute question concernant la plateforme, vos missions, la facturation ou tout autre sujet. N'hésitez pas à me contacter à tout moment !", 
          timestamp: "Maintenant", 
          isRead: true 
        }
      ]
    },
    { 
      id: "1", 
      clientName: "Jean Martin", 
      clientCompany: "Entreprise Demo", 
      lastMessage: "J'ai uploadé les documents demandés", 
      timestamp: "10:30", 
      unreadCount: 2, 
      isStarred: true, 
      messages: [
        {
          id: "1", 
          sender: "client", 
          content: "Bonjour, j'ai une question concernant le dossier TICPE", 
          timestamp: "10:15", 
          isRead: true 
        },
        { 
          id: "2", 
          sender: "expert", 
          content: "Bonjour, je suis à votre disposition", 
          timestamp: "10:20", 
          isRead: true 
        },
        { 
          id: "3", 
          sender: "client", 
          content: "J'ai uploadé les documents demandés", 
          timestamp: "10:30", 
          isRead: false 
        }
      ]
    },
    { 
      id: "2", 
      clientName: "Marie Dubois", 
      clientCompany: "SARL Optimisation", 
      lastMessage: "Merci pour votre retour", 
      timestamp: "Hier", 
      unreadCount: 0, 
      isStarred: false, 
      messages: [
        {
          id: "1", 
          sender: "client", 
          content: "Bonjour, pouvez-vous me donner des nouvelles ?", 
          timestamp: "Hier 15:30", 
          isRead: true 
        },
        { 
          id: "2", 
          sender: "expert", 
          content: "Je suis en train d'analyser votre dossier", 
          timestamp: "Hier 16:00", 
          isRead: true 
        },
        { 
          id: "3", 
          sender: "client", 
          content: "Merci pour votre retour", 
          timestamp: "Hier 16:30", 
          isRead: true 
        }
      ]
    }
  ];

  // Initialiser l'état des conversations
  React.useEffect(() => {
    setConversationsState(initialConversations);
  }, []);

  const filteredConversations = conversationsState.filter(conv =>
    conv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.clientCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversationsState.find(conv => conv.id === selectedConversation);

  const handleSendMessage = async () => { 
    if (!newMessage.trim()) return;
    
    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);
    
    try {
      // Gestion spéciale pour les messages admin
      if (selectedConversation === 'admin-support') {
        // Envoi direct vers l'admin via API
        const response = await fetch('/api/admin/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: messageContent,
            sender_id: 'expert', // À remplacer par l'ID réel de l'expert
            sender_type: 'expert',
            conversation_id: 'admin-support'
          })
        });

        if (response.ok) {
          const data = await response.json();
          
          // Ajouter le message à la conversation locale
          const newMessageObj: Message = {
            id: data.message.id,
            content: messageContent,
            sender: 'expert',
            timestamp: new Date().toISOString(),
            isRead: false
          };
          
          // Mettre à jour l'état des conversations
          const updatedConversations = conversationsState.map(conv => 
            conv.id === 'admin-support' 
              ? { 
                  ...conv, 
                  messages: [...conv.messages, newMessageObj],
                  lastMessage: messageContent,
                  timestamp: 'Maintenant'
                }
              : conv
          );
          
          setConversationsState(updatedConversations);
        }
        
      } else {
        // Messages normaux vers les clients
        // Simulation d'envoi
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Logique d'envoi de message à implémenter
      }
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
    } finally {
      setSending(false);
    }
  };

  const getMessageStatus = (message: Message) => {
    if (message.sender !== "expert") return null;
    
    if (message.isRead) {
      return <CheckCheck className="w-4 h-4 text-blue-500 animate-fade-in" />;
    } else {
      return <Check className="w-4 h-4 text-gray-400" />;
    }
  };

  const isOwnMessage = (message: Message) => {
    return message.sender === "expert";
  };

  return (
    <>
      <HeaderExpert />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="mt-16"></div>
          
          {/* Header amélioré */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Messagerie Expert</h1>
                <p className="text-slate-600">
                  Communiquez avec vos clients en temps réel
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge 
                variant={isConnected ? "default" : "secondary"}
                className="flex items-center gap-2 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isConnected ? "Connecté" : "Déconnecté"}
              </Badge>
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
              >
                <Filter className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
                Filtres
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Filtres améliorés */}
          {showFilters && (
            <Card className="mb-6 bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl animate-fade-in">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200">
                    Non lus
                  </Button>
                  <Button variant="outline" size="sm" className="hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200 transition-all duration-200">
                    Favoris
                  </Button>
                  <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-200">
                    Avec pièces jointes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Liste des conversations améliorée */}
            <Card className="lg:col-span-1 bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                  </div>
                  Conversations
                  <Badge variant="secondary" className="ml-2">
                    {conversationsState.filter(c => c.unreadCount > 0).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="relative mb-4 group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-200" />
                  <Input
                    placeholder="Rechercher une conversation..."
                    className="pl-10 transition-all duration-300 group-hover:shadow-md focus:shadow-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {filteredConversations.map((conv) => (
                      <Card
                        key={conv.id}
                        className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group ${
                          selectedConversation === conv.id
                            ? 'ring-2 ring-indigo-500 bg-indigo-50/50'
                            : 'hover:bg-slate-50/50'
                        }`}
                        onClick={() => setSelectedConversation(conv.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium group-hover:scale-110 transition-transform duration-200">
                                {conv.clientName.charAt(0)}
                              </div>
                              {conv.unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse flex items-center justify-center">
                                  <span className="text-xs text-white font-bold">{conv.unreadCount}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-medium text-slate-900 truncate group-hover:text-indigo-600 transition-colors duration-200">
                                  {conv.clientName}
                                </h3>
                                {conv.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                              </div>
                              <p className="text-sm text-slate-600 mb-1 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                {conv.clientCompany}
                              </p>
                              <p className="text-xs text-slate-500 truncate mb-2">
                                {conv.lastMessage}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {conv.timestamp}
                                </span>
                                {conv.unreadCount > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {conv.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Zone de conversation améliorée */}
            <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
              {selectedConv ? (
                <>
                  <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                            {selectedConv.clientName.charAt(0)}
                          </div>
                          {selectedConv.unreadCount > 0 && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
                          )}
                        </div>
                        
                        <div>
                          <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                            <User className="w-5 h-5 text-indigo-600" />
                            {selectedConv.clientName}
                          </CardTitle>
                          <p className="text-sm text-slate-600 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {selectedConv.clientCompany}
                          </p>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="hover:bg-slate-100 hover:scale-110 transition-all duration-200">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem className="hover:bg-yellow-50">
                            <Star className="h-4 w-4 mr-2 text-yellow-500" />
                            {selectedConv.isStarred ? "Retirer des favoris" : "Ajouter aux favoris"}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-blue-50">
                            <Archive className="h-4 w-4 mr-2 text-blue-500" />
                            Archiver
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    {/* Messages améliorés */}
                    <ScrollArea className="h-[500px] p-4">
                      <div className="space-y-4">
                        {selectedConv.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'} animate-fade-in`}
                          >
                            <div className={`max-w-[70%] ${isOwnMessage(message) ? 'order-2' : 'order-1'}`}>
                              <Card 
                                className={`p-3 transition-all duration-300 hover:shadow-md ${
                                  isOwnMessage(message) 
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' 
                                    : 'bg-white border border-slate-200'
                                }`}
                              >
                                <CardContent className="p-0">
                                  <p className={`text-sm ${isOwnMessage(message) ? 'text-white' : 'text-slate-900'}`}>
                                    {message.content}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className={`text-xs flex items-center gap-1 ${isOwnMessage(message) ? 'text-indigo-100' : 'text-slate-400'}`}>
                                      <Clock className="w-3 h-3" />
                                      {message.timestamp}
                                    </span>
                                    {isOwnMessage(message) && (
                                      <div className="flex items-center gap-1">
                                        {getMessageStatus(message)}
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    {/* Zone de saisie améliorée */}
                    <div className="border-t border-slate-200 p-4 bg-gradient-to-r from-slate-50 to-white">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 hover:scale-110">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex-1 relative group">
                          <Input
                            placeholder="Écrivez votre message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                            className="transition-all duration-300 group-hover:shadow-md focus:shadow-lg"
                          />
                        </div>
                        
                        <Button 
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sending}
                          className="flex items-center gap-2 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group"
                        >
                          {sending ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Envoi...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                              Envoyer
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-[600px]">
                  <div className="text-center space-y-4">
                    <div className="relative">
                      <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <div className="absolute inset-0 w-16 h-16 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    </div>
                    <CardTitle className="text-xl mb-2 text-slate-900">Aucune conversation sélectionnée</CardTitle>
                    <p className="text-slate-600">
                      Sélectionnez une conversation pour commencer à discuter
                    </p>
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <ArrowRight className="w-4 h-4 animate-bounce" />
                      <span className="text-sm">Cliquez sur une conversation</span>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default MessagerieExpert; 