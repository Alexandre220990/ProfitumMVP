import express, { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { AuthUser } from '../types/auth';
import { enhancedAuthMiddleware, AuthenticatedRequest } from '../middleware/auth-enhanced';

const router = express.Router();

// ============================================================================
// ROUTES GESTION DOCUMENTS EXPERT
// ============================================================================

/**
 * GET /api/expert/dossier/:id/documents
 * Récupérer tous les documents d'un dossier avec leur statut de validation
 */
router.get('/dossier/:id/documents', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: dossierId } = req.params;

    if (!user || user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    console.log('🔍 Récupération documents dossier:', { dossierId, expertId: user.database_id });

    // Vérifier que l'expert est bien assigné au dossier
    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('id, expert_id, "clientId"')
      .eq('id', dossierId)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    if (dossier.expert_id !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Ce dossier n\'est pas assigné à cet expert'
      });
    }

    // Récupérer tous les documents avec validation
    const { data: documents, error: docsError } = await supabase
      .from('ClientProcessDocument')
      .select(`
        id,
        filename,
        storage_path,
        mime_type,
        file_size,
        validation_status,
        workflow_step,
        rejection_reason,
        validated_at,
        created_at,
        validated_by,
        Expert:validated_by (
          id,
          name,
          email
        )
      `)
      .eq('client_produit_id', dossierId)
      .order('created_at', { ascending: false });

    if (docsError) {
      console.error('❌ Erreur récupération documents:', docsError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des documents'
      });
    }

    console.log(`✅ ${documents?.length || 0} document(s) récupéré(s)`);

    return res.json({
      success: true,
      data: documents || []
    });

  } catch (error) {
    console.error('❌ Erreur route documents:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * PUT /api/expert/document/:id/validate
 * Valider un document
 */
router.put('/document/:id/validate', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: documentId } = req.params;

    if (!user || user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    console.log('✅ Validation document:', { documentId, expertId: user.database_id });

    // Récupérer le document et vérifier l'accès
    const { data: document, error: docError } = await supabase
      .from('ClientProcessDocument')
      .select('id, client_produit_id, filename')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Vérifier que l'expert est assigné au dossier
    const { data: dossier } = await supabase
      .from('ClientProduitEligible')
      .select('expert_id')
      .eq('id', document.client_produit_id)
      .single();

    if (!dossier || dossier.expert_id !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Mettre à jour le document
    const { data: updatedDoc, error: updateError } = await supabase
      .from('ClientProcessDocument')
      .update({
        validation_status: 'validated',
        validated_by: user.database_id,
        validated_at: new Date().toISOString(),
        rejection_reason: null,
        status: 'validated'
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur validation document:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la validation'
      });
    }

    console.log(`✅ Document validé:`, updatedDoc.filename);

    return res.json({
      success: true,
      message: 'Document validé avec succès',
      data: updatedDoc
    });

  } catch (error) {
    console.error('❌ Erreur route validation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * PUT /api/expert/document/:id/reject
 * Rejeter un document
 */
router.put('/document/:id/reject', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: documentId } = req.params;
    const { reason } = req.body;

    if (!user || user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La raison du rejet est obligatoire'
      });
    }

    console.log('❌ Rejet document:', { documentId, expertId: user.database_id, reason });

    // Récupérer le document et vérifier l'accès
    const { data: document, error: docError } = await supabase
      .from('ClientProcessDocument')
      .select('id, client_produit_id, filename')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Vérifier que l'expert est assigné au dossier
    const { data: dossier } = await supabase
      .from('ClientProduitEligible')
      .select('expert_id, "clientId"')
      .eq('id', document.client_produit_id)
      .single();

    if (!dossier || dossier.expert_id !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Mettre à jour le document
    const { data: updatedDoc, error: updateError } = await supabase
      .from('ClientProcessDocument')
      .update({
        validation_status: 'rejected',
        validated_by: user.database_id,
        validated_at: new Date().toISOString(),
        rejection_reason: reason,
        status: 'rejected'
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur rejet document:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du rejet'
      });
    }

    // Envoyer notification au client
    try {
      const { data: clientAuth } = await supabase
        .from('Client')
        .select('auth_user_id')
        .eq('id', dossier.clientId)
        .single();

      if (clientAuth?.auth_user_id) {
        await supabase
          .from('notification')
          .insert({
            user_id: clientAuth.auth_user_id,
            user_type: 'client',
            title: `📄 Document rejeté - ${document.filename}`,
            message: `Votre expert a rejeté le document "${document.filename}". Raison : ${reason}. Merci de fournir un nouveau document.`,
            notification_type: 'document_rejected',
            priority: 'high',
            is_read: false,
            action_url: `/produits/dossier/${document.client_produit_id}`,
            action_data: {
              document_id: documentId,
              document_name: document.filename,
              rejection_reason: reason,
              dossier_id: document.client_produit_id
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        console.log('📧 Notification client envoyée pour document rejeté');
      }
    } catch (notifError) {
      console.error('⚠️ Erreur notification (non bloquant):', notifError);
    }

    console.log(`❌ Document rejeté:`, updatedDoc.filename);

    return res.json({
      success: true,
      message: 'Document rejeté avec succès',
      data: updatedDoc
    });

  } catch (error) {
    console.error('❌ Erreur route rejet:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/expert/dossier/:id/request-documents
 * Demander des documents complémentaires au client
 */
router.post('/dossier/:id/request-documents', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: dossierId } = req.params;
    const { documents, notes } = req.body;

    if (!user || user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La liste des documents est obligatoire'
      });
    }

    console.log('📄 Demande documents complémentaires:', { 
      dossierId, 
      expertId: user.database_id,
      count: documents.length 
    });

    // Vérifier que l'expert est assigné au dossier
    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id, 
        expert_id, 
        "clientId",
        ProduitEligible:produitId (
          nom,
          type_produit
        )
      `)
      .eq('id', dossierId)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    if (dossier.expert_id !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Ce dossier n\'est pas assigné à cet expert'
      });
    }

    // Formater la liste des documents demandés
    const requestedDocuments = documents.map((doc: string, index: number) => ({
      id: `doc-${Date.now()}-${index}`,
      name: doc,
      mandatory: true,
      uploaded: false,
      document_id: null,
      uploaded_at: null
    }));

    // Créer la demande de documents
    const { data: request, error: requestError } = await supabase
      .from('document_request')
      .insert({
        dossier_id: dossierId,
        expert_id: user.database_id,
        client_id: dossier.clientId,
        requested_documents: requestedDocuments,
        status: 'pending',
        notes: notes || null,
        notification_sent: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (requestError) {
      console.error('❌ Erreur création demande:', requestError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la demande'
      });
    }

    // Envoyer notification au client
    try {
      const { data: clientAuth } = await supabase
        .from('Client')
        .select('auth_user_id, company_name')
        .eq('id', dossier.clientId)
        .single();

      const { data: expertData } = await supabase
        .from('Expert')
        .select('name')
        .eq('id', user.database_id)
        .single();

      if (clientAuth?.auth_user_id) {
        const produitNom = (dossier as any).ProduitEligible?.nom || 'Produit';
        
        await supabase
          .from('notification')
          .insert({
            user_id: clientAuth.auth_user_id,
            user_type: 'client',
            title: `📄 Documents complémentaires requis - ${produitNom}`,
            message: `Votre expert ${expertData?.name || 'Expert'} a besoin de ${documents.length} document(s) complémentaire(s) pour poursuivre l'analyse de votre dossier ${produitNom}.`,
            notification_type: 'documents_requested',
            priority: 'high',
            is_read: false,
            action_url: `/produits/${(dossier as any).ProduitEligible?.type_produit?.toLowerCase() || 'produit'}/${dossierId}`,
            action_data: {
              request_id: request.id,
              dossier_id: dossierId,
              expert_id: user.database_id,
              documents_count: documents.length,
              requested_documents: requestedDocuments
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        // Marquer la notification comme envoyée
        await supabase
          .from('document_request')
          .update({
            notification_sent: true,
            client_notified_at: new Date().toISOString()
          })
          .eq('id', request.id);

        console.log('📧 Notification client envoyée pour demande documents');
      }
    } catch (notifError) {
      console.error('⚠️ Erreur notification (non bloquant):', notifError);
    }

    console.log(`✅ Demande de ${documents.length} document(s) créée`);

    return res.json({
      success: true,
      message: 'Demande de documents envoyée au client',
      data: request
    });

  } catch (error) {
    console.error('❌ Erreur route demande documents:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/expert/dossier/:id/launch-audit
 * Lancer l'audit technique
 */
router.post('/dossier/:id/launch-audit', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: dossierId } = req.params;

    if (!user || user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    console.log('🔍 Lancement audit:', { dossierId, expertId: user.database_id });

    // Vérifier que l'expert est assigné au dossier
    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id, 
        expert_id, 
        "clientId",
        statut,
        ProduitEligible:produitId (
          nom,
          type_produit
        )
      `)
      .eq('id', dossierId)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    if (dossier.expert_id !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Ce dossier n\'est pas assigné à cet expert'
      });
    }

    // ✅ Validation groupée : Valider automatiquement tous les documents en attente
    const { error: validateError } = await supabase
      .from('ClientProcessDocument')
      .update({
        validation_status: 'validated',
        validated_by: user.database_id,
        validated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('client_produit_id', dossierId)
      .eq('validation_status', 'pending');

    if (validateError) {
      console.error('❌ Erreur validation groupée documents:', validateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la validation des documents'
      });
    }

    console.log('✅ Validation groupée : Tous les documents en attente ont été validés');

    // Mettre à jour le statut du dossier
    const { error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        statut: 'audit_en_cours',
        updated_at: new Date().toISOString()
      })
      .eq('id', dossierId);

    if (updateError) {
      console.error('❌ Erreur mise à jour statut:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du lancement de l\'audit'
      });
    }

    // Mettre à jour l'étape "Audit technique" dans dossierstep
    const { error: stepError } = await supabase
      .from('dossierstep')
      .update({
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('dossier_id', dossierId)
      .eq('step_name', 'Audit technique');

    if (stepError) {
      console.warn('⚠️ Erreur mise à jour étape (non bloquant):', stepError);
    }

    // Envoyer notification au client
    try {
      const { data: clientAuth } = await supabase
        .from('Client')
        .select('auth_user_id')
        .eq('id', dossier.clientId)
        .single();

      const { data: expertData } = await supabase
        .from('Expert')
        .select('name')
        .eq('id', user.database_id)
        .single();

      if (clientAuth?.auth_user_id) {
        const produitNom = (dossier as any).ProduitEligible?.nom || 'Produit';
        
        await supabase
          .from('notification')
          .insert({
            user_id: clientAuth.auth_user_id,
            user_type: 'client',
            title: `🔍 Audit technique lancé - ${produitNom}`,
            message: `Votre expert ${expertData?.name || 'Expert'} a lancé l'audit technique de votre dossier ${produitNom}. Vous serez informé de l'avancement.`,
            notification_type: 'audit_launched',
            priority: 'medium',
            is_read: false,
            action_url: `/produits/${(dossier as any).ProduitEligible?.type_produit?.toLowerCase() || 'produit'}/${dossierId}`,
            action_data: {
              dossier_id: dossierId,
              expert_id: user.database_id,
              launched_at: new Date().toISOString()
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        console.log('📧 Notification client envoyée pour lancement audit');
      }
    } catch (notifError) {
      console.error('⚠️ Erreur notification (non bloquant):', notifError);
    }

    console.log(`✅ Audit lancé pour le dossier ${dossierId}`);

    return res.json({
      success: true,
      message: 'Audit technique lancé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur route lancement audit:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/expert/dossier/:id/document-request
 * Récupérer la dernière demande de documents pour un dossier
 */
router.get('/dossier/:id/document-request', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: dossierId } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    console.log('🔍 Récupération demande documents:', { dossierId, userType: user.type });

    // Récupérer la dernière demande active
    const { data: request, error } = await supabase
      .from('document_request')
      .select(`
        *,
        Expert:expert_id (
          id,
          name,
          email
        ),
        Client:client_id (
          id,
          company_name,
          email
        )
      `)
      .eq('dossier_id', dossierId)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('❌ Erreur récupération demande:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }

    console.log(request ? `✅ Demande trouvée: ${(request.requested_documents as any[]).length} documents` : 'Aucune demande active');

    return res.json({
      success: true,
      data: request || null
    });

  } catch (error) {
    console.error('❌ Erreur route document-request:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router;

