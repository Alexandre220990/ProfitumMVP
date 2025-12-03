import { AuthUser } from "@/types/auth";

/**
 * Interface pour les données de connexion
 */
interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Interface pour la réponse d'authentification
 */
interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user: AuthUser;
  };
  message?: string;
}

/**
 * Se connecter en tant que CLIENT UNIQUEMENT
 */
export const loginClient = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';
    console.log('🔑 Tentative de connexion CLIENT via API...', { API_URL });
    
    const response = await fetch(`${API_URL}/api/auth/client/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Erreur de connexion'
      };
    }

    // ✅ Stocker la session Supabase côté client
    if (data.data?.supabase_session) {
      const { supabase } = await import('./supabase');
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.data.supabase_session.access_token,
        refresh_token: data.data.supabase_session.refresh_token
      });
      
      if (sessionError) {
        console.error('❌ Erreur stockage session Supabase:', sessionError);
      } else {
        console.log('✅ Session Supabase établie côté client');
      }
    }

    return data;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur de connexion'
    };
  }
};

/**
 * Se connecter en tant qu'EXPERT UNIQUEMENT
 */
export const loginExpert = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';
    console.log('🔑 Tentative de connexion EXPERT via API...', { API_URL });
    
    const response = await fetch(`${API_URL}/api/auth/expert/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Erreur de connexion'
      };
    }

    // ✅ Stocker la session Supabase côté client
    if (data.data?.supabase_session) {
      const { supabase } = await import('./supabase');
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.data.supabase_session.access_token,
        refresh_token: data.data.supabase_session.refresh_token
      });
      
      if (sessionError) {
        console.error('❌ Erreur stockage session Supabase:', sessionError);
      } else {
        console.log('✅ Session Supabase établie côté client');
      }
    }

    return data;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur de connexion'
    };
  }
};

/**
 * Se connecter en tant qu'APPORTEUR UNIQUEMENT
 */
export const loginApporteur = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';
    console.log('🔑 Tentative de connexion APPORTEUR via API...', { API_URL });
    
    const response = await fetch(`${API_URL}/api/auth/apporteur/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Erreur de connexion'
      };
    }

    // ✅ Stocker la session Supabase côté client
    if (data.data?.supabase_session) {
      const { supabase } = await import('./supabase');
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.data.supabase_session.access_token,
        refresh_token: data.data.supabase_session.refresh_token
      });
      
      if (sessionError) {
        console.error('❌ Erreur stockage session Supabase:', sessionError);
      } else {
        console.log('✅ Session Supabase établie côté client');
      }
    }

    return data;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur de connexion'
    };
  }
};

/**
 * Se connecter en tant qu'ADMIN UNIQUEMENT
 */
export const loginAdmin = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';
    console.log('🔑 Tentative de connexion ADMIN via API...', { API_URL });
    
    const response = await fetch(`${API_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });

    const data = await response.json();
    console.log('📦 Réponse backend admin:', { 
      ok: response.ok, 
      status: response.status,
      hasData: !!data.data,
      hasUser: !!data.data?.user,
      userType: data.data?.user?.type,
      hasSupabaseSession: !!data.data?.supabase_session
    });

    if (!response.ok) {
      console.error('❌ Réponse non-ok du backend:', data);
      return {
        success: false,
        message: data.message || 'Erreur de connexion'
      };
    }

    // ✅ Stocker la session Supabase côté client
    if (data.data?.supabase_session) {
      console.log('🔐 Tentative de stockage session Supabase...');
      const { supabase } = await import('./supabase');
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.data.supabase_session.access_token,
        refresh_token: data.data.supabase_session.refresh_token
      });
      
      if (sessionError) {
        console.error('❌ Erreur stockage session Supabase:', sessionError);
      } else {
        console.log('✅ Session Supabase établie côté client');
      }
    } else {
      console.warn('⚠️ Aucune session Supabase dans la réponse backend');
    }

    console.log('✅ Retour de loginAdmin:', { 
      success: data.success, 
      hasUser: !!data.data?.user,
      userEmail: data.data?.user?.email,
      userType: data.data?.user?.type
    });
    return data;
  } catch (error) {
    console.error('❌ Erreur catch loginAdmin:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur de connexion'
    };
  }
};
