/**
 * Script pour tester la requête expert exactement comme dans auth.ts
 */

require('dotenv').config({ path: './server/.env' });

const { createClient } = require('@supabase/supabase-js');

const expertEmail = 'expert@profitum.fr';
const authUserId = '2678526c-488f-45a1-818a-f9ce48882d26';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testQuery() {
  try {
    console.log('🔍 Test de la requête Expert\n');
    console.log('Paramètres:');
    console.log('  authUserId:', authUserId);
    console.log('  email:', expertEmail);
    
    // Test 1: Requête exacte du code
    console.log('\n📋 Test 1: Requête OR exacte du code');
    const { data: expert1, error: error1 } = await supabase
      .from('Expert')
      .select('*')
      .or(`auth_user_id.eq.${authUserId},email.eq.${expertEmail}`)
      .maybeSingle();
    
    console.log('Résultat:', {
      found: !!expert1,
      error: error1?.message,
      data: expert1 ? {
        id: expert1.id,
        email: expert1.email,
        auth_user_id: expert1.auth_user_id,
        is_active: expert1.is_active,
        status: expert1.status,
        approval_status: expert1.approval_status
      } : null
    });
    
    // Test 2: Par auth_user_id uniquement
    console.log('\n📋 Test 2: Par auth_user_id uniquement');
    const { data: expert2, error: error2 } = await supabase
      .from('Expert')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();
    
    console.log('Résultat:', {
      found: !!expert2,
      error: error2?.message
    });
    
    // Test 3: Par email uniquement
    console.log('\n📋 Test 3: Par email uniquement');
    const { data: expert3, error: error3 } = await supabase
      .from('Expert')
      .select('*')
      .eq('email', expertEmail)
      .maybeSingle();
    
    console.log('Résultat:', {
      found: !!expert3,
      error: error3?.message
    });
    
    // Test 4: Vérifier les conditions de filtrage
    if (expert1) {
      console.log('\n🔍 Test des conditions de filtrage:');
      console.log('  is_active !== false:', expert1.is_active !== false);
      console.log('  approval_status === "approved":', expert1.approval_status === 'approved');
      console.log('  Passe tous les filtres:', expert1.is_active !== false && expert1.approval_status === 'approved');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testQuery();

