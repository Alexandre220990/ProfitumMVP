import express, { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/authenticate';
import { AuthUser } from '../types/auth';
import { supabase } from '../lib/supabase';

const router = express.Router();

// Route pour créer une simulation
router.post('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { clientId, type, data } = req.body;

    // Vérifier que l'utilisateur a le droit de créer une simulation pour ce client
    if (authUser.type !== 'expert' && authUser.id !== clientId) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Créer la simulation
    const { data: simulation, error } = await supabase
      .from('Simulation')
      .insert({
        clientId,
        type,
        data,
        createdBy: authUser.id,
        createdAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de la simulation:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    return res.status(201).json({
      success: true,
      data: simulation
    });
  } catch (error) {
    console.error('Erreur lors de la création de la simulation:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router; 