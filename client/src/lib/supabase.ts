import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";
import { config } from "../config/env";

// ============================================================================
// SINGLETON AVEC HMR - Évite la réinitialisation lors du hot-reload
// ============================================================================

// Déclaration du type global pour le HMR
declare global {
  interface Window {
    __SUPABASE_CLIENT__?: ReturnType<typeof createClient<Database>>;
  }
}

// Fonction pour créer ou récupérer le client Supabase singleton
function getSupabaseClient() {
  // En développement avec HMR, utiliser window pour persister le client
  if (import.meta.hot && typeof window !== 'undefined') {
    if (!window.__SUPABASE_CLIENT__) {
      console.log('🔧 [Supabase] Création du client singleton (HMR)');
      window.__SUPABASE_CLIENT__ = createClient<Database>(
        config.SUPABASE_URL, 
        config.SUPABASE_ANON_KEY, 
        { 
  auth: {
    persistSession: true, 
    autoRefreshToken: true, 
    detectSessionInUrl: true,
    storage: window.localStorage,
            storageKey: 'supabase.auth.token',
            flowType: 'implicit'
          }
        }
      );
    } else {
      console.log('♻️ [Supabase] Réutilisation du client singleton (HMR)');
    }
    return window.__SUPABASE_CLIENT__;
  }

  // En production, créer normalement
  return createClient<Database>(
    config.SUPABASE_URL, 
    config.SUPABASE_ANON_KEY, 
    { 
      auth: {
        persistSession: true, 
        autoRefreshToken: true, 
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'supabase.auth.token',
        flowType: 'implicit'
      }
    }
  );
}

// Export du client Supabase singleton
export const supabase = getSupabaseClient();

// ============================================================================
// HMR - Préserver les données lors du hot-reload
// ============================================================================
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('🔥 [Supabase] HMR accepté, client préservé');
  });
  
  // Éviter les fuites mémoire en nettoyant les anciens listeners
  import.meta.hot.dispose(() => {
    console.log('🧹 [Supabase] Nettoyage HMR (listeners préservés)');
  });
}

// Fonction utilitaire pour les requêtes avec headers
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => { 
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  return fetch(url, { 
    ...options, 
    headers: {
      ...options.headers, 
      'apikey': config.SUPABASE_ANON_KEY, 
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
};

// Fonction utilitaire pour les uploads de fichiers avec authentification
export const fetchWithAuthForUpload = async (url: string, options: RequestInit = {}) => { 
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  return fetch(url, { 
    ...options, 
    headers: {
      ...options.headers, 
      'apikey': config.SUPABASE_ANON_KEY, 
      'Authorization': token ? `Bearer ${token}` : ''
      // Ne pas forcer Content-Type pour permettre multipart/form-data
    },
    credentials: 'include'
  });
};

// Test de connexion
export const testSupabaseConnection = async () => { 
  try {
    const { error } = await supabase
      .from('Client')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) { 
      console.error('❌ Erreur de connexion à Supabase :', error);
      return false; 
    }

    console.log('✅ Connexion à Supabase réussie');
    return true;
  } catch (err) { 
    console.error('❌ Erreur inattendue :', err);
    return false; 
  }
}; 