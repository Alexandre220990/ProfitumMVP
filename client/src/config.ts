/**
 * Configuration de l'application
 * @deprecated Utilisez config depuis '@/config/env' à la place
 */
import { config, getApiUrl } from './config/env';

// Export de compatibilité pour l'ancien système
export const API_URL = getApiUrl();

/**
 * Configuration du chatbot
 * @deprecated Utilisez config depuis '@/config/env' à la place
 */
export const CHATBOT_CONFIG = { 
  SESSION_DURATION: config.SESSION_DURATION,
  RETRY_ATTEMPTS: config.MAX_RETRY_ATTEMPTS, 
  RETRY_DELAY: config.RETRY_DELAY,
  MAX_RETRY_DELAY: 30000 // 30 secondes 
};

// Export de la configuration principale
export { config } from './config/env';
