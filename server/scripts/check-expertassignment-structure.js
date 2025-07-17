const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Erreur: SUPABASE_SERVICE_ROLE_KEY manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Vérification de la structure de la table expertassignment...');
console.log(`📡 Connexion à: ${supabaseUrl}`);

// Fonction pour vérifier la structure de la table
async function checkTableStructure() {
  try {
    console.log('\n📋 Structure actuelle de la table expertassignment:');
    
    // Récupérer toutes les colonnes de la table
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns 
          WHERE table_name = 'expertassignment' 
          ORDER BY ordinal_position;
        `
      });
    
    if (columnsError) {
      console.log('⚠️  Impossible d\'utiliser exec_sql, utilisation d\'une approche alternative...');
      
      // Approche alternative : essayer de sélectionner les colonnes une par une
      const columnTests = [
        'id', 'expert_id', 'client_produit_eligible_id', 'statut', 
        'created_at', 'updated_at'
      ];
      
      console.log('\n🔍 Test des colonnes individuelles:');
      
      for (const column of columnTests) {
        try {
          const { data, error } = await supabase
            .from('expertassignment')
            .select(column)
            .limit(1);
          
          if (error) {
            console.log(`❌ ${column}: ${error.message}`);
          } else {
            console.log(`✅ ${column}: Présente`);
          }
        } catch (err) {
          console.log(`❌ ${column}: ${err.message}`);
        }
      }
      
      return;
    }
    
    if (columns && columns.length > 0) {
      console.log('\n📊 Colonnes trouvées:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'YES' ? ' (nullable)' : ''}${col.column_default ? ` [default: ${col.column_default}]` : ''}`);
      });
      
      // Vérifier les colonnes manquantes
      const requiredColumns = [
        'id', 'expert_id', 'client_produit_eligible_id', 'statut', 
        'created_at', 'updated_at'
      ];
      
      const existingColumns = columns.map(col => col.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('\n❌ Colonnes manquantes:');
        missingColumns.forEach(col => console.log(`  - ${col}`));
      } else {
        console.log('\n✅ Toutes les colonnes requises sont présentes');
      }
      
    } else {
      console.log('❌ Aucune colonne trouvée dans la table expertassignment');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// Fonction pour vérifier les contraintes
async function checkConstraints() {
  try {
    console.log('\n🔗 Vérification des contraintes:');
    
    // Vérifier les clés étrangères
    const { data: foreignKeys, error: fkError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'expertassignment';
        `
      });
    
    if (fkError) {
      console.log('⚠️  Impossible de vérifier les contraintes avec exec_sql');
      return;
    }
    
    if (foreignKeys && foreignKeys.length > 0) {
      console.log('\n🔗 Clés étrangères trouvées:');
      foreignKeys.forEach(fk => {
        console.log(`  - ${fk.constraint_name}: ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.log('\n⚠️  Aucune clé étrangère trouvée');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des contraintes:', error);
  }
}

// Fonction pour vérifier les index
async function checkIndexes() {
  try {
    console.log('\n📈 Vérification des index:');
    
    const { data: indexes, error: indexError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            indexname,
            indexdef
          FROM pg_indexes
          WHERE tablename = 'expertassignment'
          ORDER BY indexname;
        `
      });
    
    if (indexError) {
      console.log('⚠️  Impossible de vérifier les index avec exec_sql');
      return;
    }
    
    if (indexes && indexes.length > 0) {
      console.log('\n📈 Index trouvés:');
      indexes.forEach(idx => {
        console.log(`  - ${idx.indexname}: ${idx.indexdef}`);
      });
    } else {
      console.log('\n⚠️  Aucun index trouvé');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des index:', error);
  }
}

// Fonction pour tester les relations
async function testRelations() {
  try {
    console.log('\n🔗 Test des relations:');
    
    // Test de la relation avec ClientProduitEligible
    console.log('🔄 Test relation expertassignment -> ClientProduitEligible...');
    
    const { data: relationTest, error: relationError } = await supabase
      .from('expertassignment')
      .select(`
        *,
        ClientProduitEligible (
          Client (company_name),
          ProduitEligible (nom)
        )
      `)
      .limit(1);
    
    if (relationError) {
      console.log(`❌ Erreur relation: ${relationError.message}`);
    } else {
      console.log('✅ Relation fonctionnelle');
      if (relationTest && relationTest.length > 0) {
        console.log(`  - Données de test: ${relationTest.length} enregistrement(s)`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test des relations:', error);
  }
}

// Fonction pour proposer des corrections
async function proposeCorrections() {
  console.log('\n🔧 Corrections proposées:');
  console.log('1. Ajouter la colonne client_produit_eligible_id si elle n\'existe pas');
  console.log('2. Ajouter la colonne statut si elle n\'existe pas');
  console.log('3. Créer la contrainte de clé étrangère');
  console.log('4. Créer les index nécessaires');
  console.log('5. Activer RLS');
  
  console.log('\n📝 Pour appliquer les corrections:');
  console.log('1. Utiliser le fichier migrations/20250103_fix_schema_issues.sql');
  console.log('2. Ou exécuter: node scripts/fix-database-schema.js');
  console.log('3. Ou utiliser le script automatisé: ./scripts/apply-schema-and-start-dashboard.sh');
}

// Fonction principale
async function main() {
  try {
    console.log('🔍 Démarrage de la vérification de la structure...\n');
    
    // 1. Vérifier la structure de la table
    await checkTableStructure();
    
    // 2. Vérifier les contraintes
    await checkConstraints();
    
    // 3. Vérifier les index
    await checkIndexes();
    
    // 4. Tester les relations
    await testRelations();
    
    // 5. Proposer des corrections
    await proposeCorrections();
    
    console.log('\n🎉 Vérification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  }
}

// Exécuter le script
main(); 