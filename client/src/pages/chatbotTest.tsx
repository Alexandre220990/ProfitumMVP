import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Message } from '../types/chatbot';
import { ChatConversation } from '../components/ChatConversation';
import { ChatInput } from '../components/ChatInput';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

const ChatbotTestPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      text: "Bonjour ! Je suis votre assistant Profitum en mode démo. Je vais vous aider à identifier vos opportunités d'optimisation fiscale. Dans quel secteur d'activité évoluez-vous ?", 
      isUser: false, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);

  const handleSendMessage = async (message: string) => {
    try {
      setLoading(true);
      
      // Ajouter le message de l'utilisateur
      const userMessage: Message = {
        text: message,
        isUser: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, userMessage]);

      // Préparer l'historique pour OpenAI
      const apiHistory = messages.map(m => ({
        role: m.isUser ? 'user' : 'assistant',
        content: m.text
      }));

      // Appel direct à l'API OpenAI
      const response = await fetch('/api/chatbot-test/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: apiHistory
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message');
      }

      const data = await response.json();
      
      // Ajouter la réponse du chatbot
      const botMessage: Message = {
        text: data.reply,
        isUser: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Erreur:', error);
      const errorMessage: Message = {
        text: "Désolé, je rencontre un problème technique. Pouvez-vous réessayer ?",
        isUser: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="container mx-auto p-4">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/dashboard/client/demo')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au tableau de bord
        </Button>
      </div>
      <main className="flex-1 flex">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-lg flex flex-col h-[80vh]">
            <ChatConversation messages={messages} />
            <ChatInput
              onSend={handleSendMessage}
              disabled={loading}
              loading={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatbotTestPage; 