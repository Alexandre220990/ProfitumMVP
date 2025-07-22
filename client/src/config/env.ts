// Configuration des variables d'environnement
export interface AppConfig {
  // Configuration API
  API_URL: string;
  
  // Configuration Supabase
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  
  // Configuration environnement
  NODE_ENV: 'development' | 'production' | 'test';
  IS_DEVELOPMENT: boolean;
  IS_PRODUCTION: boolean;
  
  // Configuration analytics
  GOOGLE_ANALYTICS_ID?: string;
  MIXPANEL_TOKEN?: string;
  
  // Configuration features
  ENABLE_CHATBOT: boolean;
  ENABLE_ANALYTICS: boolean;
  ENABLE_NOTIFICATIONS: boolean;
  
  // Configuration réseau
  USE_IPV6: boolean;
  API_TIMEOUT: number;
  
  // Configuration sécurité
  SESSION_DURATION: number;
  MAX_RETRY_ATTEMPTS: number;
  RETRY_DELAY: number;
}

export const config: AppConfig = {
  // Configuration API
  API_URL: import.meta.env.VITE_API_URL || 'https://www.profitum.app',
  
  // Configuration Supabase (vraies valeurs)
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Njk4NDksImV4cCI6MjA1NzM0NTg0OX0.2hahkZasfMfdFhQvP7rvPHzO1DBCl0FfsRVkxVZfdgk',
  
  // Configuration environnement
  NODE_ENV: (import.meta.env.MODE as AppConfig['NODE_ENV']) || 'development',
  IS_DEVELOPMENT: import.meta.env.DEV || false,
  IS_PRODUCTION: import.meta.env.PROD || false,
  
  // Configuration analytics
  GOOGLE_ANALYTICS_ID: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
  MIXPANEL_TOKEN: import.meta.env.VITE_MIXPANEL_TOKEN,
  
  // Configuration features
  ENABLE_CHATBOT: import.meta.env.VITE_ENABLE_CHATBOT !== 'false',
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
  ENABLE_NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false',
  
  // Configuration réseau
  USE_IPV6: import.meta.env.VITE_USE_IPV6 === 'true',
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  
  // Configuration sécurité
  SESSION_DURATION: parseInt(import.meta.env.VITE_SESSION_DURATION || '86400000'), // 24h par défaut
  MAX_RETRY_ATTEMPTS: parseInt(import.meta.env.VITE_MAX_RETRY_ATTEMPTS || '3'),
  RETRY_DELAY: parseInt(import.meta.env.VITE_RETRY_DELAY || '1000'),
};

// Validation de la configuration
const validateConfig = (): void => {
  const errors: string[] = [];
  
  // Validation des variables critiques
  if (!config.SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL est manquante');
  }
  
  if (!config.SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY est manquante');
  }
  
  if (!config.API_URL) {
    errors.push('VITE_API_URL est manquante');
  }
  
  // Validation des URLs
  try {
    new URL(config.SUPABASE_URL);
  } catch {
    errors.push('VITE_SUPABASE_URL n\'est pas une URL valide');
  }
  
  try {
    new URL(config.API_URL);
  } catch {
    errors.push('VITE_API_URL n\'est pas une URL valide');
  }
  
  // Affichage des erreurs
  if (errors.length > 0) {
    console.error('❌ Erreurs de configuration:', errors);
    if (config.IS_PRODUCTION) {
      throw new Error(`Configuration invalide: ${errors.join(', ')}`);
    }
  } else {
    console.log('✅ Configuration validée avec succès');
  }
  
  // Avertissements pour les variables optionnelles
  if (!config.GOOGLE_ANALYTICS_ID && config.ENABLE_ANALYTICS) {
    console.warn('⚠️ Google Analytics activé mais VITE_GOOGLE_ANALYTICS_ID manquant');
  }
  
  if (!config.MIXPANEL_TOKEN && config.ENABLE_ANALYTICS) {
    console.warn('⚠️ Analytics activé mais VITE_MIXPANEL_TOKEN manquant');
  }
};

// Validation au chargement du module
validateConfig();

// Export des utilitaires de configuration
export const getApiUrl = (): string => {
  if (config.USE_IPV6 && config.IS_DEVELOPMENT) {
    return config.API_URL.replace('https://', 'http://[::1]:5001');
  }
  return config.API_URL;
};

export const isFeatureEnabled = (feature: keyof Pick<AppConfig, 'ENABLE_CHATBOT' | 'ENABLE_ANALYTICS' | 'ENABLE_NOTIFICATIONS'>): boolean => {
  return config[feature];
};

export default config; 