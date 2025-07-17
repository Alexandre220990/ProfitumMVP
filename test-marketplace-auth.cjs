const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testMarketplaceAuth() {
  console.log('🔍 Test de l\'authentification et des APIs marketplace...\n');
  
  // 1. Vérifier les clients et leurs auth_id
  console.log('1️⃣ Vérification des clients et auth_id:');
  const { data: clients, error: clientsError } = await supabase
    .from('Client')
    .select('id, name, company_name, auth_id, email');
  
  if (clientsError) {
    console.log('❌ Erreur clients:', clientsError.message);
  } else {
    console.log(`✅ ${clients ? clients.length : 0} clients trouvés`);
    if (clients && clients.length > 0) {
      clients.forEach(client => {
        console.log(`   - ID: ${client.id}, Auth ID: ${client.auth_id}, Nom: ${client.name}, Email: ${client.email}`);
      });
    }
  }
  
  // 2. Vérifier les utilisateurs auth
  console.log('\n2️⃣ Vérification des utilisateurs auth:');
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.log('❌ Erreur auth users:', authError.message);
  } else {
    console.log(`✅ ${authUsers ? authUsers.users.length : 0} utilisateurs auth trouvés`);
    if (authUsers && authUsers.users.length > 0) {
      authUsers.users.slice(0, 5).forEach(user => {
        console.log(`   - ID: ${user.id}, Email: ${user.email}, Created: ${user.created_at}`);
      });
    }
  }
  
  // 3. Tester l'API experts directement
  console.log('\n3️⃣ Test API experts (sans auth):');
  try {
    const { data: experts, error: expError } = await supabase
      .from('Expert')
      .select('id, name, company_name, status, specializations')
      .eq('status', 'active');
    
    if (expError) {
      console.log('❌ Erreur API experts:', expError.message);
    } else {
      console.log(`✅ ${experts ? experts.length : 0} experts actifs trouvés`);
      if (experts && experts.length > 0) {
        experts.slice(0, 3).forEach(expert => {
          console.log(`   - ${expert.name} (${expert.specializations ? expert.specializations.join(', ') : 'Aucune'})`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Erreur test API experts:', error.message);
  }
  
  // 4. Tester l'API produits éligibles pour un client spécifique
  console.log('\n4️⃣ Test API produits éligibles pour un client:');
  if (clients && clients.length > 0) {
    const testClient = clients[0];
    console.log(`   Test avec le client: ${testClient.name} (ID: ${testClient.id})`);
    
    try {
      const { data: produits, error: prodError } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          clientId,
          produitId,
          statut,
          charte_signed,
          expert_id,
          ProduitEligible (
            id,
            nom,
            description,
            category
          )
        `)
        .eq('clientId', testClient.id);
      
      if (prodError) {
        console.log('❌ Erreur API produits:', prodError.message);
      } else {
        console.log(`✅ ${produits ? produits.length : 0} produits éligibles trouvés pour ce client`);
        if (produits && produits.length > 0) {
          produits.forEach(prod => {
            console.log(`   - ${prod.ProduitEligible ? prod.ProduitEligible.nom : 'N/A'} (Statut: ${prod.statut}, Charte: ${prod.charte_signed})`);
          });
        }
      }
    } catch (error) {
      console.log('❌ Erreur test API produits:', error.message);
    }
  }
  
  // 5. Vérifier la correspondance auth_id vs id
  console.log('\n5️⃣ Vérification de la correspondance auth_id vs id:');
  if (clients && authUsers) {
    const clientAuthIds = clients.map(c => c.auth_id).filter(id => id);
    const authUserIds = authUsers.users.map(u => u.id);
    
    console.log(`   Clients avec auth_id: ${clientAuthIds.length}`);
    console.log(`   Utilisateurs auth: ${authUserIds.length}`);
    
    const matchingIds = clientAuthIds.filter(id => authUserIds.includes(id));
    console.log(`   Correspondances trouvées: ${matchingIds.length}`);
    
    if (matchingIds.length === 0) {
      console.log('   ⚠️ AUCUNE correspondance trouvée ! C\'est probablement le problème.');
    }
  }
}

testMarketplaceAuth().catch(console.error); 