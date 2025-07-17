const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
  console.log('🔍 Vérification des données de la marketplace...\n');
  
  // 1. Vérifier les ClientProduitEligible
  console.log('📊 1. ClientProduitEligible:');
  const { data: clientProduits, error: cpError } = await supabase
    .from('ClientProduitEligible')
    .select('id, clientId, produitId, statut, charte_signed, expert_id, ProduitEligible(nom)');
  
  if (cpError) {
    console.log('❌ Erreur ClientProduitEligible:', cpError.message);
  } else {
    console.log(`✅ ${clientProduits ? clientProduits.length : 0} produits éligibles trouvés`);
    if (clientProduits && clientProduits.length > 0) {
      clientProduits.forEach(cp => {
        console.log(`   - ID: ${cp.id}, Statut: ${cp.statut}, Charte: ${cp.charte_signed}, Expert: ${cp.expert_id || 'Aucun'}, Produit: ${cp.ProduitEligible ? cp.ProduitEligible.nom : 'N/A'}`);
      });
    }
  }
  
  // 2. Vérifier les Experts
  console.log('\n👨‍💼 2. Experts:');
  const { data: experts, error: expError } = await supabase
    .from('Expert')
    .select('id, name, company_name, status, specializations');
  
  if (expError) {
    console.log('❌ Erreur Experts:', expError.message);
  } else {
    console.log(`✅ ${experts ? experts.length : 0} experts trouvés`);
    if (experts && experts.length > 0) {
      experts.forEach(exp => {
        console.log(`   - ID: ${exp.id}, Nom: ${exp.name}, Status: ${exp.status}, Spécialisations: ${exp.specializations ? exp.specializations.join(', ') : 'Aucune'}`);
      });
    }
  }
  
  // 3. Vérifier les ProduitEligible
  console.log('\n📦 3. ProduitEligible:');
  const { data: produits, error: prodError } = await supabase
    .from('ProduitEligible')
    .select('id, nom, category, active');
  
  if (prodError) {
    console.log('❌ Erreur ProduitEligible:', prodError.message);
  } else {
    console.log(`✅ ${produits ? produits.length : 0} produits trouvés`);
    if (produits && produits.length > 0) {
      produits.forEach(prod => {
        console.log(`   - ID: ${prod.id}, Nom: ${prod.nom}, Catégorie: ${prod.category}, Actif: ${prod.active}`);
      });
    }
  }
  
  // 4. Vérifier les Clients
  console.log('\n👤 4. Clients:');
  const { data: clients, error: clientError } = await supabase
    .from('Client')
    .select('id, name, company_name, auth_id');
  
  if (clientError) {
    console.log('❌ Erreur Clients:', clientError.message);
  } else {
    console.log(`✅ ${clients ? clients.length : 0} clients trouvés`);
    if (clients && clients.length > 0) {
      clients.slice(0, 3).forEach(client => {
        console.log(`   - ID: ${client.id}, Nom: ${client.name}, Entreprise: ${client.company_name}`);
      });
      if (clients.length > 3) {
        console.log(`   ... et ${clients.length - 3} autres`);
      }
    }
  }
}

checkData().catch(console.error); 