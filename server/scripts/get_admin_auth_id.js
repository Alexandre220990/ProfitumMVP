const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getAdminAuthId() {
  try {
    console.log('🔍 Récupération de l\'ID Auth de l\'administrateur...');
    
    const adminEmail = 'grandjean.alexandre5@gmail.com';
    
    // Récupérer l'utilisateur depuis Supabase Auth
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
      return;
    }

    const adminUser = users.find(user => user.email === adminEmail);
    
    if (!adminUser) {
      console.error('❌ Utilisateur admin non trouvé dans Supabase Auth');
      return;
    }

    console.log('✅ Utilisateur admin trouvé dans Supabase Auth');
    console.log('📧 Email:', adminUser.email);
    console.log('🆔 ID Auth:', adminUser.id);
    console.log('📅 Créé le:', adminUser.created_at);

    // Insérer dans la table Admin
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .insert({
        id: adminUser.id, // Utiliser l'ID Supabase Auth
        email: adminEmail,
        name: 'Alexandre Grandjean',
        role: 'super_admin',
        created_at: new Date().toISOString(),
        last_login: null
      })
      .select()
      .single();

    if (adminError) {
      console.error('❌ Erreur lors de l\'insertion dans la table Admin:', adminError);
      return;
    }

    console.log('✅ Administrateur créé dans la table Admin');
    console.log('🆔 ID Admin:', adminData.id);
    console.log('👤 Nom:', adminData.name);
    console.log('🔑 Rôle:', adminData.role);

    // Vérifier que l'admin existe
    const { data: verifyData, error: verifyError } = await supabase
      .from('Admin')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (verifyError) {
      console.error('❌ Erreur lors de la vérification:', verifyError);
      return;
    }

    console.log('\n🎉 COMPTE ADMINISTRATEUR CRÉÉ AVEC SUCCÈS !');
    console.log('==========================================');
    console.log('📧 Email:', verifyData.email);
    console.log('🆔 ID:', verifyData.id);
    console.log('👤 Nom:', verifyData.name);
    console.log('🔑 Rôle:', verifyData.role);
    console.log('📅 Créé le:', verifyData.created_at);
    console.log('==========================================');
    console.log('\n🔗 Vous pouvez maintenant vous connecter sur: /connect-admin');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

getAdminAuthId(); 