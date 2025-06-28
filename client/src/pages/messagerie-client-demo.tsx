import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  sender: 'user' | 'expert';
  content: string;
  timestamp: Date;
  read: boolean;
}

const demoMessages: Message[] = [
  {
    id: '1',
    sender: 'expert',
    content: 'Bonjour, je suis votre expert dédié. Comment puis-je vous aider aujourd\'hui ?',
    timestamp: new Date(Date.now() - 3600000),
    read: true
  },
  {
    id: '2',
    sender: 'user',
    content: 'Bonjour, j\'aimerais des informations sur le remboursement TICPE.',
    timestamp: new Date(Date.now() - 1800000),
    read: true
  },
  {
    id: '3',
    sender: 'expert',
    content: 'Je serai ravi de vous aider avec le remboursement TICPE. Pouvez-vous me confirmer votre numéro de dossier ?',
    timestamp: new Date(Date.now() - 900000),
    read: false
  }
];

const MessagerieClientDemo: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(demoMessages);
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: newMessage,
      timestamp: new Date(),
      read: false
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simuler une réponse de l'expert
    setTimeout(() => {
      const expertResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'expert',
        content: 'Merci pour votre message. Je vais traiter votre demande dans les plus brefs délais.',
        timestamp: new Date(),
        read: false
      };
      setMessages(prev => [...prev, expertResponse]);
    }, 2000);
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="p-4 h-[600px] flex flex-col">
        <h1 className="text-2xl font-bold mb-4">Messagerie</h1>
        <ScrollArea className="flex-1 mb-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">
                      {message.sender === 'user' ? 'Vous' : 'Expert'}
                    </span>
                    {!message.read && message.sender === 'expert' && (
                      <Badge variant="secondary">Non lu</Badge>
                    )}
                  </div>
                  <p>{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend}>Envoyer</Button>
        </div>
      </Card>
    </div>
  );
};

export default MessagerieClientDemo; 