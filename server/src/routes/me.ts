import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

/**
 * Route pour récupérer les informations de l'utilisateur connecté
 * @route GET /api/me
 * @access Private
 */
router.get('/', authMiddleware, (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
  }
  
  // Retourner les informations de l'utilisateur sans données sensibles
  return res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.user_metadata.username,
        type: req.user.type,
        company_name: req.user.user_metadata.company_name || null,
        siren: req.user.user_metadata.siren || null,
        phone_number: req.user.user_metadata.phone_number || null,
        address: req.user.user_metadata.address || null,
        city: req.user.user_metadata.city || null,
        postal_code: req.user.user_metadata.postal_code || null
      }
    }
  });
});

export default router; 