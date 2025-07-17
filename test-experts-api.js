const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdzltldunj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testExpertsAPI() {
  try {
    console.log('🔍 Test de l\'API des experts...');
    
    // 1. Créer un token admin temporaire
    const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
      email: 'test-admin@example.com',
      password: 'TestAdmin2024!',
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        type: 'admin'
      }
    });

    if (authError) {
      console.error('❌ Erreur création utilisateur test:', authError);
      return;
    }

    console.log('✅ Utilisateur test créé:', user.id);

    // 2. Créer un token de session
    const { data: { session }, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: 'test-admin@example.com'
    });

    if (sessionError) {
      console.error('❌ Erreur génération session:', sessionError);
      return;
    }

    console.log('✅ Session générée');

    // 3. Tester l'API des experts
    const response = await fetch('http://localhost:5001/api/admin/experts?page=1&limit=5', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur API experts:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ API experts fonctionne:');
    console.log('   - Nombre d\'experts:', data.data.experts?.length || 0);
    console.log('   - Pagination:', data.data.pagination);

    // 4. Nettoyer l'utilisateur test
    await supabase.auth.admin.deleteUser(user.id);
    console.log('✅ Utilisateur test supprimé');

  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
}

testExpertsAPI(); 