import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Message, ApiMessage } from '../types/chatbot';
import { ChatConversation } from '../components/ChatConversation';
import { ChatInput } from '../components/ChatInput';
import { ChatResults } from '../components/ChatResults';

const ChatbotPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const clientId = params.get('client_id');

  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      text: "Bonjour ! Je suis votre assistant Profitum. Je vais vous aider à identifier vos opportunités d'optimisation fiscale. Dans quel secteur d'activité évoluez-vous ?", 
      isUser: false, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);

  // États pour les résultats
  const [conversationComplete, setConversationComplete] = useState(false);
  const [eligibleProducts, setEligibleProducts] = useState<any[]>([]);
  const [totalGain, setTotalGain] = useState(0);
  const [profileData, setProfileData] = useState<any>({});

  if (!clientId) {
    return (
      <div className="container mx-auto mt-10 max-w-2xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Impossible de démarrer la discussion : client non identifié.
            <div className="mt-4">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Retour au tableau de bord
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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

      // Formater l'historique pour l'API
      const apiHistory: ApiMessage[] = messages.map(m => ({
        role: m.isUser ? 'user' : 'assistant',
        content: m.text,
        timestamp: new Date()
      }));

      // Envoyer au serveur
      const response = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
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

      // Vérifier si la conversation est terminée
      if (data.conversation_complete) {
        setConversationComplete(true);
        
        // Normaliser les produits éligibles pour s'assurer qu'ils ont les bonnes propriétés
        const normalizedProducts = (data.produits_eligibles || []).map((p: any) => ({
          ...p,
          estimatedGain: p.estimatedGain || p.gainPotentiel || 0,
          gainPotentiel: p.gainPotentiel || p.estimatedGain || 0,
          reasons: p.reasons || []
        }));
        
        setEligibleProducts(normalizedProducts);
        
        // Calculer le gain total en gérant les propriétés manquantes
        const calculatedTotalGain = normalizedProducts.reduce((sum: number, p: any) => {
          const gain = p.gainPotentiel || p.estimatedGain || 0;
          return sum + gain;
        }, 0);
        
        setTotalGain(calculatedTotalGain);
        setProfileData(data.client_profile || {});
      }

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

  const handleContactExpert = () => {
    // Navigation vers la page de contact expert
    navigate('/contact-expert', { 
      state: { 
        eligibleProducts, 
        totalGain, 
        profileData,
        clientId 
      } 
    });
  };

  const handleStartProcess = () => {
    // Navigation vers le dashboard client avec le clientId
    navigate(`/dashboard/client/${clientId}`, { 
      state: { 
        eligibleProducts, 
        totalGain, 
        profileData,
        clientId 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 flex flex-col">
        {/* Fenêtre du chatbot */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-lg flex flex-col h-[60vh]">
            <div className="flex-1 overflow-y-auto">
              <ChatConversation messages={messages} />
            </div>
            {!conversationComplete && (
              <ChatInput
                onSend={handleSendMessage}
                disabled={loading}
                loading={loading}
              />
            )}
          </div>
        </div>

        {/* Résultats sous la fenêtre du chatbot */}
        {conversationComplete && (
          <div className="w-full max-w-6xl mx-auto p-4">
            <ChatResults
              eligibleProducts={eligibleProducts}
              totalGain={totalGain}
              profileData={profileData}
              onContactExpert={handleContactExpert}
              onStartProcess={handleStartProcess}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatbotPage; 