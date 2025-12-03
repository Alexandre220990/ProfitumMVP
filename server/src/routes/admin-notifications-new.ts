/**
 * Routes pour les notifications admin
 */

import express, { Request, Response } from 'express';
import { enhancedAuthMiddleware, AuthenticatedRequest } from '../middleware/auth-enhanced';
import { AdminNotificationService } from '../services/admin-notification-service';
import { supabase } from '../lib/supabase';

const router = express.Router();

/**
 * POST /api/notifications/admin/documents-eligibility
 * Notifier les admins qu'un client a uploadé des documents de pré-éligibilité
 */
router.post('/admin/documents-eligibility', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { client_produit_id, product_type, documents } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Vérifier que l'utilisateur est un client
    if (user.type !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients'
      });
    }

    if (!client_produit_id || !product_type || !documents) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants (client_produit_id, product_type, documents requis)'
      });
    }

    console.log('📧 Envoi notification admin - Documents pré-éligibilité:', {
      client_produit_id,
      client_id: user.database_id,
      product_type,
      documents_count: documents.length
    });

    // Récupérer les infos du client
    const { data: clientData } = await supabase
      .from('Client')
      .select('company_name, email, name')
      .eq('id', user.database_id)
      .single();

    // Récupérer les infos du produit
    const { data: produitData } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible (
          nom,
          description
        )
      `)
      .eq('id', client_produit_id)
      .single();

    // Envoyer les notifications aux admins
    const result = await AdminNotificationService.notifyDocumentsPreEligibilityUploaded({
      client_produit_id,
      client_id: user.database_id,
      client_name: clientData?.name,
      client_email: clientData?.email,
      client_company: clientData?.company_name,
      product_type,
      product_name: produitData?.ProduitEligible?.nom,
      documents
    });

    if (result.success) {
      console.log(`✅ ${result.notification_ids.length} notifications admin créées`);
      return res.json({
        success: true,
        message: 'Notifications envoyées aux administrateurs',
        data: {
          notification_count: result.notification_ids.length,
          notification_ids: result.notification_ids
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi des notifications'
      });
    }

  } catch (error) {
    console.error('❌ Erreur route notifications admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/notifications/admin
 * Récupérer toutes les notifications pour les admins
 */
router.get('/admin', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Vérifier que l'utilisateur est un admin
    if (user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    // Récupérer toutes les notifications pour cet admin (exclure les remplacées et masquées)
    const { data: notifications, error } = await supabase
      .from('notification')
      .select('*')
      .eq('user_id', user.id)
      .eq('user_type', 'admin')
      .neq('status', 'replaced')
      .eq('hidden_in_list', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ Erreur récupération notifications:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des notifications'
      });
    }

    return res.json({
      success: true,
      data: notifications || [],
      count: notifications?.length || 0
    });

  } catch (error) {
    console.error('❌ Erreur route notifications admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/notifications/:id/children
 * Récupérer les notifications enfants d'une notification parent
 */
router.get('/:id/children', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Récupérer les enfants de cette notification parent
    const { data: children, error } = await supabase
      .from('notification')
      .select('*')
      .eq('parent_id', id)
      .eq('user_id', user.id)
      .neq('status', 'replaced')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération enfants:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des détails'
      });
    }

    return res.json({
      success: true,
      data: children || [],
      count: children?.length || 0
    });

  } catch (error) {
    console.error('❌ Erreur route children:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Marquer une notification comme lue
 * Si c'est un parent, marque aussi tous les enfants
 */
router.put('/:id/read', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Vérifier si c'est un parent
    const { data: notification } = await supabase
      .from('notification')
      .select('is_parent')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    // Marquer la notification comme lue
    const { error } = await supabase
      .from('notification')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Erreur marquage lu:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du marquage'
      });
    }

    // Si c'est un parent, marquer aussi tous les enfants comme lus
    if (notification?.is_parent) {
      const { error: childrenError } = await supabase
        .from('notification')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('parent_id', id)
        .eq('user_id', user.id);

      if (childrenError) {
        console.error('❌ Erreur marquage enfants comme lus:', childrenError);
      } else {
        console.log(`✅ Parent et enfants marqués comme lus pour notification ${id}`);
      }
    }

    return res.json({
      success: true,
      message: notification?.is_parent 
        ? 'Notification et ses détails marqués comme lus'
        : 'Notification marquée comme lue'
    });

  } catch (error) {
    console.error('❌ Erreur marquage lu:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * PUT /api/notifications/:id/dismiss
 * Supprimer/dismisser une notification
 */
router.put('/:id/dismiss', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const { error } = await supabase
      .from('notification')
      .update({
        is_dismissed: true,
        dismissed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Erreur suppression notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression'
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
      message: 'Erreur serveur'
    });
  }
});

export default router;

