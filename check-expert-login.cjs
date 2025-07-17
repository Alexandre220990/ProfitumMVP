const { createClient } = require('@supabase/supabase-js');

// Variables d'environnement Supabase du projet (vraies valeurs)
const SUPABASE_URL = 'https://gvvlsgtubqfxdztldunj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2a3ZrcGZ0YWt5dHhwc2Jra2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk0MDc0NjEsImV4cCI6MjAyNDk4MzQ2MX0.ckc2_CK5yDRBG5Z5yxYJgXGzGJGpMf-dHDMHk-8GHxs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkExpertLogin() {
  console.log('🔍 Vérification de la connexion expert...');
  console.log('🔑 URL Supabase:', SUPABASE_URL);
  console.log('🔑 Clé utilisée:', SUPABASE_ANON_KEY.substring(0, 50) + '...');
  
  const email = 'alexandre@profitum.fr';
  const password = 'Expertprofitum';
  
  try {
    console.log(`📧 Tentative de connexion avec: ${email}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.error('❌ Erreur de connexion:', error.message);
      console.error('❌ Code d\'erreur:', error.status);
      return;
    }

    if (!data.user) {
      console.error('❌ Aucun utilisateur trouvé');
      return;
    }

    console.log('✅ Connexion réussie!');
    console.log('👤 Utilisateur:', {
      id: data.user.id,
      email: data.user.email,
      type: data.user.user_metadata?.type,
      username: data.user.user_metadata?.username,
      company_name: data.user.user_metadata?.company_name
    });

    // Vérifier si l'utilisateur existe dans la table expert
    const { data: expertData, error: expertError } = await supabase
      .from('expert')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (expertError) {
      console.error('❌ Erreur lors de la vérification de la table expert:', expertError.message);
    } else if (expertData) {
      console.log('✅ Expert trouvé dans la table expert:', {
        id: expertData.id,
        nom: expertData.nom,
        prenom: expertData.prenom,
        email: expertData.email,
        statut: expertData.statut
      });
    } else {
      console.log('⚠️  Expert non trouvé dans la table expert');
    }

    // Se déconnecter
    await supabase.auth.signOut();
    console.log('🔓 Déconnexion effectuée');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkExpertLogin(); 