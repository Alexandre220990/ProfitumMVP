/**
 * ROUTES FCM (FIREBASE CLOUD MESSAGING)
 * 
 * Gestion des tokens FCM et envoi de notifications push background
 */

import express, { Request, Response } from 'express';
import { enhancedAuthMiddleware, AuthenticatedRequest } from '../middleware/auth-enhanced';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// POST /api/notifications/fcm/register
// Enregistrer un token FCM pour un utilisateur
// ============================================================================

router.post('/register', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { fcm_token, device_info } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    if (!fcm_token) {
      return res.status(400).json({
        success: false,
        message: 'Token FCM requis'
      });
    }

    console.log('📝 Enregistrement token FCM:', {
      user_id: user.id,
      user_type: user.type,
      token_preview: fcm_token.substring(0, 20) + '...'
    });

    // Vérifier si ce token existe déjà pour cet utilisateur
    const { data: existingDevice, error: checkError } = await supabase
      .from('UserDevices')
      .select('id, fcm_token, active')
      .eq('user_id', user.id)
      .eq('fcm_token', fcm_token)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Erreur vérification device existant:', checkError);
    }

    if (existingDevice) {
      // Token déjà enregistré, mettre à jour si inactif
      if (!existingDevice.active) {
        const { error: updateError } = await supabase
          .from('UserDevices')
          .update({
            active: true,
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDevice.id);

        if (updateError) {
          throw updateError;
        }

        console.log('✅ Device réactivé');
      }

      return res.json({
        success: true,
        message: 'Token FCM déjà enregistré',
        data: { device_id: existingDevice.id, already_registered: true }
      });
    }

    // Créer un nouvel enregistrement
    const { data: newDevice, error: insertError } = await supabase
      .from('UserDevices')
      .insert({
        user_id: user.id,
        user_type: user.type,
        fcm_token: fcm_token,
        device_type: device_info?.platform || 'web',
        device_name: device_info?.user_agent || 'Web Browser',
        platform: 'web',
        browser: getBrowserFromUserAgent(device_info?.user_agent),
        os: device_info?.platform || 'Unknown',
        app_version: '1.0.0',
        active: true,
        metadata: device_info || {},
        last_used_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log('✅ Nouveau device FCM enregistré:', newDevice.id);

    return res.json({
      success: true,
      message: 'Token FCM enregistré avec succès',
      data: { device_id: newDevice.id }
    });

  } catch (error) {
    console.error('❌ Erreur enregistrement token FCM:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'enregistrement du token'
    });
  }
});

// ============================================================================
// POST /api/notifications/fcm/unregister
// Désenregistrer un token FCM
// ============================================================================

router.post('/unregister', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { fcm_token } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    if (!fcm_token) {
      return res.status(400).json({
        success: false,
        message: 'Token FCM requis'
      });
    }

    console.log('🗑️ Désenregistrement token FCM:', {
      user_id: user.id,
      token_preview: fcm_token.substring(0, 20) + '...'
    });

    // Marquer le device comme inactif (au lieu de supprimer)
    const { error } = await supabase
      .from('UserDevices')
      .update({
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('fcm_token', fcm_token);

    if (error) {
      throw error;
    }

    console.log('✅ Token FCM désactivé');

    return res.json({
      success: true,
      message: 'Token FCM désenregistré'
    });

  } catch (error) {
    console.error('❌ Erreur désenregistrement token FCM:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du désenregistrement'
    });
  }
});

// ============================================================================
// GET /api/notifications/fcm/devices
// Liste des devices enregistrés pour l'utilisateur
// ============================================================================

router.get('/devices', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const { data: devices, error } = await supabase
      .from('UserDevices')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true)
      .order('last_used_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data: devices || [],
      count: devices?.length || 0
    });

  } catch (error) {
    console.error('❌ Erreur récupération devices:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ============================================================================
// DELETE /api/notifications/fcm/devices/:deviceId
// Supprimer un device spécifique
// ============================================================================

router.delete('/devices/:deviceId', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { deviceId } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Vérifier que le device appartient à l'utilisateur
    const { error } = await supabase
      .from('UserDevices')
      .delete()
      .eq('id', deviceId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      message: 'Device supprimé'
    });

  } catch (error) {
    console.error('❌ Erreur suppression device:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ============================================================================
// GET /api/notifications/fcm/vapid-public-key
// Obtenir la clé VAPID publique Firebase
// ============================================================================

router.get('/vapid-public-key', (req, res) => {
  const vapidKey = process.env.FIREBASE_VAPID_KEY || process.env.VITE_FIREBASE_VAPID_KEY;
  
  if (!vapidKey) {
    return res.status(503).json({
      success: false,
      message: 'Clé VAPID Firebase non configurée. Vérifiez les variables d\'environnement.'
    });
  }

  return res.json({
    success: true,
    data: {
      publicKey: vapidKey
    }
  });
});

// ============================================================================
// POST /api/notifications/push/subscribe
// Alias pour compatibilité avec l'ancienne API
// ============================================================================

router.post('/subscribe', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  // Rediriger vers /register
  req.url = '/register';
  return router.handle(req, res);
});

// ============================================================================
// POST /api/notifications/push/unsubscribe
// Alias pour compatibilité avec l'ancienne API
// ============================================================================

router.post('/unsubscribe', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  // Rediriger vers /unregister
  req.url = '/unregister';
  return router.handle(req, res);
});

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Extraire le nom du navigateur depuis le user agent
 */
function getBrowserFromUserAgent(userAgent?: string): string {
  if (!userAgent) return 'Unknown';
  
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  
  return 'Unknown';
}

export default router;

