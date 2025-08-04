import express, { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler } from '../utils/asyncHandler';
import { requireUserType } from '../middleware/auth-enhanced';

import * as webpush from 'web-push';

const router = express.Router();

// Configuration Supabase
const supabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configuration VAPID pour les notifications push
// Configuration VAPID pour les notifications push
const vapidKeys = webpush.generateVAPIDKeys();
webpush.setVapidDetails(
  'mailto:admin@financialtracker.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Types
interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  renotify?: boolean;
}

// POST /api/notifications - Créer une notification
router.post('/', asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { user_id, user_type, event_id, event_title, type, message } = req.body;

    // Validation des données
    if (!user_id || !user_type || !type || !message) {
      return res.status(400).json({
        success: false,
        message: 'user_id, user_type, type et message sont requis'
      });
    }

    // Vérifier que l'utilisateur peut créer une notification pour cet utilisateur
    if (userId !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Créer la notification
    const { data: notification, error } = await supabaseClient
      .from('notification')
      .insert({
        user_id,
        user_type,
        event_id,
        event_title,
        notification_type: type,
        message,
        priority: 'medium',
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      data: {
        id: notification.id,
        message: 'Notification créée avec succès'
      }
    });

  } catch (error) {
    console.error('Erreur création notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la notification'
    });
  }
}));

// GET /api/notifications - Récupérer les notifications
router.get('/', asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20, type, priority, read } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabaseClient
      .from('notification')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Filtres
    if (type && type !== 'all') {
      query = query.eq('notification_type', String(type));
    }
    if (priority && priority !== 'all') {
      query = query.eq('priority', String(priority));
    }
    if (read !== undefined) {
      query = query.eq('is_read', read === 'true');
    }

    // Pagination
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: notifications, error, count } = await query;

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data: {
        notifications: notifications || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications'
    });
  }
}));

// POST /api/notifications/push/subscribe - S'abonner aux notifications push
router.post('/push/subscribe', asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { subscription }: { subscription: PushSubscription } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Subscription invalide'
      });
    }

    // Vérifier si l'abonnement existe déjà
    const { data: existingSubscription } = await supabaseClient
      .from('UserDevices')
      .select('*')
      .eq('user_id', userId)
      .eq('push_token', subscription.endpoint)
      .single();

    if (existingSubscription) {
      // Mettre à jour l'abonnement existant
      const { error } = await supabaseClient
        .from('UserDevices')
        .update({
          device_token: JSON.stringify(subscription),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscription.id);

      if (error) throw error;
    } else {
      // Créer un nouvel abonnement
      const { error } = await supabaseClient
        .from('UserDevices')
        .insert({
          user_id: userId,
          device_token: JSON.stringify(subscription),
          push_token: subscription.endpoint,
          device_type: 'web',
          device_name: 'Navigateur Web',
          active: true
        });

      if (error) throw error;
    }

    return res.json({
      success: true,
      message: 'Abonnement push créé avec succès'
    });

  } catch (error) {
    console.error('Erreur abonnement push:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'abonnement'
    });
  }
}));

// POST /api/notifications/push/unsubscribe - Se désabonner des notifications push
router.post('/push/unsubscribe', asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user.id;

    // Supprimer tous les abonnements de l'utilisateur
    const { error } = await supabaseClient
      .from('UserDevices')
      .update({
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('device_type', 'web');

    if (error) throw error;

    return res.json({
      success: true,
      message: 'Désabonnement réussi'
    });

  } catch (error) {
    console.error('Erreur désabonnement push:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du désabonnement'
    });
  }
}));

