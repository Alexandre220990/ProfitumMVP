const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    console.log('🔐 Création de l\'utilisateur administrateur...');
    
    // Données de l'admin
    const adminEmail = 'grandjean.alexandre5@gmail.com';
    const adminPassword = 'Adminprofitum';
    
    // Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Confirmer automatiquement l'email
      user_metadata: {
        role: 'admin',
        name: 'Alexandre Grandjean'
      }
    });

    if (authError) {
      console.error('❌ Erreur lors de la création de l\'utilisateur Auth:', authError);
      return;
    }

    console.log('✅ Utilisateur Supabase Auth créé avec succès');
    console.log('📧 Email:', authData.user.email);
    console.log('🆔 ID Auth:', authData.user.id);

    // Insérer dans la table Admin (sans password car géré par Supabase Auth)
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .insert({
        id: authData.user.id, // Utiliser l'ID Supabase Auth
        email: adminEmail,
        name: 'Alexandre Grandjean',
        role: 'super_admin',
        status: 'active',
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

createAdminUser(); 