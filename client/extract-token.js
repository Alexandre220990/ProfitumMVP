// Script à exécuter dans la console du navigateur pour extraire le token
// Copiez ce code dans la console de votre navigateur (F12)

function extractToken() {
  console.log('🔍 Extraction du token depuis localStorage...');
  
  // Essayer différents emplacements du token
  const tokenSources = [
    'supabase_token',
    'token',
    'access_token'
  ];
  
  let token = null;
  let source = null;
  
  for (const sourceName of tokenSources) {
    const storedToken = localStorage.getItem(sourceName);
    if (storedToken) {
      token = storedToken;
      source = sourceName;
      break;
    }
  }
  
  if (token) {
    console.log(`✅ Token trouvé dans ${source}:`, token.substring(0, 50) + '...');
    console.log('📋 Token complet (copiez-le):');
    console.log(token);
    
    // Créer un lien pour tester l'API
    const testUrl = `http://localhost:5001/api/client/produits-eligibles`;
    console.log('🌐 URL de test:', testUrl);
    console.log('🔑 Headers à utiliser:');
    console.log(`Authorization: Bearer ${token}`);
    
    return token;
  } else {
    console.log('❌ Aucun token trouvé dans localStorage');
    console.log('💡 Assurez-vous d\'être connecté via le frontend');
    return null;
  }
}

// Exécuter l'extraction
const token = extractToken();

// Si vous voulez tester directement depuis le navigateur
if (token) {
  fetch('http://localhost:5001/api/client/produits-eligibles', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('🌐 Réponse API:', data);
  })
  .catch(error => {
    console.error('❌ Erreur API:', error);
  });
} 