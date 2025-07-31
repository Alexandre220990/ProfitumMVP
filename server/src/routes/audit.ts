import express, { Router, Request, Response } from 'express';

import { AuthUser } from '../types/auth';
import { supabase } from '../lib/supabase';

const router = express.Router();

// Route pour créer un audit
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { clientId, type, expertId, documents } = req.body;

    // Vérifier que l'utilisateur a le droit de créer un audit
    if (authUser.type !== 'expert' && authUser.id !== clientId) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Créer l'audit
    const { data: audit, error } = await supabase
      .from('Audit')
      .insert({
        clientId,
        expertId,
        type,
        status: 'en_cours',
        createdAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de l\'audit:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    return res.status(201).json({
      success: true,
      data: audit
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'audit:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router; 