// Script pour déboguer l'ID de l'utilisateur Supabase
console.log('🔍 Débogage de l\'ID utilisateur Supabase...');

// Vérifier les tokens
const token = localStorage.getItem('token');
const supabaseToken = localStorage.getItem('supabase_token');

console.log('📦 Tokens disponibles:');
console.log('- token:', token ? '✅ Présent' : '❌ Absent');
console.log('- supabase_token:', supabaseToken ? '✅ Présent' : '❌ Absent');

if (token) {
  console.log('🔐 Token trouvé:', token.substring(0, 50) + '...');
  
  // Décoder le token JWT pour voir les informations
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('📄 Payload du token:', payload);
    console.log('🆔 ID utilisateur dans le token:', payload.sub);
    console.log('📧 Email dans le token:', payload.email);
    console.log('👤 Type dans le token:', payload.user_metadata?.type);
  } catch (error) {
    console.error('❌ Erreur lors du décodage du token:', error);
  }
}

// Vérifier l'utilisateur dans le contexte React
console.log('💡 Pour vérifier l\'utilisateur dans le contexte React, ouvrez les DevTools et tapez:');
console.log('document.querySelector("[data-testid=\'user-info\']")?.textContent');

// Tester la redirection manuelle
console.log('🔄 Test de redirection manuelle...');
const userId = 'e991b465-2e37-45ae-9475-6d7b1e35e391'; // ID de l'ancienne base
console.log('📍 Redirection vers:', `/dashboard/client/${userId}`);

// Afficher les routes disponibles
console.log('📋 Routes disponibles pour les clients:');
console.log('- /dashboard/client/:id');
console.log('- /dashboard/client/demo');
console.log('- /messagerie-client/:id');
console.log('- /profile/client'); 