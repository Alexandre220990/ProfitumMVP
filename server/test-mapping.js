const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fonction de mapping (copiée du code)
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

async function testMapping() {
  console.log('🧪 Test du mapping des noms de produits...');
  
  const testNames = [
    'Récupération TICPE',
    'Optimisation Taxe Foncière',
    'Optimisation URSSAF',
    'DFS',
    'TICPE'
  ];
  
  for (const testName of testNames) {
    const mappedName = mapProductName(testName);
    console.log(`  "${testName}" -> "${mappedName}"`);
    
    // Vérifier si le produit existe en base
    const { data: produit, error } = await supabase
      .from('ProduitEligible')
      .select('*')
      .eq('nom', mappedName)
      .single();
      
    if (error) {
      console.log(`    ❌ Non trouvé: ${error.message}`);
    } else {
      console.log(`    ✅ Trouvé: ID ${produit.id}`);
    }
  }
}

testMapping(); 