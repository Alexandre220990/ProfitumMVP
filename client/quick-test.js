// Test rapide et simple
console.log('⚡ TEST RAPIDE');
console.log('==============');

// Vérifier le token
const token = localStorage.getItem('token');
console.log('🔐 Token présent:', token ? '✅' : '❌');

if (!token) {
  console.log('❌ Aucun token - reconnectez-vous');
  return;
}

// Décoder le token
try {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('🆔 ID Supabase:', payload.sub);
  console.log('📧 Email:', payload.email);
  console.log('👤 Type:', payload.user_metadata?.type || 'client');
  
  // Redirection automatique
  const userId = payload.sub;
  console.log('📍 Redirection vers:', `/dashboard/client/${userId}`);
  window.location.href = `/dashboard/client/${userId}`;
  
} catch (error) {
  console.error('❌ Erreur:', error);
} 