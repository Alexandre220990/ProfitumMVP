const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

// Variables d'environnement Supabase du projet (vraies valeurs)
const SUPABASE_URL = 'https://gvvlsgtubqfxdztldunj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc2OTg0OSwiZXhwIjoyMDU3MzQ1ODQ5fQ.pN73GQUJHmd099PUcxAVGm-TFTe3KHeBemBk9IlGAcg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function hashAndUpdateExpertPassword() {
  console.log('🔍 Recherche de l\'expert alexandre@profitum.fr...');
  
  const email = 'alexandre@profitum.fr';
  const password = 'Expertprofitum';
  
  try {
    // 1. Vérifier si l'expert existe
    const { data: expert, error: expertError } = await supabase
      .from('Expert')
      .select('*')
      .eq('email', email)
      .single();

    if (expertError) {
      console.error('❌ Erreur lors de la recherche de l\'expert:', expertError.message);
      return;
    }

    if (!expert) {
      console.error('❌ Expert non trouvé avec l\'email:', email);
      return;
    }

    console.log('✅ Expert trouvé:', {
      id: expert.id,
      email: expert.email,
      name: expert.name,
      status: expert.status,
      approval_status: expert.approval_status
    });

    // 2. Hasher le mot de passe avec bcrypt (salt rounds = 10)
    console.log('🔐 Hachage du mot de passe...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Mot de passe hashé avec succès');

    // 3. Mettre à jour le mot de passe dans la table Expert
    console.log('📝 Mise à jour du mot de passe dans la table Expert...');
    const { data: updatedExpert, error: updateError } = await supabase
      .from('Expert')
      .update({ 
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour:', updateError.message);
      return;
    }

    console.log('✅ Mot de passe mis à jour avec succès dans la table Expert');

    // 4. Vérifier que la mise à jour a fonctionné
    console.log('🔍 Vérification de la mise à jour...');
    const { data: verifyExpert, error: verifyError } = await supabase
      .from('Expert')
      .select('id, email, password')
      .eq('email', email)
      .single();

    if (verifyError) {
      console.error('❌ Erreur lors de la vérification:', verifyError.message);
      return;
    }

    if (verifyExpert.password && verifyExpert.password.length > 0) {
      console.log('✅ Vérification réussie: le mot de passe est maintenant présent');
      console.log('🔑 Longueur du hash:', verifyExpert.password.length, 'caractères');
    } else {
      console.error('❌ Le mot de passe n\'a pas été mis à jour correctement');
    }

    // 5. Tester la connexion avec le nouveau mot de passe
    console.log('🧪 Test de connexion avec le nouveau mot de passe...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (authError) {
      console.error('❌ Erreur lors du test de connexion:', authError.message);
      console.log('💡 Note: Cette erreur peut être normale si l\'utilisateur n\'existe pas dans Supabase Auth');
    } else {
      console.log('✅ Test de connexion réussi!');
      console.log('👤 Utilisateur connecté:', {
        id: authData.user.id,
        email: authData.user.email,
        type: authData.user.user_metadata?.type
      });
      
      // Se déconnecter
      await supabase.auth.signOut();
      console.log('🔓 Déconnexion effectuée');
    }

    console.log('\n🎉 Processus terminé avec succès!');
    console.log('📧 Email:', email);
    console.log('🔑 Mot de passe:', password);
    console.log('💡 L\'expert peut maintenant se connecter avec ces identifiants');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

hashAndUpdateExpertPassword(); 