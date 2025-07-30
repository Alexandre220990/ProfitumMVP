import { Router } from 'express';
import { supabaseClient } from '../config/supabase';

const router = Router();
const supabase = supabaseClient;

// Types pour la migration
interface SimulationProduct {
  code: string;
  score: number;
  savings: number;
  confidence?: string;
}

interface SimulationResults {
  timestamp: number;
  products: SimulationProduct[];
}

interface MigrationRequest {
  clientId: string;
  email: string;
  simulationResults: SimulationResults;
}

// Mapping simplifié des produits
const PRODUCT_MAPPING: { [key: string]: string } = {
  'TICPE': '32dd9cf8-15e2-4375-86ab-a95158d3ada1',
  'URSSAF': 'd1e8f740-7c2a-4b5e-9a91-0e15c0e7d3a2',
  'DFS': 'e2f9a830-8d3b-4c7c-b590-1d7631c0d4b5',
  'FONCIER': 'c5d2e980-4f63-44c0-b8a9-9d6e8e21c0f7',
  'CIR': '37da1c4e-3fcc-49f8-9acb-9b75e231edfd',
  'CEE': 'b7f3c891-28d9-4982-b0eb-821c9e7cbcf0',
  'AUDIT_ENERGETIQUE': 'bc2b94ec-659b-4cf5-a693-d61178b03caf'
};

/**
 * Migration simplifiée des résultats de simulation
 * Appelée directement après l'inscription du client
 */
router.post('/migrate-simulation', async (req, res) => {
  try {
    const { clientId, email, simulationResults }: MigrationRequest = req.body;
    
    console.log('🚀 MIGRATION SIMPLIFIÉE');
    console.log('Client:', email);
    console.log('Résultats:', simulationResults);
    
    if (!clientId || !email || !simulationResults) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes'
      });
    }
    
    // 1. Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('id, email')
      .eq('id', clientId)
      .eq('email', email)
      .single();
      
    if (clientError || !client) {
      return res.status(404).json({
        success: false,
        error: 'Client non trouvé'
      });
    }
    
    console.log('✅ Client vérifié:', client.email);
    
    // 2. Migrer chaque produit
    const migratedProducts = [];
    
    for (const product of simulationResults.products) {
      const produitId = PRODUCT_MAPPING[product.code];
      
      if (!produitId) {
        console.warn(`⚠️ Produit non mappé: ${product.code}`);
        continue;
      }
      
      // Créer l'entrée ClientProduitEligible
      const clientProduitEligible = {
        clientId: client.id,
        produitId: produitId,
        statut: product.score >= 50 ? 'eligible' : 'non_eligible',
        tauxFinal: product.score / 100,
        montantFinal: product.savings || 0,
        dureeFinale: 12,
        simulationId: null,
        metadata: {
          original_code: product.code,
          migrated_at: new Date().toISOString(),
          source: 'simulator'
        },
        notes: `Migration depuis simulateur - Score: ${product.score}%`,
        priorite: product.score >= 80 ? 1 : product.score >= 60 ? 2 : 3,
        dateEligibilite: new Date().toISOString(),
        current_step: 0,
        progress: 0,
        expert_id: null,
        charte_signed: false,
        charte_signed_at: null
      };
      
      // Insérer dans la base
      const { data: insertedProduct, error: insertError } = await supabase
        .from('ClientProduitEligible')
        .insert(clientProduitEligible)
        .select()
        .single();
        
      if (insertError) {
        console.error(`❌ Erreur insertion ${product.code}:`, insertError);
        continue;
      }
      
      migratedProducts.push(insertedProduct);
      console.log(`✅ ${product.code} migré: ${insertedProduct.id}`);
    }
    
    console.log(`🎉 Migration terminée: ${migratedProducts.length} produits`);
    
    return res.json({
      success: true,
      data: {
        client_id: client.id,
        migrated_products: migratedProducts.length,
        products: migratedProducts
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur migration:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la migration'
    });
  }
});

/**
 * Récupérer les produits éligibles d'un client
 */
router.get('/client-products/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const { data: products, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible (
          id,
          nom,
          description,
          category
        )
      `)
      .eq('clientId', clientId);
      
    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erreur récupération produits'
      });
    }
    
    return res.json({
      success: true,
      data: {
        client_id: clientId,
        products: products || []
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

export default router; 