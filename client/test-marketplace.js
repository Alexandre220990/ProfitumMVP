const API_URL = 'http://localhost:3001';

// Fonction pour tester les APIs de la marketplace
async function testMarketplaceAPIs() {
  console.log('🧪 Test des APIs de la marketplace...\n');

  // Test 1: Récupération des experts
  console.log('1️⃣ Test récupération des experts...');
  try {
    const expertsResponse = await fetch(`${API_URL}/api/experts`);
    const expertsData = await expertsResponse.json();
    
    if (expertsData.success) {
      console.log(`✅ ${expertsData.data.length} experts récupérés`);
      console.log('📊 Exemple d\'expert:', expertsData.data[0]);
    } else {
      console.log('❌ Erreur récupération experts:', expertsData);
    }
  } catch (error) {
    console.log('❌ Erreur API experts:', error.message);
  }

  console.log('\n2️⃣ Test récupération des produits éligibles...');
  try {
    const produitsResponse = await fetch(`${API_URL}/api/produits-eligibles`);
    const produitsData = await produitsResponse.json();
    
    if (produitsData.success) {
      console.log(`✅ ${produitsData.data.length} produits éligibles récupérés`);
      console.log('📊 Exemple de produit:', produitsData.data[0]);
    } else {
      console.log('❌ Erreur récupération produits:', produitsData);
    }
  } catch (error) {
    console.log('❌ Erreur API produits:', error.message);
  }

  console.log('\n3️⃣ Test récupération des produits éligibles d\'un client (sans auth)...');
  try {
    // Test avec un ID fictif pour voir la structure
    const clientProduitsResponse = await fetch(`${API_URL}/api/produits-eligibles/client/test-client-id`);
    const clientProduitsData = await clientProduitsResponse.json();
    
    console.log('📊 Réponse API client produits:', clientProduitsData);
  } catch (error) {
    console.log('❌ Erreur API client produits:', error.message);
  }

  console.log('\n✅ Tests terminés !');
}

// Exécuter les tests
testMarketplaceAPIs(); 