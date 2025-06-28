import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  error?: Error;
  message?: string;
  resetError?: () => void;
}

export default function ErrorPage({ 
  error, 
  message = "Une erreur est survenue dans l'application", 
  resetError 
}: ErrorPageProps) {
  // Enregistrer l'erreur dans les logs
  useEffect(() => {
    console.error('Page d\'erreur affichée:', error || message);
    
    // Vous pouvez envoyer l'erreur à un service de monitoring ici
  }, [error, message]);

  // Fonction pour recharger l'application
  const handleReload = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 text-red-500">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oups! Quelque chose s'est mal passé</h1>
          <p className="text-gray-600 mb-4">{message}</p>
          
          {error && (
            <div className="mb-6 text-left">
              <details className="bg-gray-100 p-3 rounded-lg">
                <summary className="cursor-pointer font-medium">Détails techniques</summary>
                <p className="mt-2 text-sm text-gray-700">{error.message}</p>
                <pre className="mt-2 text-xs overflow-x-auto p-2 bg-gray-200 rounded">
                  {error.stack}
                </pre>
              </details>
            </div>
          )}
          
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={handleReload}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Recharger l'application
            </Button>
            
            <Link to="/home">
              <Button
                variant="outline"
                className="w-full"
              >
                Retour à la page d'accueil
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 