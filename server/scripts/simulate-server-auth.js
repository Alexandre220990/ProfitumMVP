const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simuler les fonctions du serveur
function createAuthUserFromSupabase(user) {
  const type = (user.user_metadata?.type || 'client');
  
  const username = user.user_metadata?.username ||
    user.user_metadata?.company_name ||
    (user.email ? user.email.split('@')[0] : 'user');

  return {
    id: user.id,
    email: user.email || '',
    type,
    user_metadata: {
      type,
      username,
      ...user.user_metadata
    }
  };
}

async function simulateServerAuth() {
  try {
    console.log('🧪 SIMULATION AUTHENTIFICATION SERVEUR');
    console.log('=====================================\n');

    const adminEmail = 'grandjean.alexandre5@gmail.com';
    const adminPassword = 'Adminprofitum';

    // 1. Connexion utilisateur
    console.log('1️⃣ Connexion utilisateur...');
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

    // 2. Simuler le middleware authenticateToken
    console.log('\n2️⃣ Simulation middleware authenticateToken...');
    
    // Simuler la vérification du token
    const { data: { user }, error: getUserError } = await supabase.auth.getUser(session.access_token);

    if (getUserError || !user) {
      console.error('❌ Erreur vérification token:', getUserError);
      return;
    }

    console.log('✅ Token vérifié');
    console.log('   👤 User ID:', user.id);
    console.log('   📧 Email:', user.email);
    console.log('   🏷️ Métadonnées:', JSON.stringify(user.user_metadata, null, 2));

    // 3. Simuler createAuthUserFromSupabase
    console.log('\n3️⃣ Simulation createAuthUserFromSupabase...');
    const authUser = createAuthUserFromSupabase(user);
    
    console.log('✅ AuthUser créé:');
    console.log('   🆔 ID:', authUser.id);
    console.log('   📧 Email:', authUser.email);
    console.log('   📝 Type:', authUser.type);
    console.log('   🏷️ Métadonnées:', JSON.stringify(authUser.user_metadata, null, 2));

    // 4. Simuler le middleware requireAdmin
    console.log('\n4️⃣ Simulation middleware requireAdmin...');
    
    // Simuler la requête exacte du middleware
    const { data: admin, error: adminError } = await supabase
      .from('Admin')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (adminError) {
      console.error('❌ Erreur middleware requireAdmin:', adminError);
      console.error('   Code:', adminError.code);
      console.error('   Message:', adminError.message);
      console.error('   Details:', adminError.details);
      return;
    }

    if (!admin) {
      console.error('❌ Admin non trouvé dans la table');
      return;
    }

    console.log('✅ Admin trouvé:');
    console.log('   🆔 ID:', admin.id);
    console.log('   📧 Email:', admin.email);
    console.log('   👤 Nom:', admin.name);
    console.log('   🔑 Rôle:', admin.role);

    // 5. Test de l'API avec le token utilisateur (pas service key)
    console.log('\n5️⃣ Test API avec token utilisateur...');
    
    // Créer un client avec le token utilisateur
    const userSupabase = createClient(supabaseUrl, session.access_token);
    
    const { data: adminTest, error: adminTestError } = await userSupabase
      .from('Admin')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (adminTestError) {
      console.error('❌ Erreur avec token utilisateur:', adminTestError);
      console.error('   Code:', adminTestError.code);
      console.error('   Message:', adminTestError.message);
    } else {
      console.log('✅ Requête réussie avec token utilisateur');
    }

    console.log('\n🎉 SIMULATION TERMINÉE');
    console.log('=====================');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

simulateServerAuth(); 