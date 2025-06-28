const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Utiliser la clé de service pour contourner RLS
const supabaseService = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function testChatbotSaveFixed() {
  console.log('🧪 Test de sauvegarde corrigée du chatbot\n');

  const testClientId = '0538de29-4287-4c28-b76a-b65ef993f393';
  
  try {
    // 1. Simuler les données du chatbot avec les vrais noms
    const mockChatbotProducts = [
      {
        nom: 'Récupération TICPE',
        estimatedGain: 50000,
        reasons: [
          'Secteur transport',
          'Véhicules professionnels',
          'Estimation basée sur le CA'
        ]
      },
      {
        nom: 'Déduction Forfaitaire Spécifique',
        estimatedGain: 8820,
        reasons: [
          '7 salariés concernés',
          'Taux DFS : 10%',
          'Économies sur charges patronales'
        ]
      }
    ];

    const profileData = {
      secteur: 'transport',
      vehiculesProfessionnels: true,
      chiffreAffaires: '5000000000',
      nombreEmployes: 10
    };

    console.log('📦 Données du chatbot simulées:', {
      clientId: testClientId,
      eligibleProducts: mockChatbotProducts,
      profileData: profileData
    });

    // 2. Mapping des noms de produits
    const PRODUCT_NAME_MAPPING = {
      'Récupération TICPE': 'TICPE',
      'TICPE': 'TICPE',
      'Déduction Forfaitaire Spécifique': 'DFS',
      'DFS': 'DFS',
      'URSSAF': 'URSSAF',
      'Optimisation URSSAF': 'URSSAF'
    };

    function normalizeProductName(chatbotName) {
      return PRODUCT_NAME_MAPPING[chatbotName] || chatbotName;
    }

    // 3. Créer une simulation
    console.log('\n1️⃣ Création d\'une simulation...');
    const { data: simulation, error: simulationError } = await supabaseService
      .from('Simulation')
      .insert({
        clientId: testClientId,
        statut: 'termine',
        type: 'chatbot',
        source: 'profitum',
        dateCreation: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        Answers: {
          profileData: profileData,
          eligibleProducts: mockChatbotProducts.map(p => ({
            nom: p.nom,
            estimatedGain: p.estimatedGain,
            reasons: p.reasons || []
          })),
          timestamp: new Date().toISOString()
        },
        metadata: {
          source: 'chatbot',
          version: '2.0',
          features: ['ai_analysis', 'product_matching', 'gain_calculation']
        },
        score: mockChatbotProducts.length * 10 + Math.floor(Math.random() * 20),
        tempsCompletion: Math.floor(Math.random() * 300) + 60,
        CheminParcouru: {
          steps: ['profile_collection', 'product_analysis', 'eligibility_check', 'results_generation'],
          completed: true,
          duration: Math.floor(Math.random() * 300) + 60
        }
      })
      .select()
      .single();
      
    if (simulationError) {
      console.log(`❌ Erreur création simulation: ${simulationError.message}`);
      return;
    }
    
    console.log(`✅ Simulation créée avec l'ID: ${simulation.id}`);
    
    // 4. Sauvegarder les produits éligibles
    console.log('\n2️⃣ Sauvegarde des produits éligibles...');
    const savedProducts = [];
    
    for (const product of mockChatbotProducts) {
      try {
        console.log(`🔄 Traitement du produit: ${product.nom}`);
        
        // Normaliser le nom du produit
        const normalizedName = normalizeProductName(product.nom);
        console.log(`   📝 Nom normalisé: ${product.nom} → ${normalizedName}`);
        
        // Trouver le produit dans ProduitEligible
        const { data: produitEligible, error: produitError } = await supabaseService
          .from('ProduitEligible')
          .select('*')
          .eq('nom', normalizedName)
          .single();
          
        if (produitError || !produitEligible) {
          console.log(`   ⚠️ Produit non trouvé: ${normalizedName} (original: ${product.nom})`);
          continue;
        }
        
        console.log(`   ✅ Produit trouvé: ${produitEligible.nom} (ID: ${produitEligible.id})`);
        
        // Calculer les valeurs optimisées
        const gainPotentiel = product.estimatedGain || product.gainPotentiel || 0;
        const tauxFinal = Math.min(0.95, Math.max(0.60, (gainPotentiel / 10000) * 0.3 + 0.65));
        const dureeFinale = Math.min(36, Math.max(12, Math.floor(gainPotentiel / 1000) + 12));
        const priorite = gainPotentiel > 5000 ? 1 : gainPotentiel > 2000 ? 2 : 3;
        
        // Sauvegarder en ClientProduitEligible
        const { data: savedProduct, error: saveError } = await supabaseService
          .from('ClientProduitEligible')
          .insert({
            clientId: testClientId,
            produitId: produitEligible.id,
            simulationId: simulation.id,
            statut: 'eligible',
            tauxFinal: tauxFinal,
            montantFinal: gainPotentiel,
            dureeFinale: dureeFinale,
            priorite: priorite,
            dateEligibilite: new Date().toISOString(),
            notes: `Identifié par chatbot - Gain potentiel: ${gainPotentiel}€`,
            metadata: {
              source: 'chatbot',
              confidence: 0.85,
              analysis_date: new Date().toISOString(),
              product_details: {
                nom: product.nom,
                normalizedName: normalizedName,
                description: product.description,
                reasons: product.reasons || [],
                estimatedGain: gainPotentiel
              },
              client_profile: {
                secteur: profileData?.secteur,
                nombreEmployes: profileData?.nombreEmployes,
                chiffreAffaires: profileData?.chiffreAffaires
              }
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (saveError) {
          console.log(`   ❌ Erreur sauvegarde: ${saveError.message}`);
          continue;
        }
        
        savedProducts.push(savedProduct);
        console.log(`   ✅ Produit sauvegardé: ${product.nom} (ID: ${savedProduct.id})`);
        
      } catch (error) {
        console.log(`   ❌ Erreur générale pour ${product.nom}: ${error.message}`);
      }
    }
    
    // 5. Vérification finale
    console.log('\n3️⃣ Vérification finale...');
    console.log(`✅ ${savedProducts.length} produits sauvegardés sur ${mockChatbotProducts.length}`);
    
    const { data: finalProducts, error: finalError } = await supabaseService
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', testClientId)
      .eq('simulationId', simulation.id);

    if (finalError) {
      console.log(`❌ Erreur vérification: ${finalError.message}`);
    } else {
      console.log(`✅ ${finalProducts.length} produits trouvés pour cette simulation`);
      
      if (finalProducts.length > 0) {
        console.log('\n📊 Détails des produits sauvegardés:');
        finalProducts.forEach((entry, index) => {
          console.log(`   ${index + 1}. ID: ${entry.id}`);
          console.log(`      ProduitId: ${entry.produitId}`);
          console.log(`      Statut: ${entry.statut}`);
          console.log(`      Montant: ${entry.montantFinal}€`);
          console.log(`      Taux: ${entry.tauxFinal}`);
          console.log(`      Durée: ${entry.dureeFinale} mois`);
          console.log('');
        });
      }
    }

    console.log('\n✅ Test de sauvegarde corrigée terminé !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testChatbotSaveFixed(); 