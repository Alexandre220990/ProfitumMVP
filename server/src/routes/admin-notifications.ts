import express, { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { enhancedAuthMiddleware, AuthenticatedRequest } from '../middleware/auth-enhanced';

const router = express.Router();

// ============================================================================
// ROUTES DE NOTIFICATIONS ADMIN
// ============================================================================

// POST /api/notifications/admin/document-validation
// Notification envoyée à l'admin quand un client valide une étape avec documents
router.post('/admin/document-validation', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { client_produit_id, documents, product_type, step } = req.body;
    
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

    if (!client_produit_id || !documents || !product_type || !step) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants'
      });
    }

    // Récupérer les informations du dossier
    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        Client (
          id,
          name,
          email,
          company_name
        ),
        ProduitEligible (
          id,
          nom,
          description
        )
      `)
      .eq('id', client_produit_id)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire du dossier
    if (dossier.clientId !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Créer la notification pour les admins
    const { data: notification, error: notificationError } = await supabase
      .from('AdminNotification')
      .insert({
        type: 'document_validation',
        title: `Validation d'éligibilité ${product_type}`,
        message: `Le client ${dossier.Client?.company_name || dossier.Client?.name || 'Inconnu'} a soumis des documents pour validation de l'éligibilité ${product_type}`,
        status: 'unread',
        is_read: false,
        priority: 'high',
        metadata: {
          client_produit_id,
          client_id: dossier.clientId,
          client_name: dossier.Client?.name,
          client_email: dossier.Client?.email,
          client_company: dossier.Client?.company_name,
          product_type,
          product_name: dossier.ProduitEligible?.nom,
          step,
          documents: documents.map((doc: any) => ({
            id: doc.id,
            type: doc.type,
            filename: doc.filename
          })),
          submitted_at: new Date().toISOString(),
          submitted_by: user.id
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (notificationError) {
      console.error('❌ Erreur création notification:', notificationError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la notification'
      });
    }

    // Mettre à jour le statut du dossier
    const { error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        statut: 'en_attente_validation',
        notes: `Documents soumis pour validation ${product_type} - ${new Date().toLocaleDateString('fr-FR')}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', client_produit_id);

    if (updateError) {
      console.error('❌ Erreur mise à jour dossier:', updateError);
    }

    console.log('✅ Notification admin créée:', {
      notification_id: notification.id,
      client_produit_id,
      product_type,
      documents_count: documents.length
    });

    return res.json({
      success: true,
      message: 'Notification envoyée avec succès',
      data: {
        notification_id: notification.id,
        status: 'pending_validation'
      }
    });

  } catch (error) {
    console.error('❌ Erreur notification admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/notifications/admin - Récupérer les notifications pour les admins
router.get('/admin', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { status, priority, limit = 50 } = req.query;
    
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

    console.log('🔍 Récupération notifications admin - user:', {
      id: user.id,
      type: user.type,
      database_id: user.database_id
    });

    // Récupérer depuis AdminNotification (table globale pour tous les admins)
    let adminNotificationQuery = supabase
      .from('AdminNotification')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (status && status !== 'all') {
      adminNotificationQuery = adminNotificationQuery.eq('status', status);
    }
    
    if (priority) {
      adminNotificationQuery = adminNotificationQuery.eq('priority', priority);
    }
    
    if (limit && Number(limit) > 0) {
      adminNotificationQuery = adminNotificationQuery.limit(Number(limit));
    }
    
    const { data: adminNotifications, error: adminError } = await adminNotificationQuery;
    
    if (adminError) {
      console.error('❌ Erreur récupération AdminNotification:', adminError);
    }

    // Récupérer aussi depuis notification (pour les notifications d'événement et autres)
    const userId = user.id || user.database_id;
    let eventNotifications: any[] = [];
    
    if (userId) {
      console.log(`🔍 Recherche notifications événement pour user_id: ${userId}`);
      
      let eventNotificationQuery = supabase
        .from('notification')
        .select('*')
        .eq('user_id', userId)
        .eq('user_type', 'admin')
        .order('created_at', { ascending: false });
      
      // Si un status spécifique est demandé, filtrer
      if (status && status !== 'all') {
        if (status === 'unread') {
          eventNotificationQuery = eventNotificationQuery.eq('is_read', false);
        } else if (status === 'read') {
          eventNotificationQuery = eventNotificationQuery.eq('is_read', true);
        } else if (status === 'archived') {
          eventNotificationQuery = eventNotificationQuery.eq('status', 'archived');
        }
      }
      
      if (priority) {
        eventNotificationQuery = eventNotificationQuery.eq('priority', priority);
      }
      
      if (limit && Number(limit) > 0) {
        eventNotificationQuery = eventNotificationQuery.limit(Number(limit));
      }
      
      const { data: eventNotifs, error: eventError } = await eventNotificationQuery;
      
      if (eventError) {
        console.error('❌ Erreur récupération notifications événement:', eventError);
      } else {
        eventNotifications = eventNotifs || [];
        console.log(`✅ ${eventNotifications.length} notifications d'événement trouvées`);
      }
    } else {
      console.warn('⚠️ Aucun user_id trouvé dans user, impossible de récupérer les notifications d\'événement');
    }

    // Normaliser les notifications AdminNotification
    const normalizedAdminNotifications = (adminNotifications || []).map((notif: any) => ({
      ...notif,
      is_read: notif.is_read !== undefined ? notif.is_read : (notif.status === 'read' || (notif.read_at !== null && notif.read_at !== undefined)),
      status: notif.status || 'unread',
      notification_type: notif.type || notif.notification_type,
    }));

    // Normaliser les notifications d'événement
    const normalizedEventNotifications = (eventNotifications || []).map((notif: any) => ({
      ...notif,
      is_read: notif.is_read !== undefined ? notif.is_read : (notif.status === 'read'),
      status: notif.status || (notif.is_read ? 'read' : 'unread'),
      notification_type: notif.notification_type || notif.type,
      type: notif.notification_type || notif.type,
    }));

    // Fusionner les deux listes
    const allNotifications = [...normalizedAdminNotifications, ...normalizedEventNotifications];
    
    // Trier par date de création (plus récentes en premier)
    allNotifications.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
    
    // Appliquer la limite globale si nécessaire
    const limitedNotifications = limit && Number(limit) > 0 
      ? allNotifications.slice(0, Number(limit))
      : allNotifications;
    
    console.log(`✅ Notifications récupérées: ${normalizedAdminNotifications.length} AdminNotification + ${normalizedEventNotifications.length} événements = ${limitedNotifications.length} total`);

    return res.json({
      success: true,
      data: limitedNotifications
    });

  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PUT /api/notifications/admin/:id/status - Mettre à jour le statut d'une notification
router.put('/admin/:id/status', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    
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

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Statut requis'
      });
    }

    const { data: notification, error } = await supabase
      .from('AdminNotification')
      .update({
        status,
        admin_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur mise à jour notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la notification'
      });
    }

    // Si la notification est validée, mettre à jour le dossier client
    if (status === 'validated' && notification.metadata?.client_produit_id) {
      const { error: updateError } = await supabase
        .from('ClientProduitEligible')
        .update({
          statut: 'admin_validated',
          notes: `Éligibilité validée par l'admin - ${admin_notes || ''}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', notification.metadata.client_produit_id);

      if (updateError) {
        console.error('❌ Erreur mise à jour dossier après validation:', updateError);
      }
    }

    return res.json({
      success: true,
      message: 'Notification mise à jour avec succès',
      data: notification
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router;
