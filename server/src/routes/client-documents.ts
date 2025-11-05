import express, { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { AuthUser } from '../types/auth';
import { enhancedAuthMiddleware, AuthenticatedRequest } from '../middleware/auth-enhanced';

const router = express.Router();

// ============================================================================
// ROUTES DOCUMENTS CLIENT
// ============================================================================

/**
 * GET /api/client/dossier/:id/document-request
 * Récupérer la demande de documents complémentaires pour un dossier
 */
router.get('/dossier/:id/document-request', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: dossierId } = req.params;

    if (!user || user.type !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients'
      });
    }

    console.log('🔍 Client - Récupération demande documents:', { dossierId, clientId: user.database_id });

    // Vérifier que le dossier appartient au client
    const { data: dossier } = await supabase
      .from('ClientProduitEligible')
      .select('"clientId"')
      .eq('id', dossierId)
      .single();

    if (!dossier || dossier.clientId !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Récupérer la dernière demande active
    const { data: request, error } = await supabase
      .from('document_request')
      .select(`
        *,
        Expert:expert_id (
          id,
          name,
          email
        )
      `)
      .eq('dossier_id', dossierId)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
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

/**
 * POST /api/client/dossier/:id/validate-complementary-documents
 * Valider que tous les documents complémentaires ont été fournis
 */
router.post('/dossier/:id/validate-complementary-documents', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: dossierId } = req.params;

    if (!user || user.type !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients'
      });
    }

    console.log('✅ Client - Validation documents complémentaires:', { dossierId, clientId: user.database_id });

    // Vérifier que le dossier appartient au client
    const { data: dossier } = await supabase
      .from('ClientProduitEligible')
      .select('"clientId", expert_id')
      .eq('id', dossierId)
      .single();

    if (!dossier || dossier.clientId !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Marquer la demande comme complétée
    const { error: updateError } = await supabase
      .from('document_request')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('dossier_id', dossierId)
      .in('status', ['pending', 'in_progress']);

    if (updateError) {
      console.error('❌ Erreur mise à jour demande:', updateError);
    }

    // Mettre à jour l'étape dans dossierstep
    const { error: stepError } = await supabase
      .from('dossierstep')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('dossier_id', dossierId)
      .eq('step_name', 'Collecte des documents');

    if (stepError) {
      console.warn('⚠️ Erreur mise à jour étape:', stepError);
    }

    // 📅 TIMELINE : Ajouter événement documents complémentaires envoyés
    try {
      const { DossierTimelineService } = await import('../services/dossier-timeline-service');
      
      // Récupérer le nom du client
      const { data: clientData } = await supabase
        .from('Client')
        .select('company_name')
        .eq('id', user.database_id)
        .single();

      const clientName = clientData?.company_name || 'Client';
      
      // Compter les documents de la demande
      const { data: requestData } = await supabase
        .from('document_request')
        .select('requested_documents')
        .eq('dossier_id', dossierId)
        .in('status', ['completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const requestedDocs = (requestData?.requested_documents as any[]) || [];
      const uploadedDocs = requestedDocs
        .filter((doc: any) => doc.uploaded)
        .map((doc: any) => doc.name);
      
      await DossierTimelineService.documentsComplementairesUploades({
        dossier_id: dossierId,
        client_name: clientName,
        documents_count: uploadedDocs.length,
        documents: uploadedDocs
      });

      console.log('✅ Événement timeline ajouté (documents complémentaires uploadés)');
    } catch (timelineError) {
      console.error('⚠️ Erreur timeline (non bloquant):', timelineError);
    }

    // Envoyer notification à l'expert
    if (dossier.expert_id) {
      try {
        const { data: expertData } = await supabase
          .from('Expert')
          .select('auth_user_id, name')
          .eq('id', dossier.expert_id)
          .single();

        const { data: clientData } = await supabase
          .from('Client')
          .select('company_name')
          .eq('id', dossier.clientId)
          .single();

        if (expertData?.auth_user_id) {
          await supabase
            .from('notification')
            .insert({
              user_id: expertData.auth_user_id,
              user_type: 'expert',
              title: `✅ Documents complémentaires reçus`,
              message: `${clientData?.company_name || 'Le client'} a fourni tous les documents complémentaires demandés. Vous pouvez maintenant consulter le dossier.`,
              notification_type: 'documents_completed',
              priority: 'medium',
              is_read: false,
              action_url: `/expert/dossier/${dossierId}`,
              action_data: {
                dossier_id: dossierId,
                client_id: dossier.clientId,
                completed_at: new Date().toISOString()
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          console.log('📧 Notification expert envoyée (documents complets)');
        }
      } catch (notifError) {
        console.error('⚠️ Erreur notification (non bloquant):', notifError);
      }
    }

    console.log(`✅ Documents complémentaires validés pour le dossier ${dossierId}`);

    return res.json({
      success: true,
      message: 'Documents complémentaires validés avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur validation documents:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/client/dossier/:id/validate-step-3
 * Valider l'étape 3 "Collecte des documents" du workflow
 * Vérifie que tous les documents rejetés ont été remplacés et que tous les documents demandés ont été fournis
 */
router.post('/dossier/:id/validate-step-3', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: dossierId } = req.params;

    if (!user || user.type !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients'
      });
    }

    console.log('✅ Client - Validation étape 3:', { dossierId, clientId: user.database_id });

    // Vérifier que le dossier appartient au client
    const { data: dossier } = await supabase
      .from('ClientProduitEligible')
      .select('"clientId", expert_id, metadata')
      .eq('id', dossierId)
      .single();

    if (!dossier || dossier.clientId !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Vérifier les documents rejetés
    const { data: rejectedDocs, error: rejectedError } = await supabase
      .from('ClientProcessDocument')
      .select('id, filename, document_type')
      .eq('client_produit_id', dossierId)
      .eq('validation_status', 'rejected');

    if (rejectedError) {
      console.error('❌ Erreur vérification documents rejetés:', rejectedError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des documents'
      });
    }

    // ✅ VÉRIFICATION AVEC VERSIONING : Exclure les documents rejetés qui ont été remplacés
    const { data: allDocs } = await supabase
      .from('ClientProcessDocument')
      .select('id, parent_document_id, validation_status')
      .eq('client_produit_id', dossierId);

    // Filtrer les documents rejetés qui n'ont PAS été remplacés
    const unresolvedRejectedDocs = (rejectedDocs || []).filter(rejectedDoc => {
      // Vérifier s'il existe un document de remplacement (avec parent_document_id = rejectedDoc.id)
      const hasReplacement = (allDocs || []).some(doc => 
        doc.parent_document_id === rejectedDoc.id && 
        doc.validation_status !== 'rejected' // Le remplacement doit être pending ou validated
      );
      return !hasReplacement; // Garder seulement ceux qui n'ont PAS de remplacement
    });

    console.log('🔍 Vérification documents rejetés:', {
      total_rejected: rejectedDocs?.length || 0,
      unresolved_rejected: unresolvedRejectedDocs.length
    });

    // Vérifier la demande de documents complémentaires
    const { data: documentRequest } = await supabase
      .from('document_request')
      .select('id, requested_documents, status')
      .eq('dossier_id', dossierId)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Compter les documents encore manquants
    const rejectedDocsCount = unresolvedRejectedDocs.length; // ✅ Utiliser la version filtrée
    const requestedDocs = (documentRequest?.requested_documents as any[]) || [];
    const missingRequiredDocs = requestedDocs.filter((doc: any) => doc.required && !doc.uploaded);

    if (rejectedDocsCount > 0 || missingRequiredDocs.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tous les documents requis n\'ont pas encore été fournis',
        details: {
          rejected_docs_count: rejectedDocsCount,
          missing_required_docs: missingRequiredDocs.length,
          unresolved_rejected: unresolvedRejectedDocs.map(d => d.filename)
        }
      });
    }

    // Marquer l'étape 3 comme complétée
    const { error: stepError } = await supabase
      .from('DossierStep')
      .update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('dossier_id', dossierId)
      .eq('step_name', 'Collecte des documents');

    if (stepError) {
      console.error('❌ Erreur mise à jour étape:', stepError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'étape'
      });
    }

    // Marquer la demande de documents comme complétée si elle existe
    if (documentRequest) {
      await supabase
        .from('document_request')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', documentRequest.id);
    }

    // Mettre à jour le statut du dossier
    await supabase
      .from('ClientProduitEligible')
      .update({
        statut: 'documents_completes',
        metadata: {
          ...(dossier.metadata as any || {}),
          documents_missing: false,
          step_3_completed_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', dossierId);

    // Activer l'étape 4 "Audit technique"
    await supabase
      .from('DossierStep')
      .update({
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('dossier_id', dossierId)
      .eq('step_name', 'Audit technique')
      .eq('status', 'pending');

    // 📅 TIMELINE : Ajouter événement étape 3 complétée
    try {
      const { DossierTimelineService } = await import('../services/dossier-timeline-service');
      
      const { data: clientData } = await supabase
        .from('Client')
        .select('company_name')
        .eq('id', user.database_id)
        .single();

      const clientName = clientData?.company_name || 'Client';
      
      await DossierTimelineService.addEvent({
        dossier_id: dossierId,
        type: 'status_change',
        actor_type: 'client',
        actor_name: clientName,
        title: '✅ Étape 3 validée : Collecte des documents',
        description: `${clientName} a fourni tous les documents requis. L'étape de collecte des documents est maintenant complétée.`,
        metadata: {
          step_number: 3,
          step_name: 'Collecte des documents',
          validated_at: new Date().toISOString()
        },
        icon: '✅',
        color: 'green'
      });

      console.log('✅ Événement timeline ajouté (étape 3 validée)');
    } catch (timelineError) {
      console.error('⚠️ Erreur timeline (non bloquant):', timelineError);
    }

    // Envoyer notification à l'expert
    if (dossier.expert_id) {
      try {
        const { data: expertData } = await supabase
          .from('Expert')
          .select('auth_user_id, name')
          .eq('id', dossier.expert_id)
          .single();

        const { data: clientData } = await supabase
          .from('Client')
          .select('company_name')
          .eq('id', dossier.clientId)
          .single();

        if (expertData?.auth_user_id) {
          await supabase
            .from('notification')
            .insert({
              user_id: expertData.auth_user_id,
              user_type: 'expert',
              title: `✅ Étape 3 complétée - Documents collectés`,
              message: `${clientData?.company_name || 'Le client'} a fourni tous les documents requis. Vous pouvez maintenant procéder à l'audit technique.`,
              notification_type: 'step_completed',
              priority: 'high',
              is_read: false,
              action_url: `/expert/dossier/${dossierId}`,
              action_data: {
                dossier_id: dossierId,
                client_id: dossier.clientId,
                step_number: 3,
                step_name: 'Collecte des documents',
                completed_at: new Date().toISOString()
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          console.log('📧 Notification expert envoyée (étape 3 validée)');
        }
      } catch (notifError) {
        console.error('⚠️ Erreur notification (non bloquant):', notifError);
      }
    }

    console.log(`✅ Étape 3 validée pour le dossier ${dossierId}`);

    return res.json({
      success: true,
      message: 'Étape 3 validée avec succès ! L\'expert va maintenant procéder à l\'audit technique.'
    });

  } catch (error) {
    console.error('❌ Erreur validation étape 3:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/client/dossier/:id/documents
 * Récupérer tous les documents d'un dossier (pour le client)
 */
router.get('/dossier/:id/documents', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: dossierId } = req.params;

    if (!user || user.type !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients'
      });
    }

    // Vérifier que le dossier appartient au client
    const { data: dossier } = await supabase
      .from('ClientProduitEligible')
      .select('"clientId"')
      .eq('id', dossierId)
      .single();

    if (!dossier || dossier.clientId !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Récupérer tous les documents (uniquement les versions actives, pas les remplacements)
    // Un document est "actif" s'il n'a pas été remplacé (is_replacement = false)
    // OU s'il est la dernière version (pas de document plus récent avec même parent)
    const { data: allDocuments, error: fetchError } = await supabase
      .from('ClientProcessDocument')
      .select('*')
      .eq('client_produit_id', dossierId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Erreur récupération documents:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des documents'
      });
    }

    // Filtrer pour ne garder que les versions actives
    // Un document est "actif" si :
    // 1. Il n'a pas de parent (document original)
    // 2. OU il est la dernière version de son parent
    const activeDocuments = (allDocuments || []).filter(doc => {
      // Si pas de parent, c'est un document original = actif
      if (!doc.parent_document_id) {
        // Vérifier qu'il n'existe pas un remplacement plus récent
        const hasNewerReplacement = (allDocuments || []).some(other => 
          other.parent_document_id === doc.id && 
          new Date(other.created_at) > new Date(doc.created_at)
        );
        return !hasNewerReplacement;
      }
      
      // Si c'est un remplacement, vérifier qu'il est le plus récent
      const newerReplacements = (allDocuments || []).filter(other => 
        other.parent_document_id === doc.parent_document_id &&
        new Date(other.created_at) > new Date(doc.created_at)
      );
      return newerReplacements.length === 0;
    });

    // Mapper les données pour le frontend (avec fallbacks)
    const documents = activeDocuments.map(doc => ({
      id: doc.id,
      filename: doc.filename,
      original_filename: doc.filename, // Fallback si colonne n'existe pas
      storage_path: doc.storage_path,
      bucket_name: doc.bucket_name,
      mime_type: doc.mime_type,
      file_size: doc.file_size,
      validation_status: doc.validation_status || doc.status || 'pending',
      rejection_reason: doc.rejection_reason,
      workflow_step: doc.workflow_step,
      document_type: doc.document_type,
      created_at: doc.created_at,
      validated_at: doc.validated_at,
      updated_at: doc.updated_at,
      parent_document_id: doc.parent_document_id,
      version_number: doc.version_number || 1,
      is_replacement: doc.is_replacement || false
    }));

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
 * GET /api/client/document/:id/view
 * Visualiser un document (stream du fichier avec authentification)
 */
router.get('/document/:id/view', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: documentId } = req.params;

    if (!user || user.type !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients'
      });
    }

    console.log('👁️ Client - Visualisation document:', { documentId, clientId: user.database_id });

    // Récupérer les infos du document + vérifier la propriété via client_produit_id
    const { data: document, error: docError } = await supabase
      .from('ClientProcessDocument')
      .select(`
        id,
        filename,
        storage_path,
        bucket_name,
        mime_type,
        client_produit_id,
        ClientProduitEligible:client_produit_id (
          id,
          "clientId"
        )
      `)
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('❌ Document non trouvé:', docError);
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Vérifier que le document appartient au client
    const dossier = (document as any).ClientProduitEligible;
    if (!dossier || dossier.clientId !== user.database_id) {
      console.error('❌ Accès refusé:', { 
        dossierClientId: dossier?.clientId, 
        userClientId: user.database_id 
      });
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce document'
      });
    }

    // Télécharger le fichier depuis Supabase Storage
    const bucketName = (document as any).bucket_name || 'client-documents';
    
    console.log('📥 Tentative téléchargement Storage:', {
      bucket: bucketName,
      path: document.storage_path
    });

    // Nettoyer le path si nécessaire (enlever préfixe bucket si présent)
    let cleanPath = document.storage_path;
    if (cleanPath.startsWith('documents/')) {
      cleanPath = cleanPath.replace('documents/', '');
    }
    if (cleanPath.startsWith('client-documents/')) {
      cleanPath = cleanPath.replace('client-documents/', '');
    }

    console.log('📥 Téléchargement:', { bucket: bucketName, cleanPath });

    const { data: fileData, error: storageError } = await supabase.storage
      .from(bucketName)
      .download(cleanPath);

    if (storageError || !fileData) {
      console.error('❌ Erreur téléchargement Storage:', {
        error: storageError,
        originalPath: document.storage_path,
        cleanedPath: cleanPath
      });
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du fichier'
      });
    }

    console.log(`✅ Document récupéré pour visualisation: ${document.filename} (${document.mime_type})`);

    // Envoyer le fichier avec les bons headers pour visualisation inline
    res.setHeader('Content-Type', document.mime_type || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${document.filename}"`);
    
    // Convertir le blob en buffer et l'envoyer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return res.send(buffer);

  } catch (error) {
    console.error('❌ Erreur visualisation document:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/client/document/:id/download
 * Télécharger un document (force le téléchargement)
 */
router.get('/document/:id/download', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: documentId } = req.params;

    if (!user || user.type !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients'
      });
    }

    console.log('📥 Client - Téléchargement document:', { documentId, clientId: user.database_id });

    // Récupérer les infos du document + vérifier la propriété via client_produit_id
    const { data: document, error: docError } = await supabase
      .from('ClientProcessDocument')
      .select(`
        id,
        filename,
        storage_path,
        bucket_name,
        mime_type,
        client_produit_id,
        ClientProduitEligible:client_produit_id (
          id,
          "clientId"
        )
      `)
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('❌ Document non trouvé:', docError);
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Vérifier que le document appartient au client
    const dossier = (document as any).ClientProduitEligible;
    if (!dossier || dossier.clientId !== user.database_id) {
      console.error('❌ Accès refusé:', { 
        dossierClientId: dossier?.clientId, 
        userClientId: user.database_id 
      });
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce document'
      });
    }

    // Télécharger le fichier depuis Supabase Storage
    const bucketName = (document as any).bucket_name || 'client-documents';
    
    // Nettoyer le path si nécessaire
    let cleanPath = document.storage_path;
    if (cleanPath.startsWith('documents/')) {
      cleanPath = cleanPath.replace('documents/', '');
    }
    if (cleanPath.startsWith('client-documents/')) {
      cleanPath = cleanPath.replace('client-documents/', '');
    }

    const { data: fileData, error: storageError } = await supabase.storage
      .from(bucketName)
      .download(cleanPath);

    if (storageError || !fileData) {
      console.error('❌ Erreur téléchargement Storage:', {
        error: storageError,
        originalPath: document.storage_path,
        cleanedPath: cleanPath
      });
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du fichier'
      });
    }

    console.log(`✅ Document récupéré pour téléchargement: ${document.filename}`);

    // Envoyer le fichier avec les bons headers pour forcer le téléchargement
    res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
    
    // Convertir le blob en buffer et l'envoyer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return res.send(buffer);

  } catch (error) {
    console.error('❌ Erreur téléchargement document:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/client/dossier/:id/confirm-payment-received
 * Client confirme avoir reçu le remboursement (finalisation dossier)
 */
router.post('/dossier/:id/confirm-payment-received', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: dossierId } = req.params;
    const { date_reception, montant_reel } = req.body;

    if (!user || user.type !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients'
      });
    }

    if (!date_reception || !montant_reel) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes (date_reception, montant_reel requis)'
      });
    }

    console.log('🎉 Client confirme réception remboursement:', {
      client_id: user.database_id,
      dossierId,
      montant_reel
    });

    // Vérifier que le dossier appartient au client
    const { data: dossier } = await supabase
      .from('ClientProduitEligible')
      .select('"clientId", expert_id, montantFinal, Client(company_name, apporteur_id), ProduitEligible(nom)')
      .eq('id', dossierId)
      .single();

    if (!dossier || dossier.clientId !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const clientInfo = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
    const clientName = clientInfo?.company_name || 'Client';

    // Mettre à jour le dossier
    const { error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        statut: 'completed',
        date_remboursement: new Date(date_reception).toISOString(),
        current_step: 6,
        progress: 100,
        metadata: {
          remboursement_recu: true,
          montant_reel_recu: montant_reel,
          confirme_par_client: true,
          date_confirmation: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', dossierId);

    if (updateError) {
      console.error('❌ Erreur mise à jour dossier:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la confirmation'
      });
    }

    console.log(`✅ Remboursement confirmé - Dossier complété`);

    // 📅 TIMELINE
    try {
      const { DossierTimelineService } = await import('../services/dossier-timeline-service');
      await DossierTimelineService.addEvent({
        dossier_id: dossierId,
        type: 'client_action',
        actor_type: 'client',
        actor_name: clientName,
        title: '🎉 Remboursement reçu et confirmé !',
        description: `Le client a confirmé la réception du remboursement de ${montant_reel.toLocaleString('fr-FR')} €. Dossier finalisé avec succès.`,
        metadata: {
          montant_reel,
          date_reception,
          confirme_at: new Date().toISOString()
        },
        icon: '💰',
        color: 'green'
      });
    } catch (timelineError) {
      console.error('⚠️ Erreur timeline (non bloquant):', timelineError);
    }

    // 🔔 NOTIFICATIONS
    // Expert
    if (dossier.expert_id) {
      const { data: expertData } = await supabase
        .from('Expert')
        .select('auth_user_id, compensation')
        .eq('id', dossier.expert_id)
        .single();

      if (expertData?.auth_user_id) {
        const compensation = expertData.compensation ?? 0.30;
        const commission = montant_reel * compensation;

        await supabase.from('notification').insert({
          user_id: expertData.auth_user_id,
          user_type: 'expert',
          title: `🎉 Remboursement confirmé - ${clientName}`,
          message: `Le client a reçu ${montant_reel.toLocaleString('fr-FR')} €. Dossier finalisé.`,
          notification_type: 'dossier_completed',
          priority: 'high',
          is_read: false,
          action_url: `/expert/dossier/${dossierId}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    // Apporteur
    if (clientInfo?.apporteur_id) {
      const { data: apporteurData } = await supabase
        .from('ApporteurAffaires')
        .select('auth_user_id, commission_rate')
        .eq('id', clientInfo.apporteur_id)
        .single();

      if (apporteurData?.auth_user_id) {
        await supabase.from('notification').insert({
          user_id: apporteurData.auth_user_id,
          user_type: 'apporteur',
          title: `🎉 Dossier finalisé - ${clientName}`,
          message: `Remboursement de ${montant_reel.toLocaleString('fr-FR')} € confirmé.`,
          notification_type: 'dossier_completed',
          priority: 'medium',
          is_read: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    // Admin
    const { data: admins } = await supabase
      .from('Admin')
      .select('auth_user_id')
      .eq('is_active', true);

    if (admins) {
      for (const admin of admins) {
        if (admin.auth_user_id) {
          await supabase.from('notification').insert({
            user_id: admin.auth_user_id,
            user_type: 'admin',
            title: `✅ Dossier finalisé - ${clientName}`,
            message: `Remboursement ${montant_reel.toLocaleString('fr-FR')} € confirmé. Préparer paiement commissions.`,
            notification_type: 'admin_info',
            priority: 'medium',
            is_read: false,
            action_url: `/admin/dossiers/${dossierId}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    }

    return res.json({
      success: true,
      message: 'Remboursement confirmé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur confirmation remboursement:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/client/dossier/:id/invoice
 * Récupérer la facture Profitum pour un dossier
 */
router.get('/dossier/:id/invoice', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: dossierId } = req.params;

    if (!user || user.type !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients'
      });
    }

    // Vérifier que le dossier appartient au client
    const { data: dossier } = await supabase
      .from('ClientProduitEligible')
      .select('"clientId"')
      .eq('id', dossierId)
      .single();

    if (!dossier || dossier.clientId !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Récupérer la facture
    const { data: invoice, error } = await supabase
      .from('invoice')
      .select('*')
      .eq('client_produit_eligible_id', dossierId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!invoice) {
      return res.json({
        success: true,
        data: null,
        message: 'Aucune facture générée pour ce dossier'
      });
    }

    return res.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('❌ Erreur récupération facture client:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router;

