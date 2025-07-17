import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) { throw new Error('Variables d\'environnement Supabase manquantes'); }

// Création du client Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, { auth: {
    persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

// Fonction utilitaire pour les requêtes avec headers
export const fetchWithAuth = async (url: string, options: RequestInit = {  }) => { const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  return fetch(url, { ...options, headers: {
      ...options.headers, 'apikey': supabaseKey, 'Authorization': token ? `Bearer ${token }` : '',
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
};

// Test de connexion
export const testSupabaseConnection = async () => { try {
    const { error } = await supabase
      .from('Client')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) { console.error('❌ Erreur de connexion à Supabase :', error);
      return false; }

    console.log('✅ Connexion à Supabase réussie');
    return true;
  } catch (err) { console.error('❌ Erreur inattendue :', err);
    return false; }
}; 