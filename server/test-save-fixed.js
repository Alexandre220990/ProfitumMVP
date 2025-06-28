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

async function testSaveFixed() {
  const clientId = 'e4dd024b-c6d7-41c5-9c7e-2faf3fdfbb01'; // Alain Bonin
  
  // Données simulées du chatbot
  const eligibleProducts = [
    {
      nom: 'Récupération TICPE',
      estimatedGain: 50000,
      reasons: ['Secteur transport', 'Véhicules professionnels', 'Estimation basée sur le CA']
    }
  ];
  
  const profileData = {
    secteur: 'transport',
    nombreEmployes: 50,
    chiffreAffaires: '10000000€'
  };
  
  console.log('🧪 Test de sauvegarde corrigée pour Alain Bonin...');
  console.log('📦 Produits à sauvegarder:', eligibleProducts);
  
  try {
    // 1. Créer une nouvelle simulation dans la table Simulation
    const { data: newSimulation, error: simulationError } = await supabase
      .from('Simulation')
      .insert({
        clientId: clientId,
        dateCreation: new Date().toISOString(),
        statut: 'termine',
        type: 'chatbot',
        source: 'profitum',
        score: 100,
        tempsCompletion: 0,
        Answers: {
          source: 'chatbot',
          profileData: profileData,
          eligibleProducts: eligibleProducts
        },
        metadata: {}
      })
      .select()
      .single();
      
    if (simulationError) {
      console.error('❌ Erreur création simulation:', simulationError);
      return;
    }
    
    console.log('✅ Simulation créée avec ID:', newSimulation.id);
    
    const savedProducts = [];
    
    for (const product of eligibleProducts) {
      try {
        // Mapper le nom du produit
        const mappedProductName = mapProductName(product.nom);
        console.log(`🔄 Mapping: "${product.nom}" -> "${mappedProductName}"`);
        
        // 2. Trouver le produit dans ProduitEligible
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
        
        // 3. Sauvegarder en ClientProduitEligible avec le bon simulationId
        const { data: savedProduct, error: saveError } = await supabase
          .from('ClientProduitEligible')
          .insert({
            clientId: clientId,
            produitId: produitEligible.id,
            simulationId: newSimulation.id, // Utiliser l'ID de la simulation créée
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
        .eq('simulationId', newSimulation.id);
        
      if (verifError) {
        console.error('❌ Erreur vérification:', verifError);
      } else {
        console.log('✅ Données vérifiées:', verification.length, 'enregistrements');
        verification.forEach(v => {
          console.log(`  - ${v.ProduitEligible?.nom}: ${v.montantFinal}€`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testSaveFixed(); 