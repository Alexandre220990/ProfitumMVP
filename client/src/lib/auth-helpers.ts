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
 * Récupère un token Supabase frais (refresh automatique si expiré)
 * @param forceRefresh Force le refresh même si le token n'est pas expiré
 * @returns Token d'accès Supabase ou null si pas de session
 */
export const getSupabaseTokenFresh = async (forceRefresh = false): Promise<string | null> => {
  try {
    // D'abord récupérer la session actuelle
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (!currentSession) {
      console.warn('⚠️ Pas de session Supabase active');
      return null;
    }

    // Vérifier si le token expire dans moins de 5 minutes (300 secondes)
    const expiresAt = currentSession.expires_at || 0;
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt - now;
    const isExpiringSoon = timeUntilExpiry < 300; // 5 minutes

    // Refresh si expiré bientôt ou si forcé
    if (isExpiringSoon || forceRefresh) {
      console.log(`🔄 Token Supabase ${isExpiringSoon ? 'expire bientôt' : 'refresh forcé'}, refresh en cours... (expire dans ${timeUntilExpiry}s)`);
      
      const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('❌ Erreur refresh session Supabase:', refreshError);
        
        // Si erreur 429 (rate limiting), utiliser le token actuel
        if (refreshError.message?.includes('429') || refreshError.status === 429) {
          console.warn('⚠️ Rate limiting Supabase (429), utilisation du token actuel');
          return currentSession.access_token || null;
        }
        
        // Pour les autres erreurs, retourner null
        return null;
      }
      
      if (!newSession) {
        console.error('❌ Pas de session après refresh');
        return null;
      }
      
      console.log('✅ Token Supabase refreshé avec succès');
      
      // Mettre à jour localStorage pour compatibilité
      localStorage.setItem('token', newSession.access_token);
      localStorage.setItem('supabase_token', newSession.access_token);
      
      return newSession.access_token;
    }
    
    // Token encore valide
    return currentSession.access_token || null;
    
  } catch (error) {
    console.error('❌ Erreur récupération token Supabase frais:', error);
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

