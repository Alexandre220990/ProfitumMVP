const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Erreur: SUPABASE_SERVICE_ROLE_KEY manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Test des corrections du schéma...');
console.log(`📡 Connexion à: ${supabaseUrl}`);

// Fonction pour tester les colonnes ajoutées
async function testAddedColumns() {
  console.log('\n📋 Test des colonnes ajoutées:');
  
  // Test 1: client_produit_eligible_id dans expertassignment
  try {
    const { data, error } = await supabase
      .from('expertassignment')
      .select('client_produit_eligible_id')
      .limit(1);
    
    if (error) {
      console.log(`  ❌ client_produit_eligible_id: ${error.message}`);
    } else {
      console.log('  ✅ client_produit_eligible_id: Présente');
    }
  } catch (err) {
    console.log(`  ❌ client_produit_eligible_id: ${err.message}`);
  }
  
  // Test 2: statut dans expertassignment
  try {
    const { data, error } = await supabase
      .from('expertassignment')
      .select('statut')
      .limit(1);
    
    if (error) {
      console.log(`  ❌ statut: ${error.message}`);
    } else {
      console.log('  ✅ statut: Présente');
    }
  } catch (err) {
    console.log(`  ❌ statut: ${err.message}`);
  }
  
  // Test 3: category dans ProduitEligible
  try {
    const { data, error } = await supabase
      .from('ProduitEligible')
      .select('category')
      .limit(1);
    
    if (error) {
      console.log(`  ❌ category: ${error.message}`);
    } else {
      console.log('  ✅ category: Présente');
    }
  } catch (err) {
    console.log(`  ❌ category: ${err.message}`);
  }
  
  // Test 4: active dans ProduitEligible
  try {
    const { data, error } = await supabase
      .from('ProduitEligible')
      .select('active')
      .limit(1);
    
    if (error) {
      console.log(`  ❌ active: ${error.message}`);
    } else {
      console.log('  ✅ active: Présente');
    }
  } catch (err) {
    console.log(`  ❌ active: ${err.message}`);
  }
  
  // Test 5: timestamp dans message
  try {
    const { data, error } = await supabase
      .from('message')
      .select('timestamp')
      .limit(1);
    
    if (error) {
      console.log(`  ❌ timestamp: ${error.message}`);
    } else {
      console.log('  ✅ timestamp: Présente');
    }
  } catch (err) {
    console.log(`  ❌ timestamp: ${err.message}`);
  }
}

// Fonction pour tester les vues
async function testViews() {
  console.log('\n👁️ Test des vues:');
  
  // Test 1: v_expert_assignments
  try {
    const { data, error } = await supabase
      .from('v_expert_assignments')
      .select('*')
      .limit(3);
    
    if (error) {
      console.log(`  ❌ v_expert_assignments: ${error.message}`);
    } else {
      console.log(`  ✅ v_expert_assignments: ${data.length} résultats`);
      if (data.length > 0) {
        console.log('    Exemple:', {
          expert_name: data[0].expert_name,
          client_name: data[0].client_name,
          produit_nom: data[0].produit_nom,
          statut: data[0].statut
        });
      }
    }
  } catch (err) {
    console.log(`  ❌ v_expert_assignments: ${err.message}`);
  }
  
  // Test 2: v_messages_with_users
  try {
    const { data, error } = await supabase
      .from('v_messages_with_users')
      .select('*')
      .limit(3);
    
    if (error) {
      console.log(`  ❌ v_messages_with_users: ${error.message}`);
    } else {
      console.log(`  ✅ v_messages_with_users: ${data.length} résultats`);
      if (data.length > 0) {
        console.log('    Exemple:', {
          sender_name: data[0].sender_name,
          sender_type: data[0].sender_type,
          content: data[0].content?.substring(0, 50) + '...'
        });
      }
    }
  } catch (err) {
    console.log(`  ❌ v_messages_with_users: ${err.message}`);
  }
  
  // Test 3: v_assignment_reports
  try {
    const { data, error } = await supabase
      .from('v_assignment_reports')
      .select('*')
      .limit(3);
    
    if (error) {
      console.log(`  ❌ v_assignment_reports: ${error.message}`);
    } else {
      console.log(`  ✅ v_assignment_reports: ${data.length} résultats`);
      if (data.length > 0) {
        console.log('    Exemple:', {
          month: data[0].month,
          category: data[0].category,
          statut: data[0].statut,
          count: data[0].count
        });
      }
    }
  } catch (err) {
    console.log(`  ❌ v_assignment_reports: ${err.message}`);
  }
}

