const { createClient } = require('@supabase/supabase-js');

// Variables d'environnement Supabase du projet (vraies valeurs)
const SUPABASE_URL = 'https://gvvlsgtubqfxdztldunj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc2OTg0OSwiZXhwIjoyMDU3MzQ1ODQ5fQ.pN73GQUJHmd099PUcxAVGm-TFTe3KHeBemBk9IlGAcg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixExpertAuthPassword() {
  console.log('🔍 Recherche de l\'expert dans Supabase Auth...');
  
  const email = 'alexandre@profitum.fr';
  const password = 'Expertprofitum';
  
  try {
    // 1. Vérifier si l'utilisateur existe dans Supabase Auth
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erreur lors de la liste des utilisateurs:', listError.message);
      return;
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error('❌ Utilisateur non trouvé dans Supabase Auth:', email);
      console.log('📋 Création de l\'utilisateur dans Supabase Auth...');
      
      // Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          type: 'expert',
          username: 'alexandre',
          company_name: 'Profitum Expert'
        }
      });

      if (createError) {
        console.error('❌ Erreur lors de la création:', createError.message);
        return;
      }

      console.log('✅ Utilisateur créé dans Supabase Auth:', authData.user.id);
      
      // Mettre à jour l'auth_id dans la table Expert
      const { error: updateError } = await supabase
        .from('Expert')
        .update({ auth_id: authData.user.id })
        .eq('email', email);

      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour de auth_id:', updateError.message);
      } else {
        console.log('✅ auth_id mis à jour dans la table Expert');
      }

    } else {
      console.log('✅ Utilisateur trouvé dans Supabase Auth:', user.id);
      console.log('📧 Email:', user.email);
      console.log('🔧 Type:', user.user_metadata?.type);
      
      // Mettre à jour le mot de passe dans Supabase Auth
      console.log('🔐 Mise à jour du mot de passe dans Supabase Auth...');
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        {
          password: password,
          user_metadata: {
            type: 'expert',
            username: 'alexandre',
            company_name: 'Profitum Expert'
          }
        }
      );

      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour du mot de passe:', updateError.message);
        return;
      }

      console.log('✅ Mot de passe mis à jour dans Supabase Auth');
    }

    // 2. Tester la connexion
    console.log('🧪 Test de connexion avec les nouveaux identifiants...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (authError) {
      console.error('❌ Erreur lors du test de connexion:', authError.message);
      return;
    }

    console.log('✅ Test de connexion réussi!');
    console.log('👤 Utilisateur connecté:', {
      id: authData.user.id,
      email: authData.user.email,
      type: authData.user.user_metadata?.type
    });

    // 3. Vérifier la table Expert
    console.log('🔍 Vérification de la table Expert...');
    const { data: expert, error: expertError } = await supabase
      .from('Expert')
      .select('*')
      .eq('email', email)
      .single();

    if (expertError) {
      console.error('❌ Erreur lors de la vérification de la table Expert:', expertError.message);
    } else {
      console.log('✅ Expert trouvé dans la table Expert:', {
        id: expert.id,
        email: expert.email,
        status: expert.status,
        approval_status: expert.approval_status,
        auth_id: expert.auth_id
      });
    }

    // Se déconnecter
    await supabase.auth.signOut();
    console.log('🔓 Déconnexion effectuée');

    console.log('\n🎉 Processus terminé avec succès!');
    console.log('📧 Email:', email);
    console.log('🔑 Mot de passe:', password);
    console.log('💡 L\'expert peut maintenant se connecter via l\'interface web');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

fixExpertAuthPassword(); 