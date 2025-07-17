const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugAdminTable() {
  try {
    console.log('🔍 DÉBOGAGE TABLE ADMIN');
    console.log('========================\n');

    const adminEmail = 'grandjean.alexandre5@gmail.com';
    const adminId = '61797a61-edde-4816-b818-00015b627fe1';

    // 1. Vérifier la structure de la table Admin
    console.log('1️⃣ Structure de la table Admin...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'Admin' });

    if (columnsError) {
      console.log('⚠️ Impossible de récupérer la structure:', columnsError);
    } else {
      console.log('✅ Structure de la table Admin:');
      console.log(columns);
    }

    // 2. Lister tous les admins
    console.log('\n2️⃣ Liste de tous les admins...');
    const { data: allAdmins, error: allAdminsError } = await supabase
      .from('Admin')
      .select('*');

    if (allAdminsError) {
      console.error('❌ Erreur récupération admins:', allAdminsError);
    } else {
      console.log('✅ Admins trouvés:', allAdmins.length);
      allAdmins.forEach(admin => {
        console.log(`   👤 ${admin.name} (${admin.email}) - ID: ${admin.id} - Rôle: ${admin.role}`);
      });
    }

    // 3. Rechercher par email
    console.log('\n3️⃣ Recherche par email...');
    const { data: adminByEmail, error: emailError } = await supabase
      .from('Admin')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (emailError) {
      console.error('❌ Erreur recherche par email:', emailError);
    } else {
      console.log('✅ Admin trouvé par email:');
      console.log('   🆔 ID:', adminByEmail.id);
      console.log('   📧 Email:', adminByEmail.email);
      console.log('   👤 Nom:', adminByEmail.name);
      console.log('   🔑 Rôle:', adminByEmail.role);
    }

    // 4. Rechercher par ID
    console.log('\n4️⃣ Recherche par ID...');
    const { data: adminById, error: idError } = await supabase
      .from('Admin')
      .select('*')
      .eq('id', adminId)
      .single();

    if (idError) {
      console.error('❌ Erreur recherche par ID:', idError);
    } else {
      console.log('✅ Admin trouvé par ID:');
      console.log('   🆔 ID:', adminById.id);
      console.log('   📧 Email:', adminById.email);
      console.log('   👤 Nom:', adminById.name);
      console.log('   🔑 Rôle:', adminById.role);
    }

    // 5. Test de la requête exacte du middleware
    console.log('\n5️⃣ Test de la requête du middleware requireAdmin...');
    
    // Simuler exactement ce que fait le middleware
    const { data: middlewareTest, error: middlewareError } = await supabase
      .from('Admin')
      .select('*')
      .eq('id', adminId)
      .single();

    if (middlewareError) {
      console.error('❌ Erreur middleware:', middlewareError);
      console.error('   Code:', middlewareError.code);
      console.error('   Message:', middlewareError.message);
      console.error('   Details:', middlewareError.details);
    } else {
      console.log('✅ Requête middleware réussie:');
      console.log('   🆔 ID:', middlewareTest.id);
      console.log('   📧 Email:', middlewareTest.email);
      console.log('   👤 Nom:', middlewareTest.name);
      console.log('   🔑 Rôle:', middlewareTest.role);
    }

    // 6. Vérifier les politiques RLS
    console.log('\n6️⃣ Vérification des politiques RLS...');
    
    // Désactiver temporairement RLS pour tester
    const { error: disableRlsError } = await supabase
      .rpc('exec_sql', { sql: 'ALTER TABLE "Admin" DISABLE ROW LEVEL SECURITY;' });

    if (disableRlsError) {
      console.log('⚠️ Impossible de désactiver RLS:', disableRlsError);
    } else {
      console.log('✅ RLS désactivé temporairement');
      
      // Retester la requête
      const { data: testWithoutRls, error: testError } = await supabase
        .from('Admin')
        .select('*')
        .eq('id', adminId)
        .single();

      if (testError) {
        console.error('❌ Erreur même sans RLS:', testError);
      } else {
        console.log('✅ Requête réussie sans RLS');
      }
      
      // Réactiver RLS
      await supabase.rpc('exec_sql', { sql: 'ALTER TABLE "Admin" ENABLE ROW LEVEL SECURITY;' });
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

debugAdminTable(); 