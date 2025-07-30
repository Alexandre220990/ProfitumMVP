import { supabaseClient } from '../config/supabase';

const supabase = supabaseClient;

// Fonction pour obtenir un token d'authentification valide
async function getValidAuthToken() {
  console.log('🔐 Récupération d\'un token d\'authentification...');
  
  try {
    // Créer un utilisateur de test ou utiliser un utilisateur existant
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });

    if (authError) {
      console.log('⚠️ Tentative de création d\'un utilisateur de test...');
      
      // Créer un utilisateur de test
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testUser.email,
        password: testUser.password
      });

      if (signUpError) {
        console.error('❌ Erreur création utilisateur:', signUpError);
        return null;
      }

      console.log('✅ Utilisateur de test créé');
      return signUpData.session?.access_token || null;
    }

    console.log('✅ Authentification réussie');
    return authData.session?.access_token || null;
  } catch (error) {
    console.error('❌ Erreur authentification:', error);
    return null;
  }
}

// Données de test
const testSimulationResults = {
  timestamp: Date.now(),
  products: [
    {
      code: 'TICPE',
      score: 85,
      savings: 15000,
      confidence: 'high'
    },
    {
      code: 'URSSAF', // Remplacer CIR par URSSAF qui est dans le mapping
      score: 72,
      savings: 8000,
      confidence: 'medium'
    },
    {
      code: 'CEE',
      score: 45,
      savings: 5000,
      confidence: 'low'
    },
    {
      code: 'DFS',
      score: 95,
      savings: 25000,
      confidence: 'high'
    }
  ]
};

// Client de test
const testClient = {
  id: '74dfdf10-af1b-4c84-8828-fa5e0eed5b69', // ID réel du client existant
  email: 'test-migration@example.com',
  name: 'Test Client Test Migration',
  company_name: 'Test Company',
  phone_number: '0123456789'
};

// Utilisateur de test pour l'authentification
const testUser = {
  email: 'test-migration@example.com',
  password: 'test-password-123'
};

async function createTestClient() {
  console.log('🔧 Création du client de test...');
  
  try {
    // Vérifier si le client existe déjà
    const { data: existingClient } = await supabase
      .from('Client')
      .select('id')
      .eq('id', testClient.id)
      .single();

    if (existingClient) {
      console.log('✅ Client de test existe déjà');
      return testClient.id;
    }

    // Créer le client de test avec l'email de l'utilisateur authentifié
    const { data: newClient, error } = await supabase
      .from('Client')
      .insert({
        id: testClient.id,
        email: testUser.email, // Utiliser l'email de l'utilisateur authentifié
        name: testClient.name,
        company_name: testClient.company_name,
        phone_number: testClient.phone_number,
        password: 'test-password-hash',
        username: 'test-migration',
        address: '123 Test Street',
        city: 'Test City',
        postal_code: '75000',
        type: 'entreprise',
        statut: 'actif',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur création client:', error);
      throw error;
    }

    console.log('✅ Client de test créé:', newClient.id);
    return newClient.id;
  } catch (error) {
    console.error('❌ Erreur lors de la création du client:', error);
    throw error;
  }
}

async function testMigrationEndpoint() {
  console.log('🧪 Test de l\'endpoint de migration...');
  
  try {
    // Récupérer un token d'authentification valide
    const authToken = await getValidAuthToken();
    
    if (!authToken) {
      console.error('❌ Impossible d\'obtenir un token d\'authentification');
      return null;
    }

    console.log('🔐 Token d\'authentification obtenu');

    const response = await fetch('https://profitummvp-production.up.railway.app/api/simple-migration/migrate-simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        clientId: testClient.id,
        email: testUser.email, // Utiliser l'email de l'utilisateur authentifié
        simulationResults: testSimulationResults
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Migration réussie:', result);
      return result;
    } else {
      console.error('❌ Erreur migration:', result);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur lors du test de migration:', error);
    return null;
  }
}

async function verifyMigrationResults(clientId: string) {
  console.log('🔍 Vérification des résultats de migration...');
  
  try {
    const { data: products, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible (
          id,
          nom,
          description,
          categorie
        )
      `)
      .eq('clientId', clientId);

    if (error) {
      console.error('❌ Erreur récupération produits:', error);
      return null;
    }

    console.log(`📊 ${products?.length || 0} produits migrés:`);
    
    if (products) {
      products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.ProduitEligible?.nom || 'Produit inconnu'}`);
        console.log(`      - Statut: ${product.statut}`);
        console.log(`      - Taux: ${product.tauxFinal}`);
        console.log(`      - Montant: ${product.montantFinal}€`);
        console.log(`      - Priorité: ${product.priorite}`);
      });
    }

    return products;
  } catch (error) {
    console.error('❌ Erreur vérification:', error);
    return null;
  }
}

