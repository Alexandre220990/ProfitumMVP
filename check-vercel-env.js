#!/usr/bin/env node

console.log('🔍 Vérification des variables d\'environnement Vercel\n');

// Variables d'environnement requises pour Vercel
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_API_URL'
];

console.log('📋 Variables d\'environnement requises dans Vercel:');
requiredEnvVars.forEach(envVar => {
  console.log(`   • ${envVar}`);
});

console.log('\n🔧 Configuration Vercel:');
console.log('1. Allez dans votre projet Vercel');
console.log('2. Settings > Environment Variables');
console.log('3. Ajoutez les variables suivantes:');
console.log('\n   VITE_SUPABASE_URL = https://gvvlsgtubqfxdztldunj.supabase.co');
console.log('   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Njk4NDksImV4cCI6MjA1NzM0NTg0OX0.2hahkZasfMfdFhQvP7rvPHzO1DBCl0FfsRVkxVZfdgk');
console.log('   VITE_API_URL = https://profitummvp-production.up.railway.app');

console.log('\n⚠️  IMPORTANT:');
console.log('• Les variables doivent commencer par VITE_ pour être accessibles côté client');
console.log('• Redéployez l\'application après avoir ajouté les variables');
console.log('• Vérifiez que les variables sont bien définies pour "Production"');

console.log('\n✅ Une fois configuré, l\'erreur "supabaseUrl is required" devrait disparaître');
