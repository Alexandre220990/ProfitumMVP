import express, { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser } from '../../middleware/authenticate';
import { AuthUser } from '../../types/auth';

const router = express.Router();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// ROUTES DE NOTIFICATIONS
// ============================================================================

// GET /api/expert/notifications - Récupérer les notifications de l'expert
router.get('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    const expertId = authUser.id;
    if (!expertId) {
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

    // Récupérer les notifications
    const { data: notifications, error: notificationsError } = await supabase
      .from('notification')
      .select('*')
      .eq('recipient_id', expertId)
      .eq('recipient_type', 'expert')
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (notificationsError) {
      console.error('❌ Erreur récupération notifications:', notificationsError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des notifications'
      });
    }

    // Compter les notifications non lues
    const { count: unreadCount, error: countError } = await supabase
      .from('notification')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', expertId)
      .eq('recipient_type', 'expert')
      .eq('read', false);

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

// POST /api/expert/notifications/:id/read - Marquer une notification comme lue
router.post('/:id/read', authenticateUser, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
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
      .eq('recipient_id', expertId)
      .eq('recipient_type', 'expert')
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
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('recipient_id', expertId);

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

// POST /api/expert/notifications/mark-all-read - Marquer toutes les notifications comme lues
router.post('/mark-all-read', authenticateUser, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    const expertId = authUser.id;

    if (!expertId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Marquer toutes les notifications non lues comme lues
    const { error: updateError } = await supabase
      .from('notification')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('recipient_id', expertId)
      .eq('recipient_type', 'expert')
      .eq('read', false);

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

// DELETE /api/expert/notifications/:id - Supprimer une notification
router.delete('/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
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
      .eq('recipient_id', expertId)
      .eq('recipient_type', 'expert')
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
      .eq('recipient_id', expertId);

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
router.get('/unread-count', authenticateUser, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
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
      .eq('recipient_id', expertId)
      .eq('recipient_type', 'expert')
      .eq('read', false);

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