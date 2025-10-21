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
    
    // Utiliser le client Supabase pour créer les RDV
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const createdMeetings = [];
    const errors = [];
    
    // Créer chaque RDV
    for (const meeting of meetings) {
      try {
        const { data: rdv, error: rdvError } = await supabase
          .from('RDV')
          .insert({
            clientId: prospectId,
            expertId: meeting.expert_id,
            apporteurId: user.database_id,
            dateRdv: meeting.scheduled_date && meeting.scheduled_time 
              ? `${meeting.scheduled_date}T${meeting.scheduled_time}:00`
              : null,
            type: meeting.meeting_type || 'video',
            lieu: meeting.location || '',
            statut: 'planifie',
            notes: meeting.notes || '',
            duration_minutes: meeting.estimated_duration || 60,
            metadata: {
              source: 'apporteur_simulation',
              product_ids: meeting.product_ids || [],
              client_produit_eligible_ids: meeting.client_produit_eligible_ids || [],
              estimated_savings: meeting.estimated_savings || 0,
              created_by: user.database_id
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*')
          .single();
        
        if (rdvError) {
          console.error(`❌ Erreur création RDV pour expert ${meeting.expert_id}:`, rdvError);
          errors.push({ expert_id: meeting.expert_id, error: rdvError.message });
        } else {
          console.log(`✅ RDV créé: ${rdv.id}`);
          createdMeetings.push(rdv);
        }
      } catch (meetingError) {
        console.error('❌ Erreur création RDV individuel:', meetingError);
        errors.push({ expert_id: meeting.expert_id, error: 'Erreur inconnue' });
      }
    }
    
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

