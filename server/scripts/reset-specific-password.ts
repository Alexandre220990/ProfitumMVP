import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

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

const EMAIL = 'grandjean.alexandre5@gmail.com';
const NEW_PASSWORD = 'MaeMelieAlex130124.';

async function resetPassword() {
  console.log('🔐 RÉINITIALISATION DU MOT DE PASSE');
  console.log('═══════════════════════════════════\n');
  console.log(`📧 Email: ${EMAIL}`);
  console.log(`🔑 Nouveau mot de passe: ${NEW_PASSWORD}\n`);
  
  // 1. Trouver l'admin
  const { data: admin, error: adminError } = await supabaseAdmin
    .from('Admin')
    .select('id, email, name, auth_user_id')
    .eq('email', EMAIL)
    .single();
  
  if (adminError || !admin) {
    console.error('❌ Admin non trouvé:', adminError?.message);
    process.exit(1);
  }
  
  console.log(`✅ Admin trouvé: ${admin.name}`);
  console.log(`   Auth User ID: ${admin.auth_user_id}\n`);
  
  // 2. Réinitialiser le mot de passe dans Supabase Auth
  console.log('🔄 Réinitialisation du mot de passe...');
  
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    admin.auth_user_id,
    { password: NEW_PASSWORD }
  );
  
  if (updateError) {
    console.error('❌ Erreur:', updateError.message);
    process.exit(1);
  }
  
  console.log('✅ Mot de passe réinitialisé avec succès !\n');
  
  console.log('═══════════════════════════════════');
  console.log('📋 INFORMATIONS DE CONNEXION');
  console.log('═══════════════════════════════════');
  console.log(`Email:        ${EMAIL}`);
  console.log(`Mot de passe: ${NEW_PASSWORD}`);
  console.log(`URL:          https://www.profitum.app/connect-admin`);
  console.log('═══════════════════════════════════\n');
  console.log('✅ Vous pouvez maintenant vous connecter !');
}

resetPassword()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

