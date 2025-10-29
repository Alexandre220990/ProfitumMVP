/**
 * Script pour vérifier l'état d'un expert
 */

require('dotenv').config({ path: './server/.env' });

const { createClient } = require('@supabase/supabase-js');

const expertEmail = 'expert@profitum.fr';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExpertStatus() {
  try {
    console.log('🔍 Vérification de l\'expert:', expertEmail, '\n');
    
    // Récupérer TOUTES les colonnes de l'expert
    const { data: expert, error } = await supabase
      .from('Expert')
      .select('*')
      .eq('email', expertEmail)
      .single();
    
    if (error) {
      console.error('❌ Erreur:', error.message);
      process.exit(1);
    }
    
    if (!expert) {
      console.error('❌ Expert non trouvé');
      process.exit(1);
    }
    
    console.log('✅ Expert trouvé:\n');
    console.log('📋 Informations complètes:');
    console.log(JSON.stringify(expert, null, 2));
    
    console.log('\n🔍 Vérifications de connexion:');
    console.log('   ✓ auth_user_id:', expert.auth_user_id || '❌ MANQUANT');
    console.log('   ✓ approval_status:', expert.approval_status || '❌ MANQUANT');
    console.log('   ✓ status:', expert.status || '❌ MANQUANT');
    console.log('   ✓ is_active:', expert.is_active !== undefined ? expert.is_active : '⚠️ COLONNE N\'EXISTE PAS');
    console.log('   ✓ password:', expert.password ? '✅ Défini' : '❌ MANQUANT');
    
    console.log('\n📊 Diagnostic:');
    
    const issues = [];
    
    if (!expert.auth_user_id) {
      issues.push('❌ auth_user_id est manquant');
    }
    
    if (expert.approval_status !== 'approved') {
      issues.push(`❌ approval_status = '${expert.approval_status}' (doit être 'approved')`);
    }
    
    if (expert.status !== 'active') {
      issues.push(`❌ status = '${expert.status}' (doit être 'active')`);
    }
    
    if (expert.is_active === false) {
      issues.push('❌ is_active = false (doit être true ou NULL)');
    }
    
    if (!expert.password) {
      issues.push('❌ password est manquant');
    }
    
    if (issues.length === 0) {
      console.log('✅ ✅ ✅ TOUT EST BON ! L\'expert devrait pouvoir se connecter.');
      console.log('\n🔐 Identifiants:');
      console.log('   Email: expert@profitum.fr');
      console.log('   Mot de passe: Expertprofitum');
    } else {
      console.log('⚠️ Problèmes détectés:');
      issues.forEach(issue => console.log('   ' + issue));
      
      console.log('\n🔧 Actions correctives nécessaires:');
      
      if (!expert.auth_user_id) {
        console.log('   1. Exécutez: node scripts/create-expert-auth.js');
      }
      
      if (expert.approval_status !== 'approved' || expert.status !== 'active') {
        console.log('   2. Mettez à jour le statut:');
        console.log(`      UPDATE "Expert" SET approval_status = 'approved', status = 'active' WHERE email = '${expertEmail}';`);
      }
      
      if (expert.is_active === false) {
        console.log('   3. Activez is_active:');
        console.log(`      UPDATE "Expert" SET is_active = true WHERE email = '${expertEmail}';`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkExpertStatus();

