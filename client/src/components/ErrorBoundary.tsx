import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Mettre à jour l'état pour afficher l'UI de secours au prochain rendu
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Vérifier si c'est une erreur de chargement de chunk
    const chunkFailedMessage = /Failed to fetch dynamically imported module|Loading chunk|Loading CSS chunk/i;
    
    if (chunkFailedMessage.test(error.message)) {
      console.warn('🔄 Erreur de chargement de chunk détectée par ErrorBoundary, rechargement...');
      
      // Éviter les boucles infinies
      if (!sessionStorage.getItem('chunk_reload_attempted')) {
        sessionStorage.setItem('chunk_reload_attempted', 'true');
        window.location.reload();
      } else {
        // Si ça a déjà échoué une fois, réinitialiser le compteur pour permettre 
        // un nouveau rechargement après un délai
        setTimeout(() => {
          sessionStorage.removeItem('chunk_reload_attempted');
        }, 5000);
      }
    }
  }

  private handleReload = () => {
    sessionStorage.removeItem('chunk_reload_attempted');
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    sessionStorage.removeItem('chunk_reload_attempted');
  };

  public render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message && 
        /Failed to fetch dynamically imported module|Loading chunk|Loading CSS chunk/i.test(this.state.error.message);

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
              
              {this.state.error && !isChunkError && (
                <div className="bg-gray-100 rounded p-4 mb-6 text-sm">
                  <p className="font-mono text-gray-700 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button
                  onClick={this.handleReload}
                  className="flex-1"
                  variant="default"
                >
                  Recharger l'application
                </Button>
                {!isChunkError && (
                  <Button
                    onClick={this.handleReset}
                    variant="outline"
                    className="flex-1"
                  >
                    Réessayer
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

