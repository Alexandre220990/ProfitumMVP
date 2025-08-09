import express from 'express';
import { supabaseClient } from '../config/supabase';
import { enhancedAuthMiddleware, AuthenticatedRequest } from '../middleware/auth-enhanced';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

interface ClientSimulationRequest {
  responses: Record<string, any>;
  simulationType?: 'update' | 'new';
}

interface ClientSimulationResponse {
  success: boolean;
  data?: {
    simulationId: string;
    productsUpdated: number;
    productsCreated: number;
    productsProtected: number;
    totalSavings: number;
    conflicts: any[];
    historyId: string;
  };
  message?: string;
}

// ============================================================================
// ROUTES API
// ============================================================================

/**
 * POST /api/client/simulation/update
 * Met à jour la simulation d'un client connecté avec fusion intelligente
 */
router.post('/update', enhancedAuthMiddleware, asyncHandler(async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    
    if (!user || user.type !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients connectés'
      });
    }

    const { responses, simulationType = 'update' }: ClientSimulationRequest = req.body;

    console.log('🚀 Simulation client connecté:', {
      clientId: user.database_id,
      simulationType,
      responsesCount: Object.keys(responses || {}).length
    });

    // 1. Créer une nouvelle simulation
    const { data: simulation, error: simulationError } = await supabaseClient
      .from('simulations')
      .insert({
        client_id: user.database_id,
        type: simulationType,
        status: 'processing',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (simulationError) {
      console.error('❌ Erreur création simulation:', simulationError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la simulation'
      });
    }

    // 2. Appeler le service Python pour analyser les réponses
    const pythonResponse = await callPythonSimulationService(responses, user.database_id);
    
    if (!pythonResponse.success) {
      // Marquer la simulation comme échouée
      await supabaseClient
        .from('simulations')
        .update({ status: 'failed', error_message: pythonResponse.error })
        .eq('id', simulation.id);
        
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'analyse de la simulation'
      });
    }

    // 3. Fusionner intelligemment avec les produits existants
    const mergeResult = await mergeClientProducts(
      user.database_id,
      simulation.id,
      pythonResponse.eligibleProducts
    );

    // 4. Mettre à jour la simulation avec les résultats
    await supabaseClient
      .from('simulations')
      .update({
        status: 'completed',
        results: mergeResult,
        completed_at: new Date().toISOString()
      })
      .eq('id', simulation.id);

    console.log('✅ Simulation client terminée:', {
      simulationId: simulation.id,
      productsUpdated: mergeResult.products_updated,
      productsCreated: mergeResult.products_created,
      productsProtected: mergeResult.products_protected
    });

    const response: ClientSimulationResponse = {
      success: true,
      data: {
        simulationId: simulation.id,
        productsUpdated: mergeResult.products_updated,
        productsCreated: mergeResult.products_created,
        productsProtected: mergeResult.products_protected,
        totalSavings: mergeResult.total_savings,
        conflicts: mergeResult.conflicts || [],
        historyId: mergeResult.history_id
      },
      message: 'Simulation mise à jour avec succès'
    };

    return res.json(response);

  } catch (error) {
    console.error('❌ Erreur simulation client:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la simulation'
    });
  }
}));

/**
 * GET /api/client/simulation/history
 * Récupère l'historique des simulations d'un client
 */
router.get('/history', enhancedAuthMiddleware, asyncHandler(async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    
    if (!user || user.type !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients connectés'
      });
    }

    const { data: history, error } = await supabaseClient
      .from('SimulationHistory')
      .select('*')
      .eq('client_id', user.database_id)
      .order('simulation_date', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Erreur récupération historique:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'historique'
      });
    }

    return res.json({
      success: true,
      data: history || [],
      message: 'Historique récupéré avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur historique simulation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
}));

/**
 * GET /api/client/simulation/status
 * Vérifie le statut de la dernière simulation
 */
router.get('/status', enhancedAuthMiddleware, asyncHandler(async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    
    if (!user || user.type !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients connectés'
      });
    }

    const { data: lastSimulation, error } = await supabaseClient
      .from('simulations')
      .select('*')
      .eq('client_id', user.database_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Erreur statut simulation:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification du statut'
      });
    }

    return res.json({
      success: true,
      data: {
        hasRecentSimulation: !!lastSimulation,
        lastSimulation: lastSimulation || null,
        canRunNewSimulation: !lastSimulation || 
          lastSimulation.status === 'completed' || 
          lastSimulation.status === 'failed'
      },
      message: 'Statut vérifié avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur statut simulation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
}));

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Appelle le service Python pour analyser les réponses
 */
async function callPythonSimulationService(responses: Record<string, any>, clientId: string) {
  try {
    // TODO: Implémenter l'appel au service Python
    // Pour l'instant, retourner des données de test
    console.log('🔍 Appel service Python pour client:', clientId);
    
    // Simulation de réponse Python
    return {
      success: true,
      eligibleProducts: [
        {
          produitId: '123e4567-e89b-12d3-a456-426614174000',
          tauxFinal: 0.85,
          montantFinal: 7500,
          dureeFinale: 12,
          metadata: { confidence: 0.9 }
        }
      ]
    };
  } catch (error) {
    console.error('❌ Erreur service Python:', error);
    return {
      success: false,
      error: 'Erreur lors de l\'analyse Python'
    };
  }
}

/**
 * Fusionne les produits avec la logique intelligente
 */
async function mergeClientProducts(clientId: string, simulationId: string, newProducts: any[]) {
  try {
    console.log('🔄 Fusion intelligente pour client:', clientId);
    
    // Convertir en JSONB pour la fonction PostgreSQL
    const productsJsonb = JSON.stringify(newProducts);
    
    // Appeler la fonction PostgreSQL
    const { data, error } = await supabaseClient.rpc('merge_client_products', {
      p_client_id: clientId,
      p_new_simulation_id: simulationId,
      p_new_products: productsJsonb
    });

    if (error) {
      console.error('❌ Erreur fusion PostgreSQL:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Erreur fusion produits:', error);
    throw error;
  }
}

export default router;
