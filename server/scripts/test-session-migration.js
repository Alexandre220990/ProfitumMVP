#!/usr/bin/env node

/**
 * Script de test pour la migration des sessions temporaires
 * Teste le flux complet : création session → migration → compte client
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Données de test
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

async function testSessionMigration() {
  console.log('🧪 Début des tests de migration de session\n');

  try {
    // Test 1: Création d'une session temporaire
    console.log('1️⃣ Test création session temporaire...');
    
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Créer la session temporaire
    const { data: sessionData, error: sessionError } = await supabase
      .from('TemporarySimulationSession')
      .insert({
        sessionId,
        simulationData: testSimulationData,
        expiresAt: expiresAt.toISOString(),
        metadata: {
          source: 'test_script',
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (sessionError) {
      throw new Error(`Erreur création session: ${sessionError.message}`);
    }

    console.log('✅ Session temporaire créée:', sessionId);

    // Test 2: Création des ClientProduitEligible temporaires
    console.log('\n2️⃣ Test création ClientProduitEligible temporaires...');
    
    for (const product of testSimulationData.eligibleProducts) {
      const { error: productError } = await supabase
        .from('ClientProduitEligible')
        .insert({
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
        });

      if (productError) {
        throw new Error(`Erreur création produit éligible: ${productError.message}`);
      }
    }

    console.log(`✅ ${testSimulationData.eligibleProducts.length} produits éligibles temporaires créés`);

    // Test 3: Vérification des données créées
    console.log('\n3️⃣ Test vérification des données...');
    
    const { data: sessionCheck, error: sessionCheckError } = await supabase
      .from('TemporarySimulationSession')
      .select('*')
      .eq('sessionId', sessionId)
      .single();

    if (sessionCheckError || !sessionCheck) {
      throw new Error('Session non trouvée après création');
    }

    const { data: productsCheck, error: productsCheckError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('sessionId', sessionId);

    if (productsCheckError) {
      throw new Error(`Erreur vérification produits: ${productsCheckError.message}`);
    }

    console.log(`✅ Session vérifiée: ${sessionCheck.sessionId}`);
    console.log(`✅ Produits vérifiés: ${productsCheck?.length || 0} produits`);

    // Test 4: Simulation de migration (création du compte client)
    console.log('\n4️⃣ Test création compte client...');
    
    // Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testClientData.email,
      password: testClientData.password,
      email_confirm: true,
      user_metadata: {
        username: testClientData.username,
        type: 'client',
        company_name: testClientData.company_name,
        siren: testClientData.siren,
        phone_number: testClientData.phone_number
      }
    });

    if (authError) {
      throw new Error(`Erreur création utilisateur Auth: ${authError.message}`);
    }

    const authUserId = authData.user.id;
    console.log('✅ Utilisateur Auth créé:', authUserId);

    // Créer le client dans la table Client
    const { data: clientData, error: clientError } = await supabase
      .from('Client')
      .insert({
        auth_id: authUserId,
        email: testClientData.email,
        password: testClientData.password, // En production, il faudrait hasher
        name: testClientData.username,
        company_name: testClientData.company_name,
        phone_number: testClientData.phone_number,
        address: testClientData.address,
        city: testClientData.city,
        postal_code: testClientData.postal_code,
        siren: testClientData.siren,
        type: 'client',
        statut: 'actif',
        derniereConnexion: new Date().toISOString(),
        dateCreation: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        revenuAnnuel: testClientData.revenuAnnuel,
        secteurActivite: testClientData.secteurActivite,
        nombreEmployes: testClientData.nombreEmployes,
        ancienneteEntreprise: testClientData.ancienneteEntreprise,
        metadata: {
          source: 'test_script_migration',
          migration_date: new Date().toISOString()
        }
      })
      .select('id')
      .single();

    if (clientError) {
      throw new Error(`Erreur création client: ${clientError.message}`);
    }

    const clientId = clientData.id;
    console.log('✅ Client créé:', clientId);

    // Test 5: Migration des ClientProduitEligible
    console.log('\n5️⃣ Test migration des produits éligibles...');
    
    const { data: productsToMigrate, error: productsToMigrateError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('sessionId', sessionId);

    if (productsToMigrateError) {
      throw new Error(`Erreur récupération produits à migrer: ${productsToMigrateError.message}`);
    }

    console.log(`📊 Migration de ${productsToMigrate?.length || 0} produits...`);

    for (const product of productsToMigrate || []) {
      const { data: migratedProduct, error: migrationError } = await supabase
        .from('ClientProduitEligible')
        .update({
          clientId: clientId,
          sessionId: null,
          updated_at: new Date().toISOString(),
          metadata: {
            ...product.metadata,
            migrated_at: new Date().toISOString(),
            original_session_id: sessionId
          }
        })
        .eq('id', product.id)
        .select()
        .single();

      if (migrationError) {
        throw new Error(`Erreur migration produit: ${migrationError.message}`);
      }

      console.log(`✅ Produit migré: ${migratedProduct.id}`);
    }

    // Test 6: Vérification de la migration
    console.log('\n6️⃣ Test vérification de la migration...');
    
    const { data: migratedProductsCheck, error: migratedProductsCheckError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', clientId);

    if (migratedProductsCheckError) {
      throw new Error(`Erreur vérification produits migrés: ${migratedProductsCheckError.message}`);
    }

    console.log(`✅ ${migratedProductsCheck?.length || 0} produits migrés vers le client ${clientId}`);

    // Test 7: Nettoyage de la session temporaire
    console.log('\n7️⃣ Test nettoyage session temporaire...');
    
    const { error: cleanupError } = await supabase
      .from('TemporarySimulationSession')
      .delete()
      .eq('sessionId', sessionId);

    if (cleanupError) {
      console.warn('⚠️ Erreur nettoyage session:', cleanupError.message);
    } else {
      console.log('✅ Session temporaire nettoyée');
    }

    // Test 8: Vérification finale
    console.log('\n8️⃣ Test vérification finale...');
    
    const { data: finalClientCheck, error: finalClientCheckError } = await supabase
      .from('Client')
      .select(`
        *,
        ClientProduitEligible (
          id,
          produitId,
          statut,
          tauxFinal,
          montantFinal,
          dureeFinale
        )
      `)
      .eq('id', clientId)
      .single();

    if (finalClientCheckError) {
      throw new Error(`Erreur vérification finale: ${finalClientCheckError.message}`);
    }

    console.log('✅ Client final vérifié:');
    console.log(`   - ID: ${finalClientCheck.id}`);
    console.log(`   - Email: ${finalClientCheck.email}`);
    console.log(`   - Entreprise: ${finalClientCheck.company_name}`);
    console.log(`   - Produits éligibles: ${finalClientCheck.ClientProduitEligible?.length || 0}`);

    // Nettoyage final (supprimer le client de test)
    console.log('\n🧹 Nettoyage final...');
    
    // Supprimer les ClientProduitEligible
    await supabase
      .from('ClientProduitEligible')
      .delete()
      .eq('clientId', clientId);

    // Supprimer le client
    await supabase
      .from('Client')
      .delete()
      .eq('id', clientId);

    // Supprimer l'utilisateur Auth
    await supabase.auth.admin.deleteUser(authUserId);

    console.log('✅ Nettoyage terminé');

    console.log('\n🎉 Tous les tests de migration sont passés avec succès !');
    console.log('\n📊 Résumé:');
    console.log('   - Session temporaire créée et validée');
    console.log('   - Produits éligibles temporaires créés');
    console.log('   - Compte client créé avec succès');
    console.log('   - Migration des produits éligibles réussie');
    console.log('   - Session temporaire nettoyée');
    console.log('   - Données de test supprimées');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Exécuter les tests
if (require.main === module) {
  testSessionMigration()
    .then(() => {
      console.log('\n✅ Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script échoué:', error);
      process.exit(1);
    });
}

module.exports = { testSessionMigration }; 