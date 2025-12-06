import express, { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

import { AuthUser } from '../../types/auth';

const router = express.Router();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// ROUTES DE NOTIFICATIONS
// ============================================================================

const resolveExpertNotificationIds = (authUser?: AuthUser | null): string[] => {
  if (!authUser) return [];

  const ids = [
    authUser.id,
    authUser.database_id,
    authUser.auth_user_id,
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);

  return Array.from(new Set(ids));
};

// GET /api/expert/notifications - Récupérer les notifications de l'expert
router.get('/', async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser | undefined;
    const expertIds = resolveExpertNotificationIds(authUser);

    if (!authUser || expertIds.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Vérifier que l'utilisateur est un expert
    if (authUser.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    const { limit = 50, offset = 0 } = req.query;

    // Récupérer les notifications (masquer les enfants - système parent/enfant)
    const { data: notifications, error: notificationsError } = await supabase
      .from('notification')
      .select('*')
      .in('user_id', expertIds)
      .eq('user_type', 'expert')
      .eq('hidden_in_list', false) // Ne pas afficher les notifications enfants masquées
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (notificationsError) {
      console.error('❌ Erreur récupération notifications:', notificationsError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des notifications'
      });
    }

    // Compter les notifications non lues (masquer les enfants)
    const { count: unreadCount, error: countError } = await supabase
      .from('notification')
      .select('*', { count: 'exact', head: true })
      .in('user_id', expertIds)
      .eq('user_type', 'expert')
      .eq('hidden_in_list', false) // Ne compter que les parents
      .eq('is_read', false);

    if (countError) {
      console.error('❌ Erreur comptage notifications non lues:', countError);
    }

    return res.json({
      success: true,
      data: {
        notifications: notifications || [],
        unread_count: unreadCount || 0
      }
    });

  } catch (error) {
    console.error('❌ Erreur route notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// GET /api/expert/notifications/:id/children - Récupérer les notifications enfants d'une parent
router.get('/:id/children', async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser | undefined;
    const expertIds = resolveExpertNotificationIds(authUser);

    if (!authUser || expertIds.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Vérifier que l'utilisateur est un expert
    if (authUser.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    const parentId = req.params.id;

    // Vérifier que la notification parent existe et appartient à l'expert
    const { data: parent, error: parentError } = await supabase
      .from('notification')
      .select('id, is_parent')
      .eq('id', parentId)
      .in('user_id', expertIds)
      .eq('user_type', 'expert')
      .single();

    if (parentError || !parent) {
      return res.status(404).json({
        success: false,
        message: 'Notification parent non trouvée'
      });
    }

    if (!parent.is_parent) {
      return res.status(400).json({
        success: false,
        message: 'Cette notification n\'est pas une notification parent'
      });
    }

    // Récupérer les enfants
    const { data: children, error: childrenError } = await supabase
      .from('notification')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false });

    if (childrenError) {
      console.error('❌ Erreur récupération enfants:', childrenError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des notifications enfants'
      });
    }

    return res.json({
      success: true,
      data: {
        children: children || []
      }
    });

  } catch (error) {
    console.error('❌ Erreur route children:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// POST /api/expert/notifications/:id/read - Marquer une notification comme lue
router.post('/:id/read', async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser | undefined;
    const expertIds = resolveExpertNotificationIds(authUser);

    if (!authUser || expertIds.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const notificationId = req.params.id;

    // Vérifier que la notification appartient à l'expert
    const { data: notification, error: checkError } = await supabase
      .from('notification')
      .select('id')
      .eq('id', notificationId)
      .in('user_id', expertIds)
      .eq('user_type', 'expert')
      .single();

    if (checkError || !notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    // Marquer comme lue
    const { error: updateError } = await supabase
      .from('notification')
      .update({
        is_read: true,
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .in('user_id', expertIds);

    if (updateError) {
      console.error('❌ Erreur marquage notification:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du marquage de la notification'
      });
    }

    return res.json({
      success: true,
      message: 'Notification marquée comme lue'
    });

  } catch (error) {
    console.error('❌ Erreur marquage notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// POST /api/expert/notifications/:id/unread - Marquer une notification comme non lue
router.post('/:id/unread', async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser | undefined;
    const expertIds = resolveExpertNotificationIds(authUser);

    if (!authUser || expertIds.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const notificationId = req.params.id;

    const { data: notification, error: checkError } = await supabase
      .from('notification')
      .select('id')
      .eq('id', notificationId)
      .in('user_id', expertIds)
      .eq('user_type', 'expert')
      .single();

    if (checkError || !notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    const { error: updateError } = await supabase
      .from('notification')
      .update({
        is_read: false,
        status: 'unread',
        read_at: null
      })
      .eq('id', notificationId)
      .in('user_id', expertIds);

    if (updateError) {
      console.error('❌ Erreur marquage notification non lue:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du marquage de la notification'
      });
    }

    return res.json({
      success: true,
      message: 'Notification marquée comme non lue'
    });

  } catch (error) {
    console.error('❌ Erreur marquage notification non lue:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// POST /api/expert/notifications/:id/archive - Archiver une notification
router.post('/:id/archive', async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser | undefined;
    const expertIds = resolveExpertNotificationIds(authUser);

    if (!authUser || expertIds.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const notificationId = req.params.id;

    const { data: notification, error: checkError } = await supabase
      .from('notification')
      .select('id')
      .eq('id', notificationId)
      .in('user_id', expertIds)
      .eq('user_type', 'expert')
      .single();

    if (checkError || !notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    const { error: updateError } = await supabase
      .from('notification')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .in('user_id', expertIds);

    if (updateError) {
      console.error('❌ Erreur archivage notification:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'archivage de la notification'
      });
    }

    return res.json({
      success: true,
      message: 'Notification archivée'
    });

  } catch (error) {
    console.error('❌ Erreur archivage notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// POST /api/expert/notifications/:id/unarchive - Restaurer une notification archivée
router.post('/:id/unarchive', async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser | undefined;
    const expertIds = resolveExpertNotificationIds(authUser);

    if (!authUser || expertIds.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const notificationId = req.params.id;

    const { data: notification, error: checkError } = await supabase
      .from('notification')
      .select('id')
      .eq('id', notificationId)
      .in('user_id', expertIds)
      .eq('user_type', 'expert')
      .single();

    if (checkError || !notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    const { error: updateError } = await supabase
      .from('notification')
      .update({
        status: 'read',
        is_read: true,
        archived_at: null,
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .in('user_id', expertIds);

    if (updateError) {
      console.error('❌ Erreur restauration notification:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la restauration de la notification'
      });
    }

    return res.json({
      success: true,
      message: 'Notification restaurée'
    });

  } catch (error) {
    console.error('❌ Erreur restauration notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// POST /api/expert/notifications/mark-all-read - Marquer toutes les notifications comme lues
router.post('/mark-all-read', async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser | undefined;
    const expertIds = resolveExpertNotificationIds(authUser);

    if (!authUser || expertIds.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Marquer toutes les notifications non lues comme lues
    const { error: updateError } = await supabase
      .from('notification')
      .update({
        is_read: true,
        status: 'read',
        read_at: new Date().toISOString()
      })
      .in('user_id', expertIds)
      .eq('user_type', 'expert')
      .eq('is_read', false);

    if (updateError) {
      console.error('❌ Erreur marquage toutes notifications:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du marquage des notifications'
      });
    }

    return res.json({
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues'
    });

  } catch (error) {
    console.error('❌ Erreur marquage toutes notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// POST /api/expert/notifications/archive-all-read - Archiver toutes les notifications lues
router.post('/archive-all-read', async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser | undefined;
    const expertIds = resolveExpertNotificationIds(authUser);

    if (!authUser || expertIds.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Archiver toutes les notifications lues
    const { error: updateError, count } = await supabase
      .from('notification')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('user_id', expertIds)
      .eq('user_type', 'expert')
      .eq('is_read', true)
      .neq('status', 'archived');

    if (updateError) {
      console.error('❌ Erreur archivage toutes notifications:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'archivage des notifications'
      });
    }

    return res.json({
      success: true,
      count: count || 0,
      message: `${count || 0} notification(s) archivée(s)`
    });

  } catch (error) {
    console.error('❌ Erreur archivage toutes notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// DELETE /api/expert/notifications/:id - Supprimer une notification
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const authUser = req.user;
    
    if (!authUser) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    const expertId = authUser.id;
    const notificationId = req.params.id;

    if (!expertId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Vérifier que la notification appartient à l'expert
    const { data: notification, error: checkError } = await supabase
      .from('notification')
      .select('id')
      .eq('id', notificationId)
      .eq('user_id', expertId)
      .eq('user_type', 'expert')
      .single();

    if (checkError || !notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    // Supprimer la notification
    const { error: deleteError } = await supabase
      .from('notification')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', expertId);

    if (deleteError) {
      console.error('❌ Erreur suppression notification:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la notification'
      });
    }

    return res.json({
      success: true,
      message: 'Notification supprimée'
    });

  } catch (error) {
    console.error('❌ Erreur suppression notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// GET /api/expert/notifications/unread-count - Obtenir le nombre de notifications non lues
router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const authUser = req.user;
    
    if (!authUser) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    const expertId = authUser.id;

    if (!expertId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Compter les notifications non lues
    const { count, error } = await supabase
      .from('notification')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', expertId)
      .eq('user_type', 'expert')
      .eq('is_read', false);

    if (error) {
      console.error('❌ Erreur comptage notifications non lues:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du comptage des notifications'
      });
    }

    return res.json({
      success: true,
      data: {
        unread_count: count || 0
      }
    });

  } catch (error) {
    console.error('❌ Erreur comptage notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

export default router; 