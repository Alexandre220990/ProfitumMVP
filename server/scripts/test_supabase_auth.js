require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.log('SUPABASE_URL:', supabaseUrl ? '✅ Défini' : '❌ Manquant');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ Défini' : '❌ Manquant');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  try {
    console.log('🔄 Test de connexion à Supabase...');
    
    // Test de la connexion de base
    const { data: testData, error: testError } = await supabase
      .from('Client')
      .select('count')
      .limit(1);
    
    if (testError) throw testError;
    console.log('✅ Connexion à Supabase réussie');

    // Test de l'authentification
    console.log('🔄 Test de l\'authentification...');
    const testUser = {
      email: 'test@example.com',
      password: 'Test123!',
      user_metadata: {
        username: 'testuser',
        type: 'client'
      }
    };

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
      user_metadata: testUser.user_metadata
    });

    if (authError) {
      console.error('❌ Erreur lors de la création d\'un utilisateur test:', authError.message);
      console.log('Code d\'erreur:', authError.code);
      console.log('Détails:', authError.details);
      return;
    }

    console.log('✅ Création d\'utilisateur test réussie');
    console.log('ID utilisateur:', authData.user.id);

    // Nettoyage - Suppression de l'utilisateur test
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id);
    if (deleteError) {
      console.error('⚠️ Erreur lors de la suppression de l\'utilisateur test:', deleteError.message);
    } else {
      console.log('✅ Nettoyage réussi - Utilisateur test supprimé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('Code d\'erreur:', error.code);
    console.log('Détails:', error.details);
  }
}

testSupabaseConnection(); 