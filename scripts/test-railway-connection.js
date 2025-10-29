/**
 * Script pour tester la connexion exactement comme Railway
 */

require('dotenv').config({ path: './server/.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Configuration Railway:');
console.log('SUPABASE_URL:', supabaseUrl);
console.log('SERVICE_KEY présent:', !!supabaseServiceKey);
console.log('SERVICE_KEY premiers chars:', supabaseServiceKey?.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRailwayQuery() {
  try {
    const authUserId = '2678526c-488f-45a1-818a-f9ce48882d26';
    const email = 'expert@profitum.fr';
    
    console.log('\n🔍 Test 1: Requête OR exacte (comme dans findUserProfiles)');
    const { data: expert1, error: error1 } = await supabase
      .from('Expert')
      .select('*')
      .or(`auth_user_id.eq.${authUserId},email.eq.${email}`)
      .maybeSingle();
    
    console.log('Résultat:', {
      found: !!expert1,
      error: error1?.message,
      hint: error1?.hint
    });
    
    if (expert1) {
      console.log('✅ Expert trouvé:', {
        id: expert1.id,
        email: expert1.email,
        status: expert1.status,
        approval_status: expert1.approval_status,
        is_active: expert1.is_active
      });
    }
    
    console.log('\n🔍 Test 2: Authentification Supabase Auth');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'expert@profitum.fr',
      password: 'Expertprofitum'
    });
    
    if (authError) {
      console.log('❌ Erreur auth:', authError.message);
    } else {
      console.log('✅ Auth réussie:', {
        userId: authData.user.id,
        email: authData.user.email
      });
      
      // Test 3: Rechercher avec l'ID retourné par l'auth
      console.log('\n🔍 Test 3: Recherche avec l\'ID de l\'auth');
      console.log('ID à chercher:', authData.user.id);
      console.log('Email à chercher:', authData.user.email);
      
      const { data: expert2, error: error2 } = await supabase
        .from('Expert')
        .select('*')
        .or(`auth_user_id.eq.${authData.user.id},email.eq.${authData.user.email}`)
        .maybeSingle();
      
      console.log('Résultat:', {
        found: !!expert2,
        error: error2?.message,
        data: expert2 ? { id: expert2.id, email: expert2.email } : null
      });
      
      // Test 4 : Logout puis réessayer
      await supabase.auth.signOut();
      console.log('\n🔍 Test 4: Après logout, recherche à nouveau');
      const { data: expert3, error: error3 } = await supabase
        .from('Expert')
        .select('*')
        .or(`auth_user_id.eq.${authData.user.id},email.eq.${authData.user.email}`)
        .maybeSingle();
      
      console.log('Résultat après logout:', {
        found: !!expert3,
        error: error3?.message
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testRailwayQuery();

