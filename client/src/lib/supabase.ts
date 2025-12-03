import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";
import { config } from "../config/env";

// Création du client Supabase avec la configuration optimisée pour la persistance
export const supabase = createClient<Database>(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, { 
  auth: {
    persistSession: true, 
    autoRefreshToken: true, 
    detectSessionInUrl: true,
    // Configuration du stockage pour garantir la persistance
    storage: window.localStorage,
    storageKey: 'supabase.auth.token', // Clé explicite pour éviter les conflits
    flowType: 'implicit' // Utiliser le flux implicite pour les PWA
  }
});

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