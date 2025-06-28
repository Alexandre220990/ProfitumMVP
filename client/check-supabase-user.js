// Script pour vérifier l'utilisateur dans Supabase Auth
console.log('🔍 Vérification de l\'utilisateur dans Supabase Auth...');

// Informations de l'utilisateur actuel
const currentUser = {
  email: 'grandjean.alexandre5@gmail.com',
  password: 'profitum',
  type: 'client'
};

console.log('👤 Utilisateur à vérifier:', currentUser.email);

// Instructions pour l'utilisateur
console.log('📋 Instructions:');
console.log('1. Allez sur https://gvvlsgtubqfxdztldunj.supabase.co/auth/users');
console.log('2. Vérifiez si l\'utilisateur existe');
console.log('3. Si non, créez-le avec les informations suivantes:');
console.log('   - Email:', currentUser.email);
console.log('   - Password:', currentUser.password);
console.log('   - Type:', currentUser.type);
console.log('4. Ou utilisez l\'interface d\'inscription de l\'application');

// Alternative : tester la connexion directe
console.log('🔄 Test de connexion directe avec Supabase...');

// Créer un client Supabase temporaire pour le test
const SUPABASE_URL = 'https://gvvlsgtubqfxdztldunj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Njk4NDksImV4cCI6MjA1NzM0NTg0OX0.2hahkZasfMfdFhQvP7rvPHzO1DBCl0FfsRVkxVZfdgk';

// Note: Ce test nécessiterait l'import de @supabase/supabase-js
// Pour l'instant, nous allons juste afficher les instructions
console.log('💡 Pour tester la connexion, utilisez l\'interface de l\'application'); 