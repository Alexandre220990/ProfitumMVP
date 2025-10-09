import express, { Router, Request, Response } from 'express';
import { ProspectSimulationService } from '../services/ProspectSimulationService';
import { ExpertOptimizationService } from '../services/ExpertOptimizationService';

const router = express.Router();

// ============================================================================
// ROUTES SIMULATION PROSPECT PAR APPORTEUR
// ============================================================================

/**
 * POST /api/apporteur/prospects/:prospectId/simulation
 * Créer une simulation complète pour un prospect
 */
router.post('/:prospectId/simulation', async (req: Request, res: Response) => {
  try {
    const { prospectId } = req.params;
    const user = req.user as any;
    
    if (!user || user.type !== 'apporteur_affaires') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux apporteurs d\'affaires'
      });
    }
    
    const { answers, prospect_data } = req.body;
    
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Réponses de simulation requises'
      });
    }
    
    // Créer la simulation
    const result = await ProspectSimulationService.createProspectSimulation({
      prospect_id: prospectId,
      apporteur_id: user.database_id,
      answers: answers,
      prospect_data: prospect_data
    });
    
    return res.status(201).json({
      success: true,
      message: `Simulation créée : ${result.summary.highly_eligible + result.summary.eligible} produits éligibles identifiés`,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Erreur création simulation prospect:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur serveur'
    });
  }
});

/**
 * GET /api/apporteur/prospects/:prospectId/simulation
 * Récupérer la simulation existante d'un prospect
 */
router.get('/:prospectId/simulation', async (req: Request, res: Response) => {
  try {
    const { prospectId } = req.params;
    const user = req.user as any;
    
    if (!user || user.type !== 'apporteur_affaires') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux apporteurs d\'affaires'
      });
    }
    
    const result = await ProspectSimulationService.getProspectSimulation(prospectId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Aucune simulation trouvée pour ce prospect'
      });
    }
    
    return res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération simulation:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur serveur'
    });
  }
});

/**
 * POST /api/apporteur/experts/optimize
 * Optimiser la sélection d'experts pour plusieurs produits
 */
router.post('/experts/optimize', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    
    if (!user || user.type !== 'apporteur_affaires') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux apporteurs d\'affaires'
      });
    }
    
    const { products, client_data } = req.body;
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Liste de produits requise'
      });
    }
    
    const optimization = await ExpertOptimizationService.optimizeExpertSelection(
      products,
      client_data
    );
    
    return res.json({
      success: true,
      data: optimization
    });
    
  } catch (error) {
    console.error('❌ Erreur optimisation experts:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur serveur'
    });
  }
});

/**
 * POST /api/apporteur/prospects/:prospectId/schedule-meetings
 * Créer les RDV recommandés pour un prospect
 */
router.post('/:prospectId/schedule-meetings', async (req: Request, res: Response) => {
  try {
    const { prospectId } = req.params;
    const user = req.user as any;
    
    if (!user || user.type !== 'apporteur_affaires') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux apporteurs d\'affaires'
      });
    }
    
    const { meetings } = req.body;
    
    if (!meetings || !Array.isArray(meetings) || meetings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Au moins un RDV requis'
      });
    }
    
    const result = await ProspectSimulationService.createRecommendedMeetings({
      prospect_id: prospectId,
      apporteur_id: user.database_id,
      meetings: meetings
    });
    
    return res.status(201).json({
      success: true,
      message: `${result.created_meetings.length} RDV créés, ${result.notifications_sent.length} experts notifiés`,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Erreur création RDV:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur serveur'
    });
  }
});

/**
 * GET /api/apporteur/simulation/questions/prefilled
 * Obtenir les questions pré-remplies basées sur les données prospect
 */
router.post('/simulation/questions/prefilled', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    
    if (!user || user.type !== 'apporteur_affaires') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux apporteurs d\'affaires'
      });
    }
    
    const { prospect_data } = req.body;
    
    const prefilledAnswers = ProspectSimulationService.prefillSimulationAnswers(prospect_data || {});
    
    return res.json({
      success: true,
      data: {
        prefilled_answers: prefilledAnswers,
        total_prefilled: Object.keys(prefilledAnswers).length
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur pré-remplissage questions:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur serveur'
    });
  }
});

export default router;

