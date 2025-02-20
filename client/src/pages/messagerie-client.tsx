import { useState } from "react";
import { Button } from "@/components/ui/button";
import HeaderClient from "@/components/HeaderClient";
import {
  Send,
  MessageSquare,
  Users,
  XCircle,
  CheckCircle,
  Star,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface Message {
  id: string;
  sender: "client" | "expert";
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  expertName: string;
  expertAvatar: string;
  category: "received" | "active" | "refused" | "favorite";
  messages: Message[];
}

const allConversations: Conversation[] = [
  {
id: "req1",
expertName: "Paul Durand",
expertAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
category: "received",
messages: [{ id: "m1", sender: "expert", content: "Je vous propose un audit complet.", timestamp: "10:30 AM", isRead: false }],
},
{
id: "req2",
expertName: "Caroline Lefèvre",
expertAvatar: "https://randomuser.me/api/portraits/women/40.jpg",
category: "received",
messages: [{ id: "m1", sender: "expert", content: "J’ai analysé votre situation, voici mon retour.", timestamp: "14:15 PM", isRead: false }],
},
{
id: "req3",
expertName: "Vincent Morel",
expertAvatar: "https://randomuser.me/api/portraits/men/45.jpg",
category: "received",
messages: [{ id: "m1", sender: "expert", content: "Je peux optimiser vos charges sociales.", timestamp: "09:00 AM", isRead: false }],
},

// 💬 Conversations actives
{
id: "chat1",
expertName: "Sophie Martin",
expertAvatar: "https://randomuser.me/api/portraits/women/45.jpg",
category: "active",
messages: [
  { id: "m1", sender: "expert", content: "Votre dossier est prêt !", timestamp: "Hier", isRead: true },
  { id: "m2", sender: "client", content: "Merci beaucoup !", timestamp: "Hier", isRead: true },
],
},
{
id: "chat2",
expertName: "Marc Dupont",
expertAvatar: "https://randomuser.me/api/portraits/men/50.jpg",
category: "active",
messages: [
  { id: "m1", sender: "expert", content: "Bonjour, avez-vous eu le temps de consulter mon rapport ?", timestamp: "10:20 AM", isRead: true },
  { id: "m2", sender: "client", content: "Oui, j’ai quelques questions à clarifier.", timestamp: "10:35 AM", isRead: true },
],
},
{
id: "chat3",
expertName: "Nathalie Girard",
expertAvatar: "https://randomuser.me/api/portraits/women/35.jpg",
category: "active",
messages: [
  { id: "m1", sender: "expert", content: "Je viens d’envoyer la mise à jour du dossier.", timestamp: "08:45 AM", isRead: true },
  { id: "m2", sender: "client", content: "Merci ! J’examine et vous reviens.", timestamp: "09:10 AM", isRead: true },
],
},

// ❌ Demandes refusées
{
id: "ref1",
expertName: "Jean Lefevre",
expertAvatar: "https://randomuser.me/api/portraits/men/50.jpg",
category: "refused",
messages: [{ id: "m1", sender: "expert", content: "Je peux vous aider sur votre dossier.", timestamp: "9:00 AM", isRead: true }],
},
{
id: "ref2",
expertName: "Isabelle Bernard",
expertAvatar: "https://randomuser.me/api/portraits/women/30.jpg",
category: "refused",
messages: [{ id: "m1", sender: "expert", content: "Je reste disponible si vous changez d’avis.", timestamp: "Hier", isRead: true }],
},
{
id: "ref3",
expertName: "David Laurent",
expertAvatar: "https://randomuser.me/api/portraits/men/55.jpg",
category: "refused",
messages: [{ id: "m1", sender: "expert", content: "Nous pouvons revoir notre proposition.", timestamp: "14:00 PM", isRead: true }],
},

// ⭐ Favoris
{
id: "fav1",
expertName: "Chloé Roux",
expertAvatar: "https://randomuser.me/api/portraits/women/28.jpg",
category: "favorite",
messages: [
  { id: "m1", sender: "expert", content: "Je suis disponible pour un point téléphonique.", timestamp: "16:20 PM", isRead: true },
  { id: "m2", sender: "client", content: "Oui, quand seriez-vous disponible ?", timestamp: "16:30 PM", isRead: true },
],
},
{
id: "fav2",
expertName: "Guillaume Caron",
expertAvatar: "https://randomuser.me/api/portraits/men/38.jpg",
category: "favorite",
messages: [
  { id: "m1", sender: "expert", content: "Notre dernière analyse montre un gain potentiel supplémentaire.", timestamp: "11:15 AM", isRead: true },
  { id: "m2", sender: "client", content: "Très intéressant, pouvez-vous détailler ?", timestamp: "11:25 AM", isRead: true },
],
},
];

export default function MessagerieClient() {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["received"]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((cat) => cat !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-16 pt-24">
      <HeaderClient />
      <div className="max-w-5xl mx-auto px-6 py-6 flex gap-6">
        <div className="w-1/3 bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-md font-bold text-gray-800 mb-4">Messagerie</h2>
          {Object.entries({
            received: { name: "Demandes reçues", icon: Users },
            active: { name: "Conversations", icon: MessageSquare },
            refused: { name: "Demandes refusées", icon: XCircle },
            favorite: { name: "Favoris", icon: Star },
          }).map(([key, { name, icon: Icon }]) => {
            const categoryConversations = allConversations.filter((conv) => conv.category === key);
            return (
              <div key={key} className="mb-2">
                <button
                  className="w-full flex justify-between items-center text-gray-900 font-medium py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all"
                  onClick={() => toggleCategory(key)}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-600" />
                    {name}
                  </div>
                  {expandedCategories.includes(key) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {expandedCategories.includes(key) && (
                  <div className="mt-2 space-y-1 pl-3">
                    {categoryConversations.length > 0 ? (
                      categoryConversations.map((conv) => (
                        <button
                          key={conv.id}
                          className={`w-full flex items-center gap-2 p-2 rounded-md transition-all truncate ${
                            activeConversation?.id === conv.id ? "bg-blue-500 text-white" : "hover:bg-gray-100"
                          }`}
                          onClick={() => setActiveConversation(conv)}
                        >
                          <img src={conv.expertAvatar} alt={conv.expertName} className="h-7 w-7 rounded-full" />
                          {conv.expertName}
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 pl-3">Aucune conversation</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="w-2/3 bg-white p-6 rounded-xl shadow-md flex flex-col">
          {activeConversation ? (
            <>
              <div className="p-4 border-b flex items-center">
                <img src={activeConversation.expertAvatar} alt={activeConversation.expertName} className="h-10 w-10 rounded-full" />
                <h2 className="ml-3 text-lg font-semibold">{activeConversation.expertName}</h2>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {activeConversation.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "client" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-lg ${msg.sender === "client" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                      <p>{msg.content}</p>
                      <span className="block text-xs text-gray-500 mt-1">{msg.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center">Sélectionnez une conversation.</p>
          )}
        </div>
      </div>
    </div>
  );
}
