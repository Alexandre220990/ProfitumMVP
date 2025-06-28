import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler } from '../utils/asyncHandler';
import { RequestWithUser } from '../types/auth';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Route pour obtenir les audits
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const typedReq = req as RequestWithUser;
  if (!typedReq.user?.id) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { data: audits, error } = await supabase
    .from('audits')
    .select('*');

  if (error) throw error;
  res.json(audits);
}));

export default router; 