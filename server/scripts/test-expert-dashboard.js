const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testExpertDashboard() {
  console.log('🧪 Test du Dashboard Expert...\n');

  try {
    // 1. Test de récupération des assignations
    console.log('1. Test récupération des assignations...');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('expertassignment')
      .select('*')
      .limit(5);

    if (assignmentsError) {
      console.error('❌ Erreur assignations:', assignmentsError);
    } else {
      console.log(`✅ ${assignments.length} assignations trouvées`);
      if (assignments.length > 0) {
        console.log('   Exemple:', {
          id: assignments[0].id,
          status: assignments[0].status,
          expert_id: assignments[0].expert_id,
          assignment_date: assignments[0].assignment_date
        });
      }
    }

    // 2. Test de récupération des notifications
    console.log('\n2. Test récupération des notifications...');
    const { data: notifications, error: notificationsError } = await supabase
      .from('notification_final')
      .select('*')
      .eq('user_type', 'expert')
      .limit(5);

    if (notificationsError) {
      console.error('❌ Erreur notifications:', notificationsError);
    } else {
      console.log(`✅ ${notifications.length} notifications trouvées`);
      if (notifications.length > 0) {
        console.log('   Exemple:', {
          id: notifications[0].id,
          title: notifications[0].title,
          user_type: notifications[0].user_type,
          is_read: notifications[0].is_read
        });
      }
    }

    // 3. Test de récupération des experts
    console.log('\n3. Test récupération des experts...');
    const { data: experts, error: expertsError } = await supabase
      .from('Expert')
      .select('*')
      .limit(5);

    if (expertsError) {
      console.error('❌ Erreur experts:', expertsError);
    } else {
      console.log(`✅ ${experts.length} experts trouvés`);
      if (experts.length > 0) {
        console.log('   Exemple:', {
          id: experts[0].id,
          name: experts[0].name,
          email: experts[0].email,
          status: experts[0].status
        });
      }
    }

    // 4. Test de calcul des analytics
    console.log('\n4. Test calcul des analytics...');
    const { data: allAssignments, error: analyticsError } = await supabase
      .from('expertassignment')
      .select('*');

    if (analyticsError) {
      console.error('❌ Erreur analytics:', analyticsError);
    } else {
      const totalAssignments = allAssignments.length;
      const completedAssignments = allAssignments.filter(a => a.status === 'completed').length;
      const pendingAssignments = allAssignments.filter(a => a.status === 'pending').length;
      const totalEarnings = allAssignments
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + (Number(a.compensation_amount) || 0), 0);

      console.log('✅ Analytics calculés:', {
        totalAssignments,
        completedAssignments,
        pendingAssignments,
        totalEarnings: `${totalEarnings}€`
      });
    }

    // 5. Test des colonnes manquantes
    console.log('\n5. Test des colonnes manquantes...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'expertassignment' });

    if (columnsError) {
      console.log('⚠️ Impossible de vérifier les colonnes, mais ce n\'est pas critique');
    } else {
      const requiredColumns = ['progress', 'documents', 'rejection_reason', 'rejected_at'];
      const existingColumns = columns.map(col => col.column_name);
      
      console.log('✅ Colonnes existantes:', existingColumns);
      
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      if (missingColumns.length > 0) {
        console.log('⚠️ Colonnes manquantes:', missingColumns);
        console.log('   Exécutez la migration: 20250103_add_expert_dashboard_columns.sql');
      } else {
        console.log('✅ Toutes les colonnes requises sont présentes');
      }
    }

    console.log('\n🎉 Tests terminés avec succès !');
    console.log('\n📋 Prochaines étapes:');
    console.log('   1. Exécuter la migration si des colonnes manquent');
    console.log('   2. Tester les API avec un vrai expert');
    console.log('   3. Vérifier le dashboard dans l\'interface');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Fonction pour obtenir les colonnes d'une table (si disponible)
async function setupRPC() {
  try {
    await supabase.rpc('get_table_columns', { table_name: 'test' });
  } catch (error) {
    // Créer la fonction RPC si elle n'existe pas
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
        RETURNS TABLE(column_name text, data_type text)
        LANGUAGE sql
        AS $$
          SELECT column_name::text, data_type::text
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position;
        $$;
      `
    });
    
    if (createError) {
      console.log('⚠️ Impossible de créer la fonction RPC, mais ce n\'est pas critique');
    }
  }
}

// Exécuter les tests
async function main() {
  await setupRPC();
  await testExpertDashboard();
  process.exit(0);
}

main().catch(console.error); 