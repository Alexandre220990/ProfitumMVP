import { supabase } from './supabase';
import { AuthUser } from "@/types/auth";
import { config } from '../config/env';

/**
 * ✅ SYSTÈME D'AUTHENTIFICATION SIMPLIFIÉ - SUPABASE NATIVE
 * 
 * Architecture :
 * 1. Frontend authentifie DIRECTEMENT avec Supabase (supabase.auth.signInWithPassword)
 * 2. Supabase gère automatiquement la session (persistSession: true)
 * 3. Backend sert uniquement à récupérer le profil utilisateur (GET /api/auth/me)
 * 
 * Avantages :
 * ✅ Moins d'étapes
 * ✅ Session auto-gérée par Supabase SDK
 * ✅ Refresh automatique
 * ✅ Plus simple à maintenir
 */

interface LoginCredentials {
  email: string;
  password: string;
  type?: 'client' | 'expert' | 'admin' | 'apporteur'; // Optionnel, pour validation seulement
}

interface RegisterCredentials {
  email: string;
  password: string;
  type: 'client' | 'expert' | 'admin' | 'apporteur';
  user_metadata?: Record<string, any>;
}

interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user: AuthUser;
  };
  message?: string;
}

/**
 * 🔐 Connexion simplifiée - Utilise DIRECTEMENT Supabase Auth
 */
export const loginSimple = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    console.log('🔐 [auth-simple] Connexion directe avec Supabase Auth...');
    
    // 1️⃣ Authentification directe avec Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    if (authError || !authData.session || !authData.user) {
      console.error('❌ Erreur authentification Supabase:', authError);
      return {
        success: false,
        message: authError?.message || 'Erreur de connexion'
      };
    }

    console.log('✅ Authentification Supabase réussie:', {
      userId: authData.user.id,
      email: authData.user.email,
      userType: authData.user.user_metadata?.type
    });

    // ✅ Supabase gère automatiquement le stockage de la session (persistSession: true)

    // 2️⃣ Récupérer le profil utilisateur complet depuis le backend
    const profileResponse = await fetch(`${config.API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      console.error('❌ Erreur récupération profil:', errorData);
      return {
        success: false,
        message: errorData.message || 'Erreur lors de la récupération du profil'
      };
    }

    const profileData = await profileResponse.json();
    console.log('✅ Profil utilisateur récupéré:', profileData);

    if (!profileData.success || !profileData.data?.user) {
      return {
        success: false,
        message: 'Profil utilisateur introuvable'
      };
    }

    return {
      success: true,
      data: {
        token: authData.session.access_token,
        user: profileData.data.user
      }
    };

  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur de connexion'
    };
  }
};

/**
 * 📝 Inscription simplifiée - Utilise DIRECTEMENT Supabase Auth
 */
export const registerSimple = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  try {
    console.log('📝 [auth-simple] Inscription directe avec Supabase Auth...');
    
    // 1️⃣ Inscription directe avec Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          type: credentials.type,
          ...credentials.user_metadata
        }
      }
    });

    if (authError || !authData.user) {
      console.error('❌ Erreur inscription Supabase:', authError);
      return {
        success: false,
        message: authError?.message || 'Erreur lors de l\'inscription'
      };
    }

    console.log('✅ Inscription Supabase réussie:', {
      userId: authData.user.id,
      email: authData.user.email
    });

    // Si pas de session (email à confirmer)
    if (!authData.session) {
      const authUser: AuthUser = {
        id: authData.user.id,
        email: authData.user.email || '',
        type: credentials.type,
        username: credentials.user_metadata?.username || credentials.email.split('@')[0],
        company_name: credentials.user_metadata?.company_name,
        siren: credentials.user_metadata?.siren,
        specializations: credentials.user_metadata?.specializations,
        experience: credentials.user_metadata?.experience,
        location: credentials.user_metadata?.location,
        description: credentials.user_metadata?.description
      };

      return {
        success: true,
        data: {
          token: '',
          user: authUser
        },
        message: 'Vérifiez votre email pour confirmer votre compte'
      };
    }

    // ✅ Supabase gère automatiquement le stockage de la session

    // 2️⃣ Récupérer le profil utilisateur complet depuis le backend
    const profileResponse = await fetch(`${config.API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!profileResponse.ok) {
      // Si le profil n'existe pas encore (création en cours), retourner les données de base
      const authUser: AuthUser = {
        id: authData.user.id,
        email: authData.user.email || '',
        type: credentials.type,
        username: credentials.user_metadata?.username || credentials.email.split('@')[0],
        company_name: credentials.user_metadata?.company_name,
        siren: credentials.user_metadata?.siren,
        specializations: credentials.user_metadata?.specializations,
        experience: credentials.user_metadata?.experience,
        location: credentials.user_metadata?.location,
        description: credentials.user_metadata?.description
      };

      return {
        success: true,
        data: {
          token: authData.session.access_token,
          user: authUser
        },
        message: 'Inscription réussie ! Votre profil est en cours de création'
      };
    }

    const profileData = await profileResponse.json();
    console.log('✅ Profil utilisateur récupéré:', profileData);

    return {
      success: true,
      data: {
        token: authData.session.access_token,
        user: profileData.data?.user || {
          id: authData.user.id,
          email: authData.user.email || '',
          type: credentials.type,
          username: credentials.user_metadata?.username || credentials.email.split('@')[0]
        }
      },
      message: 'Inscription réussie !'
    };

  } catch (error) {
    console.error('❌ Erreur lors de l\'inscription:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de l\'inscription'
    };
  }
};

