/**
 * Script pour appliquer le fix RLS sur la table Expert
 */

require('dotenv').config({ path: './server/.env' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLSFix() {
  try {
    console.log('🔧 Application du fix RLS sur la table Expert\n');
    
    // Lire le fichier SQL
    const sqlFile = path.join(__dirname, '../sql/fix-expert-rls-policies.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📄 Script SQL chargé\n');
    
    // Exécuter chaque commande SQL séparément
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--') && !cmd.startsWith('SELECT'));
    
    console.log(`📋 ${commands.length} commande(s) SQL à exécuter\n`);
    
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      if (!cmd) continue;
      
      console.log(`${i + 1}. Exécution...`);
      const cmdPreview = cmd.substring(0, 60).replace(/\n/g, ' ') + '...';
      console.log(`   ${cmdPreview}`);
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: cmd });
      
      if (error) {
        console.log(`   ⚠️ Erreur (peut être normal si politique n'existe pas):`, error.message);
      } else {
        console.log(`   ✅ OK`);
      }
    }
    
    console.log('\n✅ Fix RLS appliqué !');
    console.log('\n🧪 Test de validation...\n');
    
    // Test de validation
    const testAuth = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    const { data: authData } = await testAuth.auth.signInWithPassword({
      email: 'expert@profitum.fr',
      password: 'Expertprofitum'
    });
    
    if (authData?.user) {
      const { data: expertTest } = await testAuth
        .from('Expert')
        .select('*')
        .eq('email', 'expert@profitum.fr')
        .maybeSingle();
      
      if (expertTest) {
        console.log('✅ ✅ ✅ SUCCÈS ! Expert trouvé avec session !');
        console.log('\n🎉 L\'expert peut maintenant se connecter :');
        console.log('   Email: expert@profitum.fr');
        console.log('   Mot de passe: Expertprofitum');
      } else {
        console.log('❌ Expert toujours pas trouvé avec session');
        console.log('\n⚠️ Il faut exécuter le SQL manuellement dans Supabase Dashboard');
      }
      
      await testAuth.auth.signOut();
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n⚠️ Le script rpc("exec_sql") n\'existe peut-être pas.');
    console.log('📝 Exécutez manuellement le SQL dans Supabase Dashboard → SQL Editor');
  }
}

applyRLSFix();

