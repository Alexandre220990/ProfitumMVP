// Configuration des variables d'environnement
export const config = {
  // Configuration API
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  
  // Configuration Supabase (à remplacer par vos vraies valeurs)
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://gvvlstubqfxdzltldunj.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzdHVicWZ4ZHpsdGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NzE5NzAsImV4cCI6MjA2NDI0Nzk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
};

// Vérification de la configuration
if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Veuillez configurer VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
} 