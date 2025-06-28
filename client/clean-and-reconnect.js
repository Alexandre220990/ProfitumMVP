// Script pour nettoyer les tokens et forcer la reconnexion
console.log('🧹 Nettoyage des tokens...');

// Supprimer tous les tokens existants
localStorage.removeItem('token');
localStorage.removeItem('supabase_token');
localStorage.removeItem('supabase_refresh_token');
localStorage.removeItem('user');

console.log('✅ Tokens supprimés');

// Afficher l'état actuel
console.log('📊 État du localStorage après nettoyage:');
console.log('- token:', localStorage.getItem('token') ? '❌ Encore présent' : '✅ Supprimé');
console.log('- supabase_token:', localStorage.getItem('supabase_token') ? '❌ Encore présent' : '✅ Supprimé');
console.log('- supabase_refresh_token:', localStorage.getItem('supabase_refresh_token') ? '❌ Encore présent' : '✅ Supprimé');
console.log('- user:', localStorage.getItem('user') ? '❌ Encore présent' : '✅ Supprimé');

console.log('🔄 Redirection vers la page de connexion...');
console.log('💡 Vous allez être redirigé vers la page de connexion pour vous reconnecter avec Supabase');

// Rediriger vers la page de connexion
setTimeout(() => {
  window.location.href = '/connexion-client';
}, 2000); 