/**
 * SCRIPT DE TEST POUR L'API /api/admin/produits
 * 
 * Ce script teste l'endpoint des produits pour diagnostiquer l'erreur 404
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function testAPIConfiguration() {
  log('\n============================================================', 'cyan');
  log('DIAGNOSTIC API /api/admin/produits', 'cyan');
  log('============================================================\n', 'cyan');

  // 1. Vérifier les variables d'environnement
  log('1. VÉRIFICATION DES VARIABLES D\'ENVIRONNEMENT', 'blue');
  log('================================================\n', 'blue');
  
  const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  let envValid = true;
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      log(`✅ ${envVar}: Défini`, 'green');
    } else {
      log(`❌ ${envVar}: Manquant`, 'red');
      envValid = false;
    }
  }
  
  if (!envValid) {
    log('\n❌ Variables d\'environnement manquantes!', 'red');
    process.exit(1);
  }

  // 2. Créer le client Supabase
  log('\n2. CONNEXION À SUPABASE', 'blue');
  log('========================\n', 'blue');
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  log('✅ Client Supabase créé avec succès', 'green');

  // 3. Vérifier l'existence de la table ProduitEligible
  log('\n3. VÉRIFICATION DE LA TABLE ProduitEligible', 'blue');
  log('============================================\n', 'blue');
  
  try {
    const { data: tableCheck, error: tableError } = await supabase
      .from('ProduitEligible')
      .select('count', { count: 'exact', head: true });
    
    if (tableError) {
      log(`❌ Erreur lors de la vérification de la table:`, 'red');
      log(JSON.stringify(tableError, null, 2), 'red');
      return;
    }
    
    log('✅ Table ProduitEligible existe', 'green');
  } catch (error) {
    log(`❌ Exception lors de la vérification de la table:`, 'red');
    log(error.message, 'red');
    return;
  }

  // 4. Compter les produits
  log('\n4. NOMBRE DE PRODUITS DANS LA BASE', 'blue');
  log('====================================\n', 'blue');
  
  try {
    const { count, error: countError } = await supabase
      .from('ProduitEligible')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      log(`❌ Erreur lors du comptage:`, 'red');
      log(JSON.stringify(countError, null, 2), 'red');
      return;
    }
    
    if (count === 0) {
      log('⚠️  AUCUN PRODUIT TROUVÉ DANS LA BASE!', 'yellow');
      log('   C\'est probablement la cause de l\'erreur "Aucun produit éligible"', 'yellow');
    } else {
      log(`✅ ${count} produit(s) trouvé(s) dans la base`, 'green');
    }
  } catch (error) {
    log(`❌ Exception lors du comptage:`, 'red');
    log(error.message, 'red');
    return;
  }

  // 5. Récupérer tous les produits
  log('\n5. RÉCUPÉRATION DES PRODUITS', 'blue');
  log('==============================\n', 'blue');
  
  try {
    const { data: produits, error: produitsError } = await supabase
      .from('ProduitEligible')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (produitsError) {
      log(`❌ Erreur lors de la récupération des produits:`, 'red');
      log(JSON.stringify(produitsError, null, 2), 'red');
      return;
    }
    
    if (!produits || produits.length === 0) {
      log('⚠️  Aucun produit récupéré', 'yellow');
      log('\n📝 SOLUTION:', 'magenta');
      log('   Vous devez insérer des produits dans la table ProduitEligible', 'magenta');
      log('   Utilisez le script SQL DIAGNOSTIC-API-PRODUITS.sql (section 13)', 'magenta');
    } else {
      log(`✅ ${produits.length} produit(s) récupéré(s):\n`, 'green');
      
      produits.forEach((produit, index) => {
        log(`   ${index + 1}. ${produit.nom}`, 'cyan');
        log(`      Catégorie: ${produit.categorie}`, 'cyan');
        log(`      Montant: ${produit.montant_min}€ - ${produit.montant_max}€`, 'cyan');
        log(`      ID: ${produit.id}\n`, 'cyan');
      });
    }
  } catch (error) {
    log(`❌ Exception lors de la récupération:`, 'red');
    log(error.message, 'red');
    return;
  }

  // 6. Vérifier les politiques RLS
  log('\n6. VÉRIFICATION DES POLITIQUES RLS', 'blue');
  log('====================================\n', 'blue');
  
  try {
    const { data: policies, error: policiesError } = await supabase
      .rpc('pg_policies')
      .eq('tablename', 'ProduitEligible');
    
    if (policiesError && policiesError.code !== '42883') {
      log(`⚠️  Impossible de récupérer les politiques RLS:`, 'yellow');
      log(JSON.stringify(policiesError, null, 2), 'yellow');
    } else if (policies && policies.length > 0) {
      log(`✅ ${policies.length} politique(s) RLS trouvée(s)`, 'green');
    } else {
      log('⚠️  Aucune politique RLS trouvée', 'yellow');
      log('   Vérifiez les permissions avec le script SQL', 'yellow');
    }
  } catch (error) {
    log(`⚠️  Vérification RLS ignorée (fonction non disponible)`, 'yellow');
  }

  // 7. Vérifier l'authentification admin
  log('\n7. VÉRIFICATION DES ADMINISTRATEURS', 'blue');
  log('=====================================\n', 'blue');
  
  try {
    const { data: admins, error: adminsError } = await supabase
      .from('Admin')
      .select('id, email, name')
      .limit(5);
    
    if (adminsError) {
      log(`❌ Erreur lors de la récupération des admins:`, 'red');
      log(JSON.stringify(adminsError, null, 2), 'red');
    } else if (!admins || admins.length === 0) {
      log('⚠️  Aucun administrateur trouvé!', 'yellow');
      log('   Créez un compte admin pour accéder à l\'API', 'yellow');
    } else {
      log(`✅ ${admins.length} administrateur(s) trouvé(s):\n`, 'green');
      admins.forEach((admin, index) => {
        log(`   ${index + 1}. ${admin.email} (${admin.name || 'Sans nom'})`, 'cyan');
      });
    }
  } catch (error) {
    log(`❌ Exception lors de la vérification des admins:`, 'red');
    log(error.message, 'red');
  }

  // 8. Résumé et recommandations
  log('\n============================================================', 'magenta');
  log('RÉSUMÉ ET RECOMMANDATIONS', 'magenta');
  log('============================================================\n', 'magenta');
  
  log('📋 CHECKLIST:', 'cyan');
  log('   1. ✓ Variables d\'environnement configurées', 'green');
  log('   2. ✓ Connexion Supabase établie', 'green');
  log('   3. ✓ Table ProduitEligible existe', 'green');
  
  const { count } = await supabase
    .from('ProduitEligible')
    .select('*', { count: 'exact', head: true });
  
  if (count === 0) {
    log('   4. ✗ AUCUN PRODUIT dans la table', 'red');
    log('\n🔧 ACTION REQUISE:', 'red');
    log('   Exécutez le script SQL DIAGNOSTIC-API-PRODUITS.sql (section 13)', 'yellow');
    log('   pour insérer des produits de test dans la base de données.', 'yellow');
  } else {
    log(`   4. ✓ ${count} produit(s) disponible(s)`, 'green');
  }
  
  // 9. Informations sur l'erreur 404
  log('\n🔍 DIAGNOSTIC ERREUR 404:', 'magenta');
  log('   L\'erreur 404 peut avoir plusieurs causes:', 'yellow');
  log('   • Serveur backend non démarré ou crashé', 'yellow');
  log('   • Route /api/admin/produits non montée correctement', 'yellow');
  log('   • Middleware d\'authentification bloquant', 'yellow');
  log('   • Problème de déploiement (Railway, Vercel...)', 'yellow');
  
  log('\n📝 VÉRIFICATIONS SUPPLÉMENTAIRES:', 'cyan');
  log('   1. Vérifiez que le serveur backend est démarré:', 'white');
  log('      → npm run dev (en local)', 'white');
  log('      → Vérifiez les logs de déploiement (en production)', 'white');
  log('   2. Testez l\'endpoint depuis le terminal:', 'white');
  log('      → curl http://localhost:3000/api/admin/test', 'white');
  log('   3. Vérifiez les logs du serveur backend', 'white');
  log('   4. Vérifiez que vous êtes authentifié en tant qu\'admin', 'white');
  
  log('\n============================================================\n', 'cyan');
}

// Exécuter le diagnostic
testAPIConfiguration()
  .then(() => {
    log('✅ Diagnostic terminé', 'green');
    process.exit(0);
  })
  .catch((error) => {
    log('\n❌ Erreur lors du diagnostic:', 'red');
    log(error.message, 'red');
    console.error(error);
    process.exit(1);
  });

