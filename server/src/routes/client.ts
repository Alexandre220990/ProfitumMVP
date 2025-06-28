import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler } from '../utils/asyncHandler';
import { RequestWithUser } from '../types/auth';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Obtenir le profil du client
router.get('/profile', asyncHandler(async (req: Request, res: Response) => {
  const typedReq = req as RequestWithUser;
  if (!typedReq.user?.id) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  // Récupérer le client depuis la table Client en utilisant l'ID directement
  const { data: client, error } = await supabase
    .from('Client')
    .select('*')
    .eq('id', typedReq.user.id)
    .single();

  if (error) {
    console.error('❌ Erreur récupération Client par ID:', error);
    return res.status(404).json({ 
      success: false,
      error: 'Client non trouvé avec cet ID' 
    });
  }

  if (!client) {
    return res.status(404).json({ 
      success: false,
      error: 'Client non trouvé' 
    });
  }

  res.json({
    success: true,
    data: client
  });
}));

// Mettre à jour le profil du client
router.put('/profile', asyncHandler(async (req: Request, res: Response) => {
  const typedReq = req as RequestWithUser;
  if (!typedReq.user?.id) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(req.body)
    .eq('id', typedReq.user.id)
    .select()
    .single();

  if (error) throw error;
  res.json(data);
}));

export default router; 