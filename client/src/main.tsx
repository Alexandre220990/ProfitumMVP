import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from "react-router-dom";
import App from './App';
import './index.css';

// Composant pour afficher les erreurs capturées
function ErrorFallback({ error }: { error: Error }) { console.error("Erreur capturée par ErrorBoundary: ", error);
  
  return (
    <div style={{ 
      margin: '20px', padding: '20px', border: '1px solid red', borderRadius: '5px', backgroundColor: '#ffebee' }}>
      <h2>Une erreur s'est produite</h2>
      <p>Message: { error.message }</p>
      <details>
        <summary>Détails de l'erreur</summary>
        <pre>{ error.stack }</pre>
      </details>
      <button 
        onClick={ () => window.location.reload() }
        style={ {
          padding: '10px', margin: '10px 0', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Recharger l'application
      </button>
    </div>
  );
}

// Error Boundary personnalisée
class ErrorBoundary extends React.Component<{ children: React.ReactNode }> { state = { hasError: false, error: null as Error | null };
  
  static getDerivedStateFromError(error: Error) { return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: any) { console.error("Erreur rencontrée dans le composant: ", error);
    console.error("Détails: ", errorInfo); }
  
  render() { if (this.state.hasError && this.state.error) {
      return <ErrorFallback error={this.state.error } />;
    }
    
    return this.props.children;
  }
}

// Gestionnaire global pour les erreurs de chargement de modules (chunk loading errors)
const handleChunkLoadError = () => {
  console.warn('🔄 Erreur de chargement de module détectée, rechargement automatique...');
  
  // Vérifier si on a déjà tenté un rechargement récemment pour éviter les boucles infinies
  const lastReload = sessionStorage.getItem('lastChunkReload');
  const now = Date.now();
  
  if (!lastReload || (now - parseInt(lastReload)) > 10000) {
    sessionStorage.setItem('lastChunkReload', now.toString());
    
    // Vider le cache et recharger
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Hard reload pour forcer le rechargement sans cache
    window.location.reload();
  } else {
    console.error('❌ Trop de rechargements détectés, veuillez vider votre cache manuellement');
  }
};

window.addEventListener('error', (event) => {
  const isChunkLoadError = 
    event.message.includes('Failed to fetch dynamically imported module') ||
    event.message.includes('Importing a module script failed') ||
    event.message.includes('error loading dynamically imported module');
  
  if (isChunkLoadError) {
    event.preventDefault();
    handleChunkLoadError();
  }
});

// Gestionnaire pour les promesses rejetées (erreurs de chargement asynchrone)
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason?.message || event.reason?.toString() || '';
  const isChunkLoadError = 
    error.includes('Failed to fetch dynamically imported module') ||
    error.includes('Importing a module script failed') ||
    error.includes('error loading dynamically imported module');
  
  if (isChunkLoadError) {
    event.preventDefault();
    handleChunkLoadError();
  }
});

// Initialisation de l'app avec plus de logs pour déboguer
console.log("Initialisation de l'application...");

const root = document.getElementById("root");
if (!root) { console.error("Élément root introuvable dans le DOM");
  throw new Error("Root element not found"); }

console.log("Élément root trouvé, création du root React...");

try { const reactRoot = ReactDOM.createRoot(root);
  
  console.log("Root React créé, rendu de l'application...");
  
  reactRoot.render(
    <React.StrictMode>
      <Router>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </Router>
    </React.StrictMode>
  );
  
  console.log("Rendu initial terminé"); } catch (error) { console.error("Erreur lors de l'initialisation de React: ", error);
  
  // Afficher un message d'erreur directement dans le DOM
  root.innerHTML = `
    <div style="padding: 20px; color: red; border: 1px solid red; margin: 20px; border-radius: 5px;">
      <h3>Erreur d'initialisation</h3>
      <p>${error instanceof Error ? error.message : String(error) }</p>
      <button onclick="window.location.reload()">Recharger l'application</button>
    </div>
  `;
}