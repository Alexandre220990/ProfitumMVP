// Configuration des variables d'environnement
export const config = {
  // Configuration API
  API_URL: import.meta.env.VITE_API_URL || 'http://[::1]:5001',
  
  // Configuration Supabase (vraies valeurs)
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2a3ZrcGZ0YWt5dHhwc2Jra2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk0MDc0NjEsImV4cCI6MjAyNDk4MzQ2MX0.ckc2_CK5yDRBG5Z5yxYJgXGzGJGpMf-dHDMHk-8GHxs'
};

// Vérification de la configuration
if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Veuillez configurer VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
} 