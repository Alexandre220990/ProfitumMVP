import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Send, 
  Paperclip, 
  MoreVertical, 
  Star, 
  Trash2, 
  Archive, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Building2, 
  Clock, 
  User, 
  ArrowRight, 
  Check, 
  CheckCheck, 
  Wifi, 
  Users,
  Shield,
  Crown,
  Mail,
  Phone,
  Video,
  AlertCircle,
  Award
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface AdminMessage { 
  id: string;
  content: string;
  sender_id: string;
  sender_type: 'admin' | 'client' | 'expert';
  conversation_id: string;
  timestamp: string;
  is_read: boolean;
}

interface Conversation { 
  id: string;
  participant_id: string;
  participant_name: string;
  participant_type: 'client' | 'expert';
  participant_company?: string;
  participant_avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  messages: AdminMessage[];
  isStarred: boolean;
  status: 'active' | 'inactive' | 'blocked';
}

const MessagerieAdmin = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'client' | 'expert'>('all');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les conversations admin
  useEffect(() => {
    loadAdminConversations();
  }, []);

  const loadAdminConversations = async () => {
    try {
      setLoading(true);
      
      // Charger tous les messages admin
      const response = await api.get('/admin/messages');
      
      if (response.data.success) {
        const messages: AdminMessage[] = response.data.data.messages || [];
        
        // Grouper les messages par conversation
        const conversationMap = new Map<string, Conversation>();
        
        messages.forEach(message => {
          const convId = message.conversation_id;
          
          if (!conversationMap.has(convId)) {
            conversationMap.set(convId, {
              id: convId,
              participant_id: message.sender_id,
              participant_name: message.sender_type === 'client' ? 'Client' : 'Expert',
              participant_type: message.sender_type as 'client' | 'expert',
              participant_company: message.sender_type === 'client' ? 'Entreprise' : 'Expertise',
              lastMessage: message.content,
              timestamp: new Date(message.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              unreadCount: message.sender_type !== 'admin' && !message.is_read ? 1 : 0,
              messages: [],
              isStarred: false,
              status: 'active'
            });
          }
          
          const conversation = conversationMap.get(convId)!;
          conversation.messages.push(message);
          
          // Mettre à jour le dernier message
          if (new Date(message.timestamp) > new Date(conversation.lastMessage)) {
            conversation.lastMessage = message.content;
            conversation.timestamp = new Date(message.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          }
          
          // Compter les messages non lus
          if (message.sender_type !== 'admin' && !message.is_read) {
            conversation.unreadCount++;
          }
        });
        
        setConversations(Array.from(conversationMap.values()));
      }
    } catch (error) {
      console.error('❌ Erreur chargement conversations admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => { 
    if (!newMessage.trim() || !selectedConversation) return;
    
    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);
    
    try {
      // Envoyer le message admin
      const response = await api.post('/admin/messages', {
        content: messageContent,
        sender_id: user?.id,
        sender_type: 'admin',
        conversation_id: selectedConversation
      });

      if (response.data.success) {
        // Recharger les conversations
        await loadAdminConversations();
      }
    } catch (error) {
      console.error('❌ Erreur envoi message admin:', error);
    } finally {
      setSending(false);
    }
  };

  // Trouver la conversation sélectionnée
  const selectedConv = selectedConversation ? conversations.find(c => c.id === selectedConversation) : null;

  const getMessageStatus = (message: AdminMessage) => {
    if (message.sender_type !== "admin") return null;
    
    if (message.is_read) {
      return <CheckCheck className="w-4 h-4 text-blue-500 animate-fade-in" />;
    } else {
      return <Check className="w-4 h-4 text-gray-400" />;
    }
  };

  const isOwnMessage = (message: AdminMessage) => {
    return message.sender_type === "admin";
  };

  const getParticipantIcon = (type: 'client' | 'expert') => {
    return type === 'client' ? <User className="w-4 h-4" /> : <Award className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'blocked': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header amélioré */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-2xl shadow-lg">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Messagerie Admin</h1>
              <p className="text-slate-600">
                Communiquez avec les clients et experts
              </p>
            </div>
          </div>
          
                      <div className="flex items-center gap-3">
              <Badge 
                variant="default"
                className="flex items-center gap-2 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <Wifi className="w-3 h-3" />
                Connecté
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
                <Select value={selectedType} onValueChange={(value: 'all' | 'client' | 'expert') => setSelectedType(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type de participant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="client">Clients</SelectItem>
                    <SelectItem value="expert">Experts</SelectItem>
                  </SelectContent>
                </Select>
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
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                Conversations
                <Badge variant="secondary" className="ml-2">
                  {conversations.filter(c => c.unreadCount > 0).length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {/* Onglets */}
              <div className="mb-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-lg">
                    <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
                      Toutes
                    </TabsTrigger>
                    <TabsTrigger value="unread" className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
                      Non lus
                    </TabsTrigger>
                    <TabsTrigger value="starred" className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
                      Favoris
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Recherche */}
              <div className="relative mb-4 group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-purple-500 transition-colors duration-200" />
                <Input
                  placeholder="Rechercher une conversation..."
                  className="pl-10 transition-all duration-300 group-hover:shadow-md focus:shadow-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Liste des conversations */}
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {loading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                      <span className="ml-2 text-slate-600">Chargement des conversations...</span>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-10">
                      <Crown className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600">Aucune conversation trouvée.</p>
                      <div className="flex items-center justify-center gap-2 text-slate-400 mt-4">
                        <ArrowRight className="w-4 h-4 animate-bounce" />
                        <span className="text-sm">Essayez de modifier vos filtres ou de rafraîchir la page.</span>
                      </div>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <Card
                        key={conv.id}
                        className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group ${
                          selectedConversation === conv.id
                            ? 'ring-2 ring-purple-500 bg-purple-50/50'
                            : 'hover:bg-slate-50/50'
                        }`}
                        onClick={() => setSelectedConversation(conv.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10 group-hover:scale-110 transition-transform duration-200">
                                <AvatarImage src={conv.participant_avatar} />
                                <AvatarFallback className={`${
                                  conv.participant_type === 'client' 
                                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                                    : 'bg-gradient-to-br from-green-500 to-emerald-600'
                                } text-white`}>
                                  {getParticipantIcon(conv.participant_type)}
                                </AvatarFallback>
                              </Avatar>
                              {conv.unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse flex items-center justify-center">
                                  <span className="text-xs text-white font-bold">{conv.unreadCount}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-medium text-slate-900 truncate group-hover:text-purple-600 transition-colors duration-200 flex items-center gap-1">
                                  {conv.participant_name}
                                  <Badge variant="outline" className={`text-xs ${getStatusColor(conv.status)}`}>
                                    {conv.participant_type === 'client' ? 'Client' : 'Expert'}
                                  </Badge>
                                </h3>
                                {conv.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                              </div>
                              <p className="text-sm text-slate-600 mb-1 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                {conv.participant_company}
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
                    ))
                  )}
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
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={selectedConv.participant_avatar} />
                          <AvatarFallback className={`${
                            selectedConv.participant_type === 'client' 
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                              : 'bg-gradient-to-br from-green-500 to-emerald-600'
                          } text-white`}>
                            {getParticipantIcon(selectedConv.participant_type)}
                          </AvatarFallback>
                        </Avatar>
                        {selectedConv.unreadCount > 0 && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
                        )}
                      </div>
                      
                      <div>
                        <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                          <Shield className="w-5 h-5 text-purple-600" />
                          {selectedConv.participant_name}
                          <Badge variant="outline" className={`text-xs ${getStatusColor(selectedConv.status)}`}>
                            {selectedConv.participant_type === 'client' ? 'Client' : 'Expert'}
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-slate-600 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {selectedConv.participant_company}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 hover:scale-110">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:bg-green-50 hover:text-green-600 transition-all duration-200 hover:scale-110">
                        <Video className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:bg-purple-50 hover:text-purple-600 transition-all duration-200 hover:scale-110">
                        <Mail className="w-4 h-4" />
                      </Button>
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
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Bloquer
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  {/* Messages améliorés */}
                  <ScrollArea className="h-[500px] p-4">
                    <div className="space-y-4">
                      {loading ? (
                        <div className="flex justify-center items-center h-full">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                          <span className="ml-2 text-slate-600">Chargement des messages...</span>
                        </div>
                      ) : selectedConv.messages.length === 0 ? (
                        <div className="text-center py-10">
                          <Crown className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-600">Aucun message trouvé dans cette conversation.</p>
                          <div className="flex items-center justify-center gap-2 text-slate-400 mt-4">
                            <ArrowRight className="w-4 h-4 animate-bounce" />
                            <span className="text-sm">Commencez la conversation en écrivant un message.</span>
                          </div>
                        </div>
                      ) : (
                        selectedConv.messages.map((message: AdminMessage) => (
                          <div
                            key={message.id}
                            className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'} animate-fade-in`}
                          >
                            <div className={`max-w-[70%] ${isOwnMessage(message) ? 'order-2' : 'order-1'}`}>
                              <Card 
                                className={`p-3 transition-all duration-300 hover:shadow-md ${
                                  isOwnMessage(message) 
                                    ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white' 
                                    : 'bg-white border border-slate-200'
                                }`}
                              >
                                <CardContent className="p-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-medium ${isOwnMessage(message) ? 'text-purple-100' : 'text-slate-600'}`}>
                                      {message.sender_type === 'admin' ? 'Vous' : message.sender_type === 'client' ? 'Client' : 'Expert'}
                                    </span>
                                    <Badge variant="outline" className={`text-xs ${
                                      message.sender_type === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                      message.sender_type === 'client' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                      'bg-green-100 text-green-700 border-green-200'
                                    }`}>
                                      {message.sender_type === 'admin' ? 'Admin' : 
                                       message.sender_type === 'client' ? 'Client' : 'Expert'}
                                    </Badge>
                                  </div>
                                  <p className={`text-sm ${isOwnMessage(message) ? 'text-white' : 'text-slate-900'}`}>
                                    {message.content}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className={`text-xs flex items-center gap-1 ${isOwnMessage(message) ? 'text-purple-100' : 'text-slate-400'}`}>
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
                        ))
                      )}
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
                    <Crown className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <div className="absolute inset-0 w-16 h-16 border-2 border-purple-200 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  </div>
                  <CardTitle className="text-xl mb-2 text-slate-900">Aucune conversation sélectionnée</CardTitle>
                  <p className="text-slate-600">
                    Sélectionnez une conversation pour commencer à discuter
                  </p>
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <ArrowRight className="w-4 h-4 animate-bounce" />
                    <span className="text-sm">Cliquez sur une conversation dans la liste</span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MessagerieAdmin; 