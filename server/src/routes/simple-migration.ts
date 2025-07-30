import { Router } from 'express';
import { supabaseClient } from '../config/supabase';
import { authenticateUser } from '../middleware/authenticate';

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

// Mapping dynamique des produits (sera mis à jour automatiquement)
let PRODUCT_MAPPING: { [key: string]: string } = {};

/**
 * Initialiser le mapping des produits depuis la base de données
 */
async function initializeProductMapping() {
  try {
    console.log('🔄 Initialisation du mapping des produits...');
    
    const { data: produits, error } = await supabase
      .from('ProduitEligible')
      .select('id, nom, categorie')
      .order('nom');

    if (error) {
      console.error('❌ Erreur récupération produits:', error);
      return;
    }

    // Mapping basé sur les noms et catégories
    const mapping: { [key: string]: string } = {};
    const codesToFind = ['TICPE', 'URSSAF', 'DFS', 'FONCIER', 'CIR', 'CEE', 'AUDIT_ENERGETIQUE'];
    
    for (const code of codesToFind) {
      const matchingProduct = produits.find(p => 
        p.nom.toLowerCase().includes(code.toLowerCase()) ||
        p.categorie?.toLowerCase().includes(code.toLowerCase())
      );
      
      if (matchingProduct) {
        mapping[code] = matchingProduct.id;
        console.log(`✅ ${code} -> ${matchingProduct.nom} (${matchingProduct.id})`);
      } else {
        console.log(`⚠️ ${code} -> Aucun produit trouvé`);
      }
    }

    PRODUCT_MAPPING = mapping;
    console.log('✅ Mapping des produits initialisé:', Object.keys(mapping));
    
  } catch (error) {
    console.error('❌ Erreur initialisation mapping:', error);
  }
}

// Initialiser le mapping au démarrage
initializeProductMapping();

/**
 * Migration simplifiée des résultats de simulation
 * Appelée directement après l'inscription du client
 * REQUIRES AUTHENTICATION
 */
