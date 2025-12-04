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
  const reloadCount = parseInt(sessionStorage.getItem('chunkReloadCount') || '0');
  const now = Date.now();
  
  // Autoriser jusqu'à 3 rechargements dans les 30 dernières secondes
  if (!lastReload || (now - parseInt(lastReload)) > 30000) {
    // Reset le compteur si plus de 30 secondes se sont écoulées
    sessionStorage.setItem('chunkReloadCount', '1');
    sessionStorage.setItem('lastChunkReload', now.toString());
    
    console.log('🧹 Nettoyage du cache...');
    
    // Vider le cache et recharger
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Hard reload pour forcer le rechargement sans cache
    setTimeout(() => {
      window.location.reload();
    }, 500);
  } else if (reloadCount < 3) {
    // Incrémenter le compteur
    sessionStorage.setItem('chunkReloadCount', (reloadCount + 1).toString());
    sessionStorage.setItem('lastChunkReload', now.toString());
    
    console.log(`🔄 Tentative ${reloadCount + 1}/3 de rechargement...`);
    
    // Vider le cache et recharger
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
  } else {
    console.error('❌ Trop de rechargements détectés, veuillez vider votre cache manuellement');
    console.error('💡 Sur Mac: Cmd + Shift + R | Sur Windows: Ctrl + Shift + R');
    
    // Afficher un message à l'utilisateur
    const root = document.getElementById('root');
    if (root && !root.hasChildNodes()) {
      root.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; font-family: system-ui, sans-serif;">
          <div style="max-width: 500px; padding: 30px; background: #fee; border: 2px solid #c33; border-radius: 12px; text-align: center;">
            <h2 style="color: #c33; margin-bottom: 16px;">⚠️ Problème de cache persistant</h2>
            <p style="color: #333; margin-bottom: 20px;">
              L'application ne peut pas charger certains fichiers. Ceci est souvent causé par un cache obsolète.
            </p>
            <p style="color: #666; font-size: 14px; margin-bottom: 24px;">
              <strong>Solution :</strong> Effectuez un rechargement forcé :
              <br><br>
              <strong>Sur Mac :</strong> Cmd + Shift + R
              <br>
              <strong>Sur Windows :</strong> Ctrl + Shift + R
            </p>
            <button 
              onclick="sessionStorage.clear(); localStorage.clear(); if('caches' in window){ caches.keys().then(n => n.forEach(name => caches.delete(name))); } setTimeout(() => window.location.reload(), 500);" 
              style="padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500;">
              Vider tout le cache et réessayer
            </button>
          </div>
        </div>
      `;
    }
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
  
  console.log("Rendu initial terminé");
  
  // ✅ Marquer que l'application a démarré avec succès
  // Cela désactive le timer de sécurité dans index.html
  if (typeof window !== 'undefined' && typeof window.__APP_STARTED__ === 'function') {
    setTimeout(() => {
      window.__APP_STARTED__?.();
    }, 100);
  }
} catch (error) { console.error("Erreur lors de l'initialisation de React: ", error);
  
  // Afficher un message d'erreur directement dans le DOM
  root.innerHTML = `
    <div style="padding: 20px; color: red; border: 1px solid red; margin: 20px; border-radius: 5px;">
      <h3>Erreur d'initialisation</h3>
      <p>${error instanceof Error ? error.message : String(error) }</p>
      <button onclick="window.location.reload()">Recharger l'application</button>
    </div>
  `;
}