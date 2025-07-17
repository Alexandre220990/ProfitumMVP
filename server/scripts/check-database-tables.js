const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Erreur: SUPABASE_SERVICE_ROLE_KEY manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Vérification des tables existantes dans la base de données...');
console.log(`📡 Connexion à: ${supabaseUrl}`);

// Fonction pour lister toutes les tables
async function listAllTables() {
  try {
    console.log('\n📋 Tables existantes dans le schéma public:');
    
    // Essayer de récupérer la liste des tables
    const { data: tables, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            table_name,
            table_type
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `
      });
    
    if (error) {
      console.log('⚠️  Impossible d\'utiliser exec_sql, utilisation d\'une approche alternative...');
      
      // Approche alternative : tester les tables une par une
      const tableTests = [
        'client', 'Client', 'clients', 'Clients',
        'expert', 'Expert', 'experts', 'Experts',
        'expertassignment', 'ExpertAssignment', 'expert_assignments',
        'produiteligible', 'ProduitEligible', 'produits_eligibles',
        'clientproduiteligible', 'ClientProduitEligible', 'client_produit_eligible',
        'message', 'Message', 'messages',
        'conversation', 'Conversation', 'conversations',
        'notification', 'Notification', 'notifications'
      ];
      
      console.log('\n🔍 Test des tables possibles:');
      
      for (const tableName of tableTests) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (error) {
            // Essayer avec des guillemets pour les noms avec majuscules
            if (tableName !== tableName.toLowerCase()) {
              const { data: data2, error: error2 } = await supabase
                .from(`"${tableName}"`)
                .select('*')
                .limit(1);
              
              if (!error2) {
                console.log(`✅ "${tableName}": Table trouvée (avec guillemets)`);
              } else {
                console.log(`❌ "${tableName}": ${error2.message}`);
              }
            } else {
              console.log(`❌ ${tableName}: ${error.message}`);
            }
          } else {
            console.log(`✅ ${tableName}: Table trouvée`);
          }
        } catch (err) {
          console.log(`❌ ${tableName}: ${err.message}`);
        }
      }
      
      return;
    }
    
    if (tables && tables.length > 0) {
      console.log('\n📊 Tables trouvées:');
      tables.forEach(table => {
        console.log(`  - ${table.table_name} (${table.table_type})`);
      });
    } else {
      console.log('❌ Aucune table trouvée dans le schéma public');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des tables:', error);
  }
}

// Fonction pour vérifier la structure d'une table spécifique
async function checkTableStructure(tableName) {
  try {
    console.log(`\n🔍 Structure de la table ${tableName}:`);
    
    const { data: columns, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = '${tableName}'
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });
    
    if (error) {
      console.log(`⚠️  Impossible de vérifier la structure de ${tableName}`);
      return;
    }
    
    if (columns && columns.length > 0) {
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'YES' ? ' (nullable)' : ''}${col.column_default ? ` [default: ${col.column_default}]` : ''}`);
      });
    } else {
      console.log(`❌ Aucune colonne trouvée dans ${tableName}`);
    }
    
  } catch (error) {
    console.error(`❌ Erreur lors de la vérification de ${tableName}:`, error);
  }
}

// Fonction pour proposer une migration corrigée
function proposeCorrectedMigration() {
  console.log('\n🔧 Migration corrigée proposée:');
  console.log('');
  console.log('Basé sur les tables trouvées, voici les corrections à apporter:');
  console.log('');
  console.log('1. Vérifier les noms exacts des tables');
  console.log('2. Adapter les jointures dans les vues');
  console.log('3. Corriger les références de colonnes');
  console.log('');
  console.log('📝 Créer un nouveau fichier de migration avec les noms corrects');
}

// Fonction principale
async function main() {
  try {
    console.log('🔍 Démarrage de la vérification des tables...\n');
    
    // 1. Lister toutes les tables
    await listAllTables();
    
    // 2. Vérifier la structure des tables importantes
    const importantTables = ['expertassignment', 'ProduitEligible', 'ClientProduitEligible', 'message'];
    
    for (const table of importantTables) {
      await checkTableStructure(table);
    }
    
    // 3. Proposer des corrections
    proposeCorrectedMigration();
    
    console.log('\n🎉 Vérification terminée !');
    console.log('');
    console.log('📋 Prochaines étapes:');
    console.log('1. Identifier les noms exacts des tables');
    console.log('2. Créer une migration corrigée');
    console.log('3. Tester les jointures');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  }
}

// Exécuter le script
main(); 