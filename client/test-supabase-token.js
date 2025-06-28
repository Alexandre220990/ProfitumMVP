// Script de test pour vérifier le token Supabase
console.log('🔍 Test du token Supabase...');

// Vérifier les tokens stockés
const token = localStorage.getItem('token');
const supabaseToken = localStorage.getItem('supabase_token');
const supabaseRefreshToken = localStorage.getItem('supabase_refresh_token');

console.log('📦 Token stocké sous "token":', token ? '✅ Présent' : '❌ Absent');
console.log('📦 Token stocké sous "supabase_token":', supabaseToken ? '✅ Présent' : '❌ Absent');
console.log('📦 Refresh token stocké:', supabaseRefreshToken ? '✅ Présent' : '❌ Absent');

if (token) {
  console.log('🔐 Token trouvé:', token.substring(0, 50) + '...');
  
  // Tester l'API avec ce token
  fetch('http://[::1]:5001/api/charte-signature/e87d3ef4-a394-4505-8fcc-41a56005c344', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('📡 Réponse API:', response.status, response.statusText);
    return response.json();
  })
  .then(data => {
    console.log('📄 Données de réponse:', data);
  })
  .catch(error => {
    console.error('❌ Erreur API:', error);
  });
} else {
  console.log('⚠️ Aucun token trouvé - veuillez vous reconnecter');
} 