import React, { useState } from "react";
import { Search, Star, StarOff, Paperclip, Send, MoreVertical, Phone, Video, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import HeaderExpert from "@/components/HeaderExpert";

interface Message {
  id: number;
  content: string;
  timestamp: string;
  isFromExpert: boolean;
  attachments?: { name: string; type: string; size: string }[];
}

interface Conversation {
  id: number;
  clientName: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  starred: boolean;
  avatar?: string;
  status: "online" | "offline" | "away";
}

export default function MessagerieExpertDemo() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("tous");

  // Données de démonstration
  const conversations: Conversation[] = [
    {
      id: 1,
      clientName: "Sophie Martin",
      lastMessage: "Bonjour, j'ai une question concernant ma demande de remboursement TICPE...",
      timestamp: "10:30",
      unread: true,
      starred: true,
      status: "online",
      avatar: "/avatars/sophie.jpg"
    },
    {
      id: 2,
      clientName: "Thomas Dubois",
      lastMessage: "Merci pour votre réponse rapide !",
      timestamp: "Hier",
      unread: false,
      starred: false,
      status: "offline",
      avatar: "/avatars/thomas.jpg"
    },
    {
      id: 3,
      clientName: "Marie Leroy",
      lastMessage: "Pouvez-vous me confirmer la date de remboursement ?",
      timestamp: "Lundi",
      unread: true,
      starred: false,
      status: "away",
      avatar: "/avatars/marie.jpg"
    }
  ];

  const messages: Message[] = [
    {
      id: 1,
      content: "Bonjour, j'ai une question concernant ma demande de remboursement TICPE.",
      timestamp: "10:30",
      isFromExpert: false
    },
    {
      id: 2,
      content: "Bonjour Sophie, je suis là pour vous aider. Pouvez-vous me donner plus de détails sur votre question ?",
      timestamp: "10:31",
      isFromExpert: true
    },
    {
      id: 3,
      content: "J'ai soumis ma demande il y a 2 semaines et je n'ai toujours pas reçu de confirmation.",
      timestamp: "10:32",
      isFromExpert: false,
      attachments: [
        { name: "facture.pdf", type: "PDF", size: "2.4 MB" }
      ]
    }
  ];

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "non-lus") return matchesSearch && conv.unread;
    if (activeTab === "favoris") return matchesSearch && conv.starred;
    return matchesSearch;
  });

  return (
    <>
      <HeaderExpert />
      <div className="flex h-screen pt-16">
        {/* Colonne de gauche - Liste des conversations */}
        <div className="w-1/3 border-r bg-white">
          <div className="p-4 space-y-4">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher une conversation..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filtres */}
            <Tabs defaultValue="tous" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tous">Tous</TabsTrigger>
                <TabsTrigger value="non-lus">Non lus</TabsTrigger>
                <TabsTrigger value="favoris">Favoris</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Liste des conversations */}
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="space-y-2">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation?.id === conv.id
                        ? "bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conv.avatar} />
                          <AvatarFallback>{conv.clientName.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                          conv.status === "online" ? "bg-green-500" :
                          conv.status === "away" ? "bg-yellow-500" : "bg-gray-500"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold truncate">{conv.clientName}</p>
                          <span className="text-sm text-gray-500">{conv.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        {conv.unread && (
                          <Badge variant="default" className="bg-blue-500">Nouveau</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Toggle starred status
                          }}
                        >
                          {conv.starred ? (
                            <Star className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <StarOff className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Colonne de droite - Zone de conversation */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedConversation ? (
            <>
              {/* En-tête de la conversation */}
              <div className="p-4 border-b bg-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedConversation.avatar} />
                    <AvatarFallback>{selectedConversation.clientName.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold">{selectedConversation.clientName}</h2>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.status === "online" ? "En ligne" :
                       selectedConversation.status === "away" ? "Absent" : "Hors ligne"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Info className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isFromExpert ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[70%] ${message.isFromExpert ? "bg-blue-500 text-white" : "bg-white"}`}>
                        <Card className="p-3 rounded-lg shadow-sm">
                          <p>{message.content}</p>
                          {message.attachments && (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map((attachment, index) => (
                                <div
                                  key={index}
                                  className="flex items-center space-x-2 p-2 bg-gray-100 rounded"
                                >
                                  <Paperclip className="h-4 w-4" />
                                  <span className="text-sm">{attachment.name}</span>
                                  <span className="text-xs text-gray-500">
                                    ({attachment.size})
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          <span className="text-xs text-gray-500 mt-1 block">
                            {message.timestamp}
                          </span>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Zone de saisie */}
              <div className="p-4 border-t bg-white">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Input
                    placeholder="Écrivez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button>
                    <Send className="h-5 w-5 mr-2" />
                    Envoyer
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Sélectionnez une conversation pour commencer
            </div>
          )}
        </div>
      </div>
    </>
  );
} 