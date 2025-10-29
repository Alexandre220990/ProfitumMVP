/**
 * Script pour mettre à jour le mot de passe d'un expert
 * Usage: node scripts/update-expert-password.js
 */

require('dotenv').config({ path: './server/.env' });

const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const expertEmail = 'expert@profitum.fr';
const newPassword = 'Expertprofitum';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes : SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateExpertPassword() {
  try {
    console.log('🔐 Génération du hash bcrypt pour le mot de passe...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('✅ Hash généré:', hashedPassword);
    
    console.log('\n📧 Recherche de l\'expert:', expertEmail);
    
    // Récupérer l'expert
    const { data: expert, error: expertError } = await supabase
      .from('Expert')
      .select('*')
      .eq('email', expertEmail)
      .single();
    
    if (expertError || !expert) {
      console.error('❌ Expert non trouvé:', expertError?.message);
      
      console.log('\n📝 Script SQL si vous voulez l\'exécuter manuellement :');
      console.log('```sql');
      console.log(`UPDATE "Expert"`);
      console.log(`SET password = '${hashedPassword}',`);
      console.log(`    updated_at = NOW()`);
      console.log(`WHERE email = '${expertEmail}';`);
      console.log('```\n');
      
      process.exit(1);
    }
    
    console.log('✅ Expert trouvé:', {
      id: expert.id,
      name: expert.name || `${expert.first_name} ${expert.last_name}`,
      email: expert.email,
      auth_user_id: expert.auth_user_id,
      approval_status: expert.approval_status,
      status: expert.status
    });
    
    // Mettre à jour le mot de passe dans la table Expert
    console.log('\n🔄 Mise à jour du mot de passe dans la table Expert...');
    const { error: updateError } = await supabase
      .from('Expert')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', expertEmail);
    
    if (updateError) {
      console.error('❌ Erreur mise à jour Expert:', updateError.message);
      process.exit(1);
    }
    
    console.log('✅ Mot de passe mis à jour dans la table Expert');
    
    // Mettre à jour Supabase Auth si l'expert a un auth_user_id
    if (expert.auth_user_id) {
      console.log('\n🔄 Mise à jour du mot de passe dans Supabase Auth...');
      try {
        const { error: authError } = await supabase.auth.admin.updateUserById(
          expert.auth_user_id,
          { password: newPassword }
        );
        
        if (authError) {
          console.error('⚠️ Erreur mise à jour Supabase Auth:', authError.message);
        } else {
          console.log('✅ Mot de passe mis à jour dans Supabase Auth');
        }
      } catch (authErr) {
        console.error('⚠️ Erreur Supabase Auth:', authErr.message);
      }
    } else {
      console.log('⚠️ Pas de auth_user_id - Supabase Auth non mis à jour');
    }
    
    console.log('\n✅ ✅ ✅ SUCCÈS ! ✅ ✅ ✅');
    console.log('\n📋 Résumé :');
    console.log(`   Email: ${expertEmail}`);
    console.log(`   Nouveau mot de passe: ${newPassword}`);
    console.log(`   Hash bcrypt: ${hashedPassword.substring(0, 30)}...`);
    console.log(`   Statut: ${expert.status}`);
    console.log(`   Approbation: ${expert.approval_status}`);
    
    console.log('\n🔐 L\'expert peut maintenant se connecter avec :');
    console.log(`   Email: ${expertEmail}`);
    console.log(`   Mot de passe: ${newPassword}`);
    console.log(`   URL: https://www.profitum.app/connexion-expert`);
    
  } catch (error) {
    console.error('❌ Erreur globale:', error);
    process.exit(1);
  }
}

// Exécuter le script
updateExpertPassword();

