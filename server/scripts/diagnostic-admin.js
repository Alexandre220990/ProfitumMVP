const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnosticAdmin() {
  try {
    console.log('🔍 DIAGNOSTIC COMPLET - AUTHENTIFICATION ADMIN');
    console.log('==============================================\n');

    const adminEmail = 'grandjean.alexandre5@gmail.com';
    
    // 1. Vérifier l'utilisateur dans Supabase Auth
    console.log('1️⃣ Vérification Supabase Auth...');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erreur Supabase Auth:', authError);
      return;
    }

    const adminUser = users.find(user => user.email === adminEmail);
    
    if (!adminUser) {
      console.log('❌ Utilisateur non trouvé dans Supabase Auth');
      console.log('📧 Email recherché:', adminEmail);
      console.log('👥 Utilisateurs disponibles:', users.map(u => u.email));
      return;
    }

    console.log('✅ Utilisateur trouvé dans Supabase Auth');
    console.log('   📧 Email:', adminUser.email);
    console.log('   🆔 ID Auth:', adminUser.id);
    console.log('   📅 Créé le:', adminUser.created_at);
    console.log('   🔑 Métadonnées:', JSON.stringify(adminUser.user_metadata, null, 2));
    console.log('   🏷️ Rôle:', adminUser.user_metadata?.role);
    console.log('   📝 Type:', adminUser.user_metadata?.type);

    // 2. Vérifier l'utilisateur dans la table Admin
    console.log('\n2️⃣ Vérification table Admin...');
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (adminError) {
      console.log('❌ Erreur table Admin:', adminError);
      
      // Vérifier si la table Admin existe
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'Admin');

      if (tablesError) {
        console.log('❌ Erreur vérification table Admin:', tablesError);
      } else if (tables.length === 0) {
        console.log('❌ Table Admin n\'existe pas');
      } else {
        console.log('✅ Table Admin existe');
      }
    } else {
      console.log('✅ Utilisateur trouvé dans table Admin');
      console.log('   🆔 ID Admin:', adminData.id);
      console.log('   📧 Email:', adminData.email);
      console.log('   👤 Nom:', adminData.name);
      console.log('   🔑 Rôle:', adminData.role);
      console.log('   📅 Créé le:', adminData.created_at);
    }

    // 3. Vérifier la correspondance des IDs
    if (adminUser && adminData) {
      console.log('\n3️⃣ Vérification correspondance des IDs...');
      if (adminUser.id === adminData.id) {
        console.log('✅ IDs correspondent parfaitement');
      } else {
        console.log('❌ IDs ne correspondent pas');
        console.log('   🆔 ID Auth:', adminUser.id);
        console.log('   🆔 ID Admin:', adminData.id);
      }
    }

    // 4. Tester l'authentification avec le token
    console.log('\n4️⃣ Test d\'authentification...');
    
    // Créer un token de test
    const { data: { session }, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: adminEmail,
    });

    if (sessionError) {
      console.log('❌ Erreur génération session:', sessionError);
    } else {
      console.log('✅ Session générée');
      console.log('   🔗 URL:', session?.action_link);
    }

    // 5. Vérifier les politiques RLS
    console.log('\n5️⃣ Vérification politiques RLS...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'Admin' });

    if (policiesError) {
      console.log('⚠️ Impossible de vérifier les politiques RLS:', policiesError);
    } else {
      console.log('✅ Politiques RLS Admin:', policies);
    }

    // 6. Recommandations
    console.log('\n6️⃣ RECOMMANDATIONS');
    console.log('==================');
    
    if (!adminData) {
      console.log('🔧 ACTION REQUISE: Créer l\'utilisateur dans la table Admin');
      console.log('   Commande: node scripts/create_admin_user.js');
    }
    
    if (adminUser && adminData && adminUser.id !== adminData.id) {
      console.log('🔧 ACTION REQUISE: Corriger la correspondance des IDs');
      console.log('   Mettre à jour la table Admin avec l\'ID Auth correct');
    }
    
    if (!adminUser.user_metadata?.role || adminUser.user_metadata.role !== 'admin') {
      console.log('🔧 ACTION REQUISE: Mettre à jour les métadonnées utilisateur');
      console.log('   Ajouter role: "admin" dans user_metadata');
    }

    console.log('\n🎯 PLAN D\'ACTION CONCRET');
    console.log('========================');
    console.log('1. Exécuter: node scripts/create_admin_user.js');
    console.log('2. Vérifier les métadonnées utilisateur');
    console.log('3. Tester la connexion admin');
    console.log('4. Vérifier les logs d\'accès');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

diagnosticAdmin(); 