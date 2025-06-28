import axios from 'axios';
import { ApiResponse } from '@/types/api';

// Configuration de base d'Axios
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const API_PREFIX = '/api'; // Préfixe centralisé pour toutes les routes API

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Important pour CORS
});

// Intercepteur pour ajouter le token d'authentification Supabase
api.interceptors.request.use((config) => {
  try {
    // Récupérer le token Supabase depuis localStorage
    const supabaseToken = localStorage.getItem('token');
    
    if (supabaseToken) {
      config.headers.Authorization = `Bearer ${supabaseToken}`;
      console.log('🔐 Token Supabase ajouté aux headers');
    } else {
      console.log('⚠️ Aucun token Supabase trouvé dans localStorage');
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
  }
  
  return config;
});

// Fonction générique pour gérer les réponses
const handleResponse = <T>(response: any): ApiResponse<T> => {
  if (response.data) {
    return {
      success: true,
      data: response.data.data as T,
      message: response.data.message
    };
  }
  return {
    success: true,
    data: null,
    message: response.data?.message
  };
};

// Fonction pour gérer les erreurs
const handleError = <T>(error: any): ApiResponse<T> => {
  if (error.response) {
    return {
      success: false,
      data: null,
      message: error.response.data.message || 'Une erreur est survenue'
    };
  }
  return {
    success: false,
    data: null,
    message: error.message || 'Une erreur est survenue'
  };
};

// Fonction pour ajouter le préfixe API si nécessaire
const addApiPrefix = (url: string): string => {
  if (url.startsWith(API_PREFIX)) {
    return url;
  }
  return `${API_PREFIX}${url.startsWith('/') ? url : `/${url}`}`;
};

// Fonctions API typées
export const get = async <T>(url: string): Promise<ApiResponse<T>> => {
  try {
    const response = await api.get(addApiPrefix(url));
    return handleResponse<T>(response);
  } catch (error) {
    return handleError<T>(error);
  }
};

export const post = async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
  try {
    const response = await api.post(addApiPrefix(url), data);
    return handleResponse<T>(response);
  } catch (error) {
    return handleError<T>(error);
  }
};

export const put = async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
  try {
    const response = await api.put(addApiPrefix(url), data);
    return handleResponse<T>(response);
  } catch (error) {
    return handleError<T>(error);
  }
};

export const del = async <T>(url: string): Promise<ApiResponse<T>> => {
  try {
    const response = await api.delete(addApiPrefix(url));
    return handleResponse<T>(response);
  } catch (error) {
    return handleError<T>(error);
  }
};

export default api;
