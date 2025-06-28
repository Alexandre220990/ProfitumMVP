const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAuthenticatedUsers() {
  try {
    console.log('🔍 Vérification de la structure de authenticated_users...');
    
    // Essayer d'insérer dans authenticated_users pour voir si c'est une vue
    const { data, error } = await supabase
      .from('authenticated_users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erreur lors de l\'accès à authenticated_users:', error);
      
      if (error.message.includes('cannot insert into view')) {
        console.log('⚠️ authenticated_users est une VUE, pas une table');
        console.log('🔍 Vérification de la structure de la vue...');
        
        // Vérifier s'il y a une table auth.users
        console.log('\n🔍 Vérification de la table auth.users...');
        const { data: authUsers, error: authError } = await supabase
          .from('auth.users')
          .select('id, email, raw_user_meta_data')
          .limit(1);
        
        if (authError) {
          console.log('❌ Erreur lors de l\'accès à auth.users:', authError);
        } else {
          console.log('✅ Table auth.users accessible');
          console.log('📋 Exemple d\'utilisateur:', authUsers[0]);
        }
      }
    } else {
      console.log('✅ authenticated_users est accessible en lecture');
      console.log('📋 Exemple de données:', data[0]);
    }
    
    // Vérifier s'il y a une table users dans le schéma public
    console.log('\n🔍 Vérification de la table users dans le schéma public...');
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (publicError) {
      console.log('❌ Erreur lors de l\'accès à users:', publicError);
    } else {
      console.log('✅ Table users accessible');
      console.log('📋 Exemple d\'utilisateur:', publicUsers[0]);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkAuthenticatedUsers(); 