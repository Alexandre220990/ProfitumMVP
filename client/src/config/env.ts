// Configuration des variables d'environnement
export const config = {
  // Configuration API
  API_URL: import.meta.env.VITE_API_URL || 'https://www.profitum.app',
  
  // Configuration Supabase (vraies valeurs)
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Njk4NDksImV4cCI6MjA1NzM0NTg0OX0.2hahkZasfMfdFhQvP7rvPHzO1DBCl0FfsRVkxVZfdgk'
};

// Vérification de la configuration
if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Veuillez configurer VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
} 