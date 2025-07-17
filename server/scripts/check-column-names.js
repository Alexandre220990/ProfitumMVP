const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Erreur: SUPABASE_SERVICE_ROLE_KEY manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Vérification des noms exacts des colonnes...');
console.log(`📡 Connexion à: ${supabaseUrl}`);

// Fonction pour vérifier les colonnes d'une table
async function checkTableColumns(tableName) {
  try {
    console.log(`\n📋 Colonnes de la table ${tableName}:`);
    
    // Essayer de récupérer les colonnes
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
      console.log(`⚠️  Impossible de vérifier ${tableName} avec exec_sql`);
      
      // Approche alternative : tester les colonnes une par une
      const commonColumns = [
        'id', 'Id', 'ID',
        'client_id', 'clientId', 'ClientId', 'clientId',
        'produit_eligible_id', 'produitEligibleId', 'ProduitEligibleId',
        'expert_id', 'expertId', 'ExpertId',
        'company_name', 'companyName', 'CompanyName',
        'first_name', 'firstName', 'FirstName',
        'last_name', 'lastName', 'LastName',
        'email', 'Email',
        'nom', 'Nom',
        'content', 'Content',
        'created_at', 'createdAt', 'CreatedAt',
        'updated_at', 'updatedAt', 'UpdatedAt'
      ];
      
      console.log(`🔍 Test des colonnes communes pour ${tableName}:`);
      
      for (const column of commonColumns) {
        try {
          const { data, error: colError } = await supabase
            .from(tableName)
            .select(column)
            .limit(1);
          
          if (colError) {
            // Essayer avec des guillemets pour les noms avec majuscules
            if (column !== column.toLowerCase()) {
              const { data: data2, error: colError2 } = await supabase
                .from(tableName)
                .select(`"${column}"`)
                .limit(1);
              
              if (!colError2) {
                console.log(`  ✅ "${column}": Présente (avec guillemets)`);
              }
            } else {
              console.log(`  ❌ ${column}: ${colError.message}`);
            }
          } else {
            console.log(`  ✅ ${column}: Présente`);
          }
        } catch (err) {
          // Ignorer les erreurs de colonnes inexistantes
        }
      }
      
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

// Fonction pour tester les jointures spécifiques
async function testSpecificJoins() {
  console.log('\n🔗 Test des jointures spécifiques:');
  
  try {
    // Test 1: ClientProduitEligible -> Client
    console.log('\n🔄 Test ClientProduitEligible -> Client...');
    
    const { data: join1, error: error1 } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        "clientId",
        "produitEligibleId",
        Client (
          id,
          company_name
        )
      `)
      .limit(1);
    
    if (error1) {
      console.log(`❌ Erreur jointure 1: ${error1.message}`);
    } else {
      console.log('✅ Jointure ClientProduitEligible -> Client: OK');
    }
    
    // Test 2: ClientProduitEligible -> ProduitEligible
    console.log('\n🔄 Test ClientProduitEligible -> ProduitEligible...');
    
    const { data: join2, error: error2 } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        "clientId",
        "produitEligibleId",
        ProduitEligible (
          id,
          nom
        )
      `)
      .limit(1);
    
    if (error2) {
      console.log(`❌ Erreur jointure 2: ${error2.message}`);
    } else {
      console.log('✅ Jointure ClientProduitEligible -> ProduitEligible: OK');
    }
    
    // Test 3: expertassignment -> ClientProduitEligible
    console.log('\n🔄 Test expertassignment -> ClientProduitEligible...');
    
    const { data: join3, error: error3 } = await supabase
      .from('expertassignment')
      .select(`
        id,
        expert_id,
        client_produit_eligible_id,
        ClientProduitEligible (
          id,
          "clientId",
          "produitEligibleId"
        )
      `)
      .limit(1);
    
    if (error3) {
      console.log(`❌ Erreur jointure 3: ${error3.message}`);
    } else {
      console.log('✅ Jointure expertassignment -> ClientProduitEligible: OK');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors des tests de jointures:', error);
  }
}

// Fonction pour proposer la migration finale
function proposeFinalMigration() {
  console.log('\n🔧 Migration finale proposée:');
  console.log('');
  console.log('Basé sur les tests, voici les corrections à apporter:');
  console.log('');
  console.log('1. Utiliser "clientId" au lieu de "client_id"');
  console.log('2. Utiliser "produitEligibleId" au lieu de "produit_eligible_id"');
  console.log('3. Utiliser "Client" au lieu de "client"');
  console.log('4. Utiliser "ProduitEligible" au lieu de "produiteligible"');
  console.log('');
  console.log('📝 Utiliser le fichier: migrations/20250103_fix_schema_issues_final.sql');
}

// Fonction principale
async function main() {
  try {
    console.log('🔍 Démarrage de la vérification des colonnes...\n');
    
    // 1. Vérifier les colonnes des tables importantes
    const importantTables = [
      'Client', 
      'ProduitEligible', 
      'ClientProduitEligible', 
      'expert', 
      'expertassignment', 
      'message'
    ];
    
    for (const table of importantTables) {
      await checkTableColumns(table);
    }
    
    // 2. Tester les jointures spécifiques
    await testSpecificJoins();
    
    // 3. Proposer la migration finale
    proposeFinalMigration();
    
    console.log('\n🎉 Vérification terminée !');
    console.log('');
    console.log('📋 Prochaines étapes:');
    console.log('1. Utiliser la migration finale avec les noms corrects');
    console.log('2. Tester les jointures après application');
    console.log('3. Vérifier que toutes les vues fonctionnent');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  }
}

// Exécuter le script
main(); 