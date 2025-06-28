// Script de test pour la connexion frontend avec Supabase
console.log('🧪 Test de connexion frontend avec Supabase\n');

// Simulation du localStorage
const mockLocalStorage = {
  supabase_token: null,
  token: null
};

// Fonction pour simuler la connexion
async function testFrontendConnection() {
  try {
    console.log('1️⃣ Tentative de connexion avec Supabase...');
    
    const response = await fetch('http://localhost:5001/api/auth/create-supabase-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'grandjean.alexandre5@gmail.com',
        password: 'profitum'
      })
    });

    const data = await response.json();
    
    if (data.success && data.data?.token) {
      console.log('✅ Connexion réussie !');
      console.log('   - Token Supabase obtenu');
      
      // Stocker le token
      mockLocalStorage.supabase_token = data.data.token;
      mockLocalStorage.token = data.data.token; // Pour compatibilité
      
      console.log('   - Token stocké dans localStorage');
      console.log('   - Token:', data.data.token.substring(0, 50) + '...');
      
      return data.data.token;
    } else {
      console.log('❌ Échec de la connexion:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error);
    return null;
  }
}

// Fonction pour tester l'API avec le token
async function testApiWithToken(token) {
  if (!token) {
    console.log('❌ Pas de token disponible pour tester l\'API');
    return;
  }

  try {
    console.log('\n2️⃣ Test de l\'API avec le token Supabase...');
    
    const response = await fetch('http://localhost:5001/api/charte-signature/e87d3ef4-a394-4505-8fcc-41a56005c344', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API accessible avec le token Supabase');
      console.log('   - Réponse:', data);
    } else {
      console.log('❌ Erreur API:', data);
      console.log('   - Status:', response.status);
    }
  } catch (error) {
    console.error('❌ Erreur lors du test API:', error);
  }
}

// Fonction pour simuler l'intercepteur Axios
function simulateAxiosInterceptor() {
  console.log('\n3️⃣ Simulation de l\'intercepteur Axios...');
  
  const supabaseToken = mockLocalStorage.supabase_token;
  const legacyToken = mockLocalStorage.token;
  
  if (supabaseToken) {
    console.log('🔐 Token Supabase utilisé pour les requêtes API');
    console.log('   - Headers: { Authorization: "Bearer " + supabase_token }');
    return supabaseToken;
  } else if (legacyToken) {
    console.log('🔐 Token JWT local utilisé (fallback)');
    console.log('   - Headers: { Authorization: "Bearer " + token }');
    return legacyToken;
  } else {
    console.log('❌ Aucun token disponible');
    return null;
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests...\n');
  
  // Test 1: Connexion
  const token = await testFrontendConnection();
  
  // Test 2: Simulation intercepteur
  const usedToken = simulateAxiosInterceptor();
  
  // Test 3: API
  await testApiWithToken(usedToken);
  
  console.log('\n🎯 Résumé des tests:');
  console.log('✅ Connexion Supabase:', token ? 'Réussie' : 'Échouée');
  console.log('✅ Intercepteur API:', usedToken ? 'Token disponible' : 'Aucun token');
  console.log('✅ Test API:', usedToken ? 'Effectué' : 'Non effectué');
  
  console.log('\n📋 Instructions pour le frontend:');
  console.log('1. Se connecter via l\'interface utilisateur');
  console.log('2. Vérifier que le token Supabase est stocké dans localStorage');
  console.log('3. Tester la signature de charte');
  
  console.log('\n🎉 Tests terminés !');
}

// Lancer les tests
runTests(); 