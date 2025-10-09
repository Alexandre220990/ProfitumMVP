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
  auth_id?: string;
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

// Interface pour la requête avec utilisateur
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

// Fonction pour ajouter les headers CORS
const addCorsHeaders = (req: Request, res: Response): void => {
  res.header('Access-Control-Allow-Origin', 'https://www.profitum.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Content-Type,Authorization,X-CSRF-Token');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept, Origin');
};

/**
 * Middleware d'authentification simplifié et optimisé
 * Fonctionne uniquement avec les tokens JWT personnalisés
 */
export const simpleAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('🔐 Simple Auth Middleware - Route:', req.path, 'Method:', req.method);
    
    // 1. Récupération du token
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ Aucun token trouvé');
      addCorsHeaders(req, res);
      res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
      return;
    }
    
    // 2. Vérification et décodage du token JWT
    const decoded = jwt.verify(token, jwtConfig.secret) as any;
    console.log('✅ Token JWT valide pour:', decoded.email);
    
    // 3. Création de l'objet utilisateur
    const user: AuthenticatedUser = {
      id: decoded.id,
      email: decoded.email,
      type: decoded.type,
      database_id: decoded.database_id || decoded.id,
      permissions: decoded.permissions || [],
      auth_id: decoded.id,
      user_metadata: {
        username: decoded.email?.split('@')[0] || 'user',
        type: decoded.type
      },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString()
    };
    
    // 4. Assignment à la requête
    (req as AuthenticatedRequest).user = user;
    console.log('✅ Utilisateur assigné:', user.email, 'Type:', user.type);
    
    // 5. Continuer vers la route suivante
    next();
    
  } catch (error) {
    console.log('❌ Erreur d\'authentification:', error instanceof Error ? error.message : 'Erreur inconnue');
    
    addCorsHeaders(req, res);
    res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré'
    });
  }
};

/**
 * Middleware pour vérifier le type d'utilisateur
 */
export const requireUserType = (requiredType: UserType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user) {
      addCorsHeaders(req, res);
      res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
      return;
    }
    
    if (authReq.user.type !== requiredType) {
      console.log(`❌ Type d'utilisateur incorrect. Attendu: ${requiredType}, Reçu: ${authReq.user.type}`);
      addCorsHeaders(req, res);
      res.status(403).json({
        success: false,
        message: `Accès réservé aux ${requiredType}`
      });
      return;
    }
    
    next();
  };
};

// Export des types pour utilisation dans d'autres fichiers
export type { AuthenticatedRequest, AuthenticatedUser, UserType };
