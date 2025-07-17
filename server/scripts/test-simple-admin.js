const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSimpleAdmin() {
  try {
    console.log('🧪 TEST SIMPLE - AUTHENTIFICATION ADMIN');
    console.log('=======================================\n');

    const adminEmail = 'grandjean.alexandre5@gmail.com';
    const adminPassword = 'Adminprofitum';

    // 1. Connexion
    console.log('1️⃣ Connexion...');
    const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (signInError || !session) {
      console.error('❌ Erreur de connexion:', signInError);
      return;
    }

    console.log('✅ Connexion réussie');
    console.log('   🔑 Token:', session.access_token.substring(0, 50) + '...');

    // 2. Test direct de l'API avec curl
    console.log('\n2️⃣ Test direct de l\'API...');
    
    const { exec } = require('child_process');
    const curlCommand = `curl -X GET "http://localhost:5001/api/admin/dashboard" \
      -H "Authorization: Bearer ${session.access_token}" \
      -H "Content-Type: application/json" \
      -v`;

    exec(curlCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erreur curl:', error);
        return;
      }
      
      console.log('📊 Réponse complète:');
      console.log(stdout);
      
      if (stderr) {
        console.log('⚠️ Erreurs:');
        console.log(stderr);
      }
    });

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testSimpleAdmin(); 