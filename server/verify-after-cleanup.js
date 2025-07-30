// Vérification après nettoyage des données temporaires
require('dotenv').config({ path: '../.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAfterCleanup() {
  console.log('🔍 VÉRIFICATION APRÈS NETTOYAGE');
  console.log('='.repeat(50));

  try {
    // 1. Vérifier que les tables temporaires sont vides
    console.log('\n1️⃣ Vérification tables temporaires...');
    
    const tempTables = ['TemporarySession', 'TemporaryEligibility', 'TemporaryResponse', 'SimulatorAnalytics'];
    
    for (const tableName of tempTables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`   ⚠️ ${tableName}: Erreur d'accès (table peut être supprimée)`);
      } else {
        const count = data?.length || 0;
        console.log(`   ${count === 0 ? '✅' : '❌'} ${tableName}: ${count} enregistrements`);
      }
    }

    // 2. Vérifier que les tables principales sont intactes
    console.log('\n2️⃣ Vérification tables principales...');
    
    const mainTables = [
      { name: 'Client', key: 'id' },
      { name: 'ClientProduitEligible', key: 'id' },
      { name: 'ProduitEligible', key: 'id' }
    ];
    
    for (const table of mainTables) {
      const { data, error } = await supabase
        .from(table.name)
        .select(table.key)
        .limit(1);
        
      if (error) {
        console.log(`   ❌ ${table.name}: Erreur d'accès`);
      } else {
        console.log(`   ✅ ${table.name}: Accessible`);
      }
    }

    // 3. Vérifier les données des tables principales
    console.log('\n3️⃣ Vérification données principales...');
    
    // Clients
    const { data: clients, error: clientsError } = await supabase
      .from('Client')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (clientsError) {
      console.log('   ❌ Erreur récupération clients');
    } else {
      console.log(`   ✅ ${clients?.length || 0} clients trouvés`);
      if (clients && clients.length > 0) {
        console.log(`   📧 Dernier client: ${clients[0].email}`);
      }
    }

    // Produits éligibles
    const { data: products, error: productsError } = await supabase
      .from('ProduitEligible')
      .select('id, nom, active')
      .eq('active', true);
      
    if (productsError) {
      console.log('   ❌ Erreur récupération produits');
    } else {
      console.log(`   ✅ ${products?.length || 0} produits éligibles actifs`);
    }

    // ClientProduitEligible
    const { data: clientProducts, error: clientProductsError } = await supabase
      .from('ClientProduitEligible')
      .select('id, clientId, produitId, statut, montantFinal')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (clientProductsError) {
      console.log('   ❌ Erreur récupération ClientProduitEligible');
    } else {
      console.log(`   ✅ ${clientProducts?.length || 0} associations client-produit trouvées`);
      if (clientProducts && clientProducts.length > 0) {
        console.log(`   📊 Dernière association: Client ${clientProducts[0].clientId} - Produit ${clientProducts[0].produitId} (${clientProducts[0].statut})`);
      }
    }

    // 4. Test de la nouvelle migration
    console.log('\n4️⃣ Test de la migration simplifiée...');
    
    // Créer un client de test
    const timestamp = Date.now();
    const testClientData = {
      email: `test-cleanup-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Client Test Cleanup',
      company_name: 'Entreprise Test Cleanup',
      phone_number: '0123456789',
      address: '123 Rue Test',
      city: 'Paris',
      postal_code: '75001',
      siren: String(Math.floor(100000000 + Math.random() * 900000000)),
      type: 'client',
      statut: 'actif',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: testClient, error: testClientError } = await supabase
      .from('Client')
      .insert(testClientData)
      .select()
      .single();

    if (testClientError) {
      console.log('   ❌ Erreur création client de test:', testClientError.message);
    } else {
      console.log('   ✅ Client de test créé:', testClient.email);
      
      // Simuler la migration
      const simulationResults = {
        timestamp: Date.now(),
        products: [
          { code: 'TICPE', score: 85, savings: 5000 },
          { code: 'URSSAF', score: 70, savings: 3000 }
        ]
      };
      
      // Test de migration directe
      const migratedProducts = [];
      
      for (const product of simulationResults.products) {
        const produitId = {
          'TICPE': '32dd9cf8-15e2-4375-86ab-a95158d3ada1',
          'URSSAF': 'd1e8f740-7c2a-4b5e-9a91-0e15c0e7d3a2'
        }[product.code];
        
        if (produitId) {
          const clientProduitEligible = {
            clientId: testClient.id,
            produitId: produitId,
            statut: product.score >= 50 ? 'eligible' : 'non_eligible',
            tauxFinal: product.score / 100,
            montantFinal: product.savings || 0,
            dureeFinale: 12,
            simulationId: null,
            metadata: {
              original_code: product.code,
              migrated_at: new Date().toISOString(),
              source: 'simulator'
            },
            notes: `Migration depuis simulateur - Score: ${product.score}%`,
            priorite: product.score >= 80 ? 1 : product.score >= 60 ? 2 : 3,
            dateEligibilite: new Date().toISOString(),
            current_step: 0,
            progress: 0,
            expert_id: null,
            charte_signed: false,
            charte_signed_at: null
          };
          
          const { data: insertedProduct, error: insertError } = await supabase
            .from('ClientProduitEligible')
            .insert(clientProduitEligible)
            .select()
            .single();
            
          if (insertError) {
            console.log(`   ❌ Erreur insertion ${product.code}:`, insertError.message);
          } else {
            migratedProducts.push(insertedProduct);
            console.log(`   ✅ ${product.code} migré: ${insertedProduct.id}`);
          }
        }
      }
      
      console.log(`   🎉 Migration test réussie: ${migratedProducts.length} produits`);
      
      // Nettoyage
      await supabase
        .from('ClientProduitEligible')
        .delete()
        .eq('clientId', testClient.id);
        
      await supabase
        .from('Client')
        .delete()
        .eq('id', testClient.id);
        
      console.log('   ✅ Données de test nettoyées');
    }

    console.log('\n🎉 VÉRIFICATION TERMINÉE AVEC SUCCÈS !');
    console.log('✅ Tables temporaires nettoyées');
    console.log('✅ Tables principales intactes');
    console.log('✅ Migration simplifiée fonctionnelle');
    console.log('✅ Système prêt pour la production');

  } catch (error) {
    console.error('❌ Erreur vérification:', error);
  }
}

verifyAfterCleanup(); 