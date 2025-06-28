// Script pour corriger la redirection de l'utilisateur
console.log('🔧 Correction de la redirection utilisateur...');

// Vérifier les tokens
const token = localStorage.getItem('token');

if (!token) {
  console.log('❌ Aucun token trouvé - veuillez vous reconnecter');
  return;
}

// Décoder le token pour obtenir l'ID Supabase
try {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const supabaseUserId = payload.sub;
  const userEmail = payload.email;
  const userType = payload.user_metadata?.type || 'client';
  
  console.log('📄 Informations du token:');
  console.log('- ID Supabase:', supabaseUserId);
  console.log('- Email:', userEmail);
  console.log('- Type:', userType);
  
  // ID de l'ancienne base de données (pour référence)
  const oldUserId = '0538de29-4287-4c28-b76a-b65ef993f393';
  
  console.log('🔄 Redirection vers le dashboard...');
  
  if (userType === 'client') {
    // Essayer d'abord avec l'ID Supabase
    console.log('📍 Tentative avec ID Supabase:', `/dashboard/client/${supabaseUserId}`);
    window.location.href = `/dashboard/client/${supabaseUserId}`;
  } else {
    console.log('📍 Redirection vers dashboard expert:', `/dashboard/expert/${supabaseUserId}`);
    window.location.href = `/dashboard/expert/${supabaseUserId}`;
  }
  
} catch (error) {
  console.error('❌ Erreur lors du décodage du token:', error);
  console.log('💡 Redirection de fallback vers /dashboard');
  window.location.href = '/dashboard';
} 