async function testMappingDebug() {
  console.log('🔧 Test du debug du mapping...');
  
  try {
    const response = await fetch('https://profitummvp-production.up.railway.app/api/simple-migration/debug/mapping');
    const result = await response.json() as any;
    
    if (response.ok) {
      console.log('✅ Mapping debug:', result.data);
      return result.data;
    } else {
      console.error('❌ Erreur debug mapping:', result);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur lors du test de debug:', error);
    return null;
  }
}

async function testReloadMapping() {
  console.log('🔄 Test du rechargement du mapping...');
  
  try {
    const response = await fetch('https://profitummvp-production.up.railway.app/api/simple-migration/reload-mapping', {
      method: 'POST'
    });
    const result = await response.json() as any;
    
    if (response.ok) {
      console.log('✅ Mapping rechargé:', result.data);
      return result.data;
    } else {
      console.error('❌ Erreur rechargement mapping:', result);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur lors du rechargement:', error);
    return null;
  }
}

async function cleanupTestData() {
  console.log('🧹 Nettoyage des données de test...');
  
  try {
    // Supprimer les produits éligibles de test
    const { error: productsError } = await supabase
      .from('ClientProduitEligible')
      .delete()
      .eq('clientId', testClient.id);

    if (productsError) {
      console.error('❌ Erreur suppression produits:', productsError);
    } else {
      console.log('✅ Produits de test supprimés');
    }

    // Supprimer le client de test
    const { error: clientError } = await supabase
      .from('Client')
      .delete()
      .eq('id', testClient.id);

    if (clientError) {
      console.error('❌ Erreur suppression client:', clientError);
    } else {
      console.log('✅ Client de test supprimé');
    }

    // Déconnexion de l'utilisateur de test
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('❌ Erreur déconnexion:', signOutError);
    } else {
      console.log('✅ Utilisateur de test déconnecté');
    }
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}

async function runAllTests() {
  console.log('🚀 DÉMARRAGE DES TESTS DE MIGRATION DES PRODUITS ÉLIGIBLES');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Debug du mapping
    console.log('\n📋 TEST 1: Debug du mapping des produits');
    const mappingDebug = await testMappingDebug();
    
    // Test 2: Rechargement du mapping
    console.log('\n📋 TEST 2: Rechargement du mapping');
    const reloadResult = await testReloadMapping();
    
    // Test 3: Création du client de test
    console.log('\n📋 TEST 3: Création du client de test');
    const clientId = await createTestClient();
    
    // Test 4: Migration des produits
    console.log('\n📋 TEST 4: Migration des produits');
    const migrationResult = await testMigrationEndpoint();
    
    // Test 5: Vérification des résultats
    console.log('\n📋 TEST 5: Vérification des résultats');
    const verificationResult = await verifyMigrationResults(clientId);
    
    // Résumé des tests
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('=' .repeat(60));
    console.log(`✅ Mapping debug: ${mappingDebug ? 'RÉUSSI' : 'ÉCHOUÉ'}`);
    console.log(`✅ Rechargement mapping: ${reloadResult ? 'RÉUSSI' : 'ÉCHOUÉ'}`);
    console.log(`✅ Création client: ${clientId ? 'RÉUSSI' : 'ÉCHOUÉ'}`);
    console.log(`✅ Migration produits: ${migrationResult ? 'RÉUSSI' : 'ÉCHOUÉ'}`);
    console.log(`✅ Vérification résultats: ${verificationResult ? 'RÉUSSI' : 'ÉCHOUÉ'}`);
    
    // Nettoyage
    console.log('\n📋 NETTOYAGE');
    await cleanupTestData();
    
    console.log('\n🎉 TESTS TERMINÉS');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runAllTests();
}

export {
  runAllTests,
  testMigrationEndpoint,
  testMappingDebug,
  testReloadMapping,
  createTestClient,
  verifyMigrationResults,
  cleanupTestData
}; 