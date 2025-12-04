import { ApiResponse } from "@/types/simulation";
import { getSupabaseToken } from '@/lib/auth-helpers';

// URL de l'API - configuration dynamique selon l'environnement
const API_URL: string = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';

export function extractData<T>(response: ApiResponse<T> | null | undefined): T | null { if (!response?.success || !response.data) {
    return null; }
  return response.data;
}

// Fonction pour obtenir les headers d'authentification
const getAuthHeaders = async () => { 
  const token = await getSupabaseToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json' };
  
  if (token) { headers['Authorization'] = `Bearer ${token }`;
  }
  
  return headers;
};

// Fonction pour gérer les erreurs d'authentification
const handleAuthError = (error: any) => { if (error.status === 401) {
    console.log('🔐 Erreur d\'authentification détectée, suppression du token');
    localStorage.removeItem('token');
    // Rediriger vers la page de connexion si nécessaire
    window.location.href = '/connexion-client'; }
  throw error;
};

export const get = async <T>(endpoint: string): Promise<ApiResponse<T>> => { try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL }${ endpoint }`, { method: 'GET', headers });

    if (!response.ok) { if (response.status === 401) {
        handleAuthError({ status: 401 });
      }
      throw new Error(`HTTP error! status: ${ response.status }`);
    }

    const data = await response.json();
    return data;
  } catch (error) { console.error('❌ Erreur GET: ', error);
    throw error; }
};

export const post = async <T>(endpoint: string, body: any): Promise<ApiResponse<T>> => { try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL }${ endpoint }`, { method: 'POST', headers, body: JSON.stringify(body) });

    if (!response.ok) { if (response.status === 401) {
        handleAuthError({ status: 401 });
      }
      throw new Error(`HTTP error! status: ${ response.status }`);
    }

    const data = await response.json();
    return data;
  } catch (error) { console.error('❌ Erreur POST: ', error);
    throw error; }
}; 