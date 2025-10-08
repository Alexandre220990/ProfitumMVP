/**
 * ============================================================================
 * ROUTES API - ÉVALUATION ÉLIGIBILITÉ
 * ============================================================================
 */

import { Router, Request, Response } from 'express';
import EligibilityEvaluator from '../services/EligibilityEvaluator';
import { createClient } from '@supabase/supabase-js';

const router = Router();
const evaluator = new EligibilityEvaluator();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * POST /api/eligibility/evaluate
 * Évaluer l'éligibilité basée sur les réponses du simulateur
 */
router.post('/evaluate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      res.status(400).json({
        success: false,
        error: 'Réponses invalides'
      });
      return;
    }

    console.log('📊 Évaluation éligibilité pour', answers.length, 'réponses');

    // Évaluer l'éligibilité
    const results = await evaluator.evaluateEligibility(answers);

    // Formater les résultats
    const formattedResults = evaluator.formatResults(results);

    res.json({
      success: true,
      data: {
        results: results,
        ...formattedResults
      }
    });

  } catch (error) {
    console.error('❌ Erreur évaluation éligibilité:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    });
  }
});

/**
 * GET /api/eligibility/rules
 * Récupérer toutes les règles actives
 */
router.get('/rules', async (req: Request, res: Response) => {
  try {
    const { data: rules, error } = await supabase
      .from('EligibilityRules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: rules
    });

  } catch (error) {
    console.error('❌ Erreur récupération règles:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    });
  }
});

/**
 * GET /api/eligibility/rules/:produitId
 * Récupérer les règles d'un produit spécifique
 */
router.get('/rules/:produitId', async (req: Request, res: Response) => {
  try {
    const { produitId } = req.params;

    const { data: rules, error } = await supabase
      .from('EligibilityRules')
      .select('*')
      .eq('produit_id', produitId)
      .eq('is_active', true);

    if (error) throw error;

    res.json({
      success: true,
      data: rules
    });

  } catch (error) {
    console.error('❌ Erreur récupération règles produit:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    });
  }
});

export default router;

