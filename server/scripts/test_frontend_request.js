const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFrontendRequest() {
  try {
    console.log('🔍 Test de la requête frontend...');
    
    // 1. Se connecter avec l'admin
    console.log('\n1. Connexion admin...');
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'grandjean.alexandre5@gmail.com',
      password: 'admin123456'
    });
    
    if (authError) {
      console.error('❌ Erreur de connexion:', authError);
      return;
    }
    
    console.log('✅ Connexion réussie pour:', user.email);
    
    // 2. Récupérer la session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('❌ Aucune session trouvée');
      return;
    }
    
    console.log('✅ Session récupérée, token:', session.access_token.substring(0, 20) + '...');
    
    // 3. Simuler exactement la requête du frontend
    console.log('\n2. Test de la requête API...');
    
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
        console.log('📊 Données:', JSON.stringify(jsonResult, null, 2));
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

testFrontendRequest(); 