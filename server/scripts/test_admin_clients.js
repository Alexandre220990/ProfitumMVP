const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAdminClients() {
  try {
    console.log('🔍 Test de la route admin clients...');
    
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
    
    // 2. Récupérer la session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('❌ Aucune session trouvée');
      return;
    }
    
    console.log('✅ Session récupérée');
    
    // 3. Vérifier que la table Client contient des données
    console.log('\n2. Vérification de la table Client...');
    const { data: clients, error: clientsError } = await supabase
      .from('Client')
      .select('id, email, company_name, created_at, derniereConnexion, statut')
      .limit(5);
    
    if (clientsError) {
      console.error('❌ Erreur lors de la récupération des clients:', clientsError);
      return;
    }
    
    console.log(`✅ ${clients?.length || 0} clients trouvés dans la base`);
    if (clients && clients.length > 0) {
      console.log('📋 Premier client:', {
        id: clients[0].id,
        email: clients[0].email,
        company_name: clients[0].company_name,
        statut: clients[0].statut,
        created_at: clients[0].created_at
      });
    }
    
    // 4. Test direct de la requête SQL qui pose problème
    console.log('\n3. Test de la requête SQL problématique...');
    const { data: testClients, error: testError } = await supabase
      .from('Client')
      .select(`
        id,
        email,
        company_name,
        created_at,
        derniereConnexion,
        statut
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (testError) {
      console.error('❌ Erreur dans la requête SQL:', testError);
      console.error('Message:', testError.message);
      console.error('Details:', testError.details);
      console.error('Hint:', testError.hint);
    } else {
      console.log('✅ Requête SQL fonctionne correctement !');
      console.log(`📊 ${testClients?.length || 0} clients retournés`);
    }
    
    // 5. Simuler exactement la requête du frontend
    console.log('\n4. Test de la requête API...');
    
    const params = new URLSearchParams({
      page: '1',
      limit: '10',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    
    console.log('📡 URL de la requête:', `http://localhost:5001/api/admin/clients?${params}`);
    console.log('📡 Paramètres:', Object.fromEntries(params.entries()));
    
    const response = await fetch(`http://localhost:5001/api/admin/clients?${params}`, {
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
          console.log(`📊 ${jsonResult.data.clients?.length || 0} clients retournés`);
          console.log(`📄 Pagination: page ${jsonResult.data.pagination?.page}, total ${jsonResult.data.pagination?.total}`);
          
          if (jsonResult.data.clients && jsonResult.data.clients.length > 0) {
            console.log('📋 Premier client:', {
              id: jsonResult.data.clients[0].id,
              email: jsonResult.data.clients[0].email,
              company_name: jsonResult.data.clients[0].company_name,
              statut: jsonResult.data.clients[0].statut
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

testAdminClients(); 