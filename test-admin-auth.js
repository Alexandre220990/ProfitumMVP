// Script de test pour l'authentification admin
console.log('🧪 Test d\'authentification admin...\n');

// Vérifier les tokens stockés
const supabaseToken = localStorage.getItem('supabase_token');
const oldToken = localStorage.getItem('token');

console.log('🔑 Tokens stockés:');
console.log('- Supabase token:', supabaseToken ? '✅ Présent' : '❌ Absent');
console.log('- Ancien token:', oldToken ? '✅ Présent' : '❌ Absent');

// Test de l'API admin
async function testAdminAPI() {
  try {
    const token = supabaseToken || oldToken;
    
    if (!token) {
      console.log('❌ Aucun token disponible - veuillez vous connecter');
      return;
    }

    console.log('\n📡 Test de l\'API admin...');
    
    const response = await fetch('http://localhost:5001/api/admin/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Réponse API:');
    console.log('- Status:', response.status);
    console.log('- OK:', response.ok);
    console.log('- Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Données reçues:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ Erreur:', errorText);
    }

  } catch (error) {
    console.error('❌ Erreur fetch:', error);
  }
}

// Exécuter le test
testAdminAPI();

// Fonction pour nettoyer les tokens (utile pour les tests)
window.clearTokens = () => {
  localStorage.removeItem('supabase_token');
  localStorage.removeItem('token');
  console.log('🧹 Tokens supprimés');
};

// Fonction pour afficher les informations utilisateur
window.showUserInfo = () => {
  const token = localStorage.getItem('supabase_token') || localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('👤 Informations utilisateur:');
      console.log('- ID:', payload.sub);
      console.log('- Email:', payload.email);
      console.log('- Type:', payload.user_metadata?.type || 'client');
      console.log('- Métadonnées:', payload.user_metadata);
    } catch (error) {
      console.error('❌ Erreur décodage token:', error);
    }
  } else {
    console.log('❌ Aucun token disponible');
  }
};

console.log('\n💡 Commandes disponibles:');
console.log('- clearTokens() : Supprimer les tokens');
console.log('- showUserInfo() : Afficher les infos utilisateur'); 