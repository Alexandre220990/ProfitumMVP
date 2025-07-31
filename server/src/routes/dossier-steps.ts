import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { DossierStepGenerator } from '../services/dossierStepGenerator';
import { enhancedAuthMiddleware } from '../middleware/auth-enhanced';

const router = Router();

// POST /api/dossier-steps/generate - Générer les étapes pour un dossier spécifique
router.post('/generate', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { dossier_id } = req.body;
    
    if (!dossier_id) {
      return res.status(400).json({
        success: false,
        message: 'dossier_id requis'
      });
    }

    console.log(`🔧 Génération des étapes pour le dossier: ${dossier_id}`);
    
    const success = await DossierStepGenerator.generateStepsForDossier(dossier_id);
    
    if (success) {
      // Mettre à jour le progress du dossier
      await DossierStepGenerator.updateDossierProgress(dossier_id);
      
      return res.json({
        success: true,
        message: 'Étapes générées avec succès'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération des étapes'
      });
    }
  } catch (error) {
    console.error('❌ Erreur génération étapes:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/dossier-steps/generate-all - Générer les étapes pour tous les dossiers éligibles
router.post('/generate-all', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    console.log('🔧 Génération des étapes pour tous les dossiers éligibles...');
    
    const result = await DossierStepGenerator.generateStepsForAllEligibleDossiers();
    
    return res.json({
      success: true,
      message: 'Génération terminée',
      data: result
    });
  } catch (error) {
    console.error('❌ Erreur génération globale:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/dossier-steps/:dossier_id - Récupérer les étapes d'un dossier
router.get('/:dossier_id', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { dossier_id } = req.params;
    
    const { data: steps, error } = await supabase
      .from('DossierStep')
      .select('*')
      .eq('dossier_id', dossier_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Erreur récupération des étapes:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des étapes'
      });
    }

    return res.json({
      success: true,
      data: steps || []
    });
  } catch (error) {
    console.error('❌ Erreur récupération étapes:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PUT /api/dossier-steps/:step_id - Mettre à jour une étape
router.put('/:step_id', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { step_id } = req.params;
    const updateData = req.body;
    
    const { data: step, error } = await supabase
      .from('DossierStep')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', step_id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur mise à jour étape:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'étape'
      });
    }

    // Mettre à jour le progress du dossier parent
    if (step) {
      await DossierStepGenerator.updateDossierProgress(step.dossier_id);
    }

    return res.json({
      success: true,
      data: step
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour étape:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/dossier-steps/auto-generate - Déclencheur automatique
router.post('/auto-generate', async (req: Request, res: Response) => {
  try {
    // Cette route peut être appelée par un webhook ou un cron job
    console.log('🤖 Déclenchement automatique de la génération des étapes...');
    
    const result = await DossierStepGenerator.generateStepsForAllEligibleDossiers();
    
    return res.json({
      success: true,
      message: 'Génération automatique terminée',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur génération automatique:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router; 