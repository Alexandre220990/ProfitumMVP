import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variables d\'environnement Supabase manquantes');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Types pour l'authentification renforcée
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    type: 'client' | 'expert' | 'admin';
    email: string;
    permissions: string[];
    auth_id: string;
    user_metadata: {
      username: string;
      type: 'client' | 'expert' | 'admin';
      company_name?: string;
      siren?: string;
      phone_number?: string;
      address?: string;
      city?: string;
      postal_code?: string;
    };
    app_metadata: any;
    aud: string;
    created_at: string;
  };
}

// Permissions disponibles
export enum Permission {
  // Permissions clients
  CLIENT_VIEW_OWN_DOSSIERS = 'client:view_own_dossiers',
  CLIENT_ASSIGN_EXPERT = 'client:assign_expert',
  CLIENT_VIEW_MARKETPLACE = 'client:view_marketplace',
  CLIENT_VIEW_OWN_PROFILE = 'client:view_own_profile',
  CLIENT_UPDATE_OWN_PROFILE = 'client:update_own_profile',
  
  // Permissions experts
  EXPERT_VIEW_ASSIGNED_DOSSIERS = 'expert:view_assigned_dossiers',
  EXPERT_UPDATE_DOSSIER = 'expert:update_dossier',
  EXPERT_VIEW_CLIENT_INFO = 'expert:view_client_info',
  EXPERT_VIEW_OWN_PROFILE = 'expert:view_own_profile',
  EXPERT_UPDATE_OWN_PROFILE = 'expert:update_own_profile',
  
  // Permissions admin
  ADMIN_VIEW_ALL = 'admin:view_all',
  ADMIN_MANAGE_USERS = 'admin:manage_users',
  ADMIN_VIEW_ANALYTICS = 'admin:view_analytics',
  ADMIN_MANAGE_SYSTEM = 'admin:manage_system'
}

// Permissions de base par type d'utilisateur
const CLIENT_PERMISSIONS = [
  Permission.CLIENT_VIEW_OWN_DOSSIERS,
  Permission.CLIENT_ASSIGN_EXPERT,
  Permission.CLIENT_VIEW_MARKETPLACE,
  Permission.CLIENT_VIEW_OWN_PROFILE,
  Permission.CLIENT_UPDATE_OWN_PROFILE
];

const EXPERT_PERMISSIONS = [
  Permission.EXPERT_VIEW_ASSIGNED_DOSSIERS,
  Permission.EXPERT_UPDATE_DOSSIER,
  Permission.EXPERT_VIEW_CLIENT_INFO,
  Permission.EXPERT_VIEW_OWN_PROFILE,
  Permission.EXPERT_UPDATE_OWN_PROFILE
];

const ADMIN_PERMISSIONS = [
  Permission.ADMIN_VIEW_ALL,
  Permission.ADMIN_MANAGE_USERS,
  Permission.ADMIN_VIEW_ANALYTICS,
  Permission.ADMIN_MANAGE_SYSTEM
];

// Mapping des permissions par type d'utilisateur
const USER_PERMISSIONS = {
  client: CLIENT_PERMISSIONS,
  expert: EXPERT_PERMISSIONS,
  admin: [
    ...ADMIN_PERMISSIONS,
    // Admins ont aussi toutes les permissions clients et experts
    ...CLIENT_PERMISSIONS,
    ...EXPERT_PERMISSIONS
  ]
};

// Interface pour les logs d'accès
interface AccessLog {
  timestamp: Date;
  userId: string;
  userType: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
}

// Fonction pour logger les accès
const logAccess = async (log: AccessLog) => {
  try {
    await supabase
      .from('access_logs')
      .insert([{
        timestamp: log.timestamp.toISOString(),
        user_id: log.userId,
        user_type: log.userType,
        action: log.action,
        resource: log.resource,
        ip_address: log.ipAddress,
        user_agent: log.userAgent,
        success: log.success,
        error_message: log.errorMessage
      }]);
  } catch (error) {
    logger.error('Erreur lors du log d\'accès:', error);
  }
};

