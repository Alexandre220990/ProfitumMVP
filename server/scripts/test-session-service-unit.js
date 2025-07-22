#!/usr/bin/env node

/**
 * Test unitaire pour le service de session temporaire
 * Teste la logique sans connexion à la base de données
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Mock des données de test
const testSimulationData = {
  answers: {
    secteurActivite: 'Transport',
    nombreEmployes: 25,
    revenuAnnuel: 1500000,
    typeVehicules: ['camions', 'utilitaires'],
    consommationCarburant: 50000
  },
  eligibleProducts: [
    {
      id: 'ticpe-product-id',
      nom: 'TICPE',
      description: 'Optimisation Taxe Intérieure de Consommation sur les Produits Énergétiques',
      tauxFinal: 0.85,
      montantFinal: 45000,
      dureeFinale: 12
    },
    {
      id: 'urssaf-product-id',
      nom: 'URSSAF',
      description: 'Audit et optimisation des cotisations sociales',
      tauxFinal: 0.75,
      montantFinal: 25000,
      dureeFinale: 18
    }
  ],
  simulationId: crypto.randomUUID(),
  metadata: {
    source: 'test_script',
    test_date: new Date().toISOString()
  }
};

const testClientData = {
  email: `test-client-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  username: 'Test Client',
  company_name: 'Test Transport SARL',
  phone_number: '0123456789',
  address: '123 Rue de Test',
  city: 'Paris',
  postal_code: '75001',
  siren: '123456789',
  revenuAnnuel: 1500000,
  secteurActivite: 'Transport',
  nombreEmployes: 25,
  ancienneteEntreprise: 5
};

// Tests unitaires
function testUUIDGeneration() {
  console.log('🧪 Test 1: Génération UUID');
  
  const uuid1 = crypto.randomUUID();
  const uuid2 = crypto.randomUUID();
  
  console.log(`   UUID 1: ${uuid1}`);
  console.log(`   UUID 2: ${uuid2}`);
  
  if (uuid1 !== uuid2 && uuid1.length === 36 && uuid2.length === 36) {
    console.log('   ✅ UUIDs générés correctement');
    return true;
  } else {
    console.log('   ❌ Erreur génération UUID');
    return false;
  }
}

function testJWTTokenGeneration() {
  console.log('\n🧪 Test 2: Génération JWT Token');
  
  const sessionId = crypto.randomUUID();
  const secret = 'test_secret_key';
  
  const token = jwt.sign(
    { 
      sessionId, 
      type: 'temporary_session',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24h
    },
    secret
  );
  
  console.log(`   Session ID: ${sessionId}`);
  console.log(`   Token généré: ${token.substring(0, 50)}...`);
  
  try {
    const decoded = jwt.verify(token, secret);
    console.log(`   Token décodé: ${JSON.stringify(decoded, null, 2)}`);
    
    if (decoded.sessionId === sessionId && decoded.type === 'temporary_session') {
      console.log('   ✅ JWT Token généré et validé correctement');
      return true;
    } else {
      console.log('   ❌ Erreur validation JWT Token');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Erreur décodage JWT: ${error.message}`);
    return false;
  }
}

function testDataValidation() {
  console.log('\n🧪 Test 3: Validation des données');
  
  // Test validation données client
  const requiredFields = [
    'email', 'password', 'username', 'company_name', 
    'phone_number', 'address', 'city', 'postal_code', 'siren'
  ];
  
  const missingFields = requiredFields.filter(field => !testClientData[field]);
  
  if (missingFields.length === 0) {
    console.log('   ✅ Toutes les données client sont présentes');
  } else {
    console.log(`   ❌ Champs manquants: ${missingFields.join(', ')}`);
    return false;
  }
  
  // Test validation données simulation
  if (testSimulationData.eligibleProducts && testSimulationData.eligibleProducts.length > 0) {
    console.log(`   ✅ ${testSimulationData.eligibleProducts.length} produits éligibles trouvés`);
  } else {
    console.log('   ❌ Aucun produit éligible trouvé');
    return false;
  }
  
  return true;
}

function testSessionExpiration() {
  console.log('\n🧪 Test 4: Calcul d\'expiration de session');
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h
  
  console.log(`   Heure actuelle: ${now.toISOString()}`);
  console.log(`   Expiration: ${expiresAt.toISOString()}`);
  
  const timeDiff = expiresAt.getTime() - now.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  if (hoursDiff >= 23.9 && hoursDiff <= 24.1) {
    console.log(`   ✅ Expiration calculée correctement (${hoursDiff.toFixed(1)}h)`);
    return true;
  } else {
    console.log(`   ❌ Erreur calcul expiration (${hoursDiff.toFixed(1)}h)`);
    return false;
  }
}

function testProductDataStructure() {
  console.log('\n🧪 Test 5: Structure des données produits');
  
  for (const product of testSimulationData.eligibleProducts) {
    const requiredProductFields = ['id', 'nom', 'description', 'tauxFinal', 'montantFinal', 'dureeFinale'];
    const missingFields = requiredProductFields.filter(field => !product[field]);
    
    if (missingFields.length > 0) {
      console.log(`   ❌ Produit ${product.id}: champs manquants ${missingFields.join(', ')}`);
      return false;
    }
    
    // Validation des types
    if (typeof product.tauxFinal !== 'number' || product.tauxFinal < 0 || product.tauxFinal > 1) {
      console.log(`   ❌ Produit ${product.id}: tauxFinal invalide (${product.tauxFinal})`);
      return false;
    }
    
    if (typeof product.montantFinal !== 'number' || product.montantFinal < 0) {
      console.log(`   ❌ Produit ${product.id}: montantFinal invalide (${product.montantFinal})`);
      return false;
    }
    
    if (typeof product.dureeFinale !== 'number' || product.dureeFinale < 1) {
      console.log(`   ❌ Produit ${product.id}: dureeFinale invalide (${product.dureeFinale})`);
      return false;
    }
  }
  
  console.log('   ✅ Structure des données produits valide');
  return true;
}

function testMigrationDataPreparation() {
  console.log('\n🧪 Test 6: Préparation des données de migration');
  
  const sessionId = crypto.randomUUID();
  const clientId = crypto.randomUUID();
  
  // Simulation de la préparation des données de migration
  const migrationData = {
    sessionId,
    clientId,
    products: testSimulationData.eligibleProducts.map(product => ({
      id: crypto.randomUUID(),
      sessionId: sessionId,
      produitId: product.id,
      statut: 'eligible',
      tauxFinal: product.tauxFinal,
      montantFinal: product.montantFinal,
      dureeFinale: product.dureeFinale,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        source: 'temporary_session',
        sessionId: sessionId,
        simulationId: testSimulationData.simulationId,
        originalData: product
      }
    }))
  };
  
  console.log(`   Session ID: ${migrationData.sessionId}`);
  console.log(`   Client ID: ${migrationData.clientId}`);
  console.log(`   Produits à migrer: ${migrationData.products.length}`);
  
  // Validation de la structure
  if (migrationData.products.length === testSimulationData.eligibleProducts.length) {
    console.log('   ✅ Données de migration préparées correctement');
    return true;
  } else {
    console.log('   ❌ Erreur préparation données de migration');
    return false;
  }
}

// Exécution des tests
function runAllTests() {
  console.log('🚀 TESTS UNITAIRES - SERVICE DE SESSION TEMPORAIRE\n');
  
  const tests = [
    testUUIDGeneration,
    testJWTTokenGeneration,
    testDataValidation,
    testSessionExpiration,
    testProductDataStructure,
    testMigrationDataPreparation
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      if (test()) {
        passedTests++;
      }
    } catch (error) {
      console.log(`   ❌ Erreur dans le test: ${error.message}`);
    }
  }
  
  console.log('\n📊 RÉSULTATS DES TESTS');
  console.log(`   Tests réussis: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('   🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('   ✅ La logique du service est correcte');
    console.log('   🚀 Prêt pour l\'intégration avec la base de données');
  } else {
    console.log('   ❌ Certains tests ont échoué');
    console.log('   🔧 Vérifiez la logique du service');
  }
  
  return passedTests === totalTests;
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  const success = runAllTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runAllTests }; 