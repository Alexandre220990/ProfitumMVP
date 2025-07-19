const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Erreur: SUPABASE_SERVICE_ROLE_KEY manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Vérification des politiques RLS...\n');

async function checkRLSPolicies() {
  try {
    // 1. Vérifier si RLS est activé sur la table expertassignment
    console.log('1. Vérification de l\'activation RLS:');
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT schemaname, tablename, rowsecurity 
          FROM pg_tables 
          WHERE tablename = 'expertassignment';
        `
      });

    if (rlsError) {
      console.log(`❌ Erreur RLS status: ${rlsError.message}`);
    } else if (rlsStatus && rlsStatus.length > 0) {
      console.log(`✅ RLS activé: ${rlsStatus[0].rowsecurity}`);
    }

    // 2. Lister les politiques RLS sur expertassignment
    console.log('\n2. Politiques RLS sur expertassignment:');
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'expertassignment';
        `
      });

    if (policiesError) {
      console.log(`❌ Erreur politiques: ${policiesError.message}`);
    } else if (policies && policies.length > 0) {
      console.log(`✅ ${policies.length} politiques trouvées:`);
      policies.forEach((policy, index) => {
        console.log(`\n   Politique ${index + 1}:`);
        console.log(`   - Nom: ${policy.policyname}`);
        console.log(`   - Permissive: ${policy.permissive}`);
        console.log(`   - Rôles: ${policy.roles}`);
        console.log(`   - Commande: ${policy.cmd}`);
        console.log(`   - Condition: ${policy.qual || 'Aucune'}`);
      });
    } else {
      console.log('❌ Aucune politique RLS trouvée');
    }

    // 3. Tester l'accès avec l'utilisateur connecté (Alexandre Expert)
    console.log('\n3. Test d\'accès avec l\'utilisateur Alexandre Expert:');
    
    // Créer un client avec l'auth_id de l'utilisateur
    const userAuthId = 'f5011ed9-ac74-4f29-af6e-fd1dc063c9ad';
    
    // Simuler une requête avec l'utilisateur connecté
    const { data: userAssignments, error: userError } = await supabase
      .from('expertassignment')
      .select('*')
      .eq('expert_id', 'f5011ed9-ac74-4f29-af6e-fd1dc063c9ad');

    if (userError) {
      console.log(`❌ Erreur accès utilisateur: ${userError.message}`);
    } else {
      console.log(`✅ ${userAssignments.length} assignations accessibles pour l'utilisateur`);
    }

    // 4. Vérifier la structure de la table expertassignment
    console.log('\n4. Structure de la table expertassignment:');
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'expertassignment' 
          ORDER BY ordinal_position;
        `
      });

    if (columnsError) {
      console.log(`❌ Erreur structure: ${columnsError.message}`);
    } else if (columns && columns.length > 0) {
      console.log(`✅ ${columns.length} colonnes trouvées:`);
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}${col.is_nullable === 'YES' ? ' (nullable)' : ''}${col.column_default ? ` [default: ${col.column_default}]` : ''}`);
      });
    }

    // 5. Vérifier les contraintes de clé étrangère
    console.log('\n5. Contraintes de clé étrangère:');
    const { data: foreignKeys, error: fkError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            tc.constraint_name,
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
      console.log(`❌ Erreur clés étrangères: ${fkError.message}`);
    } else if (foreignKeys && foreignKeys.length > 0) {
      console.log(`✅ ${foreignKeys.length} clés étrangères trouvées:`);
      foreignKeys.forEach(fk => {
        console.log(`   - ${fk.constraint_name}: ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.log('❌ Aucune clé étrangère trouvée');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification RLS:', error);
  }
}

// Fonction pour proposer des corrections
function proposeCorrections() {
  console.log('\n🔧 Propositions de corrections:');
  console.log('================================');
  console.log('');
  console.log('1. PROBLÈME IDENTIFIÉ: client_produit_eligible_id est NULL');
  console.log('   Solution: Mettre à jour les assignations existantes avec des client_produit_eligible_id valides');
  console.log('');
  console.log('2. PROBLÈME POTENTIEL: Politiques RLS manquantes ou incorrectes');
  console.log('   Solution: Vérifier et corriger les politiques RLS');
  console.log('');
  console.log('3. PROBLÈME POTENTIEL: Relations manquantes');
  console.log('   Solution: Vérifier les clés étrangères et les relations');
  console.log('');
  console.log('4. PROBLÈME POTENTIEL: Structure de table incorrecte');
  console.log('   Solution: Vérifier que toutes les colonnes nécessaires existent');
}

// Fonction principale
async function main() {
  try {
    await checkRLSPolicies();
    proposeCorrections();
    
    console.log('\n🎉 Vérification RLS terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  }
}

main(); 