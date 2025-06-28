// Script pour forcer la reconnexion avec Supabase
console.log('🔄 Forçage de la reconnexion avec Supabase...');

// Nettoyer tous les tokens existants
localStorage.removeItem('token');
localStorage.removeItem('supabase_token');
localStorage.removeItem('supabase_refresh_token');
localStorage.removeItem('user');

console.log('🧹 Tokens nettoyés');

// Rediriger vers la page de connexion
console.log('📍 Redirection vers la page de connexion...');
window.location.href = '/connexion-client';

// Alternative : simuler une connexion directe
console.log('💡 Alternative : vous pouvez aussi vous reconnecter manuellement via l\'interface'); 