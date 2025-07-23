import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AuthUser } from '../types/auth';
import { logger } from '../utils/logger';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variables d\'environnement Supabase manquantes');
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

// Permissions par type d'utilisateur
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

const USER_PERMISSIONS: Record<'client' | 'expert' | 'admin', Permission[]> = {
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

// Middleware d'authentification unifié et optimisé
export const authenticateUser = async (
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
          jwtUserData = decoded;
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
        errorMessage: 'Token invalide'
      });
      
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    // 3. Vérification du type d'utilisateur en base de données
    let userData: any = null;
    let userType: 'client' | 'expert' | 'admin' = 'client';

    // Vérifier si c'est un client par email
    const { data: clientData } = await supabase
      .from('Client')
      .select('id, email, company_name, name')
      .eq('email', user.email)
      .single();

    if (clientData) {
      userData = clientData;
      userType = 'client';
    } else {
      // Vérifier si c'est un expert par email
      const { data: expertData } = await supabase
        .from('Expert')
        .select('id, email, name, approval_status')
        .eq('email', user.email)
        .single();

      if (expertData) {
        userData = expertData;
        userType = 'expert';
        
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
      } else {
        // Vérifier si c'est un admin par email
        const { data: adminData } = await supabase
          .from('Admin')
          .select('id, email, name')
          .eq('email', user.email)
          .single();

        if (adminData) {
          userData = adminData;
          userType = 'admin';
        }
      }
    }

    if (!userData) {
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
      
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé en base de données'
      });
    }

    // 4. Créer l'objet AuthUser avec les données de la base
    const authUser: AuthUser = {
      id: userData.id,
      email: userData.email || user.email || '',
      type: userType,
      user_metadata: {
        username: userData.company_name || userData.name || user.email?.split('@')[0] || 'user',
        company_name: userData.company_name,
        ...user.user_metadata,
        type: userType
      },
      app_metadata: user.app_metadata || {},
      aud: user.aud || 'authenticated',
      created_at: user.created_at || new Date().toISOString()
    };

    // 5. Ajouter l'utilisateur à la requête (maintenant compatible avec Express global)
    req.user = authUser;

    // 6. Log de l'accès réussi
    await logAccess({
      timestamp: new Date(),
      userId: authUser.id,
      userType: authUser.type,
      action: req.method,
      resource: req.path,
      ipAddress: ipAddress as string,
      userAgent,
      success: true
    });

    const responseTime = Date.now() - startTime;
    logger.info(`✅ Authentification réussie pour ${userType}: ${authUser.email} (${responseTime}ms)`);
    
    return next();
    
  } catch (error) {
    logger.error('Erreur dans le middleware d\'authentification:', error);
    
    await logAccess({
      timestamp: new Date(),
      userId: 'error',
      userType: 'unknown',
      action: req.method,
      resource: req.path,
      ipAddress: ipAddress as string,
      userAgent,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Erreur inconnue'
    });
    
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de l\'authentification'
    });
  }
};

// Middleware pour vérifier le type d'utilisateur
export const requireUserType = (requiredType: 'client' | 'expert' | 'admin') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utilisateur non authentifié' 
      });
    }

    const authUser = req.user as AuthUser;
    if (authUser.type !== requiredType) {
      return res.status(403).json({ 
        success: false, 
        message: `Accès réservé aux ${requiredType}s` 
      });
    }

    return next();
  };
};

// Middleware pour vérifier les permissions
export const requirePermission = (requiredPermission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utilisateur non authentifié' 
      });
    }

    const authUser = req.user as AuthUser;
    const userPermissions = USER_PERMISSIONS[authUser.type] || [];
    
    if (!userPermissions.includes(requiredPermission)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Permissions insuffisantes' 
      });
    }

    return next();
  };
};

// Alias pour compatibilité
export const authenticateToken = authenticateUser;
export const authMiddleware = authenticateUser;
export const enhancedAuthMiddleware = authenticateUser; 