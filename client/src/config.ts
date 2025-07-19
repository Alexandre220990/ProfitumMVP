/**
 * Configuration de l'application
 */
export const API_URL = import.meta.env.VITE_USE_IPV6 === 'true'
  ? (import.meta.env.VITE_API_URL || 'http://[::1]:5001')
  : (import.meta.env.VITE_API_URL_IPV4 || 'http://127.0.0.1:5001');

/**
 * Configuration du chatbot
 */
export const CHATBOT_CONFIG = { 
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 heures en millisecondes
  RETRY_ATTEMPTS: 3, 
  RETRY_DELAY: 1000, // 1 seconde
  MAX_RETRY_DELAY: 30000 // 30 secondes 
};
