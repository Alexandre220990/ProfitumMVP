import axios from 'axios';
import { ApiResponse } from "@/types/api";
import { supabase } from './supabase';

// Configuration de base d'Axios
// Support IPv6 et IPv4 avec fallback intelligent
const getBaseUrl = () => {
  // Priorité à la variable d'environnement
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // En développement, utiliser localhost standard
  if (import.meta.env.DEV) {
    return 'http://localhost:5001';
  }
  
  // En production, utiliser l'URL Railway
  return 'https://profitummvp-production.up.railway.app';
};

const BASE_URL = getBaseUrl();
const API_PREFIX = '/api'; // Préfixe centralisé pour toutes les routes API

const api = axios.create({ baseURL: BASE_URL, headers: {
    'Content-Type': 'application/json' },
  withCredentials: true // Important pour CORS
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(async (config) => { 
  try {
    // Récupérer le token JWT depuis localStorage (priorité au token direct)
    let authToken = localStorage.getItem('token') || localStorage.getItem('supabase_token');
    
    // Si pas de token JWT, essayer de récupérer le token Supabase
    if (!authToken) {
      console.log('🔄 Tentative de récupération session Supabase...');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          authToken = session.access_token;
          localStorage.setItem('supabase_token', session.access_token);
          console.log('✅ Session Supabase récupérée');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la session:', error);
      }
    }
    
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
      console.log('🔐 Token ajouté aux headers');
    } else { 
      console.log('⚠️ Aucun token trouvé');
      console.log('🔍 Tokens disponibles:', {
        token: localStorage.getItem('token'),
        supabase_token: localStorage.getItem('supabase_token')
      });
    }
  } catch (error) { 
    console.error('Erreur lors de la récupération du token: ', error); 
  }
  
  return config;
});

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('🔐 Erreur d\'authentification détectée, tentative de rafraîchissement...');
      
      try {
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (session?.access_token && !refreshError) {
          localStorage.setItem('supabase_token', session.access_token);
          console.log('✅ Token rafraîchi, retry de la requête...');
          
          // Retry de la requête originale avec le nouveau token
          const originalRequest = error.config;
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
          return api(originalRequest);
        } else {
          console.log('❌ Impossible de rafraîchir le token, redirection vers login...');
          localStorage.removeItem('supabase_token');
          localStorage.removeItem('token');
          window.location.href = '/connect-admin';
        }
      } catch (refreshError) {
        console.error('Erreur lors du rafraîchissement:', refreshError);
        localStorage.removeItem('supabase_token');
        localStorage.removeItem('token');
        window.location.href = '/connect-admin';
      }
    }
    
    return Promise.reject(error);
  }
);

// Fonction générique pour gérer les réponses
const handleResponse = <T>(response: any): ApiResponse<T> => { if (response.data) {
    return {
      success: true, data: response.data.data as T, message: response.data.message };
  }
  return { success: true, data: null, message: response.data?.message };
};

// Fonction pour gérer les erreurs
const handleError = <T>(error: any): ApiResponse<T> => { if (error.response) {
    return {
      success: false, data: null, message: error.response.data.message || 'Une erreur est survenue' };
  }
  return { success: false, data: null, message: error.message || 'Une erreur est survenue' };
};

// Fonction pour ajouter le préfixe API si nécessaire
const addApiPrefix = (url: string): string => { if (url.startsWith(API_PREFIX)) {
    return url; }
  return `${ API_PREFIX }${ url.startsWith('/') ? url : `/${url }`}`;
};

// Fonctions API typées
export const get = async <T>(url: string): Promise<ApiResponse<T>> => { try {
    const response = await api.get(addApiPrefix(url));
    return handleResponse<T>(response); } catch (error) { return handleError<T>(error); }
};

export const post = async <T>(url: string, data?: any): Promise<ApiResponse<T>> => { try {
    const response = await api.post(addApiPrefix(url), data);
    return handleResponse<T>(response); } catch (error) { return handleError<T>(error); }
};

export const put = async <T>(url: string, data?: any): Promise<ApiResponse<T>> => { try {
    const response = await api.put(addApiPrefix(url), data);
    return handleResponse<T>(response); } catch (error) { return handleError<T>(error); }
};

export const del = async <T>(url: string): Promise<ApiResponse<T>> => { try {
    const response = await api.delete(addApiPrefix(url));
    return handleResponse<T>(response); } catch (error) { return handleError<T>(error); }
};

export default api;
