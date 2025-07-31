import express, { Router, Request, Response } from 'express';

import { AuthUser } from '../types/auth';
import { supabase } from '../lib/supabase';

const router = express.Router();

/**
 * Route pour récupérer les informations de l'utilisateur connecté
 * @route GET /api/me
 * @access Private
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;

    // Récupérer les informations selon le type d'utilisateur
    let userData = null;
    
    if (authUser.type === 'client') {
      const { data: client, error } = await supabase
        .from('Client')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération des données client:', error);
        return res.status(500).json({ success: false, message: 'Erreur serveur' });
      }
      
      userData = client;
    } else if (authUser.type === 'expert') {
      const { data: expert, error } = await supabase
        .from('Expert')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération des données expert:', error);
        return res.status(500).json({ success: false, message: 'Erreur serveur' });
      }
      
      userData = expert;
    }

    return res.json({
      success: true,
      data: {
        id: authUser.id,
        email: authUser.email,
        type: authUser.type,
        user_metadata: authUser.user_metadata,
        profile: userData
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des informations utilisateur:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router; 