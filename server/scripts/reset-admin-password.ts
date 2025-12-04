import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const NEW_PASSWORD = 'Profitum2025!'; // Nouveau mot de passe sécurisé

// Interface pour readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function resetAdminPassword() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  RÉINITIALISATION DU MOT DE PASSE ADMINISTRATEUR        ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  // Demander l'email de l'admin
  const email = await question('📧 Email de l\'administrateur : ');
  
  if (!email || !email.includes('@')) {
    console.error('❌ Email invalide');
    rl.close();
    process.exit(1);
  }
  
  console.log('\n🔍 Recherche de l\'administrateur...');
  
  // 1. Vérifier que l'admin existe dans la table Admin
  const { data: admin, error: adminError } = await supabaseAdmin
    .from('Admin')
    .select('id, email, name, auth_user_id, is_active')
    .eq('email', email)
    .maybeSingle();
  
  if (adminError) {
    console.error('❌ Erreur lors de la recherche:', adminError.message);
    rl.close();
    process.exit(1);
  }
  
  if (!admin) {
    console.error('❌ Aucun administrateur trouvé avec cet email:', email);
    rl.close();
    process.exit(1);
  }
  
  console.log('✅ Administrateur trouvé:');
  console.log(`   - Nom: ${admin.name}`);
  console.log(`   - Email: ${admin.email}`);
  console.log(`   - ID: ${admin.id}`);
  console.log(`   - Auth User ID: ${admin.auth_user_id || 'NON DÉFINI'}`);
  console.log(`   - Actif: ${admin.is_active ? 'OUI' : 'NON'}`);
  
  if (!admin.is_active) {
    console.error('\n❌ Ce compte administrateur est désactivé.');
    console.log('   Contactez un super administrateur pour le réactiver.');
    rl.close();
    process.exit(1);
  }
  
  // 2. Vérifier/créer le compte Auth
  let authUserId = admin.auth_user_id;
  
  if (!authUserId) {
    console.log('\n⚠️  Aucun compte Auth lié. Création en cours...');
    
    // Créer le compte Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: admin.email,
      password: NEW_PASSWORD,
      email_confirm: true,
      user_metadata: {
        type: 'admin',
        database_id: admin.id,
        email: admin.email,
        name: admin.name
      }
    });
    
    if (authError || !authData.user) {
      console.error('❌ Erreur création compte Auth:', authError?.message);
      rl.close();
      process.exit(1);
    }
    
    authUserId = authData.user.id;
    console.log('✅ Compte Auth créé:', authUserId);
    
    // Mettre à jour la table Admin
    await supabaseAdmin
      .from('Admin')
      .update({ auth_user_id: authUserId })
      .eq('id', admin.id);
    
    console.log('✅ Table Admin mise à jour avec auth_user_id');
  } else {
    // Le compte Auth existe, réinitialiser le mot de passe
    console.log('\n🔄 Réinitialisation du mot de passe...');
    
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUserId,
      { password: NEW_PASSWORD }
    );
    
    if (updateError) {
      console.error('❌ Erreur réinitialisation:', updateError.message);
      rl.close();
      process.exit(1);
    }
    
    console.log('✅ Mot de passe réinitialisé avec succès');
  }
  
  // Afficher les informations de connexion
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ RÉINITIALISATION TERMINÉE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('📋 Informations de connexion:');
  console.log('');
  console.log(`   Email:        ${admin.email}`);
  console.log(`   Mot de passe: ${NEW_PASSWORD}`);
  console.log('');
  console.log('🌐 URL de connexion:');
  console.log('   https://www.profitum.app/connect-admin');
  console.log('');
  console.log('⚠️  IMPORTANT: Changez ce mot de passe après votre première connexion !');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  rl.close();
}

// Exécution
resetAdminPassword()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    rl.close();
    process.exit(1);
  });

