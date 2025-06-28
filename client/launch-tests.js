// Script pour lancer tous les tests en séquence
console.log('🚀 LANCEMENT DE TOUS LES TESTS');
console.log('==============================');

// Fonction pour exécuter un test avec délai
function runTest(testName, testFunction, delay = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`\n🧪 EXÉCUTION DU TEST: ${testName}`);
      console.log('--------------------------------');
      testFunction();
      resolve();
    }, delay);
  });
}

// Test 1: Vérification des tokens
async function test1() {
  console.log('📦 TEST 1: Vérification des tokens');
  const token = localStorage.getItem('token');
  const supabaseToken = localStorage.getItem('supabase_token');
  const supabaseRefreshToken = localStorage.getItem('supabase_refresh_token');

  console.log('- token:', token ? '✅ Présent' : '❌ Absent');
  console.log('- supabase_token:', supabaseToken ? '✅ Présent' : '❌ Absent');
  console.log('- supabase_refresh_token:', supabaseRefreshToken ? '✅ Présent' : '❌ Absent');

  if (!token) {
    console.log('❌ AUCUN TOKEN TROUVÉ - VEUILLEZ VOUS RECONNECTER');
    return false;
  }
  return true;
}

// Test 2: Décodage du token
async function test2() {
  console.log('🔐 TEST 2: Décodage du token Supabase');
  const token = localStorage.getItem('token');
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const supabaseUserId = payload.sub;
    const userEmail = payload.email;
    const userType = payload.user_metadata?.type || 'client';
    
    console.log('- ID Supabase:', supabaseUserId);
    console.log('- Email:', userEmail);
    console.log('- Type:', userType);
    console.log('- Payload complet:', payload);
    return { success: true, userId: supabaseUserId };
  } catch (error) {
    console.error('❌ Erreur lors du décodage du token:', error);
    return { success: false };
  }
}

// Test 3: Vérification dans la base de données
async function test3(userId) {
  console.log('🔍 TEST 3: Vérification dans la base de données');
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`http://[::1]:5001/api/clients/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Réponse API client (ID Supabase):', response.status, response.statusText);
    const data = await response.json();
    console.log('📄 Données client (ID Supabase):', data);
    
    if (data.success) {
      console.log('✅ Utilisateur trouvé avec l\'ID Supabase');
      return { success: true, found: true, userId: userId };
    } else {
      console.log('❌ Utilisateur non trouvé avec l\'ID Supabase');
      return { success: true, found: false, userId: userId };
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    return { success: false };
  }
}

// Test 4: Essai avec l'ancien ID
async function test4() {
  console.log('🔄 TEST 4: Essai avec l\'ancien ID');
  const oldUserId = '0538de29-4287-4c28-b76a-b65ef993f393';
  
  try {
    const response = await fetch(`http://[::1]:5001/api/clients/${oldUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Réponse API client (ancien ID):', response.status, response.statusText);
    const data = await response.json();
    console.log('📄 Données client (ancien ID):', data);
    
    if (data.success) {
      console.log('✅ Utilisateur trouvé avec l\'ancien ID');
      return { success: true, found: true, userId: oldUserId };
    } else {
      console.log('❌ Utilisateur non trouvé avec l\'ancien ID non plus');
      return { success: true, found: false, userId: oldUserId };
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    return { success: false };
  }
}

// Test 5: Test de l'API de signature de charte
async function test5() {
  console.log('📝 TEST 5: Test de l\'API de signature de charte');
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('http://[::1]:5001/api/charte-signature/e87d3ef4-a394-4505-8fcc-41a56005c344', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Réponse API charte:', response.status, response.statusText);
    const data = await response.json();
    console.log('📄 Données API charte:', data);
    
    if (data.success) {
      console.log('✅ API de signature de charte fonctionne');
      return { success: true };
    } else {
      console.log('❌ Erreur API charte:', data.message);
      return { success: false, message: data.message };
    }
  } catch (error) {
    console.error('❌ Erreur lors du test API charte:', error);
    return { success: false };
  }
}

// Exécution séquentielle des tests
async function runAllTests() {
  console.log('🚀 DÉBUT DES TESTS AUTOMATIQUES');
  
  // Test 1
  const test1Result = await runTest('Vérification des tokens', test1);
  if (!test1Result) {
    console.log('❌ ARRÊT DES TESTS - Aucun token trouvé');
    return;
  }
  
  // Test 2
  const test2Result = await runTest('Décodage du token', test2);
  if (!test2Result.success) {
    console.log('❌ ARRÊT DES TESTS - Erreur de décodage du token');
    return;
  }
  
  // Test 3
  const test3Result = await runTest('Vérification dans la base de données', () => test3(test2Result.userId));
  if (test3Result.found) {
    console.log('✅ Redirection automatique vers:', `/dashboard/client/${test2Result.userId}`);
    window.location.href = `/dashboard/client/${test2Result.userId}`;
    return;
  }
  
  // Test 4
  const test4Result = await runTest('Essai avec l\'ancien ID', test4);
  if (test4Result.found) {
    console.log('✅ Redirection automatique vers:', `/dashboard/client/${test4Result.userId}`);
    window.location.href = `/dashboard/client/${test4Result.userId}`;
    return;
  }
  
  // Test 5
  await runTest('Test de l\'API de signature de charte', test5);
  
  console.log('\n✅ TOUS LES TESTS TERMINÉS');
  console.log('==============================');
}

// Lancer les tests
runAllTests(); 