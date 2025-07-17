const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Erreur: SUPABASE_SERVICE_ROLE_KEY manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Vérification des colonnes de la table Expert...');
console.log(`📡 Connexion à: ${supabaseUrl}`);

// Fonction pour vérifier les colonnes de la table Expert
async function checkExpertColumns() {
  console.log('\n📋 Colonnes de la table Expert:');
  
  const possibleColumns = [
    'id', 'Id', 'ID',
    'first_name', 'firstName', 'FirstName', 'firstname',
    'last_name', 'lastName', 'LastName', 'lastname',
    'name', 'Name',
    'full_name', 'fullName', 'FullName',
    'email', 'Email',
    'phone', 'Phone',
    'company_name', 'companyName', 'CompanyName',
    'specialization', 'Specialization',
    'bio', 'Bio',
    'created_at', 'createdAt', 'CreatedAt',
    'updated_at', 'updatedAt', 'UpdatedAt'
  ];
  
  console.log('🔍 Test des colonnes possibles:');
  
  for (const column of possibleColumns) {
    try {
      const { data, error } = await supabase
        .from('Expert')
        .select(column)
        .limit(1);
      
      if (error) {
        // Essayer avec des guillemets pour les noms avec majuscules
        if (column !== column.toLowerCase()) {
          const { data: data2, error: error2 } = await supabase
            .from('Expert')
            .select(`"${column}"`)
            .limit(1);
          
          if (!error2) {
            console.log(`  ✅ "${column}": Présente (avec guillemets)`);
          }
        } else {
          console.log(`  ❌ ${column}: ${error.message}`);
        }
      } else {
        console.log(`  ✅ ${column}: Présente`);
      }
    } catch (err) {
      console.log(`  ❌ ${column}: ${err.message}`);
    }
  }
}

// Fonction pour tester les jointures avec Expert
async function testExpertJoins() {
  console.log('\n🔗 Test des jointures avec Expert:');
  
  try {
    // Test 1: expertassignment -> Expert
    console.log('\n🔄 Test expertassignment -> Expert...');
    
    const { data: join1, error: error1 } = await supabase
      .from('expertassignment')
      .select(`
        id,
        expert_id,
        Expert (
          id,
          name
        )
      `)
      .limit(1);
    
    if (error1) {
      console.log(`❌ Erreur jointure 1: ${error1.message}`);
      
      // Essayer avec d'autres noms de colonnes
      const { data: join1b, error: error1b } = await supabase
        .from('expertassignment')
        .select(`
          id,
          expert_id,
          Expert (
            id,
            firstName
          )
        `)
        .limit(1);
      
      if (error1b) {
        console.log(`❌ Erreur jointure 1b: ${error1b.message}`);
      } else {
        console.log('✅ Jointure expertassignment -> Expert avec firstName: OK');
      }
    } else {
      console.log('✅ Jointure expertassignment -> Expert avec name: OK');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors des tests de jointures:', error);
  }
}

// Fonction pour afficher un exemple de données Expert
async function showExpertData() {
  console.log('\n📊 Exemple de données Expert:');
  
  try {
    const { data, error } = await supabase
      .from('Expert')
      .select('*')
      .limit(3);
    
    if (error) {
      console.log(`❌ Erreur: ${error.message}`);
    } else {
      console.log('✅ Données Expert:');
      data.forEach((expert, index) => {
        console.log(`  Expert ${index + 1}:`, expert);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des données:', error);
  }
}

// Fonction pour proposer la correction
function proposeCorrection() {
  console.log('\n🔧 Correction proposée:');
  console.log('');
  console.log('Basé sur les tests, voici les corrections à apporter:');
  console.log('');
  console.log('1. Identifier les noms exacts des colonnes dans Expert');
  console.log('2. Adapter les jointures dans les vues');
  console.log('3. Corriger les références de colonnes');
  console.log('');
  console.log('📝 Créer une nouvelle migration avec les noms corrects');
}

// Fonction principale
async function main() {
  try {
    console.log('🔍 Démarrage de la vérification des colonnes Expert...\n');
    
    // 1. Vérifier les colonnes de la table Expert
    await checkExpertColumns();
    
    // 2. Tester les jointures avec Expert
    await testExpertJoins();
    
    // 3. Afficher un exemple de données
    await showExpertData();
    
    // 4. Proposer la correction
    proposeCorrection();
    
    console.log('\n🎉 Vérification terminée !');
    console.log('');
    console.log('📋 Prochaines étapes:');
    console.log('1. Identifier les noms exacts des colonnes Expert');
    console.log('2. Créer une migration corrigée');
    console.log('3. Tester les jointures');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  }
}

// Exécuter le script
main(); 