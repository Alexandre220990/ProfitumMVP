import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import HeaderClient from "@/components/HeaderClient";
import { Send, CheckCircle, XCircle } from "lucide-react";

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
  status: "pending" | "completed";
  messages: Message[];
}

// 🔹 Simule des conversations
const allConversations: Conversation[] = [
  {
    id: "conv1",
    expertName: "Paul Durand",
    expertAvatar: "https://i.pravatar.cc/150?img=3",
    status: "pending",
    messages: [
      { id: "m1", sender: "expert", content: "Bonjour, voici ma proposition.", timestamp: "10:30 AM", isRead: true },
      { id: "m2", sender: "client", content: "Merci, je vais regarder.", timestamp: "10:35 AM", isRead: true },
      { id: "m3", sender: "expert", content: "Avez-vous des questions ?", timestamp: "10:40 AM", isRead: false },
    ],
  },
  {
    id: "conv2",
    expertName: "Sophie Martin",
    expertAvatar: "https://i.pravatar.cc/150?img=5",
    status: "completed",
    messages: [
      { id: "m1", sender: "expert", content: "Votre dossier est finalisé !", timestamp: "Hier", isRead: true },
      { id: "m2", sender: "client", content: "Merci pour votre travail.", timestamp: "Hier", isRead: true },
    ],
  },
];

export default function MessagerieClient() {
  const userID = "12345"; // 🔹 Simule l'ID utilisateur
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(allConversations[0]);
  const [messageInput, setMessageInput] = useState("");

  // 🔹 Gère l'envoi d'un message
  const sendMessage = () => {
    if (!messageInput.trim()) return;
    const newMessage: Message = {
      id: `m${Math.random()}`,
      sender: "client",
      content: messageInput,
      timestamp: "Maintenant",
      isRead: true,
    };
    setActiveConversation((prev) => prev ? { ...prev, messages: [...prev.messages, newMessage] } : null);
    setMessageInput("");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <HeaderClient />
      <div className="max-w-6xl mx-auto px-6 py-16 flex gap-6">
        {/* 📂 Liste des conversations */}
        <div className="w-1/3 bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-700">📬 Conversations</h2>
          <div className="mt-4 space-y-2">
            {allConversations.map((conv) => (
              <Link 
                key={conv.id}
                href={`/messagerie-client/${userID}`}
                className={`p-3 flex items-center gap-3 rounded-md cursor-pointer transition-all ${
                  activeConversation?.id === conv.id ? "bg-blue-100" : "hover:bg-gray-100"
                }`}
              >
                <img src={conv.expertAvatar} alt={conv.expertName} className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <h3 className="font-semibold">{conv.expertName}</h3>
                  <p className="text-sm text-gray-500">
                    {conv.messages[conv.messages.length - 1].content.slice(0, 20)}...
                  </p>
                </div>
                {conv.messages.some((msg) => !msg.isRead) && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">🔴</span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* 💬 Zone de chat */}
        <div className="w-2/3 bg-white rounded-lg shadow-md flex flex-col">
          {activeConversation ? (
            <>
              {/* 🔹 Header chat */}
              <div className="p-4 border-b flex items-center">
                <img src={activeConversation.expertAvatar} alt={activeConversation.expertName} className="h-10 w-10 rounded-full" />
                <h2 className="ml-3 text-lg font-bold">{activeConversation.expertName}</h2>
              </div>

              {/* 🔹 Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {activeConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "client" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender === "client" ? "bg-blue-600 text-white" : "bg-gray-200"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <span className="block text-xs text-gray-500 mt-1">{msg.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 🔹 Zone d'envoi de message */}
              <div className="p-4 border-t flex items-center">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Écrire un message..."
                  className="flex-1 px-3 py-2 border rounded-lg outline-none"
                />
                <Button onClick={sendMessage} className="ml-3 bg-blue-600 text-white flex items-center">
                  Envoyer <Send className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Sélectionnez une conversation à afficher.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