router.post('/migrate-simulation', authenticateUser, async (req, res) => {
  try {
    const { clientId, email, simulationResults }: MigrationRequest = req.body;
    const authUser = req.user; // Récupéré par le middleware d'authentification

    console.log('🚀 MIGRATION SIMPLIFIÉE DÉMARRÉE');
    console.log('📋 Données reçues:');
    console.log('   - Client ID:', clientId);
    console.log('   - Email:', email);
    console.log('   - Nombre de produits:', simulationResults?.products?.length || 0);
    console.log('   - Utilisateur authentifié:', authUser?.email);

    // Vérification de sécurité : l'utilisateur authentifié doit correspondre au client
    if (authUser?.email !== email) {
      console.error('❌ Tentative d\'accès non autorisé:', authUser?.email, 'vs', email);
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
    }

    if (!clientId || !email || !simulationResults) {
      console.error('❌ Données manquantes');
      return res.status(400).json({
        success: false,
        error: 'Données manquantes'
      });
    }

    // 1. Vérifier que le client existe (utiliser l'email de l'utilisateur authentifié)
    console.log('🔍 Vérification du client...');
    console.log('   - Client ID recherché:', clientId);
    console.log('   - Email utilisateur authentifié:', authUser.email);
    
    let client = null; // Initialisation explicite pour éviter les erreurs null
    let clientError;
    
    // Essayer d'abord avec l'ID et l'email
    const { data: clientById, error: errorById } = await supabase
      .from('Client')
      .select('*')  // Récupérer toutes les colonnes pour s'assurer d'avoir l'ID
      .eq('id', clientId)
      .eq('email', authUser.email)
      .single();

    if (errorById || !clientById) {
      console.error('❌ Client non trouvé par ID et email:', errorById);
      console.log('🔄 Tentative de récupération par email seulement...');
      
      // Essayer de trouver le client par email seulement
      const { data: clientByEmail, error: emailError } = await supabase
        .from('Client')
        .select('*')  // Récupérer toutes les colonnes pour s'assurer d'avoir l'ID
        .eq('email', authUser.email)
        .single();
        
      if (emailError || !clientByEmail) {
        console.error('❌ Client non trouvé par email non plus:', emailError);
        return res.status(404).json({
          success: false,
          error: 'Client non trouvé'
        });
      }
      
      console.log('✅ Client trouvé par email:', clientByEmail);
      console.log('   - clientByEmail.id:', clientByEmail.id);
      console.log('   - clientByEmail.email:', clientByEmail.email);
      client = clientByEmail;
    } else {
      console.log('✅ Client trouvé par ID et email:', clientById);
      console.log('   - clientById.id:', clientById.id);
      console.log('   - clientById.email:', clientById.email);
      client = clientById;
    }

    console.log('✅ Client vérifié:', client?.email);
    console.log('✅ Client ID récupéré:', client?.id);
    console.log('✅ Type client.id:', typeof client?.id);
    console.log('✅ Client complet:', client);
    
    // Vérification supplémentaire que le client a un ID valide
    if (!client || !client.id) {
      console.error('❌ Client ID manquant ou invalide');
      console.error('   - Client object:', client);
      console.error('   - Client ID type:', typeof client?.id);
      console.error('   - Client ID value:', client?.id);
      
      // CORRECTION MINEURE : Utiliser directement le clientId de la requête
      console.log('🔄 Tentative avec clientId de la requête:', clientId);
      if (clientId) {
        client = { id: clientId, email: authUser.email, name: 'Client from request' };
        console.log('✅ Client créé à partir du clientId de la requête');
      } else {
        return res.status(500).json({
          success: false,
          error: 'Client ID invalide'
        });
      }
    }

    // 2. Vérifier le mapping des produits
    if (Object.keys(PRODUCT_MAPPING).length === 0) {
      console.log('🔄 Re-initialisation du mapping des produits...');
      await initializeProductMapping();
    }

    console.log('📊 Mapping actuel:', PRODUCT_MAPPING);

    // 3. Migrer chaque produit
    const migratedProducts = [];
    const errors = [];

    console.log('🔄 Début de la migration des produits...');

    for (const product of simulationResults.products) {
      console.log(`\n📦 Traitement du produit: ${product.code}`);
      console.log(`   - Score: ${product.score}%`);
      console.log(`   - Économies: ${product.savings}€`);

      const produitId = PRODUCT_MAPPING[product.code];

      if (!produitId) {
        const error = `Produit non mappé: ${product.code}`;
        console.warn(`⚠️ ${error}`);
        errors.push(error);
        continue;
      }

      console.log(`   - Produit ID trouvé: ${produitId}`);

      // Vérification que le clientId est valide
      if (!client || !client.id) {
        const error = `Client ID manquant pour le produit ${product.code}`;
        console.error(`❌ ${error}`);
        errors.push(error);
        continue;
      }

      // Créer l'entrée ClientProduitEligible avec vérification des valeurs
      const clientProduitEligible = {
        clientId: client?.id || clientId, // Fallback sur clientId si client.id est null
        produitId: produitId,
        statut: product.score >= 50 ? 'eligible' : 'non_eligible',
        tauxFinal: product.score / 100,
        montantFinal: product.savings || 0,
        dureeFinale: 12,
        simulationId: null,
        sessionId: null, // Ajouter la colonne manquante
        metadata: {
          original_code: product.code,
          migrated_at: new Date().toISOString(),
          source: 'simulator',
          confidence: product.confidence,
          original_score: product.score
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

      console.log(`   - Vérification des données avant insertion:`);
      console.log(`     * clientId: ${clientProduitEligible.clientId} (type: ${typeof clientProduitEligible.clientId})`);
      console.log(`     * produitId: ${clientProduitEligible.produitId} (type: ${typeof clientProduitEligible.produitId})`);
      console.log(`     * statut: ${clientProduitEligible.statut}`);
      console.log(`     * tauxFinal: ${clientProduitEligible.tauxFinal}`);
      console.log(`     * montantFinal: ${clientProduitEligible.montantFinal}`);
      console.log(`     * sessionId: ${clientProduitEligible.sessionId}`);

      // Insérer dans la base
      const { data: insertedProduct, error: insertError } = await supabase
        .from('ClientProduitEligible')
        .insert(clientProduitEligible)
        .select()
        .single();
        
      if (insertError) {
        const error = `Erreur insertion ${product.code}: ${insertError.message}`;
        console.error(`❌ ${error}`);
        console.error(`❌ Détails de l'erreur:`, insertError);
        console.error(`❌ Données qui ont causé l'erreur:`, JSON.stringify(clientProduitEligible, null, 2));
        errors.push(error);
        continue;
      }

      migratedProducts.push(insertedProduct);
      console.log(`✅ ${product.code} migré avec succès: ${insertedProduct.id}`);
    }
    
    console.log(`\n🎉 Migration terminée:`);
    console.log(`   - Produits migrés: ${migratedProducts.length}`);
    console.log(`   - Erreurs: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('⚠️ Erreurs rencontrées:', errors);
    }
    
    return res.json({
      success: true,
      data: {
        client_id: client.id,
        migrated_products: migratedProducts.length,
        products: migratedProducts,
        errors: errors
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur migration:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la migration',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * Récupérer les produits éligibles d'un client
 */
router.get('/client-products/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    
    console.log('📋 Récupération des produits pour le client:', clientId);
    
    const { data: products, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible (
          id,
          nom,
          description,
          categorie
        )
      `)
      .eq('clientId', clientId);
      
    if (error) {
      console.error('❌ Erreur récupération produits:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur récupération produits'
      });
    }
    
    console.log(`✅ ${products?.length || 0} produits récupérés`);
    
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

/**
 * Route de debug pour vérifier le mapping des produits
 */
router.get('/debug/mapping', async (req, res) => {
  try {
    console.log('🔍 Debug: Vérification du mapping des produits');
    
    const { data: produits, error } = await supabase
      .from('ProduitEligible')
      .select('id, nom, categorie')
      .order('nom');

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erreur récupération produits'
      });
    }

    return res.json({
      success: true,
      data: {
        mapping: PRODUCT_MAPPING,
        produits: produits,
        mapping_keys: Object.keys(PRODUCT_MAPPING)
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur debug:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

/**
 * Route pour recharger le mapping des produits
 */
router.post('/reload-mapping', async (req, res) => {
  try {
    console.log('🔄 Rechargement du mapping des produits...');
    await initializeProductMapping();
    
    return res.json({
      success: true,
      data: {
        mapping: PRODUCT_MAPPING,
        message: 'Mapping rechargé avec succès'
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur rechargement mapping:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du rechargement'
    });
  }
});

export default router; 