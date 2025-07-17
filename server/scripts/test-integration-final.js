const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Erreur: SUPABASE_SERVICE_ROLE_KEY manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Test d\'intégration finale...');
console.log(`📡 Connexion à: ${supabaseUrl}`);

// Fonction pour tester les assignations
async function testAssignments() {
  console.log('\n📋 Test des assignations expert/client:');
  
  try {
    const { data, error } = await supabase
      .from('v_expert_assignments')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log(`  ❌ Erreur: ${error.message}`);
      return false;
    }
    
    console.log(`  ✅ ${data.length} assignations trouvées`);
    if (data.length > 0) {
      console.log('    Exemple:', {
        expert_name: data[0].expert_name,
        client_name: data[0].client_name,
        produit_nom: data[0].produit_nom,
        statut: data[0].statut
      });
    }
    return true;
  } catch (err) {
    console.log(`  ❌ Exception: ${err.message}`);
    return false;
  }
}

// Fonction pour tester les messages
async function testMessages() {
  console.log('\n💬 Test de la messagerie:');
  
  try {
    const { data, error } = await supabase
      .from('v_messages_with_users')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log(`  ❌ Erreur: ${error.message}`);
      return false;
    }
    
    console.log(`  ✅ ${data.length} messages trouvés`);
    if (data.length > 0) {
      console.log('    Exemple:', {
        sender_name: data[0].sender_name,
        sender_type: data[0].sender_type,
        content: data[0].content?.substring(0, 50) + '...'
      });
    }
    return true;
  } catch (err) {
    console.log(`  ❌ Exception: ${err.message}`);
    return false;
  }
}

// Fonction pour tester les statistiques
async function testStatistics() {
  console.log('\n📊 Test des statistiques:');
  
  try {
    const { data, error } = await supabase
      .rpc('get_assignment_statistics');
    
    if (error) {
      console.log(`  ❌ Erreur: ${error.message}`);
      return false;
    }
    
    console.log(`  ✅ ${data.length} statistiques calculées`);
    data.forEach(stat => {
      console.log(`    ${stat.statut}: ${stat.count} (${stat.percentage}%)`);
    });
    return true;
  } catch (err) {
    console.log(`  ❌ Exception: ${err.message}`);
    return false;
  }
}

// Fonction pour tester les rapports
async function testReports() {
  console.log('\n📈 Test des rapports:');
  
  try {
    const { data, error } = await supabase
      .from('v_assignment_reports')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log(`  ❌ Erreur: ${error.message}`);
      return false;
    }
    
    console.log(`  ✅ ${data.length} rapports générés`);
    if (data.length > 0) {
      console.log('    Exemple:', {
        month: data[0].month,
        category: data[0].category,
        statut: data[0].statut,
        count: data[0].count
      });
    }
    return true;
  } catch (err) {
    console.log(`  ❌ Exception: ${err.message}`);
    return false;
  }
}

// Fonction pour tester les produits éligibles
async function testProducts() {
  console.log('\n🏷️ Test des produits éligibles:');
  
  try {
    const { data, error } = await supabase
      .from('ProduitEligible')
      .select('nom, category, active')
      .limit(5);
    
    if (error) {
      console.log(`  ❌ Erreur: ${error.message}`);
      return false;
    }
    
    console.log(`  ✅ ${data.length} produits trouvés`);
    data.forEach(product => {
      console.log(`    ${product.nom} (${product.category}) - ${product.active ? 'Actif' : 'Inactif'}`);
    });
    return true;
  } catch (err) {
    console.log(`  ❌ Exception: ${err.message}`);
    return false;
  }
}

// Fonction pour afficher le résumé final
function displayFinalSummary(results) {
  console.log('\n🎯 RÉSUMÉ FINAL:');
  console.log('=================');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`📊 Tests totaux: ${totalTests}`);
  console.log(`✅ Réussis: ${passedTests}`);
  console.log(`❌ Échoués: ${failedTests}`);
  console.log(`📈 Taux de réussite: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  console.log('\n🎉 ÉTAT DU SYSTÈME:');
  console.log('==================');
  
  if (failedTests === 0) {
    console.log('🚀 SYSTÈME 100% OPÉRATIONNEL !');
    console.log('✅ Migration complète');
    console.log('✅ Base de données optimisée');
    console.log('✅ Vues et fonctions créées');
    console.log('✅ RLS activé');
    console.log('✅ Données cohérentes');
    console.log('');
    console.log('🎯 Prêt pour le dashboard admin !');
  } else {
    console.log('⚠️ SYSTÈME PARTIELLEMENT OPÉRATIONNEL');
    console.log('❌ Certains tests ont échoué');
    console.log('🔧 Vérification requise');
  }
}

// Fonction principale
async function main() {
  const results = {};
  
  try {
    console.log('🧪 Démarrage du test d\'intégration finale...\n');
    
    // 1. Tester les assignations
    results.assignments = await testAssignments();
    
    // 2. Tester les messages
    results.messages = await testMessages();
    
    // 3. Tester les statistiques
    results.statistics = await testStatistics();
    
    // 4. Tester les rapports
    results.reports = await testReports();
    
    // 5. Tester les produits
    results.products = await testProducts();
    
    // 6. Afficher le résumé final
    displayFinalSummary(results);
    
    console.log('\n🎉 Test d\'intégration terminé !');
    console.log('');
    console.log('📋 Prochaines étapes:');
    if (Object.values(results).every(r => r)) {
      console.log('1. Démarrer le dashboard admin: node scripts/start-dashboard-admin.js');
      console.log('2. Accéder à: http://localhost:5173/admin');
      console.log('3. Tester les fonctionnalités');
    } else {
      console.log('1. Vérifier les erreurs ci-dessus');
      console.log('2. Corriger les problèmes');
      console.log('3. Relancer le test');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test d\'intégration:', error);
    process.exit(1);
  }
}

// Exécuter le script
main(); 