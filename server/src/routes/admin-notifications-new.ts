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

export default router;

