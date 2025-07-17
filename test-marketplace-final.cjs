const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testMarketplaceFinal() {
  console.log('🔍 Test final de la marketplace...\n');
  
  // 1. Vérifier les experts actifs
  console.log('1️⃣ Vérification des experts actifs:');
  const { data: experts, error: expertsError } = await supabase
    .from('Expert')
    .select('id, name, company_name, status, specializations')
    .eq('status', 'active');
  
  if (expertsError) {
    console.log('❌ Erreur experts:', expertsError.message);
  } else {
    console.log(`✅ ${experts ? experts.length : 0} experts actifs trouvés`);
    if (experts && experts.length > 0) {
      experts.slice(0, 3).forEach(expert => {
        console.log(`   - ${expert.name} (${expert.specializations ? expert.specializations.join(', ') : 'Aucune'})`);
      });
    }
  }
  
  // 2. Vérifier les produits éligibles
  console.log('\n2️⃣ Vérification des produits éligibles:');
  const { data: produits, error: produitsError } = await supabase
    .from('ProduitEligible')
    .select('id, nom, category, active')
    .eq('active', true);
  
  if (produitsError) {
    console.log('❌ Erreur produits:', produitsError.message);
  } else {
    console.log(`✅ ${produits ? produits.length : 0} produits actifs trouvés`);
    if (produits && produits.length > 0) {
      produits.slice(0, 3).forEach(produit => {
        console.log(`   - ${produit.nom} (${produit.category})`);
      });
    }
  }
  
  // 3. Vérifier les clients avec auth_id
  console.log('\n3️⃣ Vérification des clients avec auth_id:');
  const { data: clients, error: clientsError } = await supabase
    .from('Client')
    .select('id, name, email, auth_id')
    .not('auth_id', 'is', null);
  
  if (clientsError) {
    console.log('❌ Erreur clients:', clientsError.message);
  } else {
    console.log(`✅ ${clients ? clients.length : 0} clients avec auth_id trouvés`);
    if (clients && clients.length > 0) {
      clients.forEach(client => {
        console.log(`   - ${client.name || 'Sans nom'} (${client.email})`);
      });
    }
  }
  
  // 4. Vérifier les ClientProduitEligible
  console.log('\n4️⃣ Vérification des ClientProduitEligible:');
  const { data: clientProduits, error: cpError } = await supabase
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
    .limit(5);
  
  if (cpError) {
    console.log('❌ Erreur ClientProduitEligible:', cpError.message);
  } else {
    console.log(`✅ ${clientProduits ? clientProduits.length : 0} ClientProduitEligible trouvés`);
    if (clientProduits && clientProduits.length > 0) {
      clientProduits.forEach(cp => {
        console.log(`   - ${cp.ProduitEligible ? cp.ProduitEligible.nom : 'N/A'} (${cp.statut}, Charte: ${cp.charte_signed})`);
      });
    }
  }
  
  // 5. Résumé et recommandations
  console.log('\n📊 RÉSUMÉ:');
  console.log(`   - Experts actifs: ${experts ? experts.length : 0}`);
  console.log(`   - Produits actifs: ${produits ? produits.length : 0}`);
  console.log(`   - Clients avec auth_id: ${clients ? clients.length : 0}`);
  console.log(`   - ClientProduitEligible: ${clientProduits ? clientProduits.length : 0}`);
  
  if ((experts && experts.length > 0) && (produits && produits.length > 0) && (clients && clients.length > 0)) {
    console.log('\n✅ La marketplace devrait fonctionner correctement !');
    console.log('   Les données nécessaires sont présentes en base.');
  } else {
    console.log('\n⚠️ Problèmes détectés:');
    if (!experts || experts.length === 0) {
      console.log('   - Aucun expert actif trouvé');
    }
    if (!produits || produits.length === 0) {
      console.log('   - Aucun produit actif trouvé');
    }
    if (!clients || clients.length === 0) {
      console.log('   - Aucun client avec auth_id trouvé');
    }
  }
}

testMarketplaceFinal().catch(console.error); 