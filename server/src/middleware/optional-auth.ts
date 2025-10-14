import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';

// Types pour l'authentification
type UserType = 'client' | 'expert' | 'admin' | 'apporteur';

// Interface pour l'utilisateur authentifié
interface AuthenticatedUser {
  id: string;
  email: string;
  type: UserType;
  database_id: string;
  permissions?: string[];
  auth_user_id?: string;
  user_metadata: {
    username?: string;
    type: UserType;
    company_name?: string;
    siren?: string;
    phone_number?: string;
    address?: string;
    city?: string;
    postal_code?: string;
  };
  app_metadata: Record<string, any>;
  aud: string;
  created_at: string;
}

// Interface pour la requête avec utilisateur optionnel
export interface OptionalAuthRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Middleware d'authentification OPTIONNELLE
 * Vérifie si un token est présent et valide, mais ne bloque pas si absent
 * Parfait pour les routes qui doivent fonctionner pour les utilisateurs connectés ET anonymes
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('🔓 Optional Auth Middleware - Route:', req.path, 'Method:', req.method);
    
    // 1. Récupération du token
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.log('ℹ️ Aucun token trouvé - Continuation en mode anonyme');
      // Pas de token = on continue sans utilisateur (anonyme)
      next();
      return;
    }
    
    // 2. Vérification et décodage du token JWT
    try {
      const decoded = jwt.verify(token, jwtConfig.secret) as any;
      console.log('✅ Token JWT valide pour:', decoded.email);
      
      // 3. Création de l'objet utilisateur
      const user: AuthenticatedUser = {
        id: decoded.id,
        email: decoded.email,
        type: decoded.type,
        database_id: decoded.database_id || decoded.id,
        permissions: decoded.permissions || [],
        auth_user_id: decoded.id,
        user_metadata: {
          username: decoded.email?.split('@')[0] || 'user',
          type: decoded.type,
          company_name: decoded.company_name,
          siren: decoded.siren,
          phone_number: decoded.phone_number,
          address: decoded.address,
          city: decoded.city,
          postal_code: decoded.postal_code
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      };
      
      // 4. Assignment à la requête
      (req as OptionalAuthRequest).user = user;
      console.log('✅ Utilisateur connecté assigné:', user.email, 'Type:', user.type, 'Database ID:', user.database_id);
      
    } catch (tokenError) {
      console.log('⚠️ Token invalide ou expiré - Continuation en mode anonyme:', tokenError instanceof Error ? tokenError.message : 'Erreur inconnue');
      // Token invalide = on continue sans utilisateur (anonyme)
    }
    
    // 5. Continuer vers la route suivante dans tous les cas
    next();
    
  } catch (error) {
    console.log('⚠️ Erreur dans Optional Auth Middleware - Continuation en mode anonyme:', error instanceof Error ? error.message : 'Erreur inconnue');
    // En cas d'erreur, on continue en mode anonyme
    next();
  }
};

// Export des types pour utilisation dans d'autres fichiers
export type { AuthenticatedUser, UserType };

