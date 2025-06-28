const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAdminClients() {
  console.log('🧪 Test des routes API clients...\n');

  try {
    // 1. Connexion admin
    console.log('1. Connexion admin...');
    const { data: { session }, error: sessionError } = await supabase.auth.signInWithPassword({
      email: 'admin@profitum.fr',
      password: 'Admin2024!'
    });

    if (sessionError) {
      console.error('❌ Erreur connexion admin:', sessionError);
      return;
    }

    console.log('✅ Admin connecté');

    // 2. Test GET /api/admin/clients
    console.log('\n2. Test liste des clients...');
    const listResponse = await fetch('http://localhost:5001/api/admin/clients?page=1&limit=5', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!listResponse.ok) {
      const errorData = await listResponse.json();
      console.error('❌ Erreur liste clients:', errorData);
      return;
    }

    const listData = await listResponse.json();
    console.log('✅ Liste clients récupérée:', {
      total: listData.data.pagination.total,
      clients: listData.data.clients.length
    });

    // 3. Test GET /api/admin/clients/:id (si des clients existent)
    if (listData.data.clients.length > 0) {
      const firstClient = listData.data.clients[0];
      console.log(`\n3. Test détails client ${firstClient.id}...`);
      
      const detailsResponse = await fetch(`http://localhost:5001/api/admin/clients/${firstClient.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!detailsResponse.ok) {
        const errorData = await detailsResponse.json();
        console.error('❌ Erreur détails client:', errorData);
        return;
      }

      const detailsData = await detailsResponse.json();
      console.log('✅ Détails client récupérés:', {
        client: detailsData.data.client.email,
        produits: detailsData.data.produitsEligibles.length,
        audits: detailsData.data.audits.length,
        stats: detailsData.data.stats
      });

      // 4. Test PUT /api/admin/clients/:id/status
      console.log('\n4. Test modification statut client...');
      const statusResponse = await fetch(`http://localhost:5001/api/admin/clients/${firstClient.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'actif' })
      });

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json();
        console.error('❌ Erreur modification statut:', errorData);
        return;
      }

      const statusData = await statusResponse.json();
      console.log('✅ Statut client modifié:', statusData.data.statut);
    } else {
      console.log('\n3. Aucun client trouvé pour tester les détails');
    }

    // 5. Test avec filtres
    console.log('\n5. Test filtres clients...');
    const filterResponse = await fetch('http://localhost:5001/api/admin/clients?status=actif&sortBy=created_at&sortOrder=desc', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!filterResponse.ok) {
      const errorData = await filterResponse.json();
      console.error('❌ Erreur filtres clients:', errorData);
      return;
    }

    const filterData = await filterResponse.json();
    console.log('✅ Filtres clients fonctionnels:', {
      total: filterData.data.pagination.total,
      clients: filterData.data.clients.length
    });

    console.log('\n🎉 Tous les tests sont passés ! Les routes API clients fonctionnent correctement.');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testAdminClients(); 