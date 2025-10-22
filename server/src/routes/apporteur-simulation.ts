import express, { Router, Request, Response } from 'express';
import { ProspectSimulationService } from '../services/ProspectSimulationService';
import { ExpertOptimizationService } from '../services/ExpertOptimizationService';
import { RDVService } from '../services/RDVService';

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
    
    if (!user || user.type !== 'apporteur') {
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
    
    if (!user || user.type !== 'apporteur') {
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
    
    if (!user || user.type !== 'apporteur') {
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
 * 
 * Cette route crée plusieurs RDV entre le prospect et les experts recommandés.
 * Utilisée après la simulation pour planifier les rencontres.
 */
router.post('/:prospectId/schedule-meetings', async (req: Request, res: Response) => {
  try {
    const { prospectId } = req.params;
    const user = req.user as any;
    
    if (!user || user.type !== 'apporteur') {
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
    
    console.log(`📅 Création de ${meetings.length} RDV pour prospect ${prospectId}...`);
    
    // Préparer les RDV pour le service
    const rdvToCreate = meetings.map(meeting => ({
      client_id: prospectId,
      expert_id: meeting.expert_id || null,
      apporteur_id: user.database_id,
      meeting_type: meeting.meeting_type || 'video',
      scheduled_date: meeting.scheduled_date,
      scheduled_time: meeting.scheduled_time,
      duration_minutes: meeting.estimated_duration || 60,
      location: meeting.location || null,
      meeting_url: meeting.meeting_url || null,
      notes: meeting.notes || '',
      source: 'apporteur_simulation',
      category: 'client_rdv',
      priority: 1,
      created_by: user.database_id,
      product_ids: meeting.client_produit_eligible_ids || meeting.product_ids || [],
      metadata: {
        estimated_savings: meeting.estimated_savings || 0,
        simulation_id: meeting.simulation_id || null
      }
    }));
    
    // Créer tous les RDV via le service
    const results = await RDVService.createMultipleRDV(rdvToCreate);
    
    const createdMeetings = results.success;
    const errors = results.failed.map(f => ({
      expert_id: f.data.expert_id,
      error: f.error
    }));
    
    console.log(`📦 ${createdMeetings.length}/${meetings.length} RDV créés`);
    
    return res.status(createdMeetings.length > 0 ? 201 : 500).json({
      success: createdMeetings.length > 0,
      message: `${createdMeetings.length} RDV créé(s) avec succès${errors.length > 0 ? `, ${errors.length} erreur(s)` : ''}`,
      data: {
        created_meetings: createdMeetings,
        errors: errors,
        total_created: createdMeetings.length,
        total_errors: errors.length
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur création RDV:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur serveur'
    });
  }
});

export default router;

