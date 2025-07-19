import React from 'react';
import { MessagingApp } from '@/components/messaging/MessagingApp';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// PAGE PRINCIPALE DE MESSAGERIE
// ============================================================================

export default function MessageriePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Rediriger si non authentifié
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête de la page */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="md:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Messagerie
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Connecté en tant que {user.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-[calc(100vh-120px)]">
          <MessagingApp className="h-full" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MÉTADONNÉES DE LA PAGE
// ============================================================================

MessageriePage.meta = {
  title: 'Messagerie - Profitum',
  description: 'Communiquez en temps réel avec vos experts et le support',
  requiresAuth: true
}; 