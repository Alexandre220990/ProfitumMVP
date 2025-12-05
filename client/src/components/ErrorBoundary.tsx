import { Component, ErrorInfo, ReactNode } from 'react';
import ErrorDisplay from './ErrorDisplay';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Mettre à jour l'état pour afficher l'UI de secours au prochain rendu
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Stocker errorInfo pour l'envoyer au support
    this.setState({ errorInfo });
    
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

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay 
          error={this.state.error} 
          errorInfo={this.state.errorInfo}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

