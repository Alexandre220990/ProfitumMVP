import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import HeaderExpert from "@/components/HeaderExpert";
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
  MessageSquare,
  Building2,
  Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Données de démonstration
  const conversations: Conversation[] = [
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

  const filteredConversations = conversations.filter(conv =>
    conv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.clientCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find(conv => conv.id === selectedConversation);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    // Logique d'envoi de message à implémenter
    setNewMessage("");
  };

  return (
    <>
      <HeaderExpert />
      <div className="min-h-screen bg-gray-50 p-6 pt-28">
        <div className="max-w-7xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Messagerie
                </CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtres
                  {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {showFilters && (
              <CardContent>
                <div className="flex gap-4">
                  <Button variant="outline" size="sm">Non lus</Button>
                  <Button variant="outline" size="sm">Favoris</Button>
                  <Button variant="outline" size="sm">Avec pièces jointes</Button>
                </div>
              </CardContent>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Liste des conversations */}
            <Card className="lg:col-span-1">
              <CardContent className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Rechercher une conversation..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-2">
                    {filteredConversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation === conv.id
                            ? "bg-blue-50 border border-blue-200"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedConversation(conv.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{conv.clientName}</h3>
                              {conv.isStarred && <Star className="h-4 w-4 text-yellow-400" />}
                            </div>
                            <p className="text-sm text-gray-500">{conv.clientCompany}</p>
                            <p className="text-sm mt-1 line-clamp-1">{conv.lastMessage}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs text-gray-500">{conv.timestamp}</span>
                            {conv.unreadCount > 0 && (
                              <Badge variant="default" className="ml-2">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Zone de conversation */}
            <Card className="lg:col-span-2">
              {selectedConv ? (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          {selectedConv.clientName}
                        </CardTitle>
                        <p className="text-sm text-gray-500">{selectedConv.clientCompany}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Star className="h-4 w-4 mr-2" />
                            {selectedConv.isStarred ? "Retirer des favoris" : "Ajouter aux favoris"}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Archive className="h-4 w-4 mr-2" />
                            Archiver
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <ScrollArea className="h-[calc(100vh-400px)] mb-4">
                      <div className="space-y-4">
                        {selectedConv.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.sender === "expert" ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[70%] p-4 rounded-lg ${
                                message.sender === "expert"
                                  ? "bg-blue-100 text-blue-900"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <p>{message.content}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Clock className="h-3 w-3 opacity-70" />
                                <span className="text-xs opacity-70">{message.timestamp}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Input
                        placeholder="Écrivez votre message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      />
                      <Button onClick={handleSendMessage}>
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer
                      </Button>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-[calc(100vh-300px)]">
                  <div className="text-center text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                    <p>Sélectionnez une conversation pour commencer</p>
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