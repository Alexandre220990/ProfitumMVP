import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useClientId } from '../hooks/useClientId';
import { ChatbotSimulator } from '../components/ChatbotSimulator';
import { Navigate } from 'react-router-dom';

const ChatbotSimulatorPage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const clientId = useClientId();
  const clientLoading = false; // Le hook ne gère pas le loading

  if (authLoading || clientLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!clientId) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Simulation Interactive
      </h1>
      <ChatbotSimulator clientId={clientId} onComplete={(result) => {
        // Gérer la complétion de la simulation
        console.log('Simulation terminée:', result);
      }} />
    </div>
  );
};

export default ChatbotSimulatorPage; 