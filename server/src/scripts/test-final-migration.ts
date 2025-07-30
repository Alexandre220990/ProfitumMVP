import { supabaseClient } from '../config/supabase';

const supabase = supabaseClient;

async function testFinalMigration() {
  console.log('🎯 TEST FINAL: Vérification de la migration complète');
  console.log('=' .repeat(60));

  const testClientId = '74dfdf10-af1b-4c84-8828-fa5e0eed5b69';
  const testEmail = 'test-migration@example.com';

  try {
    // 1. Authentification
    console.log('1️⃣ Authentification...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'test-password-123'
    });

    if (authError) {
      console.error('❌ Erreur authentification:', authError);
      return;
    }

    console.log('✅ Authentification réussie');

    // 2. Vérifier les produits existants avant migration
    console.log('\n2️⃣ Vérification des produits existants...');
    const { data: existingProducts, error: existingError } = await supabase
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
      .eq('clientId', testClientId);

    if (existingError) {
      console.error('❌ Erreur récupération produits existants:', existingError);
    } else {
      console.log(`📊 ${existingProducts?.length || 0} produits existants:`);
      if (existingProducts) {
        existingProducts.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.ProduitEligible?.nom || 'Produit inconnu'}`);
          console.log(`      - ClientId: ${product.clientId}`);
          console.log(`      - Statut: ${product.statut}`);
          console.log(`      - Taux: ${product.tauxFinal}`);
          console.log(`      - Montant: ${product.montantFinal}€`);
        });
      }
    }

    // 3. Tester la migration
    console.log('\n3️⃣ Test de migration...');
    const response = await fetch('https://profitummvp-production.up.railway.app/api/simple-migration/migrate-simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.session?.access_token}`
      },
      body: JSON.stringify({
        clientId: testClientId,
        email: testEmail,
        simulationResults: {
          timestamp: Date.now(),
          products: [
            {
              code: 'TICPE',
              score: 85,
              savings: 15000,
              confidence: 'high'
            },
            {
              code: 'URSSAF',
              score: 72,
              savings: 8000,
              confidence: 'medium'
            }
          ]
        }
      })
    });

    const result = await response.json() as any;
    console.log('📊 Résultat migration:', JSON.stringify(result, null, 2));

    // 4. Vérifier les produits après migration
    console.log('\n4️⃣ Vérification des produits après migration...');
    const { data: newProducts, error: newError } = await supabase
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
      .eq('clientId', testClientId);

    if (newError) {
      console.error('❌ Erreur récupération nouveaux produits:', newError);
    } else {
      console.log(`📊 ${newProducts?.length || 0} produits après migration:`);
      if (newProducts) {
        newProducts.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.ProduitEligible?.nom || 'Produit inconnu'}`);
          console.log(`      - ClientId: ${product.clientId}`);
          console.log(`      - Statut: ${product.statut}`);
          console.log(`      - Taux: ${product.tauxFinal}`);
          console.log(`      - Montant: ${product.montantFinal}€`);
        });
      }
    }

    // 5. Résumé
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RÉSUMÉ FINAL');
    console.log('=' .repeat(60));
    console.log(`✅ Authentification: RÉUSSI`);
    console.log(`✅ Produits existants: ${existingProducts?.length || 0}`);
    console.log(`✅ Migration: ${result.success ? 'RÉUSSI' : 'ÉCHOUÉ'}`);
    console.log(`✅ Produits après migration: ${newProducts?.length || 0}`);
    
    if (result.success && result.data?.migrated_products > 0) {
      console.log('🎉 MIGRATION COMPLÈTEMENT RÉUSSIE !');
    } else if (result.success) {
      console.log('⚠️ Migration partiellement réussie (erreurs dans les détails)');
    } else {
      console.log('❌ Migration échouée');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test final:', error);
  } finally {
    // Déconnexion
    await supabase.auth.signOut();
  }
}

// Exécuter le test final
testFinalMigration(); 