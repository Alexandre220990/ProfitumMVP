/**
 * Routes Gmail - Récupération des réponses
 */

import express from 'express';
import { GmailService } from '../services/GmailService';

const router = express.Router();

// POST /api/gmail/check-replies - Vérifier les nouvelles réponses
router.post('/check-replies', async (req, res) => {
  try {
    const { since_date } = req.body;
    
    const sinceDate = since_date 
      ? new Date(since_date) 
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // Dernières 24h par défaut

    const result = await GmailService.fetchNewReplies(sinceDate);

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Erreur vérification réponses Gmail:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la vérification des réponses'
    });
  }
});

export default router;

