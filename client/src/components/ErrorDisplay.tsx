import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Mail, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { post } from '@/lib/api';

interface ErrorDisplayProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export default function ErrorDisplay({ error, errorInfo }: ErrorDisplayProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);

  const isChunkError = error?.message && 
    /Failed to fetch dynamically imported module|Loading chunk|Loading CSS chunk/i.test(error.message);

  const handleReload = () => {
    sessionStorage.removeItem('chunk_reload_attempted');
    window.location.reload();
  };

  const handleReset = () => {
    sessionStorage.removeItem('chunk_reload_attempted');
    window.location.reload();
  };

  const handleNotifySupport = async () => {
    if (isSending) return;

    setIsSending(true);

    try {
      // Préparer les données d'erreur
      const errorData = {
        errorMessage: error?.message || 'Erreur inconnue',
        errorStack: error?.stack || errorInfo?.componentStack || '',
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userEmail: user?.email || null,
        userType: user?.type || null,
        userName: user?.first_name && user?.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user?.username || null
      };

      // Envoyer le rapport au support
      const response = await post('/support/error-report', errorData);

      if (response.success) {
        // Afficher la notification de succès
        toast.success('Email envoyé au support avec succès', {
          description: 'Vous allez être redirigé vers votre dashboard',
          duration: 3000
        });

        // Rediriger vers le dashboard approprié après un court délai
        setTimeout(() => {
          const routes: Record<string, string> = {
            client: '/dashboard/client',
            expert: '/expert/dashboard',
            admin: '/admin/dashboard-optimized',
            apporteur: '/apporteur/dashboard'
          };

          const dashboardRoute = user?.type 
            ? routes[user.type] || '/dashboard/client'
            : '/dashboard/client';

          navigate(dashboardRoute);
        }, 1500);
      } else {
        toast.error('Erreur lors de l\'envoi de l\'email', {
          description: response.message || 'Veuillez réessayer plus tard'
        });
        setIsSending(false);
      }
    } catch (err) {
      console.error('❌ Erreur lors de l\'envoi du rapport:', err);
      toast.error('Erreur lors de l\'envoi de l\'email', {
        description: 'Veuillez réessayer plus tard'
      });
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            {isChunkError ? 'Nouvelle version disponible' : 'Une erreur s\'est produite'}
          </h1>
          
          <p className="text-center text-gray-600 mb-6">
            {isChunkError ? (
              <>
                L'application a été mise à jour. Veuillez recharger la page pour accéder à la dernière version.
              </>
            ) : (
              <>
                Nous sommes désolés, une erreur inattendue s'est produite. 
                Veuillez recharger la page pour continuer.
              </>
            )}
          </p>
          
          {error && !isChunkError && (
            <div className="bg-gray-100 rounded p-4 mb-6 text-sm">
              <details className="cursor-pointer">
                <summary className="font-medium text-gray-700 mb-2">Détails de l'erreur</summary>
                <p className="font-mono text-gray-700 break-all mt-2">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="font-mono text-xs text-gray-600 mt-2 overflow-x-auto whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                )}
              </details>
            </div>
          )}
          
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Button
                onClick={handleReload}
                className="flex-1"
                variant="default"
              >
                Recharger l'application
              </Button>
              {!isChunkError && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  Réessayer
                </Button>
              )}
            </div>
            
            {!isChunkError && (
              <Button
                onClick={handleNotifySupport}
                disabled={isSending}
                variant="outline"
                className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Prévenir le support
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
