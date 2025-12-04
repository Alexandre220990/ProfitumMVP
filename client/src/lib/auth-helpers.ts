import { supabase } from './supabase';

/**
 * ✅ HELPER D'AUTHENTIFICATION SUPABASE
 * 
 * Fonction utilitaire pour récupérer le token Supabase
 * À utiliser dans les composants qui font des appels fetch directs
 */

/**
 * Récupère le token Supabase actuel
 * @returns Token d'accès Supabase ou null si pas de session
 */
export const getSupabaseToken = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('❌ Erreur récupération token Supabase:', error);
    return null;
  }
};

/**
 * Récupère les headers d'authentification pour fetch
 * @returns Object avec Authorization header
 */
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await getSupabaseToken();
  
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/**
 * Fait un appel fetch avec authentification Supabase automatique
 * @param url URL à appeler
 * @param options Options fetch
 * @returns Promise<Response>
 */
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers = await getAuthHeaders();
  
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  });
};

