const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAdminAuth() {
  try {
    console.log('🔍 Test de l\'authentification admin...');
    
    // 1. Se connecter avec l'admin
    console.log('\n1. Connexion admin...');
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'grandjean.alexandre5@gmail.com',
      password: 'Adminprofitum'
    });
    
    if (authError) {
      console.error('❌ Erreur de connexion:', authError);
      return;
    }
    
    console.log('✅ Connexion réussie pour:', user.email);
    console.log('📋 ID utilisateur:', user.id);
    
    // 2. Récupérer la session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('❌ Aucune session trouvée');
      return;
    }
    
    console.log('✅ Session récupérée');
    console.log('🔑 Token d\'accès:', session.access_token.substring(0, 50) + '...');
    
    // 3. Vérifier que l'utilisateur est bien dans la table Admin
    console.log('\n2. Vérification de la table Admin...');
    const { data: admin, error: adminError } = await supabase
      .from('Admin')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (adminError) {
      console.error('❌ Erreur lors de la vérification admin:', adminError);
      return;
    }
    
    if (!admin) {
      console.error('❌ Utilisateur non trouvé dans la table Admin');
      return;
    }
    
    console.log('✅ Admin trouvé dans la base:', {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    });
    
    // 4. Simuler exactement la requête du frontend
    console.log('\n3. Test de la requête API...');
    
    const params = new URLSearchParams({
      page: '1',
      limit: '10',
      search: '',
      status: '',
      approval_status: '',
      specialization: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    
    // Ajouter les paramètres conditionnels comme dans le frontend
    if ('' && '' !== "all") params.append('status', '');
    if ('' && '' !== "all") params.append('approval_status', '');
    
    console.log('📡 URL de la requête:', `http://localhost:5001/api/admin/experts?${params}`);
    console.log('📡 Paramètres:', Object.fromEntries(params.entries()));
    
    const response = await fetch(`http://localhost:5001/api/admin/experts?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Status de la réponse:', response.status);
    console.log('📡 Headers de la réponse:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    const result = await response.text();
    console.log('📡 Corps de la réponse:');
    console.log(result.substring(0, 1000) + (result.length > 1000 ? '...' : ''));
    
    if (response.ok) {
      try {
        const jsonResult = JSON.parse(result);
        console.log('✅ Requête réussie !');
        if (jsonResult.success && jsonResult.data) {
          console.log(`📊 ${jsonResult.data.experts?.length || 0} experts retournés`);
          console.log(`📄 Pagination: page ${jsonResult.data.pagination?.page}, total ${jsonResult.data.pagination?.total}`);
          
          if (jsonResult.data.experts && jsonResult.data.experts.length > 0) {
            console.log('📋 Premier expert:', {
              id: jsonResult.data.experts[0].id,
              name: jsonResult.data.experts[0].name,
              email: jsonResult.data.experts[0].email,
              status: jsonResult.data.experts[0].status,
              approval_status: jsonResult.data.experts[0].approval_status
            });
          }
        }
      } catch (parseError) {
        console.error('❌ Erreur de parsing JSON:', parseError);
      }
    } else {
      console.error('❌ Erreur HTTP:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testAdminAuth(); 