import { Request, Response, NextFunction } from 'express';
import { AuthUser } from '../types/auth';

export const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AuthUser;
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Non authentifié' 
        });
      }

      if (!allowedRoles.includes(user.type)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Accès non autorisé' 
        });
      }

      return next();
    } catch (error) {
      console.error('Erreur middleware check-role:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur' 
      });
    }
  };
}; 