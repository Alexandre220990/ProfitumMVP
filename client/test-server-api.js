// Script de test côté serveur
import fetch from 'node-fetch';

console.log('🧪 TESTS CÔTÉ SERVEUR');
console.log('=====================');

const BASE_URL = 'http://[::1]:5001';

// Test 1: Vérifier que le serveur répond
async function testServerConnection() {
  console.log('\n📡 TEST 1: Connexion au serveur');
  try {
    const response = await fetch(`${BASE_URL}/api/cors-test`);
    console.log('✅ Serveur accessible:', response.status);
    return true;
  } catch (error) {
    console.log('❌ Serveur inaccessible:', error.message);
    return false;
  }
}

// Test 2: Vérifier l'utilisateur avec l'ancien ID
async function testOldUserId() {
  console.log('\n🔍 TEST 2: Vérification utilisateur (ancien ID)');
  const oldUserId = '0538de29-4287-4c28-b76a-b65ef993f393';
  
  try {
    const response = await fetch(`${BASE_URL}/api/clients/${oldUserId}`);
    const data = await response.json();
    console.log('📡 Réponse:', response.status, response.statusText);
    console.log('📄 Données:', data);
    
    if (data.success) {
      console.log('✅ Utilisateur trouvé avec l\'ancien ID');
      return { success: true, userId: oldUserId };
    } else {
      console.log('❌ Utilisateur non trouvé avec l\'ancien ID');
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
    return { success: false };
  }
}

// Test 3: Vérifier l'utilisateur avec l'ID Supabase
async function testSupabaseUserId() {
  console.log('\n🔍 TEST 3: Vérification utilisateur (ID Supabase)');
  const supabaseUserId = 'e991b465-2e37-45ae-9475-6d7b1e35e391';
  
  try {
    const response = await fetch(`${BASE_URL}/api/clients/${supabaseUserId}`);
    const data = await response.json();
    console.log('📡 Réponse:', response.status, response.statusText);
    console.log('📄 Données:', data);
    
    if (data.success) {
      console.log('✅ Utilisateur trouvé avec l\'ID Supabase');
      return { success: true, userId: supabaseUserId };
    } else {
      console.log('❌ Utilisateur non trouvé avec l\'ID Supabase');
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
    return { success: false };
  }
}

// Test 4: Tester l'API de signature de charte (sans authentification)
async function testCharteSignatureAPI() {
  console.log('\n📝 TEST 4: API de signature de charte (sans auth)');
  
  try {
    const response = await fetch(`${BASE_URL}/api/charte-signature/e87d3ef4-a394-4505-8fcc-41a56005c344`);
    const data = await response.json();
    console.log('📡 Réponse:', response.status, response.statusText);
    console.log('📄 Données:', data);
    
    if (response.status === 401) {
      console.log('✅ API protégée (401 attendu sans token)');
      return { success: true, protected: true };
    } else {
      console.log('⚠️ API non protégée ou erreur inattendue');
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
    return { success: false };
  }
}

// Exécution des tests
async function runAllTests() {
  console.log('🚀 DÉBUT DES TESTS SERVEUR');
  
  // Test 1
  const serverOk = await testServerConnection();
  if (!serverOk) {
    console.log('❌ ARRÊT DES TESTS - Serveur inaccessible');
    return;
  }
  
  // Test 2
  const oldUserResult = await testOldUserId();
  
  // Test 3
  const supabaseUserResult = await testSupabaseUserId();
  
  // Test 4
  const charteResult = await testCharteSignatureAPI();
  
  // Résumé
  console.log('\n📊 RÉSUMÉ DES TESTS');
  console.log('===================');
  console.log('✅ Serveur:', 'Accessible');
  console.log('👤 Utilisateur (ancien ID):', oldUserResult.success ? 'Trouvé' : 'Non trouvé');
  console.log('👤 Utilisateur (ID Supabase):', supabaseUserResult.success ? 'Trouvé' : 'Non trouvé');
  console.log('📝 API Charte:', charteResult.success ? 'Fonctionne' : 'Erreur');
  
  if (oldUserResult.success) {
    console.log('\n💡 SOLUTION: Utiliser l\'ancien ID pour la redirection');
    console.log('📍 URL:', `/dashboard/client/${oldUserResult.userId}`);
  } else if (supabaseUserResult.success) {
    console.log('\n💡 SOLUTION: Utiliser l\'ID Supabase pour la redirection');
    console.log('📍 URL:', `/dashboard/client/${supabaseUserResult.userId}`);
  } else {
    console.log('\n❌ PROBLÈME: Aucun utilisateur trouvé dans la base de données');
    console.log('💡 ACTION: Vérifier la base de données ou créer l\'utilisateur');
  }
}

// Lancer les tests
runAllTests().catch(console.error); 