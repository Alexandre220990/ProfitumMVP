// Script de test pour vérifier la migration des données temporaires
// et l'affichage des ClientProduitEligible sur le dashboard client

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMigrationVerification() {
  console.log('🔍 VÉRIFICATION DE LA MIGRATION ET AFFICHAGE');
  console.log('='.repeat(50));

  try {
    // 1. Vérifier les sessions temporaires récentes
    console.log('\n1️⃣ Vérification des sessions temporaires...');
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('TemporarySession')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (sessionsError) {
      console.error('❌ Erreur récupération sessions:', sessionsError);
      return;
    }

    console.log(`✅ ${sessions?.length || 0} sessions temporaires trouvées`);
    
    if (sessions && sessions.length > 0) {
      sessions.forEach((session, index) => {
        console.log(`   ${index + 1}. Token: ${session.session_token}, Migré: ${session.migrated_to_account}, Complété: ${session.completed}`);
      });
    }

    // 2. Vérifier les résultats d'éligibilité temporaires
    console.log('\n2️⃣ Vérification des résultats d\'éligibilité temporaires...');
    
    const { data: eligibilities, error: eligibilitiesError } = await supabase
      .from('TemporaryEligibility')
      .select(`
        *,
        TemporarySession!inner(session_token, migrated_to_account)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (eligibilitiesError) {
      console.error('❌ Erreur récupération éligibilités:', eligibilitiesError);
      return;
    }

    console.log(`✅ ${eligibilities?.length || 0} résultats d'éligibilité trouvés`);
    
    if (eligibilities && eligibilities.length > 0) {
      eligibilities.forEach((elig, index) => {
        console.log(`   ${index + 1}. Produit: ${elig.produit_id}, Score: ${elig.eligibility_score}%, Économies: ${elig.estimated_savings}€, Session migrée: ${elig.TemporarySession?.migrated_to_account}`);
      });
    }

    // 3. Vérifier les clients récents
    console.log('\n3️⃣ Vérification des clients récents...');
    
    const { data: clients, error: clientsError } = await supabase
      .from('Client')
      .select('id, email, name, company_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (clientsError) {
      console.error('❌ Erreur récupération clients:', clientsError);
      return;
    }

    console.log(`✅ ${clients?.length || 0} clients trouvés`);
    
    if (clients && clients.length > 0) {
      clients.forEach((client, index) => {
        console.log(`   ${index + 1}. Email: ${client.email}, Nom: ${client.name}, Entreprise: ${client.company_name}`);
      });
    }

    // 4. Vérifier les ClientProduitEligible pour chaque client
    console.log('\n4️⃣ Vérification des ClientProduitEligible par client...');
    
    if (clients && clients.length > 0) {
      for (const client of clients) {
        console.log(`\n📋 Client: ${client.email} (${client.name})`);
        
        const { data: clientProducts, error: productsError } = await supabase
          .from('ClientProduitEligible')
          .select(`
            *,
            ProduitEligible(id, nom, description, category)
          `)
          .eq('clientId', client.id)
          .order('created_at', { ascending: false });

        if (productsError) {
          console.error(`❌ Erreur récupération produits pour ${client.email}:`, productsError);
          continue;
        }

        console.log(`   📦 ${clientProducts?.length || 0} produits éligibles trouvés`);
        
        if (clientProducts && clientProducts.length > 0) {
          clientProducts.forEach((product, index) => {
            console.log(`     ${index + 1}. ${product.ProduitEligible?.nom || 'Produit inconnu'}, Statut: ${product.statut}, Montant: ${product.montantFinal}€, Taux: ${product.tauxFinal}%`);
          });
        } else {
          console.log('     ⚠️ Aucun produit éligible trouvé');
        }
      }
    }

    // 5. Vérifier le mapping des produits
    console.log('\n5️⃣ Vérification du mapping des produits...');
    
    const { data: products, error: productsError } = await supabase
      .from('ProduitEligible')
      .select('id, nom, category')
      .order('nom');

    if (productsError) {
      console.error('❌ Erreur récupération produits:', productsError);
      return;
    }

    console.log(`✅ ${products?.length || 0} produits dans le catalogue`);
    
    if (products && products.length > 0) {
      products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.nom} (${product.category}) - ID: ${product.id}`);
      });
    }

    // 6. Test de simulation de migration
    console.log('\n6️⃣ Test de simulation de migration...');
    
    // Trouver une session non migrée avec des éligibilités
    const { data: testSession, error: testSessionError } = await supabase
      .from('TemporarySession')
      .select(`
        *,
        TemporaryEligibility(*)
      `)
      .eq('migrated_to_account', false)
      .not('TemporaryEligibility', 'is', null)
      .limit(1)
      .single();

    if (testSessionError) {
      console.log('⚠️ Aucune session de test trouvée:', testSessionError.message);
    } else if (testSession) {
      console.log(`✅ Session de test trouvée: ${testSession.session_token}`);
      console.log(`   Éligibilités: ${testSession.TemporaryEligibility?.length || 0}`);
      
      if (testSession.TemporaryEligibility && testSession.TemporaryEligibility.length > 0) {
        testSession.TemporaryEligibility.forEach((elig, index) => {
          console.log(`     ${index + 1}. ${elig.produit_id} - Score: ${elig.eligibility_score}% - Économies: ${elig.estimated_savings}€`);
        });
      }
    }

    // 7. Vérifier les statistiques globales
    console.log('\n7️⃣ Statistiques globales...');
    
    const { data: stats, error: statsError } = await supabase
      .from('ClientProduitEligible')
      .select('statut, montantFinal, tauxFinal');

    if (statsError) {
      console.error('❌ Erreur récupération statistiques:', statsError);
    } else {
      const totalProducts = stats?.length || 0;
      const eligibleProducts = stats?.filter(p => p.statut === 'eligible').length || 0;
      const totalSavings = stats?.reduce((sum, p) => sum + (p.montantFinal || 0), 0) || 0;
      const avgRate = stats?.reduce((sum, p) => sum + (p.tauxFinal || 0), 0) / totalProducts || 0;

      console.log(`📊 Total produits: ${totalProducts}`);
      console.log(`📊 Produits éligibles: ${eligibleProducts}`);
      console.log(`📊 Économies totales: ${totalSavings.toLocaleString()}€`);
      console.log(`📊 Taux moyen: ${(avgRate * 100).toFixed(1)}%`);
    }

    console.log('\n✅ Vérification terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// Exécuter le test
testMigrationVerification(); 