// POST /api/notifications/push/send - Envoyer une notification push
router.post('/push/send', requireUserType('admin'), asyncHandler(async (req, res) => {
  try {
    const { userId, notification }: { userId: string; notification: NotificationData } = req.body;

    if (!userId || !notification) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes'
      });
    }

    // Récupérer les abonnements de l'utilisateur
    const { data: devices } = await supabaseClient
      .from('UserDevices')
      .select('*')
      .eq('user_id', userId)
      .eq('device_type', 'web')
      .eq('active', true);

    if (!devices || devices.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucun abonnement push trouvé pour cet utilisateur'
      });
    }

    const results = [];
    const errors = [];

    // Envoyer la notification à tous les appareils
    for (const device of devices) {
      try {
        const subscription = JSON.parse(device.device_token);
        
        const payload = JSON.stringify({
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/images/logo.png',
          badge: notification.badge || '/images/badge.png',
          image: notification.image,
          tag: notification.tag || 'default',
          requireInteraction: notification.requireInteraction || false,
          silent: notification.silent || false,
          vibrate: notification.vibrate || [200, 100, 200],
          data: notification.data || {},
          actions: notification.actions || [],
          dir: 'ltr',
          lang: 'fr-FR',
          renotify: notification.renotify || false,
          timestamp: Date.now()
        });

        await webpush.sendNotification(subscription, payload);
        results.push(device.id);
      } catch (error) {
        console.error(`Erreur envoi notification à ${device.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        errors.push({ deviceId: device.id, error: errorMessage });
        
        // Si l'abonnement est invalide, le désactiver
        if (error instanceof Error && 'statusCode' in error && error.statusCode === 410) {
          await supabaseClient
            .from('UserDevices')
            .update({ active: false })
            .eq('id', device.id);
        }
      }
    }

    return res.json({
      success: true,
      data: {
        sent: results.length,
        errors: errors.length,
        details: {
          successful: results,
          failed: errors
        }
      },
      message: `Notification envoyée à ${results.length} appareil(s)`
    });

  } catch (error) {
    console.error('Erreur envoi notification push:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de la notification'
    });
  }
}));

// PUT /api/notifications/:id/read - Marquer une notification comme lue
router.put('/:id/read', asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const { error } = await supabaseClient
      .from('notification')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return res.json({
      success: true,
      message: 'Notification marquée comme lue'
    });

  } catch (error) {
    console.error('Erreur marquage lu:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage'
    });
  }
}));

// PUT /api/notifications/:id/star - Marquer une notification comme favori
router.put('/:id/star', asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { starred } = req.body;

    const { error } = await supabaseClient
      .from('notification')
      .update({
        starred: starred,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return res.json({
      success: true,
      message: `Notification ${starred ? 'ajoutée aux' : 'retirée des'} favoris`
    });

  } catch (error) {
    console.error('Erreur toggle favori:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification'
    });
  }
}));

// DELETE /api/notifications/:id - Supprimer une notification
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const { error } = await supabaseClient
      .from('notification')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return res.json({
      success: true,
      message: 'Notification supprimée'
    });

  } catch (error) {
    console.error('Erreur suppression notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
}));

// GET /api/notifications/preferences - Récupérer les préférences
router.get('/preferences', asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const { data: preferences, error } = await supabaseClient
      .from('UserNotificationPreferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Préférences par défaut si aucune n'existe
    const defaultPreferences = {
      email_enabled: true,
      push_enabled: true,
      sms_enabled: false,
      in_app_enabled: true,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      timezone: 'Europe/Paris',
      language: 'fr',
      priority_filter: ['low', 'medium', 'high', 'urgent'],
      type_filter: []
    };

    return res.json({
      success: true,
      data: {
        preferences: preferences || defaultPreferences
      }
    });

  } catch (error) {
    console.error('Erreur récupération préférences:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des préférences'
    });
  }
}));

// PUT /api/notifications/preferences - Mettre à jour les préférences
router.put('/preferences', asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const updates = req.body;

    // Vérifier si les préférences existent
    const { data: existingPreferences } = await supabaseClient
      .from('UserNotificationPreferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    let preferences;
    if (existingPreferences) {
      // Mettre à jour
      const { data, error } = await supabaseClient
        .from('UserNotificationPreferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      preferences = data;
    } else {
      // Créer
      const { data, error } = await supabaseClient
        .from('UserNotificationPreferences')
        .insert({
          user_id: userId,
          ...updates
        })
        .select()
        .single();

      if (error) throw error;
      preferences = data;
    }

    return res.json({
      success: true,
      data: {
        preferences
      },
      message: 'Préférences mises à jour'
    });

  } catch (error) {
    console.error('Erreur mise à jour préférences:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des préférences'
    });
  }
}));

// GET /api/notifications/vapid-public-key - Obtenir la clé publique VAPID
router.get('/vapid-public-key', (req, res) => {
  return res.json({
    success: true,
    data: {
      publicKey: vapidKeys.publicKey
    }
  });
});

export default router; 