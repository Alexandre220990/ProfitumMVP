import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * ✅ MIDDLEWARE D'AUTHENTIFICATION SIMPLIFIÉ - SUPABASE NATIVE
 * 
 * Vérifie le token Supabase envoyé dans le header Authorization
 * et récupère les informations de l'utilisateur
 */

// Interface pour l'utilisateur authentifié (compatible avec AuthUser)
interface AuthenticatedUser {
  id: string;
  email: string;
  type: 'client' | 'expert' | 'admin' | 'apporteur';
  database_id: string;  // ✅ Obligatoire pour compatibilité avec AuthUser
  user_metadata: Record<string, any>;
  app_metadata: Record<string, any>;
  aud: string;  // ✅ Ajouté pour compatibilité avec AuthUser
  created_at: string;  // ✅ Ajouté pour compatibilité avec AuthUser
}

// Interface pour la requête avec utilisateur
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

// Créer un client Supabase avec la clé ANON pour vérifier les tokens
const supabaseAuth = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

/**
 * Middleware pour vérifier le token Supabase
 */
export const supabaseAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('🔐 [supabase-auth-simple] Vérification token - Route:', req.path);
    
    // 1. Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Aucun token trouvé dans Authorization header');
      res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 2. Vérifier le token avec Supabase
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
    
    if (error || !user) {
      console.error('❌ Token invalide ou expiré:', error?.message);
      res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
      return;
    }

    console.log('✅ Token Supabase valide:', {
      userId: user.id,
      email: user.email,
      type: user.user_metadata?.type
    });

    // 3. Créer l'objet utilisateur authentifié
    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email || '',
      type: (user.user_metadata?.type as 'client' | 'expert' | 'admin' | 'apporteur') || 'client',
      database_id: user.user_metadata?.database_id || user.id,  // ✅ Fallback sur user.id si database_id absent
      user_metadata: user.user_metadata || {},
      app_metadata: user.app_metadata || {},
      aud: user.aud || 'authenticated',
      created_at: user.created_at || new Date().toISOString()
    };

    // 4. Ajouter l'utilisateur à la requête
    (req as AuthenticatedRequest).user = authenticatedUser;
    
    console.log('✅ Utilisateur authentifié:', authenticatedUser.email, 'Type:', authenticatedUser.type);
    
    // 5. Continuer vers la route suivante
    next();
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de l\'authentification'
    });
  }
};

/**
 * Middleware optionnel pour vérifier le type d'utilisateur
 */
export const requireUserType = (requiredType: 'client' | 'expert' | 'admin' | 'apporteur') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
      return;
    }
    
    if (authReq.user.type !== requiredType) {
      console.log(`❌ Type d'utilisateur incorrect. Attendu: ${requiredType}, Reçu: ${authReq.user.type}`);
      res.status(403).json({
        success: false,
        message: `Accès réservé aux ${requiredType}`
      });
      return;
    }
    
    next();
  };
};

