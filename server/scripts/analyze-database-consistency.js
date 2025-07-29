// Charger les variables d'environnement
require('dotenv').config({ path: '../.env' });

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeDatabaseConsistency() {
  console.log('🔍 ANALYSE COHÉRENCE BASE DE DONNÉES');
  console.log('=' .repeat(50));

  try {
    // 1. Analyse des tables principales
    console.log('\n1️⃣ ANALYSE DES TABLES PRINCIPALES');
    console.log('-'.repeat(30));

    // TemporarySession
    console.log('\n📊 Table TemporarySession:');
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('TemporarySession')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (sessionsError) {
      console.error('❌ Erreur TemporarySession:', sessionsError);
    } else {
      console.log(`✅ ${sessions?.length || 0} sessions trouvées`);
      if (sessions && sessions.length > 0) {
        console.log('📋 Dernière session:', {
          id: sessions[0].id,
          session_token: sessions[0].session_token,
          completed: sessions[0].completed,
          migrated_to_account: sessions[0].migrated_to_account,
          created_at: sessions[0].created_at
        });
      }
    }

    // TemporaryEligibility
    console.log('\n📊 Table TemporaryEligibility:');
    const { data: eligibilities, error: eligibilitiesError } = await supabaseAdmin
      .from('TemporaryEligibility')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (eligibilitiesError) {
      console.error('❌ Erreur TemporaryEligibility:', eligibilitiesError);
    } else {
      console.log(`✅ ${eligibilities?.length || 0} éligibilités trouvées`);
      if (eligibilities && eligibilities.length > 0) {
        console.log('📋 Dernières éligibilités:');
        eligibilities.slice(0, 3).forEach((elig, index) => {
          console.log(`   ${index + 1}. Session: ${elig.session_id}, Produit: ${elig.produit_id}, Score: ${elig.eligibility_score}%`);
        });
      }
    }

    // Client
    console.log('\n📊 Table Client:');
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('Client')
      .select('id, email, company_name, siren, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (clientsError) {
      console.error('❌ Erreur Client:', clientsError);
    } else {
      console.log(`✅ ${clients?.length || 0} clients trouvés`);
      if (clients && clients.length > 0) {
        console.log('📋 Derniers clients:');
        clients.slice(0, 3).forEach((client, index) => {
          console.log(`   ${index + 1}. ${client.email} (${client.company_name})`);
        });
      }
    }

    // ClientProduitEligible
    console.log('\n📊 Table ClientProduitEligible:');
    const { data: clientProducts, error: clientProductsError } = await supabaseAdmin
      .from('ClientProduitEligible')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (clientProductsError) {
      console.error('❌ Erreur ClientProduitEligible:', clientProductsError);
    } else {
      console.log(`✅ ${clientProducts?.length || 0} produits éligibles clients trouvés`);
      if (clientProducts && clientProducts.length > 0) {
        console.log('📋 Derniers produits éligibles:');
        clientProducts.slice(0, 3).forEach((prod, index) => {
          console.log(`   ${index + 1}. Client: ${prod.clientId}, Produit: ${prod.produitId}, Statut: ${prod.statut}`);
        });
      }
    }

    // ProduitEligible (catalogue)
    console.log('\n📊 Table ProduitEligible (catalogue):');
    const { data: products, error: productsError } = await supabaseAdmin
      .from('ProduitEligible')
      .select('*');

    if (productsError) {
      console.error('❌ Erreur ProduitEligible:', productsError);
    } else {
      console.log(`✅ ${products?.length || 0} produits dans le catalogue`);
      if (products && products.length > 0) {
        console.log('📋 Produits du catalogue:');
        products.forEach((prod, index) => {
          console.log(`   ${index + 1}. ${prod.nom} (ID: ${prod.id})`);
        });
      }
    }

    // 2. Vérification des relations
    console.log('\n2️⃣ VÉRIFICATION DES RELATIONS');
    console.log('-'.repeat(30));

    if (sessions && sessions.length > 0 && eligibilities && eligibilities.length > 0) {
      const testSession = sessions[0];
      console.log(`\n🔍 Test avec session: ${testSession.session_token}`);
      
      // Vérifier les éligibilités liées à cette session
      const { data: sessionEligibilities, error: sessionEligError } = await supabaseAdmin
        .from('TemporaryEligibility')
        .select('*')
        .eq('session_id', testSession.id);

      if (sessionEligError) {
        console.error('❌ Erreur récupération éligibilités session:', sessionEligError);
      } else {
        console.log(`✅ ${sessionEligibilities?.length || 0} éligibilités liées à cette session`);
        
        if (sessionEligibilities && sessionEligibilities.length > 0) {
          console.log('📋 Éligibilités de la session:');
          sessionEligibilities.forEach((elig, index) => {
            console.log(`   ${index + 1}. Produit: ${elig.produit_id}, Score: ${elig.eligibility_score}%, Économies: ${elig.estimated_savings}€`);
          });
        }
      }
    }

    // 3. Vérification du mapping des produits
    console.log('\n3️⃣ VÉRIFICATION DU MAPPING DES PRODUITS');
    console.log('-'.repeat(30));

    // Mapping utilisé dans le code
    const PRODUCT_MAPPING = {
      'TICPE': 'ticpe-id',
      'URSSAF': 'urssaf-id', 
      'DFS': 'dfs-id',
      'CIR': 'cir-id',
      'CICE': 'cice-id'
    };

    console.log('📋 Mapping utilisé dans le code:');
    Object.entries(PRODUCT_MAPPING).forEach(([key, value]) => {
      console.log(`   ${key} → ${value}`);
    });

    // Vérifier si les IDs du mapping existent dans ProduitEligible
    console.log('\n🔍 Vérification des IDs du mapping dans ProduitEligible:');
    if (products && products.length > 0) {
      const productIds = products.map(p => p.id);
      Object.entries(PRODUCT_MAPPING).forEach(([key, mappedId]) => {
        const exists = productIds.includes(mappedId);
        console.log(`   ${key} (${mappedId}): ${exists ? '✅ Existe' : '❌ Manquant'}`);
      });
    }

    // 4. Analyse des données de test récentes
    console.log('\n4️⃣ ANALYSE DES DONNÉES DE TEST RÉCENTES');
    console.log('-'.repeat(30));

    // Chercher les sessions de test récentes
    const { data: recentSessions, error: recentSessionsError } = await supabaseAdmin
      .from('TemporarySession')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Dernières 24h
      .order('created_at', { ascending: false });

    if (recentSessionsError) {
      console.error('❌ Erreur sessions récentes:', recentSessionsError);
    } else {
      console.log(`✅ ${recentSessions?.length || 0} sessions de test récentes`);
      
      if (recentSessions && recentSessions.length > 0) {
        console.log('📋 Sessions récentes:');
        recentSessions.forEach((session, index) => {
          console.log(`   ${index + 1}. ${session.session_token} (${session.completed ? 'Complète' : 'Incomplète'})`);
        });
      }
    }

    // 5. Vérification de la cohérence des données
    console.log('\n5️⃣ VÉRIFICATION DE LA COHÉRENCE');
    console.log('-'.repeat(30));

    let issues = [];

    // Vérifier les sessions sans éligibilités
    if (sessions && sessions.length > 0) {
      for (const session of sessions.slice(0, 3)) {
        const { data: sessionEligs } = await supabaseAdmin
          .from('TemporaryEligibility')
          .select('id')
          .eq('session_id', session.id);
        
        if (!sessionEligs || sessionEligs.length === 0) {
          issues.push(`⚠️ Session ${session.session_token} sans éligibilités`);
        }
      }
    }

    // Vérifier les éligibilités sans session
    if (eligibilities && eligibilities.length > 0) {
      for (const elig of eligibilities.slice(0, 3)) {
        const { data: session } = await supabaseAdmin
          .from('TemporarySession')
          .select('id')
          .eq('id', elig.session_id);
        
        if (!session || session.length === 0) {
          issues.push(`⚠️ Éligibilité ${elig.id} sans session valide`);
        }
      }
    }

    // Vérifier les ClientProduitEligible sans client
    if (clientProducts && clientProducts.length > 0) {
      for (const prod of clientProducts.slice(0, 3)) {
        const { data: client } = await supabaseAdmin
          .from('Client')
          .select('id')
          .eq('id', prod.clientId);
        
        if (!client || client.length === 0) {
          issues.push(`⚠️ ClientProduitEligible ${prod.id} sans client valide`);
        }
      }
    }

    if (issues.length > 0) {
      console.log('❌ Problèmes de cohérence détectés:');
      issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('✅ Aucun problème de cohérence détecté');
    }

    // 6. Résumé final
    console.log('\n6️⃣ RÉSUMÉ FINAL');
    console.log('-'.repeat(30));
    console.log(`📊 Sessions temporaires: ${sessions?.length || 0}`);
    console.log(`📊 Éligibilités temporaires: ${eligibilities?.length || 0}`);
    console.log(`📊 Clients: ${clients?.length || 0}`);
    console.log(`📊 Produits éligibles clients: ${clientProducts?.length || 0}`);
    console.log(`📊 Produits catalogue: ${products?.length || 0}`);
    console.log(`📊 Sessions récentes (24h): ${recentSessions?.length || 0}`);
    console.log(`📊 Problèmes de cohérence: ${issues.length}`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

analyzeDatabaseConsistency();