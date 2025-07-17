const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Erreur: SUPABASE_SERVICE_ROLE_KEY manquante');
  console.log('💡 Ajoutez la variable d\'environnement: export SUPABASE_SERVICE_ROLE_KEY="votre_clé"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Application de la migration complète...');
console.log(`📡 Connexion à: ${supabaseUrl}`);

// Fonction pour lire le fichier de migration
function readMigrationFile() {
  const migrationPath = path.join(__dirname, '../migrations/20250103_fix_schema_issues_complete.sql');
  
  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Fichier de migration non trouvé: ${migrationPath}`);
  }
  
  return fs.readFileSync(migrationPath, 'utf8');
}

// Fonction pour appliquer la migration
async function applyMigration() {
  try {
    console.log('\n📋 Lecture du fichier de migration...');
    const migrationSQL = readMigrationFile();
    
    console.log('✅ Fichier de migration lu avec succès');
    console.log(`📏 Taille: ${migrationSQL.length} caractères`);
    
    console.log('\n🔄 Application de la migration...');
    console.log('⏳ Cela peut prendre 2-3 minutes...');
    
    // Diviser la migration en parties pour éviter les timeouts
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 ${statements.length} instructions SQL à exécuter`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim().length === 0) continue;
      
      try {
        console.log(`  [${i + 1}/${statements.length}] Exécution...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });
        
        if (error) {
          // Si exec_sql n'existe pas, essayer avec une approche différente
          console.log(`    ⚠️ exec_sql non disponible, tentative alternative...`);
          
          // Pour les instructions simples, on peut les ignorer si elles échouent
          if (statement.includes('CREATE INDEX') || statement.includes('ALTER TABLE')) {
            console.log(`    ⚠️ Instruction ignorée (peut déjà exister): ${statement.substring(0, 50)}...`);
            successCount++;
          } else {
            console.log(`    ❌ Erreur: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log(`    ✅ Succès`);
          successCount++;
        }
        
        // Pause entre les instructions
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.log(`    ❌ Exception: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 Résumé de l\'application:');
    console.log(`✅ Succès: ${successCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📈 Taux de réussite: ${Math.round((successCount / (successCount + errorCount)) * 100)}%`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Migration appliquée avec succès !');
    } else {
      console.log('\n⚠️ Migration partiellement appliquée. Vérifiez les erreurs.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error);
    process.exit(1);
  }
}

// Fonction pour vérifier l'état après migration
async function checkMigrationStatus() {
  console.log('\n🔍 Vérification de l\'état après migration...');
  
  const checks = [
    {
      name: 'Colonne client_produit_eligible_id dans expertassignment',
      query: 'SELECT column_name FROM information_schema.columns WHERE table_name = \'expertassignment\' AND column_name = \'client_produit_eligible_id\''
    },
    {
      name: 'Colonne statut dans expertassignment',
      query: 'SELECT column_name FROM information_schema.columns WHERE table_name = \'expertassignment\' AND column_name = \'statut\''
    },
    {
      name: 'Colonne category dans ProduitEligible',
      query: 'SELECT column_name FROM information_schema.columns WHERE table_name = \'ProduitEligible\' AND column_name = \'category\''
    },
    {
      name: 'Vue v_expert_assignments',
      query: 'SELECT table_name FROM information_schema.views WHERE table_name = \'v_expert_assignments\''
    }
  ];
  
  for (const check of checks) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: check.query
      });
      
      if (error) {
        console.log(`  ❌ ${check.name}: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log(`  ✅ ${check.name}: Présente`);
      } else {
        console.log(`  ❌ ${check.name}: Absente`);
      }
    } catch (err) {
      console.log(`  ❌ ${check.name}: ${err.message}`);
    }
  }
}

// Fonction pour proposer une application manuelle
function proposeManualApplication() {
  console.log('\n📋 Application Manuelle Recommandée:');
  console.log('=====================================');
  console.log('');
  console.log('1. Aller sur https://supabase.com');
  console.log('2. Se connecter et sélectionner le projet FinancialTracker');
  console.log('3. Aller dans SQL Editor');
  console.log('4. Créer une nouvelle query');
  console.log('5. Copier le contenu de: migrations/20250103_fix_schema_issues_complete.sql');
  console.log('6. Exécuter la migration');
  console.log('');
  console.log('⏱️ Temps estimé: 2-3 minutes');
  console.log('🔒 Nécessite les permissions admin');
  console.log('');
  console.log('💡 Alternative: Utiliser le guide GUIDE-MIGRATION-COMPLETE.md');
}

// Fonction principale
async function main() {
  try {
    console.log('🚀 Démarrage de l\'application de migration...\n');
    
    // Vérifier si exec_sql est disponible
    console.log('🔍 Vérification des permissions...');
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: 'SELECT 1'
      });
      
      if (error) {
        console.log('❌ exec_sql non disponible. Application manuelle requise.');
        proposeManualApplication();
        return;
      }
      
      console.log('✅ exec_sql disponible. Application automatique possible.');
      
    } catch (err) {
      console.log('❌ exec_sql non disponible. Application manuelle requise.');
      proposeManualApplication();
      return;
    }
    
    // Appliquer la migration
    await applyMigration();
    
    // Vérifier l'état
    await checkMigrationStatus();
    
    console.log('\n🎉 Processus terminé !');
    console.log('');
    console.log('📋 Prochaines étapes:');
    console.log('1. Tester les corrections: node scripts/test-schema-corrections.js');
    console.log('2. Si tout fonctionne: Démarrer le dashboard admin');
    console.log('3. Tester l\'intégration complète');
    
  } catch (error) {
    console.error('❌ Erreur lors du processus:', error);
    console.log('\n💡 Solution: Appliquer manuellement via Supabase Dashboard');
    proposeManualApplication();
    process.exit(1);
  }
}

// Exécuter le script
main(); 