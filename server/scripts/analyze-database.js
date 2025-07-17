const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function analyzeDatabase() {
  console.log('🔍 Analyse de la structure de la base de données Profitum\n');

  try {
    // 1. Lister toutes les tables
    console.log('1️⃣ Tables disponibles:');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.log(`   ❌ Erreur: ${tablesError.message}`);
    } else {
      tables.forEach(table => {
        console.log(`   ✅ ${table.table_name}`);
      });
    }

    // 2. Analyser la structure de chaque table principale
    const mainTables = ['Expert', 'Client', 'Simulation', 'ClientProduitEligible', 'Audit', 'Admin'];
    
    for (const tableName of mainTables) {
      console.log(`\n2️⃣ Structure de la table ${tableName}:`);
      
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');

      if (columnsError) {
        console.log(`   ❌ Erreur: ${columnsError.message}`);
      } else if (columns && columns.length > 0) {
        columns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultValue = col.column_default ? `DEFAULT ${col.column_default}` : '';
          console.log(`   📋 ${col.column_name}: ${col.data_type} ${nullable} ${defaultValue}`);
        });
      } else {
        console.log(`   ⚠️  Table ${tableName} non trouvée`);
      }
    }

    // 3. Vérifier les contraintes
    console.log('\n3️⃣ Contraintes de clés étrangères:');
    const { data: foreignKeys, error: fkError } = await supabase
      .from('information_schema.key_column_usage')
      .select(`
        constraint_name,
        table_name,
        column_name,
        referenced_table_name,
        referenced_column_name
      `)
      .eq('table_schema', 'public')
      .not('referenced_table_name', 'is', null);

    if (fkError) {
      console.log(`   ❌ Erreur: ${fkError.message}`);
    } else if (foreignKeys && foreignKeys.length > 0) {
      foreignKeys.forEach(fk => {
        console.log(`   🔗 ${fk.table_name}.${fk.column_name} → ${fk.referenced_table_name}.${fk.referenced_column_name}`);
      });
    } else {
      console.log('   ℹ️  Aucune clé étrangère trouvée');
    }

    // 4. Vérifier les index
    console.log('\n4️⃣ Index existants:');
    const { data: indexes, error: indexError } = await supabase
      .from('pg_indexes')
      .select('tablename, indexname, indexdef')
      .eq('schemaname', 'public')
      .order('tablename, indexname');

    if (indexError) {
      console.log(`   ❌ Erreur: ${indexError.message}`);
    } else if (indexes && indexes.length > 0) {
      indexes.forEach(idx => {
        console.log(`   📊 ${idx.tablename}.${idx.indexname}`);
      });
    } else {
      console.log('   ℹ️  Aucun index trouvé');
    }

    // 5. Compter les enregistrements
    console.log('\n5️⃣ Nombre d\'enregistrements par table:');
    for (const tableName of mainTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`   ❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`   📊 ${tableName}: ${count || 0} enregistrements`);
        }
      } catch (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`);
      }
    }

    // 6. Vérifier les types de données spécifiques
    console.log('\n6️⃣ Types de données spécifiques:');
    
    // Vérifier les enums ou contraintes CHECK
    const { data: checkConstraints, error: checkError } = await supabase
      .from('information_schema.check_constraints')
      .select('constraint_name, check_clause')
      .eq('constraint_schema', 'public');

    if (checkError) {
      console.log(`   ❌ Erreur: ${checkError.message}`);
    } else if (checkConstraints && checkConstraints.length > 0) {
      checkConstraints.forEach(constraint => {
        console.log(`   ✅ ${constraint.constraint_name}: ${constraint.check_clause}`);
      });
    } else {
      console.log('   ℹ️  Aucune contrainte CHECK trouvée');
    }

    console.log('\n✅ Analyse terminée !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

// Exécuter l'analyse
analyzeDatabase(); 