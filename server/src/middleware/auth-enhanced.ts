import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import { jwtConfig } from '../config/jwt';

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
    type: 'client' | 'expert' | 'admin' | 'apporteur';
    email: string;
    permissions: string[];
    auth_user_id: string;
    database_id: string; // ID de la base de données pour les clés étrangères
    user_metadata: {
      username: string;
      type: 'client' | 'expert' | 'admin' | 'apporteur';
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
  
  // Permissions apporteurs d'affaires
  APPORTEUR_VIEW_PROSPECTS = 'apporteur:view_prospects',
  APPORTEUR_CREATE_PROSPECTS = 'apporteur:create_prospects',
  APPORTEUR_VIEW_COMMISSIONS = 'apporteur:view_commissions',
  APPORTEUR_VIEW_OWN_PROFILE = 'apporteur:view_own_profile',
  APPORTEUR_UPDATE_OWN_PROFILE = 'apporteur:update_own_profile',
  
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

const APPORTEUR_PERMISSIONS = [
  Permission.APPORTEUR_VIEW_PROSPECTS,
  Permission.APPORTEUR_CREATE_PROSPECTS,
  Permission.APPORTEUR_VIEW_COMMISSIONS,
  Permission.APPORTEUR_VIEW_OWN_PROFILE,
  Permission.APPORTEUR_UPDATE_OWN_PROFILE
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
  apporteur: APPORTEUR_PERMISSIONS,
  admin: [
    ...ADMIN_PERMISSIONS,
    // Admins ont aussi toutes les permissions clients, experts et apporteurs
    ...CLIENT_PERMISSIONS,
    ...EXPERT_PERMISSIONS,
    ...APPORTEUR_PERMISSIONS
  ]
};

// Fonction utilitaire pour ajouter les headers CORS
const addCorsHeaders = (req: Request, res: Response) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept, Origin');
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

// Mode debug pour logs verbeux
const DEBUG_AUTH = process.env.DEBUG_AUTH === 'true';

// Middleware d'authentification renforcé
export const enhancedAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (DEBUG_AUTH) console.log('🚀 MIDDLEWARE AUTH - Route:', req.path, 'Method:', req.method);
  const startTime = Date.now();
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  try {
    // 1. Vérification du token d'authentification (header Authorization OU cookies Supabase)
    let token = req.headers.authorization?.replace('Bearer ', '');
    // Logs supprimés pour limiter usage Railway
    
    // Si pas de token dans le header, vérifier les cookies Supabase
    if (!token) {
      // Vérifier les cookies de session Supabase
      const supabaseAccessToken = req.cookies?.sb_access_token || req.cookies?.supabase_access_token;
      const supabaseRefreshToken = req.cookies?.sb_refresh_token || req.cookies?.supabase_refresh_token;
      
      if (supabaseAccessToken) {
        token = supabaseAccessToken;
      } else if (supabaseRefreshToken) {
        // Si on a un refresh token mais pas d'access token, essayer de le rafraîchir
        try {
          const { data: { session }, error } = await supabase.auth.refreshSession({
            refresh_token: supabaseRefreshToken
          });
          
          if (session?.access_token && !error) {
            token = session.access_token;
          }
        } catch (refreshError) {
          if (DEBUG_AUTH) console.log('❌ Erreur rafraîchissement token:', refreshError);
        }
      }
    }
    
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
        errorMessage: 'Token manquant (header Authorization et cookies Supabase)'
      });
      
      // S'assurer que les headers CORS sont présents avant d'envoyer la réponse
      addCorsHeaders(req, res);
      
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
    }

    // 2. Validation du token avec Supabase (source de vérité unique)
    let user;
    let authError = null;
    
    try {
      // 🔥 VÉRIFICATION AVEC SUPABASE (pas de JWT personnalisé)
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
      
      if (error || !supabaseUser) {
        throw new Error(error?.message || 'Token invalide');
      }
      
      // Utiliser les données Supabase directement
      user = {
        id: supabaseUser.id, // ID Supabase Auth
        email: supabaseUser.email || '',
        type: supabaseUser.user_metadata?.type || 'client', // Type depuis user_metadata
        database_id: supabaseUser.id, // Par défaut, on utilisera l'ID Supabase
        user_metadata: supabaseUser.user_metadata || { type: 'client' },
        app_metadata: supabaseUser.app_metadata || {},
        aud: supabaseUser.aud || 'authenticated',
        created_at: supabaseUser.created_at || new Date().toISOString()
      };
      
      if (DEBUG_AUTH) console.log('✅ Auth Supabase:', user.email, user.type);
      
      // ASSIGNER L'UTILISATEUR À LA REQUÊTE
      (req as any).user = user;
    } catch (supabaseError) {
      authError = supabaseError;
      console.error('❌ Erreur validation token Supabase:', supabaseError instanceof Error ? supabaseError.message : 'Erreur Supabase');
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
      
      // S'assurer que les headers CORS sont présents avant d'envoyer la réponse
      addCorsHeaders(req, res);
      
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    // 3. Recherche de l'utilisateur dans les tables métier par email
    let userData: any;
    let userType: 'client' | 'expert' | 'admin' | 'apporteur';

    // Utiliser le type depuis user_metadata Supabase comme indicateur
    const typeFromMetadata = user.user_metadata?.type;
    if (DEBUG_AUTH) console.log('🔍 Type depuis metadata:', typeFromMetadata, '- Recherche par email:', user.email);

    // Pour les routes admin, chercher d'abord dans la table Admin
    if (req.path.startsWith('/api/admin')) {
      
      // Chercher d'abord dans Admin
      const { data: adminData, error: adminError } = await supabase
        .from('Admin')
        .select('id, email, name')
        .eq('email', user.email);
      
      if (adminData && adminData.length > 0) {
        // Si c'est un tableau, prendre le premier élément
        const admin = Array.isArray(adminData) ? adminData[0] : adminData;
        userData = admin;
        userType = 'admin';
        if (DEBUG_AUTH) console.log('✅ Admin trouvé:', { adminId: admin.id, email: admin.email });
      } else {
        if (DEBUG_AUTH) console.log('❌ Admin non trouvé, recherche dans les autres tables...');
        
        // Chercher dans Client
        const { data: clientData, error: clientError } = await supabase
          .from('Client')
          .select('id, email, name')
          .eq('email', user.email);
        
        if (clientData && clientData.length > 0) {
          // Si c'est un tableau, prendre le premier élément
          const client = Array.isArray(clientData) ? clientData[0] : clientData;
          userData = client;
          userType = 'client';
          if (DEBUG_AUTH) console.log('✅ Client trouvé:', { clientId: client.id, email: client.email });
        } else {
          // Chercher dans Expert
          const { data: expertData, error: expertError } = await supabase
            .from('Expert')
            .select('id, email, name')
            .eq('email', user.email);
          
          if (expertData && expertData.length > 0) {
            // Si c'est un tableau, prendre le premier élément
            const expert = Array.isArray(expertData) ? expertData[0] : expertData;
            userData = expert;
            userType = 'expert';
            if (DEBUG_AUTH) console.log('✅ Expert trouvé:', { expertId: expert.id, email: expert.email });
          } else {
            if (DEBUG_AUTH) console.log('❌ Utilisateur non trouvé dans aucune table');
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
            
            // S'assurer que les headers CORS sont présents avant d'envoyer la réponse
            addCorsHeaders(req, res);
            
            return res.status(403).json({
              success: false,
              message: 'Utilisateur non autorisé'
            });
          }
        }
      }
    } else {
      // Pour les autres routes, garder l'ordre original
      if (DEBUG_AUTH) console.log('🔍 Recherche standard...');
      
      // Chercher d'abord dans Client
      const { data: clientData, error: clientError } = await supabase
        .from('Client')
        .select('id, email, name')
        .eq('email', user.email);
      
      if (clientData && clientData.length > 0) {
        // Si c'est un tableau, prendre le premier élément
        const client = Array.isArray(clientData) ? clientData[0] : clientData;
        userData = client;
        userType = 'client';
        if (DEBUG_AUTH) console.log('✅ Client trouvé:', { clientId: client.id, email: client.email });
      } else {
        if (DEBUG_AUTH) console.log('❌ Client non trouvé, recherche expert...');
        // Chercher dans Expert
        const { data: expertData, error: expertError } = await supabase
          .from('Expert')
          .select('id, email, name')
          .eq('email', user.email);
        
        if (expertData && expertData.length > 0) {
          // Si c'est un tableau, prendre le premier élément
          const expert = Array.isArray(expertData) ? expertData[0] : expertData;
          userData = expert;
          userType = 'expert';
          if (DEBUG_AUTH) console.log('✅ Expert trouvé:', { expertId: expert.id, email: expert.email });
        } else {
          if (DEBUG_AUTH) console.log('❌ Expert non trouvé, recherche apporteur...');
          // Chercher dans ApporteurAffaires
          const { data: apporteurData, error: apporteurError } = await supabase
            .from('ApporteurAffaires')
            .select('id, email, first_name, last_name, status')
            .eq('email', user.email);
          
          if (apporteurData && apporteurData.length > 0) {
            // Si c'est un tableau, prendre le premier élément
            const apporteur = Array.isArray(apporteurData) ? apporteurData[0] : apporteurData;
            userData = apporteur;
            userType = 'apporteur';
            if (DEBUG_AUTH) console.log('✅ Apporteur trouvé:', { apporteurId: apporteur.id, email: apporteur.email, status: apporteur.status });
          } else {
            if (DEBUG_AUTH) console.log('❌ Apporteur non trouvé, recherche admin...');
            // Vérifier si c'est un admin par email
            const { data: adminData, error: adminError } = await supabase
              .from('Admin')
              .select('id, email, name')
              .eq('email', user.email);
            
            if (adminError) {
              if (DEBUG_AUTH) console.log('⚠️ Erreur recherche admin:', adminError.message);
            }
            
            if (adminData && adminData.length > 0) {
              // Si c'est un tableau, prendre le premier élément
              const admin = Array.isArray(adminData) ? adminData[0] : adminData;
              userData = admin;
              userType = 'admin';
              if (DEBUG_AUTH) console.log('✅ Admin trouvé:', { adminId: admin.id, email: admin.email });
            } else {
              if (DEBUG_AUTH) console.log('❌ Utilisateur non trouvé dans aucune table');
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
              
              // S'assurer que les headers CORS sont présents avant d'envoyer la réponse
              addCorsHeaders(req, res);
              
              return res.status(403).json({
                success: false,
                message: 'Utilisateur non autorisé'
              });
            }
          }
        }
      }
    } // Fin du if/else (admin vs autres routes)

    // 4. Attribution des permissions
    const permissions = USER_PERMISSIONS[userType] || [];

    // 5. Ajout des informations utilisateur à la requête
    const authenticatedUser = {
      id: user.id, // Utiliser l'ID Supabase Auth pour compatibilité
      type: userType,
      email: userData.email,
      permissions,
      auth_user_id: user.id,
      database_id: userData.id, // ID de la base de données pour les clés étrangères
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

    // 6. Définir les paramètres RLS pour Supabase
    try {
      await supabase.rpc('set_config', {
        key: 'app.user_type',
        value: userType
      });
      
      await supabase.rpc('set_config', {
        key: 'app.user_id',
        value: userData.id
      });
      
      if (DEBUG_AUTH) console.log('🔐 Paramètres RLS définis:', { userType, userId: userData.id });
    } catch (error) {
      if (DEBUG_AUTH) console.log('⚠️ Erreur définition paramètres RLS:', error);
    }

    (req as unknown as AuthenticatedRequest).user = authenticatedUser;

    // Log pour debug
    if (DEBUG_AUTH) console.log('🔐 Utilisateur authentifié:', {
      id: authenticatedUser.id,
      type: authenticatedUser.type,
      email: authenticatedUser.email,
      auth_user_id: authenticatedUser.auth_user_id,
      route: req.path,
      method: req.method
    });

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

    return next();
    
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
    
    // S'assurer que les headers CORS sont présents avant d'envoyer la réponse
    addCorsHeaders(req, res);
    
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
      // S'assurer que les headers CORS sont présents avant d'envoyer la réponse
      addCorsHeaders(req, res);
      
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (!authReq.user.permissions.includes(requiredPermission)) {
      logger.warn(`🚫 Permission refusée - ${authReq.user.email} - ${requiredPermission} - ${req.method} ${req.path}`);
      
      // S'assurer que les headers CORS sont présents avant d'envoyer la réponse
      addCorsHeaders(req, res);
      
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    return next();
  };
};

// Middleware pour vérifier le type d'utilisateur
export const requireUserType = (requiredType: 'client' | 'expert' | 'admin' | 'apporteur') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as unknown as AuthenticatedRequest;
    
    if (!authReq.user) {
      // S'assurer que les headers CORS sont présents avant d'envoyer la réponse
      addCorsHeaders(req, res);
      
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (authReq.user.type !== requiredType) {
      logger.warn(`🚫 Type utilisateur refusé - ${authReq.user.email} - attendu: ${requiredType}, reçu: ${authReq.user.type}`);
      
      // S'assurer que les headers CORS sont présents avant d'envoyer la réponse
      addCorsHeaders(req, res);
      
      return res.status(403).json({
        success: false,
        message: 'Type d\'utilisateur non autorisé'
      });
    }

    return next();
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
  
  return next();
}; 