/**
 * 👋 Déconnexion simplifiée
 */
export const logoutSimple = async (): Promise<void> => {
  try {
    console.log('👋 [auth-simple] Déconnexion...');
    await supabase.auth.signOut();
    // ✅ Supabase gère automatiquement le nettoyage de session
    console.log('✅ Déconnexion réussie');
  } catch (error) {
    console.error('❌ Erreur lors de la déconnexion:', error);
  }
};

/**
 * 🔍 Vérification d'authentification simplifiée
 */
export const checkAuthSimple = async (): Promise<AuthResponse> => {
  try {
    console.log('🔍 [auth-simple] Vérification de l\'authentification...');
    
    // 1️⃣ Vérifier la session Supabase (avec auto-refresh si nécessaire)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log('⚠️ Pas de session active');
      return {
        success: false,
        message: 'Utilisateur non authentifié'
      };
    }

    console.log('✅ Session Supabase valide:', {
      userId: session.user?.id,
      email: session.user?.email,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'
    });

    // 2️⃣ Récupérer le profil utilisateur depuis le backend (avec timeout court)
    console.log(`🌐 [checkAuthSimple] Appel vers: ${config.API_URL}/api/auth/me`);
    console.log(`🔑 [checkAuthSimple] Avec token: ${session.access_token.substring(0, 20)}...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('⏱️ TIMEOUT 5s sur /api/auth/me - Annulation !');
      controller.abort();
    }, 5000); // Timeout RÉDUIT à 5 secondes

    try {
      console.log('🚀 [checkAuthSimple] Lancement fetch...');
      const profileResponse = await fetch(`${config.API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log(`📥 [checkAuthSimple] Réponse reçue: ${profileResponse.status} ${profileResponse.statusText}`);

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json().catch(() => ({}));
        console.error('❌ Erreur récupération profil:', errorData);
        
        // Si 401/403, la session est invalide
        if (profileResponse.status === 401 || profileResponse.status === 403) {
          return {
            success: false,
            message: 'Session expirée ou invalide'
          };
        }
        
        return {
          success: false,
          message: errorData.message || 'Erreur lors de la récupération du profil'
        };
      }

      const profileData = await profileResponse.json();
      console.log('✅ Profil utilisateur récupéré:', profileData);

      if (!profileData.success || !profileData.data?.user) {
        return {
          success: false,
          message: 'Profil utilisateur introuvable'
        };
      }

      return {
        success: true,
        data: {
          token: session.access_token,
          user: profileData.data.user
        }
      };

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Si c'est un timeout
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('⏱️ Timeout lors de la récupération du profil (10s)');
        return {
          success: false,
          message: 'Délai d\'attente dépassé lors de la récupération du profil'
        };
      }
      
      console.error('❌ Erreur fetch profil:', fetchError);
      return {
        success: false,
        message: fetchError instanceof Error ? fetchError.message : 'Erreur réseau'
      };
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la vérification'
    };
  }
};

/**
 * 🔑 Obtenir le token Supabase actuel
 */
export const getSupabaseTokenSimple = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('❌ Erreur récupération token:', error);
    return null;
  }
};

