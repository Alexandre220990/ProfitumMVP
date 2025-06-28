// Script de test complet pour diagnostiquer tous les problèmes
console.log('🧪 LANCEMENT DES TESTS COMPLETS');
console.log('================================');

// Test 1: Vérifier les tokens
console.log('\n📦 TEST 1: Vérification des tokens');
const token = localStorage.getItem('token');
const supabaseToken = localStorage.getItem('supabase_token');
const supabaseRefreshToken = localStorage.getItem('supabase_refresh_token');

console.log('- token:', token ? '✅ Présent' : '❌ Absent');
console.log('- supabase_token:', supabaseToken ? '✅ Présent' : '❌ Absent');
console.log('- supabase_refresh_token:', supabaseRefreshToken ? '✅ Présent' : '❌ Absent');

if (!token) {
  console.log('❌ AUCUN TOKEN TROUVÉ - VEUILLEZ VOUS RECONNECTER');
  return;
}

// Test 2: Décoder le token Supabase
console.log('\n🔐 TEST 2: Décodage du token Supabase');
try {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const supabaseUserId = payload.sub;
  const userEmail = payload.email;
  const userType = payload.user_metadata?.type || 'client';
  
  console.log('- ID Supabase:', supabaseUserId);
  console.log('- Email:', userEmail);
  console.log('- Type:', userType);
  console.log('- Payload complet:', payload);
} catch (error) {
  console.error('❌ Erreur lors du décodage du token:', error);
  return;
}

// Test 3: Vérifier l'utilisateur dans la base de données
console.log('\n🔍 TEST 3: Vérification dans la base de données');
const supabaseUserId = JSON.parse(atob(token.split('.')[1])).sub;

fetch(`http://[::1]:5001/api/clients/${supabaseUserId}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('📡 Réponse API client (ID Supabase):', response.status, response.statusText);
  return response.json();
})
.then(data => {
  console.log('📄 Données client (ID Supabase):', data);
  
  if (data.success) {
    console.log('✅ Utilisateur trouvé avec l\'ID Supabase');
    console.log('📍 Redirection vers:', `/dashboard/client/${supabaseUserId}`);
    window.location.href = `/dashboard/client/${supabaseUserId}`;
  } else {
    console.log('❌ Utilisateur non trouvé avec l\'ID Supabase');
    
    // Test 4: Essayer avec l'ancien ID
    console.log('\n🔄 TEST 4: Essai avec l\'ancien ID');
    const oldUserId = '0538de29-4287-4c28-b76a-b65ef993f393';
    
    return fetch(`http://[::1]:5001/api/clients/${oldUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
})
.then(response => {
  if (response) {
    console.log('📡 Réponse API client (ancien ID):', response.status, response.statusText);
    return response.json();
  }
})
.then(data => {
  if (data) {
    console.log('📄 Données client (ancien ID):', data);
    
    if (data.success) {
      console.log('✅ Utilisateur trouvé avec l\'ancien ID');
      console.log('📍 Redirection vers:', `/dashboard/client/0538de29-4287-4c28-b76a-b65ef993f393`);
      window.location.href = `/dashboard/client/0538de29-4287-4c28-b76a-b65ef993f393`;
    } else {
      console.log('❌ Utilisateur non trouvé avec l\'ancien ID non plus');
      console.log('💡 Problème complexe - vérifier la base de données');
    }
  }
})
.catch(error => {
  console.error('❌ Erreur lors des tests:', error);
});

// Test 5: Tester l'API de signature de charte
console.log('\n📝 TEST 5: Test de l\'API de signature de charte');
fetch('http://[::1]:5001/api/charte-signature/e87d3ef4-a394-4505-8fcc-41a56005c344', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('📡 Réponse API charte:', response.status, response.statusText);
  return response.json();
})
.then(data => {
  console.log('📄 Données API charte:', data);
  
  if (data.success) {
    console.log('✅ API de signature de charte fonctionne');
  } else {
    console.log('❌ Erreur API charte:', data.message);
  }
})
.catch(error => {
  console.error('❌ Erreur lors du test API charte:', error);
});

console.log('\n✅ TESTS TERMINÉS');
console.log('================================'); 