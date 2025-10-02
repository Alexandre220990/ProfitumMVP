import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { AuthenticatedRequest } from './auth-enhanced';

/**
 * ============================================================================
 * MIDDLEWARE DE MISE À JOUR AUTOMATIQUE DE LAST_ACTIVITY_AT
 * ============================================================================
 * 
 * Ce middleware met automatiquement à jour last_activity_at pour les clients
 * à chaque requête authentifiée, sauf pour les routes d'authentification.
 */

export const updateClientActivityMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Vérifier si l'utilisateur est authentifié et est un client
    const user = (req as AuthenticatedRequest).user;
    
    if (!user || user.type !== 'client') {
      return next();
    }

    // Exclure certaines routes qui ne nécessitent pas de mise à jour d'activité
    const excludedRoutes = [
      '/api/auth/login',
      '/api/auth/logout',
      '/api/auth/verify',
      '/api/auth/refresh'
    ];

    const currentPath = req.path;
    const isExcludedRoute = excludedRoutes.some(route => currentPath.startsWith(route));

    if (isExcludedRoute) {
      return next();
    }

    // Mettre à jour last_activity_at de manière asynchrone (non bloquant)
    updateClientActivity(user.database_id).catch(error => {
      console.error('❌ Erreur mise à jour last_activity_at:', error);
      // Ne pas bloquer la requête en cas d'erreur
    });

    next();
  } catch (error) {
    console.error('❌ Erreur middleware updateClientActivity:', error);
    next(); // Continuer même en cas d'erreur
  }
};

/**
 * Fonction utilitaire pour mettre à jour last_activity_at
 */
export const updateClientActivity = async (clientId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('Client')
      .update({ 
        last_activity_at: new Date().toISOString()
      })
      .eq('id', clientId);

    if (error) {
      console.error('❌ Erreur mise à jour last_activity_at:', error);
      throw error;
    }

    console.log('✅ last_activity_at mis à jour pour client:', clientId);
  } catch (error) {
    console.error('❌ Erreur updateClientActivity:', error);
    throw error;
  }
};

/**
 * Fonction pour mettre à jour manuellement last_activity_at
 * Utile pour les actions spécifiques qui nécessitent une mise à jour garantie
 */
export const forceUpdateClientActivity = async (clientId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('Client')
      .update({ 
        last_activity_at: new Date().toISOString()
      })
      .eq('id', clientId);

    if (error) {
      console.error('❌ Erreur forceUpdateClientActivity:', error);
      return false;
    }

    console.log('✅ last_activity_at forcé pour client:', clientId);
    return true;
  } catch (error) {
    console.error('❌ Erreur forceUpdateClientActivity:', error);
    return false;
  }
};
