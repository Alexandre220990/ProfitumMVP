const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Erreur: SUPABASE_SERVICE_ROLE_KEY manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Recherche du nom exact de la colonne produit éligible...');
console.log(`📡 Connexion à: ${supabaseUrl}`);

// Fonction pour tester différents noms de colonnes
async function testColumnNames() {
  console.log('\n🔍 Test des noms possibles pour la colonne produit éligible:');
  
  const possibleNames = [
    'produitEligibleId',
    'produit_eligible_id',
    'produitEligible_id',
    'produit_eligibleId',
    'produitId',
    'produit_id',
    'eligibleId',
    'eligible_id',
    'productId',
    'product_id',
    'produitEligible',
    'produit_eligible'
  ];
  
  for (const columnName of possibleNames) {
    try {
      const { data, error } = await supabase
        .from('ClientProduitEligible')
        .select(columnName)
        .limit(1);
      
      if (error) {
        // Essayer avec des guillemets pour les noms avec majuscules
        if (columnName !== columnName.toLowerCase()) {
          const { data: data2, error: error2 } = await supabase
            .from('ClientProduitEligible')
            .select(`"${columnName}"`)
            .limit(1);
          
          if (!error2) {
            console.log(`✅ "${columnName}": Colonne trouvée (avec guillemets)`);
            return columnName;
          }
        }
        console.log(`❌ ${columnName}: ${error.message}`);
      } else {
        console.log(`✅ ${columnName}: Colonne trouvée`);
        return columnName;
      }
    } catch (err) {
      console.log(`❌ ${columnName}: ${err.message}`);
    }
  }
  
  return null;
}

// Fonction pour tester les jointures avec le nom trouvé
async function testJoinWithColumn(columnName) {
  if (!columnName) {
    console.log('\n❌ Aucune colonne trouvée pour produit éligible');
    return;
  }
  
  console.log(`\n🔗 Test de jointure avec ${columnName}:`);
  
  try {
    const { data, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        "clientId",
        "${columnName}",
        ProduitEligible (
          id,
          nom
        )
      `)
      .limit(1);
    
    if (error) {
      console.log(`❌ Erreur jointure: ${error.message}`);
    } else {
      console.log('✅ Jointure réussie !');
      console.log('📊 Données de test:', data);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test de jointure:', error);
  }
}

// Fonction pour vérifier la table expert
async function checkExpertTable() {
  console.log('\n🔍 Vérification de la table expert:');
  
  const possibleNames = [
    'expert',
    'Expert',
    'experts',
    'Experts',
    'user',
    'User',
    'users',
    'Users'
  ];
  
  for (const tableName of possibleNames) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        // Essayer avec des guillemets
        if (tableName !== tableName.toLowerCase()) {
          const { data: data2, error: error2 } = await supabase
            .from(`"${tableName}"`)
            .select('*')
            .limit(1);
          
          if (!error2) {
            console.log(`✅ Table "${tableName}" trouvée (avec guillemets)`);
            return tableName;
          }
        }
        console.log(`❌ Table ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ Table ${tableName} trouvée`);
        return tableName;
      }
    } catch (err) {
      console.log(`❌ Table ${tableName}: ${err.message}`);
    }
  }
  
  return null;
}

// Fonction pour créer la migration finale
function createFinalMigration(produitColumnName, expertTableName) {
  console.log('\n🔧 Migration finale à créer:');
  console.log('');
  console.log(`Colonne produit éligible: ${produitColumnName}`);
  console.log(`Table expert: ${expertTableName || 'NON TROUVÉE'}`);
  console.log('');
  
  if (produitColumnName) {
    console.log('✅ Migration peut être créée avec les noms corrects');
  } else {
    console.log('❌ Impossible de créer la migration sans connaître les noms exacts');
  }
}

// Fonction principale
async function main() {
  try {
    console.log('🔍 Démarrage de la recherche...\n');
    
    // 1. Trouver le nom de la colonne produit éligible
    const produitColumnName = await testColumnNames();
    
    // 2. Tester la jointure avec le nom trouvé
    await testJoinWithColumn(produitColumnName);
    
    // 3. Vérifier la table expert
    const expertTableName = await checkExpertTable();
    
    // 4. Créer la migration finale
    createFinalMigration(produitColumnName, expertTableName);
    
    console.log('\n🎉 Recherche terminée !');
    
    if (produitColumnName) {
      console.log(`\n📝 Utiliser ${produitColumnName} dans la migration finale`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error);
    process.exit(1);
  }
}

// Exécuter le script
main(); 