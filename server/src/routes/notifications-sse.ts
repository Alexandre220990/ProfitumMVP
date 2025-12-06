/**
 * Routes SSE (Server-Sent Events) pour notifications temps réel
 */

import express, { Request, Response } from 'express';
import { notificationSSE } from '../services/notification-sse-service';
import { enhancedAuthMiddleware } from '../middleware/auth-enhanced';
import { sseRateLimiter } from '../middleware/rate-limiter';

const router = express.Router();

// Récupérer la clé anonyme avec fallback
const getSupabaseAnonKey = (): string => {
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
  if (!anonKey) {
    console.warn('⚠️ SUPABASE_ANON_KEY non défini, utilisation de SUPABASE_SERVICE_ROLE_KEY');
    return process.env.SUPABASE_SERVICE_ROLE_KEY!;
  }
  return anonKey;
};

/**
 * GET /api/notifications/stream - Connexion SSE pour recevoir les notifications en temps réel
 * Note: EventSource ne supporte pas les headers, donc le token est passé en query param
 * Rate limiter spécifique SSE avec limites élevées pour permettre les reconnexions
 */
router.get('/stream', sseRateLimiter, async (req: Request, res: Response) => {
  try {
    // Log toutes les connexions pour debug (on peut réduire plus tard)
    const shouldLogConnection = true; // Temporairement activé pour debug
    if (shouldLogConnection) {
      console.log('📡 SSE: Nouvelle tentative de connexion');
    }
    
    // Récupérer le token depuis query param (EventSource ne peut pas passer de headers)
    const token = req.query.token as string;

    if (!token) {
      console.log('❌ SSE: Token manquant');
      res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
      return;
    }
    
    // Log du token (preview seulement pour sécurité)
    if (shouldLogConnection) {
      console.log('🔑 SSE: Token reçu (preview):', token.substring(0, 30) + '...');
    }

    // Valider le token JWT personnalisé (comme dans enhancedAuthMiddleware)
    let userId: string;
    let userType: string;
    let tokenValidated = false;
    
    try {
      const jwt = require('jsonwebtoken');
      const { jwtConfig } = await import('../config/jwt');
      const decoded = jwt.verify(token, jwtConfig.secret) as any;
      
      // Le JWT contient id (auth_user_id) et database_id (ID de la table Admin/Client/Expert)
      userId = decoded.id; // auth_user_id pour les requêtes Supabase
      userType = decoded.type || 'client';
      tokenValidated = true;
      
      if (shouldLogConnection) {
        console.log('✅ SSE: Token JWT personnalisé validé');
      }
      
    } catch (jwtError) {
      // Si le JWT échoue, essayer avec Supabase Auth (pour compatibilité)
      if (shouldLogConnection) {
        console.log('🔄 SSE: Tentative validation avec Supabase Auth...');
      }
      
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseAnonKey = getSupabaseAnonKey();
        
        if (!supabaseUrl || !supabaseAnonKey) {
          console.error('❌ SSE: Configuration Supabase manquante', {
            hasUrl: !!supabaseUrl,
            hasAnonKey: !!supabaseAnonKey
          });
          throw new Error('Configuration Supabase manquante');
        }
        
        const supabaseWithToken = createClient(
          supabaseUrl,
          supabaseAnonKey,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          }
        );
        
        const { data, error: authError } = await supabaseWithToken.auth.getUser();
        
        if (authError) {
          console.error('❌ SSE: Erreur Supabase Auth:', {
            message: authError.message,
            status: authError.status,
            name: authError.name
          });
          throw authError;
        }
        
        if (!data?.user) {
          console.error('❌ SSE: Aucun utilisateur retourné par Supabase');
          throw new Error('Token invalide - utilisateur non trouvé');
        }
        
        userId = data.user.id;
        userType = data.user.user_metadata?.type || 'client';
        tokenValidated = true;
        
        if (shouldLogConnection) {
          console.log('✅ SSE: Token Supabase validé', {
            userId: userId.substring(0, 8) + '...',
            userType
          });
        }
      } catch (supabaseError) {
        // Déterminer le type d'erreur
        let isTokenExpired = false;
        let isRateLimited = false;
        let errorMessage = 'Token invalide ou expiré';
        
        if (supabaseError instanceof Error) {
          const errorMsg = supabaseError.message.toLowerCase();
          isTokenExpired = errorMsg.includes('expired') || errorMsg.includes('expiré') || errorMsg.includes('jwt expired');
          isRateLimited = errorMsg.includes('429') || errorMsg.includes('rate limit') || errorMsg.includes('too many');
          
          if (isTokenExpired) {
            errorMessage = 'Token expiré. Veuillez rafraîchir votre session.';
          } else if (isRateLimited) {
            errorMessage = 'Trop de tentatives. Veuillez attendre quelques instants.';
          } else if (errorMsg.includes('invalid') || errorMsg.includes('invalide')) {
            errorMessage = 'Token invalide. Veuillez vous reconnecter.';
          } else {
            errorMessage = `Erreur d'authentification: ${supabaseError.message}`;
          }
        }
        
        // Log détaillé pour comprendre le problème
        const errorDetails = {
          jwtError: jwtError instanceof Error ? jwtError.message : 'Erreur JWT',
          supabaseError: supabaseError instanceof Error ? supabaseError.message : 'Erreur Supabase',
          supabaseErrorName: supabaseError instanceof Error ? supabaseError.name : 'Unknown',
          isTokenExpired,
          isRateLimited,
          tokenPreview: token ? token.substring(0, 30) + '...' : 'null',
          tokenLength: token ? token.length : 0,
          hasSupabaseUrl: !!process.env.SUPABASE_URL,
          hasSupabaseAnonKey: !!getSupabaseAnonKey()
        };
        
        console.error('❌ SSE Auth Error:', errorDetails);
        
        res.status(isRateLimited ? 429 : 401).json({
          success: false,
          message: errorMessage,
          error: supabaseError instanceof Error ? supabaseError.message : 'Erreur d\'authentification',
          code: isTokenExpired ? 'TOKEN_EXPIRED' : isRateLimited ? 'RATE_LIMITED' : 'SSE_AUTH_FAILED',
          tokenExpired: isTokenExpired,
          rateLimited: isRateLimited
        });
        return;
      }
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User ID manquant'
      });
      return;
    }

    // Log seulement une fois toutes les 10 connexions pour éviter les logs redondants
    const shouldLogUser = Math.random() < 0.1; // 10% de chance de logger
    if (shouldLogUser) {
      console.log(`📡 Connexion SSE: ${userType} ${userId.substring(0, 8)}...`);
    }

    // Générer un ID unique pour ce client
    const clientId = `${userId}-${Date.now()}`;

    // Ajouter le client au service SSE
    notificationSSE.addClient(
      clientId,
      userId,
      userType,
      res
    );

    // Envoyer immédiatement les notifications non lues
    setTimeout(async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // ✅ MIGRATION: Pour les admins, récupérer depuis notification
        let unreadNotifications: any[] = [];
        
        if (userType === 'admin' && userId) {
          // Récupérer depuis notification (AdminNotification migrée)
          const { data: adminNotifs } = await supabase
            .from('notification')
            .select('*')
            .eq('user_type', 'admin')
            .eq('user_id', userId)
            .eq('is_read', false)
            .neq('status', 'archived')
            .order('created_at', { ascending: false })
            .limit(20);
          
          if (adminNotifs) {
            unreadNotifications = adminNotifs.map((n: any) => ({
              ...n,
              notification_type: n.notification_type || n.type,
              type: n.notification_type || n.type // Compatibilité
            }));
          }
        } else {
          // Pour les autres types, utiliser la table notification
          const { data: notifs } = await supabase
            .from('notification')
            .select('*')
            .eq('user_id', userId)
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(20);
          
          if (notifs) {
            unreadNotifications = notifs;
          }
        }

        if (unreadNotifications && unreadNotifications.length > 0) {
          res.write(`data: ${JSON.stringify({
            type: 'initial_notifications',
            count: unreadNotifications.length,
            data: unreadNotifications,
            timestamp: new Date().toISOString()
          })}\n\n`);
        }
      } catch (error) {
        console.error('❌ Erreur envoi notifications initiales:', error);
      }
    }, 100);

  } catch (error) {
    console.error('❌ Erreur route SSE stream:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
    return;
  }
});

/**
 * GET /api/notifications/stats - Statistiques clients SSE connectés
 */
router.get('/sse/stats', enhancedAuthMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;

  // Seuls les admins peuvent voir les stats
  if (user?.type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé'
    });
  }

  const stats = notificationSSE.getConnectedClientsCount();

  return res.json({
    success: true,
    data: stats
  });
});

export default router;

