// Test de migration avec authentification sécurisée
require('dotenv').config({ path: '../.env' });

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_URL = 'https://profitummvp-production.up.railway.app';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMigrationWithAuth() {
  console.log('🔐 TEST MIGRATION AVEC AUTHENTIFICATION SÉCURISÉE');
  console.log('='.repeat(60));

  try {
    // 1. Créer un client de test
    console.log('\n1️⃣ Création d\'un client de test...');
    
    const timestamp = Date.now();
    const testEmail = `auth-test-${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const testClientData = {
      email: testEmail,
      password: testPassword,
      name: 'Client Auth Test',
      company_name: 'Entreprise Auth Test',
      phone_number: '0123456789',
      address: '123 Rue Auth Test',
      city: 'Paris',
      postal_code: '75001',
      siren: String(Math.floor(100000000 + Math.random() * 900000000)),
      type: 'client',
      statut: 'actif',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: client, error: clientError } = await supabase
      .from('Client')
      .insert(testClientData)
      .select()
      .single();

    if (clientError) {
      throw new Error(`Erreur création client: ${clientError.message}`);
    }

    console.log('✅ Client créé:', client.email);
    console.log('   ID:', client.id);

    // 2. Créer un compte utilisateur authentifié
    console.log('\n2️⃣ Création du compte utilisateur authentifié...');
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });

    if (authError) {
      throw new Error(`Erreur création compte: ${authError.message}`);
    }

    console.log('✅ Compte utilisateur créé');
    console.log('   User ID:', authData.user?.id);

    // 3. Se connecter pour obtenir le token
    console.log('\n3️⃣ Connexion pour obtenir le token...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      throw new Error(`Erreur connexion: ${signInError.message}`);
    }

    const accessToken = signInData.session?.access_token;
    if (!accessToken) {
      throw new Error('Token d\'accès non obtenu');
    }

    console.log('✅ Connexion réussie');
    console.log('   Token obtenu:', accessToken.substring(0, 30) + '...');

    // 4. Test de la migration avec authentification
    console.log('\n4️⃣ Test de la migration avec authentification...');
    
    const simulationResults = {
      timestamp: Date.now(),
      products: [
        {
          code: 'TICPE',
          score: 85,
          savings: 5000,
          confidence: 'high'
        },
        {
          code: 'URSSAF',
          score: 70,
          savings: 3000,
          confidence: 'medium'
        }
      ]
    };

    const migrationPayload = {
      clientId: client.id,
      email: client.email,
      simulationResults: simulationResults
    };

    console.log('📤 Payload migration:', JSON.stringify(migrationPayload, null, 2));
    
    const migrationResponse = await fetch(`${API_URL}/api/simple-migration/migrate-simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(migrationPayload)
    });

    console.log('📥 Status migration:', migrationResponse.status);
    
    const migrationResult = await migrationResponse.json();
    console.log('📥 Réponse migration:', JSON.stringify(migrationResult, null, 2));
    
    if (migrationResult.success) {
      console.log('✅ Migration réussie');
      console.log(`   - Produits migrés: ${migrationResult.data.migrated_products}`);
      if (migrationResult.data.errors && migrationResult.data.errors.length > 0) {
        console.log('   - Erreurs:', migrationResult.data.errors);
      }
    } else {
      console.error('❌ Migration échouée:', migrationResult.error);
    }

    // 5. Vérification en base
    console.log('\n5️⃣ Vérification en base...');
    
    const { data: clientProducts, error: dbError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible (
          id,
          nom,
          categorie
        )
      `)
      .eq('clientId', client.id);

    if (dbError) {
      console.error('❌ Erreur récupération produits:', dbError);
    } else {
      console.log(`✅ ${clientProducts?.length || 0} produits trouvés en base:`);
      if (clientProducts && clientProducts.length > 0) {
        clientProducts.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.ProduitEligible?.nom} - ${product.statut} - ${product.montantFinal}€`);
        });
      }
    }

    // 6. Nettoyage
    console.log('\n6️⃣ Nettoyage...');
    
    // Supprimer les produits éligibles
    if (clientProducts && clientProducts.length > 0) {
      const { error: deleteProductsError } = await supabase
        .from('ClientProduitEligible')
        .delete()
        .eq('clientId', client.id);
      
      if (deleteProductsError) {
        console.error('⚠️ Erreur suppression produits:', deleteProductsError);
      } else {
        console.log('✅ Produits éligibles supprimés');
      }
    }

    // Supprimer le client
    const { error: deleteClientError } = await supabase
      .from('Client')
      .delete()
      .eq('id', client.id);
    
    if (deleteClientError) {
      console.error('⚠️ Erreur suppression client:', deleteClientError);
    } else {
      console.log('✅ Client supprimé');
    }

    // Supprimer le compte utilisateur
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(
      authData.user?.id
    );
    
    if (deleteUserError) {
      console.error('⚠️ Erreur suppression utilisateur:', deleteUserError);
    } else {
      console.log('✅ Compte utilisateur supprimé');
    }

  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
}

testMigrationWithAuth(); 