// Fonction pour tester les fonctions
async function testFunctions() {
  console.log('\n⚙️ Test des fonctions:');
  
  // Test 1: get_assignment_statistics
  try {
    const { data, error } = await supabase
      .rpc('get_assignment_statistics');
    
    if (error) {
      console.log(`  ❌ get_assignment_statistics: ${error.message}`);
    } else {
      console.log(`  ✅ get_assignment_statistics: ${data.length} résultats`);
      data.forEach(stat => {
        console.log(`    ${stat.statut}: ${stat.count} (${stat.percentage}%)`);
      });
    }
  } catch (err) {
    console.log(`  ❌ get_assignment_statistics: ${err.message}`);
  }
  
  // Test 2: get_expert_assignments_by_status
  try {
    const { data, error } = await supabase
      .rpc('get_expert_assignments_by_status', { status_filter: 'pending' });
    
    if (error) {
      console.log(`  ❌ get_expert_assignments_by_status: ${error.message}`);
    } else {
      console.log(`  ✅ get_expert_assignments_by_status: ${data.length} résultats pour 'pending'`);
      if (data.length > 0) {
        console.log('    Exemple:', {
          expert_name: data[0].expert_name,
          client_name: data[0].client_name,
          produit_nom: data[0].produit_nom
        });
      }
    }
  } catch (err) {
    console.log(`  ❌ get_expert_assignments_by_status: ${err.message}`);
  }
}

// Fonction pour tester les jointures avec noms corrects
async function testCorrectJoins() {
  console.log('\n🔗 Test des jointures avec noms corrects:');
  
  // Test 1: Expert avec name
  try {
    const { data, error } = await supabase
      .from('Expert')
      .select('id, name, email, company_name')
      .limit(3);
    
    if (error) {
      console.log(`  ❌ Expert avec name: ${error.message}`);
    } else {
      console.log(`  ✅ Expert avec name: ${data.length} résultats`);
      data.forEach(expert => {
        console.log(`    ${expert.name} (${expert.email}) - ${expert.company_name}`);
      });
    }
  } catch (err) {
    console.log(`  ❌ Expert avec name: ${err.message}`);
  }
  
  // Test 2: ClientProduitEligible avec clientId et produitId
  try {
    const { data, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        "clientId",
        "produitId",
        Client (
          id,
          company_name
        ),
        ProduitEligible (
          id,
          nom,
          category
        )
      `)
      .limit(3);
    
    if (error) {
      console.log(`  ❌ ClientProduitEligible jointure: ${error.message}`);
    } else {
      console.log(`  ✅ ClientProduitEligible jointure: ${data.length} résultats`);
      data.forEach(cpe => {
        console.log(`    Client: ${cpe.Client?.company_name}, Produit: ${cpe.ProduitEligible?.nom} (${cpe.ProduitEligible?.category})`);
      });
    }
  } catch (err) {
    console.log(`  ❌ ClientProduitEligible jointure: ${err.message}`);
  }
}

// Fonction pour tester RLS
async function testRLS() {
  console.log('\n🔒 Test des politiques RLS:');
  
  // Test 1: Vérifier que RLS est activé
  try {
    const { data, error } = await supabase
      .from('expertassignment')
      .select('count')
      .limit(1);
    
    if (error && error.message.includes('row level security')) {
      console.log('  ✅ RLS activé sur expertassignment');
    } else if (error) {
      console.log(`  ❌ Erreur RLS expertassignment: ${error.message}`);
    } else {
      console.log('  ⚠️ RLS peut ne pas être activé sur expertassignment');
    }
  } catch (err) {
    console.log(`  ❌ Test RLS expertassignment: ${err.message}`);
  }
  
  // Test 2: Vérifier les politiques
  try {
    const { data, error } = await supabase
      .from('message')
      .select('count')
      .limit(1);
    
    if (error && error.message.includes('row level security')) {
      console.log('  ✅ RLS activé sur message');
    } else if (error) {
      console.log(`  ❌ Erreur RLS message: ${error.message}`);
    } else {
      console.log('  ⚠️ RLS peut ne pas être activé sur message');
    }
  } catch (err) {
    console.log(`  ❌ Test RLS message: ${err.message}`);
  }
}

// Fonction pour afficher un résumé
function displaySummary(results) {
  console.log('\n📊 Résumé des tests:');
  console.log('==================');
  
  const totalTests = Object.values(results).flat().length;
  const passedTests = Object.values(results).flat().filter(r => r.status === 'passed').length;
  const failedTests = totalTests - passedTests;
  
  console.log(`Total des tests: ${totalTests}`);
  console.log(`✅ Réussis: ${passedTests}`);
  console.log(`❌ Échoués: ${failedTests}`);
  console.log(`📈 Taux de réussite: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 Tous les tests sont passés ! La migration est complète.');
  } else {
    console.log('\n⚠️ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.');
  }
}

// Fonction principale
async function main() {
  const results = {
    columns: [],
    views: [],
    functions: [],
    joins: [],
    rls: []
  };
  
  try {
    console.log('🧪 Démarrage des tests de correction du schéma...\n');
    
    // 1. Tester les colonnes ajoutées
    await testAddedColumns();
    
    // 2. Tester les vues
    await testViews();
    
    // 3. Tester les fonctions
    await testFunctions();
    
    // 4. Tester les jointures avec noms corrects
    await testCorrectJoins();
    
    // 5. Tester RLS
    await testRLS();
    
    console.log('\n🎉 Tests terminés !');
    console.log('');
    console.log('📋 Prochaines étapes:');
    console.log('1. Si tous les tests passent: Démarrer le dashboard admin');
    console.log('2. Si des erreurs: Vérifier la migration dans Supabase');
    console.log('3. Tester l\'intégration complète');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
  }
}

// Exécuter le script
main(); 