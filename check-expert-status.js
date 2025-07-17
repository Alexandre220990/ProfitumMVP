import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExpertStatus() {
  console.log('🔍 Vérification de l\'état de l\'expert...\n');

  try {
    // Vérifier dans Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erreur récupération utilisateurs Auth:', authError.message);
      return;
    }

    const expertUser = authUsers.users.find(user => user.email === 'alexandre@profitum.fr');
    
    if (expertUser) {
      console.log('✅ Utilisateur trouvé dans Supabase Auth:');
      console.log('   ID:', expertUser.id);
      console.log('   Email:', expertUser.email);
      console.log('   Créé le:', expertUser.created_at);
      console.log('   Métadonnées:', expertUser.user_metadata);
    } else {
      console.log('❌ Utilisateur non trouvé dans Supabase Auth');
    }

    // Vérifier dans la table Expert
    const { data: expert, error: expertError } = await supabase
      .from('Expert')
      .select('*')
      .eq('email', 'alexandre@profitum.fr')
      .single();

    if (expertError) {
      if (expertError.code === 'PGRST116') {
        console.log('❌ Expert non trouvé dans la table Expert');
      } else {
        console.error('❌ Erreur récupération expert:', expertError.message);
      }
    } else {
      console.log('\n✅ Expert trouvé dans la table Expert:');
      console.log('   ID:', expert.id);
      console.log('   Nom:', expert.name);
      console.log('   Statut:', expert.status);
      console.log('   Approval status:', expert.approval_status);
      console.log('   Approuvé par:', expert.approved_by);
      console.log('   Approuvé le:', expert.approved_at);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

checkExpertStatus().catch(console.error); 