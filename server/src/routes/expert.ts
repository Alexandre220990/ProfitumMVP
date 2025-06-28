import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/asyncHandler';
import { RequestWithUser } from '../types/auth';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Obtenir le profil de l'expert
router.get('/profile', asyncHandler(async (req: Request, res: Response) => {
  const typedReq = req as RequestWithUser;
  if (!typedReq.user?.id) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { data: profile, error } = await supabase
    .from('experts')
    .select('*')
    .eq('id', typedReq.user.id)
    .single();

  if (error) throw error;
  res.json(profile);
}));

// Mettre à jour le profil de l'expert
router.put('/profile', asyncHandler(async (req: Request, res: Response) => {
  const typedReq = req as RequestWithUser;
  if (!typedReq.user?.id) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { data, error } = await supabase
    .from('experts')
    .update(req.body)
    .eq('id', typedReq.user.id)
    .select()
    .single();

  if (error) throw error;
  res.json(data);
}));

// Obtenir la liste des dossiers de l'expert
router.get('/dossiers', asyncHandler(async (req: Request, res: Response) => {
  const typedReq = req as RequestWithUser;
  if (!typedReq.user?.id) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { data: dossiers, error } = await supabase
    .from('dossiers')
    .select('*')
    .eq('expert_id', typedReq.user.id);

  if (error) throw error;
  res.json(dossiers);
}));

export default router; 