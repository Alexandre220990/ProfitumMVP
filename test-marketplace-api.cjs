const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testMarketplaceAPI() {
  console.log('🔍 Test des APIs marketplace avec authentification...\n');
  
  // 1. Récupérer un client avec auth_id
  console.log('1️⃣ Récupération d\'un client avec auth_id:');
  const { data: clients, error: clientsError } = await supabase
    .from('Client')
    .select('id, name, email, auth_id')
    .not('auth_id', 'is', null)
    .limit(1);
  
  if (clientsError || !clients || clients.length === 0) {
    console.log('❌ Aucun client avec auth_id trouvé');
    return;
  }
  
  const testClient = clients[0];
  console.log(`✅ Client trouvé: ${testClient.name} (ID: ${testClient.id}, Auth ID: ${testClient.auth_id})`);
  
  // 2. Créer un token JWT pour ce client
  console.log('\n2️⃣ Création d\'un token JWT:');
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    {
      id: testClient.auth_id,
      email: testClient.email,
      type: 'client'
    },
    process.env.JWT_SECRET_KEY || 'votre_secret_jwt_super_securise',
    { expiresIn: '1h' }
  );
  
  console.log(`✅ Token JWT créé: ${token.substring(0, 50)}...`);
  
  // 3. Tester l'API experts (sans auth)
  console.log('\n3️⃣ Test API experts (sans auth):');
  try {
    const response = await fetch('http://localhost:3001/api/experts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    if (data.success) {
      console.log(`✅ ${data.data ? data.data.length : 0} experts récupérés`);
      if (data.data && data.data.length > 0) {
        console.log('   Exemples:', data.data.slice(0, 2).map(e => e.name));
      }
    } else {
      console.log('❌ Erreur:', data.message);
    }
  } catch (error) {
    console.log('❌ Erreur API experts:', error.message);
  }
  
  // 4. Tester l'API produits éligibles (avec auth)
  console.log('\n4️⃣ Test API produits éligibles (avec auth):');
  try {
    const response = await fetch('http://localhost:3001/api/client/produits-eligibles', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    if (data.success) {
      console.log(`✅ ${data.data ? data.data.length : 0} produits éligibles récupérés`);
      if (data.data && data.data.length > 0) {
        console.log('   Exemples:', data.data.slice(0, 2).map(p => p.ProduitEligible ? p.ProduitEligible.nom : 'N/A'));
      }
    } else {
      console.log('❌ Erreur:', data.message);
    }
  } catch (error) {
    console.log('❌ Erreur API produits éligibles:', error.message);
  }
  
  // 5. Vérifier directement en base
  console.log('\n5️⃣ Vérification directe en base:');
  try {
    const { data: produits, error: prodError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        clientId,
        statut,
        charte_signed,
        ProduitEligible (
          id,
          nom,
          description
        )
      `)
      .eq('clientId', testClient.id);
    
    if (prodError) {
      console.log('❌ Erreur base:', prodError.message);
    } else {
      console.log(`✅ ${produits ? produits.length : 0} produits trouvés en base pour ce client`);
      if (produits && produits.length > 0) {
        produits.forEach(prod => {
          console.log(`   - ${prod.ProduitEligible ? prod.ProduitEligible.nom : 'N/A'} (${prod.statut})`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Erreur vérification base:', error.message);
  }
}

testMarketplaceAPI().catch(console.error); 