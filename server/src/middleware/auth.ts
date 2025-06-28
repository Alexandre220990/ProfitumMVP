import { Response, NextFunction, RequestHandler } from 'express';
import { AuthUser, RequestWithUser } from '../types/auth';
import { createAuthUserFromSupabase } from '../lib/auth';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variables d\'environnement Supabase manquantes');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const authMiddleware: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Vérification avec Supabase Auth uniquement
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.error('Erreur d\'authentification Supabase:', error);
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    // Ajouter l'utilisateur à la requête
    (req as RequestWithUser).user = createAuthUserFromSupabase(user);
    logger.info(`Authentification réussie pour l'utilisateur: ${user.email}`);
    next();
    
  } catch (error) {
    logger.error('Erreur dans le middleware d\'authentification:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de l\'authentification'
    });
  }
};

// Alias pour compatibilité
export const authenticateToken = authMiddleware;

export const requireExpert: RequestHandler = (req, res, next) => {
  const typedReq = req as RequestWithUser;
  if (!typedReq.user) {
    return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
  }

  if (typedReq.user.type !== 'expert') {
    return res.status(403).json({ success: false, message: 'Accès réservé aux experts' });
  }

  next();
};

export const requireClient: RequestHandler = (req, res, next) => {
  const typedReq = req as RequestWithUser;
  if (!typedReq.user) {
    return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
  }

  if (typedReq.user.type !== 'client') {
    return res.status(403).json({ success: false, message: 'Accès réservé aux clients' });
  }

  next();
};

// Fonction pour obtenir le token d'authentification pour les requêtes API Python
export const getAuthHeaders = (token?: string): { [key: string]: string } => {
  const headers: { [key: string]: string } = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}; 