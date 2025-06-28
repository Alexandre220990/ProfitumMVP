const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fonction de mapping
const mapProductName = (chatbotName) => {
  const mapping = {
    'Récupération TICPE': 'TICPE',
    'Optimisation Taxe Foncière': 'Foncier',
    'Optimisation URSSAF': 'URSSAF',
    'Déduction Forfaitaire Spécifique': 'DFS',
    'Optimisation Énergie': 'Optimisation Énergie',
    'Aides CEE': 'CEE',
    'Optimisation MSA': 'MSA'
  };
  
  return mapping[chatbotName] || chatbotName;
};

async function testSave() {
  const clientId = 'e4dd024b-c6d7-41c5-9c7e-2faf3fdfbb01'; // Alain Bonin
  
  // Données simulées du chatbot
  const eligibleProducts = [
    {
      nom: 'Récupération TICPE',
      estimatedGain: 50000,
      reasons: ['Secteur transport', 'Véhicules professionnels', 'Estimation basée sur le CA']
    }
  ];
  
  console.log('🧪 Test de sauvegarde pour Alain Bonin...');
  console.log('📦 Produits à sauvegarder:', eligibleProducts);
  
  // Créer un ID de simulation unique
  const simulationId = Date.now();
  console.log('🆔 Simulation ID:', simulationId);
  
  const savedProducts = [];
  
  for (const product of eligibleProducts) {
    try {
      // Mapper le nom du produit
      const mappedProductName = mapProductName(product.nom);
      console.log(`🔄 Mapping: "${product.nom}" -> "${mappedProductName}"`);
      
      // 1. Trouver le produit dans ProduitEligible
      const { data: produitEligible, error: produitError } = await supabase
        .from('ProduitEligible')
        .select('*')
        .eq('nom', mappedProductName)
        .single();
        
      if (produitError || !produitEligible) {
        console.warn(`⚠️ Produit non trouvé: ${mappedProductName} (original: ${product.nom})`);
        continue;
      }
      
      console.log(`✅ Produit trouvé: ${produitEligible.nom} (ID: ${produitEligible.id})`);
      
      // 2. Sauvegarder en ClientProduitEligible
      const { data: savedProduct, error: saveError } = await supabase
        .from('ClientProduitEligible')
        .insert({
          clientId: clientId,
          produitId: produitEligible.id,
          simulationId: simulationId,
          statut: 'eligible',
          tauxFinal: 0.85,
          montantFinal: product.estimatedGain || product.gainPotentiel || 0,
          dureeFinale: 12,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (saveError) {
        console.error(`❌ Erreur sauvegarde produit ${mappedProductName}:`, saveError);
        continue;
      }
      
      savedProducts.push(savedProduct);
      console.log(`✅ Produit sauvegardé: ${mappedProductName} (ID: ${savedProduct.id})`);
      
    } catch (error) {
      console.error(`❌ Erreur pour le produit ${product.nom}:`, error);
    }
  }
  
  console.log(`\n📊 Résultat: ${savedProducts.length} produits sauvegardés sur ${eligibleProducts.length}`);
  
  // Vérifier les données sauvegardées
  if (savedProducts.length > 0) {
    console.log('\n🔍 Vérification des données sauvegardées...');
    const { data: verification, error: verifError } = await supabase
      .from('ClientProduitEligible')
      .select('*, ProduitEligible(nom)')
      .eq('clientId', clientId)
      .eq('simulationId', simulationId);
      
    if (verifError) {
      console.error('❌ Erreur vérification:', verifError);
    } else {
      console.log('✅ Données vérifiées:', verification.length, 'enregistrements');
      verification.forEach(v => {
        console.log(`  - ${v.ProduitEligible?.nom}: ${v.montantFinal}€`);
      });
    }
  }
}

testSave(); 