// Middleware d'authentification renforcé
export const enhancedAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  try {
    // 1. Vérification du token d'authentification
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      await logAccess({
        timestamp: new Date(),
        userId: 'anonymous',
        userType: 'anonymous',
        action: req.method,
        resource: req.path,
        ipAddress: ipAddress as string,
        userAgent,
        success: false,
        errorMessage: 'Token manquant'
      });
      
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
    }

    // 2. Validation du token (Supabase ou JWT personnalisé)
    let user;
    let authError = null;
    let jwtUserData = null;
    
    try {
      // Essayer d'abord avec Supabase (pour les tokens de session)
      const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser(token);
      if (sessionUser && !sessionError) {
        user = sessionUser;
      } else {
        // Si ça échoue, essayer de décoder le token JWT personnalisé
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET || 'votre_secret_jwt_super_securise');
          user = {
            id: decoded.id,
            email: decoded.email,
            user_metadata: {
              type: decoded.type
            }
          };
          jwtUserData = decoded; // Stocker les données décodées pour plus tard
        } catch (jwtError) {
          authError = jwtError;
        }
      }
    } catch (error) {
      authError = error;
    }
    
    if (authError || !user) {
      await logAccess({
        timestamp: new Date(),
        userId: 'invalid_token',
        userType: 'anonymous',
        action: req.method,
        resource: req.path,
        ipAddress: ipAddress as string,
        userAgent,
        success: false,
        errorMessage: `Token invalide: ${authError instanceof Error ? authError.message : 'Token non reconnu'}`
      });
      
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    // 3. Récupération des informations utilisateur en base
    let userData: any = null;
    let userType: 'client' | 'expert' | 'admin' = 'client';
    
    // Si on a des données JWT, les utiliser directement
    if (jwtUserData) {
      userData = jwtUserData;
      userType = jwtUserData.type || 'client';
    } else {
      // Vérifier dans la table Client
      const { data: clientData } = await supabase
        .from('Client')
        .select('id, email, auth_id')
        .eq('auth_id', user.id)
        .single();
      
      if (clientData) {
        userData = clientData;
        userType = 'client';
      } else {
        // Vérifier dans la table Expert
        const { data: expertData } = await supabase
          .from('Expert')
          .select('id, email, auth_id, status, approval_status')
          .eq('auth_id', user.id)
          .single();
        
        if (expertData) {
          // Vérifier le statut d'approbation de l'expert
          if (expertData.approval_status !== 'approved') {
            await logAccess({
              timestamp: new Date(),
              userId: user.id,
              userType: 'expert',
              action: req.method,
              resource: req.path,
              ipAddress: ipAddress as string,
              userAgent,
              success: false,
              errorMessage: 'Expert non approuvé'
            });
            
            return res.status(403).json({
              success: false,
              message: 'Votre compte est en cours d\'approbation par les équipes Profitum. Vous recevrez un email dès que votre compte sera validé.',
              approval_status: expertData.approval_status
            });
          }
          
          if (expertData.status !== 'active') {
            await logAccess({
              timestamp: new Date(),
              userId: user.id,
              userType: 'expert',
              action: req.method,
              resource: req.path,
              ipAddress: ipAddress as string,
              userAgent,
              success: false,
              errorMessage: 'Expert inactif'
            });
            
            return res.status(403).json({
              success: false,
              message: 'Compte expert inactif'
            });
          }
          
          userData = expertData;
          userType = 'expert';
        } else {
          // Vérifier dans la table Admin
          const { data: adminData } = await supabase
            .from('Admin')
            .select('id, email, role')
            .eq('id', user.id)
            .single();
          
          if (adminData) {
            userData = adminData;
            userType = 'admin';
          } else {
            // Utilisateur non trouvé dans aucune table
            await logAccess({
              timestamp: new Date(),
              userId: user.id,
              userType: 'unknown',
              action: req.method,
              resource: req.path,
              ipAddress: ipAddress as string,
              userAgent,
              success: false,
              errorMessage: 'Utilisateur non trouvé en base'
            });
            
            return res.status(403).json({
              success: false,
              message: 'Utilisateur non autorisé'
            });
          }
        }
      }
    }

    // 4. Attribution des permissions
    const permissions = USER_PERMISSIONS[userType] || [];

    // 5. Ajout des informations utilisateur à la requête
    (req as unknown as AuthenticatedRequest).user = {
      id: userData.id,
      type: userType,
      email: userData.email,
      permissions,
      auth_id: user.id,
      user_metadata: {
        username: (user.user_metadata as any)?.username || userData.email?.split('@')[0] || 'user',
        type: userType,
        company_name: (user.user_metadata as any)?.company_name,
        siren: (user.user_metadata as any)?.siren,
        phone_number: (user.user_metadata as any)?.phone_number,
        address: (user.user_metadata as any)?.address,
        city: (user.user_metadata as any)?.city,
        postal_code: (user.user_metadata as any)?.postal_code
      },
      app_metadata: user.app_metadata || {},
      aud: user.aud || 'authenticated',
      created_at: user.created_at || new Date().toISOString()
    };

    // 6. Log d'accès réussi
    await logAccess({
      timestamp: new Date(),
      userId: userData.id,
      userType,
      action: req.method,
      resource: req.path,
      ipAddress: ipAddress as string,
      userAgent,
      success: true
    });

    // 7. Log de performance
    const duration = Date.now() - startTime;
    logger.info(`🔐 Auth réussie - ${userType} ${userData.email} - ${req.method} ${req.path} - ${duration}ms`);

    next();
    
  } catch (error) {
    // Log d'erreur
    await logAccess({
      timestamp: new Date(),
      userId: 'error',
      userType: 'error',
      action: req.method,
      resource: req.path,
      ipAddress: ipAddress as string,
      userAgent,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Erreur inconnue'
    });
    
    logger.error('❌ Erreur middleware d\'authentification:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification'
    });
  }
};

// Middleware pour vérifier les permissions spécifiques
export const requirePermission = (requiredPermission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as unknown as AuthenticatedRequest;
    
    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (!authReq.user.permissions.includes(requiredPermission)) {
      logger.warn(`🚫 Permission refusée - ${authReq.user.email} - ${requiredPermission} - ${req.method} ${req.path}`);
      
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    next();
  };
};

// Middleware pour vérifier le type d'utilisateur
export const requireUserType = (requiredType: 'client' | 'expert' | 'admin') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as unknown as AuthenticatedRequest;
    
    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (authReq.user.type !== requiredType) {
      logger.warn(`🚫 Type utilisateur refusé - ${authReq.user.email} - attendu: ${requiredType}, reçu: ${authReq.user.type}`);
      
      return res.status(403).json({
        success: false,
        message: 'Type d\'utilisateur non autorisé'
      });
    }

    next();
  };
};

// Middleware pour les routes publiques (logging seulement)
export const publicRouteLogger = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  await logAccess({
    timestamp: new Date(),
    userId: 'public',
    userType: 'public',
    action: req.method,
    resource: req.path,
    ipAddress: ipAddress as string,
    userAgent,
    success: true
  });
  
  next();
}; 