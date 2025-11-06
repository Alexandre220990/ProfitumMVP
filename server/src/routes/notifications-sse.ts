/**
 * Routes SSE (Server-Sent Events) pour notifications temps réel
 */

import express, { Request, Response } from 'express';
import { notificationSSE } from '../services/notification-sse-service';
import { enhancedAuthMiddleware } from '../middleware/auth-enhanced';

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
 */
router.get('/stream', async (req: Request, res: Response) => {
  try {
    console.log('📡 SSE: Nouvelle tentative de connexion');
    
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

    console.log('🔍 SSE: Token reçu, longueur:', token.length);

    // Vérifier le token JWT avec Supabase
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = getSupabaseAnonKey();
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ SSE: Configuration Supabase manquante');
      res.status(500).json({
        success: false,
        message: 'Configuration serveur invalide'
      });
      return;
    }
    
    console.log('🔍 SSE: Configuration Supabase OK, création client...');
    
    // Créer un client avec le token de l'utilisateur pour validation
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
    
    console.log('🔍 SSE: Client Supabase créé, tentative getUser()');
    
    // Valider le token en récupérant l'utilisateur
    const { data, error: authError } = await supabaseWithToken.auth.getUser();

    if (authError || !data?.user) {
      console.error('❌ SSE Auth Error:', {
        message: authError?.message,
        status: authError?.status,
        hasData: !!data,
        hasUser: !!data?.user
      });
      res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
      return;
    }

    const user = data.user;
    console.log('✅ SSE: Utilisateur validé:', user.id);

    const userId = user.id;
    const userType = user.user_metadata?.type || 'client';

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User ID manquant'
      });
      return;
    }

    console.log(`📡 Nouvelle connexion SSE: ${userType} ${userId}`);

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

        const { data: unreadNotifications } = await supabase
          .from('notification')
          .select('*')
          .eq('user_id', userId)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(20);

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

