import { supabase } from './supabase';
import { AuthUser } from "@/types/auth";
// import { config } from '../config/env';

/**
 * Interface pour les données de connexion
 */
interface LoginCredentials { email: string;
  password: string; }

/**
 * Interface pour les données d'inscription
 */
interface RegisterCredentials { 
  email: string;
  password: string;
  type: 'client' | 'expert' | 'admin';
  user_metadata?: Record<string, any>; 
}

/**
 * Interface pour la réponse d'authentification
 */
interface AuthResponse { success: boolean;
  data?: {
    token: string;
    user: AuthUser; };
  message?: string;
}

/**
 * Se connecter avec Supabase Auth
 */
export const loginWithSupabase = async (credentials: LoginCredentials): Promise<AuthResponse> => { try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: credentials.email, password: credentials.password });

    if (error) { return {
        success: false, message: error.message };
    }

    if (!data.user || !data.session) { return {
        success: false, message: 'Connexion échouée' };
    }

    // Créer un objet AuthUser compatible
    const authUser: AuthUser = { 
      id: data.user.id, 
      email: data.user.email || '', 
      type: (data.user.user_metadata?.type as 'client' | 'expert' | 'admin') || 'client', 
      username: data.user.user_metadata?.username || data.user.email?.split('@')[0], 
      company_name: data.user.user_metadata?.company_name, 
      siren: data.user.user_metadata?.siren, 
      specializations: data.user.user_metadata?.specializations, 
      experience: data.user.user_metadata?.experience, 
      location: data.user.user_metadata?.location, 
      description: data.user.user_metadata?.description 
    };

    // Stocker le token Supabase
    localStorage.setItem('supabase_token', data.session.access_token);
    localStorage.setItem('supabase_refresh_token', data.session.refresh_token);
    
    // Stocker aussi dans 'token' pour compatibilité avec l'ancien système
    localStorage.setItem('token', data.session.access_token);

    return { success: true, data: {
        token: data.session.access_token, user: authUser }
    };

  } catch (error) { console.error('Erreur lors de la connexion Supabase: ', error);
    return {
      success: false, message: 'Erreur lors de la connexion' };
  }
};

/**
 * S'inscrire avec Supabase Auth
 */
export const registerWithSupabase = async (credentials: RegisterCredentials): Promise<AuthResponse> => { try {
    const { data, error } = await supabase.auth.signUp({ email: credentials.email, password: credentials.password, options: {
        data: {
          type: credentials.type, ...credentials.user_metadata }
      }
    });

    if (error) { return {
        success: false, message: error.message };
    }

    if (!data.user) { return {
        success: false, message: 'Inscription échouée' };
    }

    // Créer un objet AuthUser compatible
    const authUser: AuthUser = { id: data.user.id, email: data.user.email || '', type: credentials.type, username: credentials.user_metadata?.username || credentials.email.split('@')[0], company_name: credentials.user_metadata?.company_name, siren: credentials.user_metadata?.siren, specializations: credentials.user_metadata?.specializations, experience: credentials.user_metadata?.experience, location: credentials.user_metadata?.location, description: credentials.user_metadata?.description };

    // Si une session est disponible (connexion automatique après inscription)
    if (data.session) { localStorage.setItem('supabase_token', data.session.access_token);
      localStorage.setItem('supabase_refresh_token', data.session.refresh_token);

      return {
        success: true, data: {
          token: data.session.access_token, user: authUser }
      };
    }

    // Sinon, retourner juste les données utilisateur (email à confirmer)
    return { success: true, data: {
        token: '', // Pas de token car email à confirmer
        user: authUser },
      message: 'Vérifiez votre email pour confirmer votre compte'
    };

  } catch (error) { console.error('Erreur lors de l\'inscription Supabase: ', error);
    return {
      success: false, message: 'Erreur lors de l\'inscription' };
  }
};

/**
 * Se déconnecter de Supabase
 */
export const logoutFromSupabase = async (): Promise<void> => { try {
    await supabase.auth.signOut();
    localStorage.removeItem('supabase_token');
    localStorage.removeItem('supabase_refresh_token'); } catch (error) { console.error('Erreur lors de la déconnexion: ', error); }
};

/**
 * Vérifier si l'utilisateur est connecté
 */
export const checkSupabaseAuth = async (): Promise<AuthResponse> => { 
  try {
    console.log('🔍 Vérification de la session Supabase...');
    
    // D'abord vérifier la session actuelle
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erreur session Supabase:', sessionError);
      return {
        success: false, 
        message: 'Erreur de session'
      };
    }

    if (!session) {
      console.log('❌ Aucune session active');
      return {
        success: false, 
        message: 'Utilisateur non authentifié'
      };
    }

    // Ensuite vérifier l'utilisateur
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('❌ Erreur utilisateur Supabase:', userError);
      return {
        success: false, 
        message: 'Utilisateur non trouvé'
      };
    }

    console.log('✅ Utilisateur trouvé:', user.email, user.user_metadata?.type);

    // Créer un objet AuthUser compatible
    const authUser: AuthUser = { 
      id: user.id, 
      email: user.email || '', 
      type: (user.user_metadata?.type as 'client' | 'expert' | 'admin') || 'client', 
      username: user.user_metadata?.username || user.email?.split('@')[0], 
      company_name: user.user_metadata?.company_name, 
      siren: user.user_metadata?.siren, 
      specializations: user.user_metadata?.specializations, 
      experience: user.user_metadata?.experience, 
      location: user.user_metadata?.location, 
      description: user.user_metadata?.description 
    };

    // Mettre à jour les tokens dans localStorage
    localStorage.setItem('supabase_token', session.access_token);
    localStorage.setItem('supabase_refresh_token', session.refresh_token);
    localStorage.setItem('token', session.access_token);

    return { 
      success: true, 
      data: {
        token: session.access_token,
        user: authUser 
      }
    };

  } catch (error) { 
    console.error('❌ Erreur lors de la vérification de l\'authentification: ', error);
    return {
      success: false, 
      message: 'Erreur lors de la vérification'
    };
  }
};

/**
 * Obtenir le token Supabase actuel
 */
export const getSupabaseToken = async (): Promise<string | null> => { try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) { console.error('Erreur lors de la récupération du token: ', error);
    return null; }
};

/**
 * Rafraîchir le token Supabase
 */
export const refreshSupabaseToken = async (): Promise<string | null> => { try {
    const { data: { session }, error } = await supabase.auth.refreshSession();

    if (error || !session) { return null; }

    localStorage.setItem('supabase_token', session.access_token);
    localStorage.setItem('supabase_refresh_token', session.refresh_token);

    return session.access_token;
  } catch (error) { console.error('Erreur lors du rafraîchissement du token: ', error);
    return null; }
};

export default supabase; 