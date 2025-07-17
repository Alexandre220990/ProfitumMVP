const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAdminAuth() {
  try {
    console.log('🧪 TEST D\'AUTHENTIFICATION ADMIN');
    console.log('================================\n');

    const adminEmail = 'grandjean.alexandre5@gmail.com';
    const adminPassword = 'Adminprofitum';

    // 1. Connexion avec les identifiants
    console.log('1️⃣ Test de connexion...');
    const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (signInError) {
      console.error('❌ Erreur de connexion:', signInError);
      return;
    }

    if (!session) {
      console.error('❌ Aucune session créée');
      return;
    }

    console.log('✅ Connexion réussie');
    console.log('   🔑 Token:', session.access_token.substring(0, 50) + '...');
    console.log('   👤 User ID:', session.user.id);
    console.log('   📧 Email:', session.user.email);
    console.log('   🏷️ Rôle:', session.user.user_metadata?.role);
    console.log('   📝 Type:', session.user.user_metadata?.type);

    // 2. Test de vérification du token
    console.log('\n2️⃣ Test de vérification du token...');
    const { data: { user }, error: getUserError } = await supabase.auth.getUser(session.access_token);

    if (getUserError) {
      console.error('❌ Erreur vérification token:', getUserError);
      return;
    }

    console.log('✅ Token vérifié avec succès');
    console.log('   👤 User ID:', user.id);
    console.log('   📧 Email:', user.email);

    // 3. Test d'accès à la table Admin
    console.log('\n3️⃣ Test d\'accès à la table Admin...');
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('*')
      .eq('id', user.id)
      .single();

    if (adminError) {
      console.error('❌ Erreur accès table Admin:', adminError);
      return;
    }

    console.log('✅ Accès à la table Admin réussi');
    console.log('   🆔 ID Admin:', adminData.id);
    console.log('   👤 Nom:', adminData.name);
    console.log('   🔑 Rôle:', adminData.role);

    // 4. Simulation du middleware requireAdmin
    console.log('\n4️⃣ Simulation du middleware requireAdmin...');
    
    // Créer un objet simulant la requête
    const mockReq = {
      user: {
        id: user.id,
        email: user.email,
        type: user.user_metadata?.type,
        user_metadata: user.user_metadata
      }
    };

    console.log('   📋 Requête simulée:', {
      user_id: mockReq.user.id,
      user_email: mockReq.user.email,
      user_type: mockReq.user.type
    });

    // Vérifier si l'utilisateur est admin
    const { data: adminCheck, error: adminCheckError } = await supabase
      .from('Admin')
      .select('*')
      .eq('id', mockReq.user.id)
      .single();

    if (adminCheckError || !adminCheck) {
      console.error('❌ Échec de la vérification admin:', adminCheckError);
      return;
    }

    console.log('✅ Vérification admin réussie');
    console.log('   🔑 Rôle admin:', adminCheck.role);

    // 5. Test de l'API dashboard
    console.log('\n5️⃣ Test de l\'API dashboard...');
    
    // Simuler une requête HTTP
    const fetch = require('node-fetch');
    
    try {
      const response = await fetch('http://localhost:5001/api/admin/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('   📊 Status:', response.status);
      console.log('   📋 Headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API dashboard accessible');
        console.log('   📊 Données reçues:', Object.keys(data));
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur API dashboard:', errorText);
      }
    } catch (fetchError) {
      console.error('❌ Erreur requête HTTP:', fetchError.message);
    }

    console.log('\n🎉 TESTS TERMINÉS');
    console.log('=================');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testAdminAuth(); 