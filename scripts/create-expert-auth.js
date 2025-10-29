/**
 * Script pour créer un compte Supabase Auth pour un expert existant
 * Usage: node scripts/create-expert-auth.js
 */

require('dotenv').config({ path: './server/.env' });

const { createClient } = require('@supabase/supabase-js');

// Configuration
const expertEmail = 'expert@profitum.fr';
const password = 'Expertprofitum';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createExpertAuth() {
  try {
    console.log('📧 Recherche de l\'expert:', expertEmail);
    
    // Récupérer l'expert
    const { data: expert, error: expertError } = await supabase
      .from('Expert')
      .select('*')
      .eq('email', expertEmail)
      .single();
    
    if (expertError || !expert) {
      console.error('❌ Expert non trouvé:', expertError?.message);
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

    // Vérifier si un auth_user_id existe déjà
    if (expert.auth_user_id) {
      console.log('⚠️ L\'expert a déjà un auth_user_id:', expert.auth_user_id);
      console.log('🔍 Vérification du compte Supabase Auth...');
      
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(expert.auth_user_id);
        if (authUser) {
          console.log('✅ Compte Supabase Auth existe déjà');
          console.log('🔄 Mise à jour du mot de passe...');
          
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            expert.auth_user_id,
            { password: password }
          );
          
          if (updateError) {
            console.error('❌ Erreur mise à jour mot de passe:', updateError.message);
          } else {
            console.log('✅ Mot de passe mis à jour dans Supabase Auth');
          }
          
          console.log('\n✅ ✅ ✅ TERMINÉ ! ✅ ✅ ✅');
          console.log('\n🔐 L\'expert peut se connecter avec :');
          console.log(`   Email: ${expertEmail}`);
          console.log(`   Mot de passe: ${password}`);
          return;
        }
      } catch (err) {
        console.log('⚠️ Compte Auth inexistant, création en cours...');
      }
    }

    // Créer le compte Supabase Auth
    console.log('\n🔄 Création du compte Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: expertEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        type: 'expert',
        name: expert.name || `${expert.first_name} ${expert.last_name}`,
        first_name: expert.first_name,
        last_name: expert.last_name,
        company_name: expert.company_name
      }
    });

    if (authError) {
      console.error('❌ Erreur création compte Auth:', authError.message);
      process.exit(1);
    }

    console.log('✅ Compte Supabase Auth créé:', authData.user.id);

    // Mettre à jour l'expert avec l'auth_user_id
    console.log('\n🔄 Mise à jour de l\'expert avec auth_user_id...');
    const { error: updateError } = await supabase
      .from('Expert')
      .update({
        auth_user_id: authData.user.id,
        id: authData.user.id, // Utiliser l'ID Auth comme ID principal
        updated_at: new Date().toISOString()
      })
      .eq('email', expertEmail);

    if (updateError) {
      console.error('❌ Erreur mise à jour Expert:', updateError.message);
      console.log('⚠️ Le compte Auth est créé mais pas lié à l\'expert');
      console.log('🔧 Vous devrez lier manuellement avec cette requête SQL:');
      console.log(`UPDATE "Expert" SET auth_user_id = '${authData.user.id}', id = '${authData.user.id}' WHERE email = '${expertEmail}';`);
    } else {
      console.log('✅ Expert mis à jour avec auth_user_id');
    }

    console.log('\n✅ ✅ ✅ SUCCÈS ! ✅ ✅ ✅');
    console.log('\n📋 Résumé :');
    console.log(`   Email: ${expertEmail}`);
    console.log(`   Mot de passe: ${password}`);
    console.log(`   Auth User ID: ${authData.user.id}`);
    console.log(`   Statut: ${expert.status}`);
    console.log(`   Approbation: ${expert.approval_status}`);
    
    console.log('\n🔐 L\'expert peut maintenant se connecter avec :');
    console.log(`   Email: ${expertEmail}`);
    console.log(`   Mot de passe: ${password}`);
    console.log(`   URL: https://www.profitum.app/connexion-expert`);
    
  } catch (error) {
    console.error('❌ Erreur globale:', error);
    process.exit(1);
  }
}

// Exécuter le script
createExpertAuth();

