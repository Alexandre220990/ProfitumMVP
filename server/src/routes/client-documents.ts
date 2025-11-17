import express, { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { AuthUser } from '../types/auth';
import { enhancedAuthMiddleware, AuthenticatedRequest } from '../middleware/auth-enhanced';
import { DossierTimelineService } from '../services/dossier-timeline-service';
import { NotificationTriggers } from '../services/NotificationTriggers';

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
        status: 'in_review',
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
      .select('id, filename, document_type, parent_document_id')
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
    const { data: allDocs, error: allDocsError } = await supabase
      .from('ClientProcessDocument')
      .select('id, parent_document_id, validation_status')
      .eq('client_produit_id', dossierId);

    if (allDocsError) {
      console.error('❌ Erreur récupération tous les documents:', allDocsError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des documents'
      });
    }

    // Filtrer les documents rejetés qui n'ont PAS été remplacés
    // NOTE: La structure peut être complexe - un document rejeté peut pointer vers un document validé
    // et un nouveau document peut pointer vers le rejeté
    const unresolvedRejectedDocs = (rejectedDocs || []).filter(rejectedDoc => {
      // Vérifier s'il existe un document de remplacement (avec parent_document_id = rejectedDoc.id)
      // Le remplacement doit être pending ou validated (pas rejeté)
      const hasValidReplacement = (allDocs || []).some(doc => 
        doc.parent_document_id === rejectedDoc.id && 
        doc.validation_status !== 'rejected'
      );
      
      // Si le document rejeté a lui-même un parent (pointant vers un document validé),
      // on doit vérifier si ce parent validé existe toujours et n'a pas été remplacé
      const rejectedDocParent = rejectedDoc.parent_document_id 
        ? (allDocs || []).find(doc => doc.id === rejectedDoc.parent_document_id)
        : null;
      
      // Si le rejeté a un parent validé ET qu'il n'y a pas de remplacement valide du rejeté,
      // alors le rejeté bloque (car il remplace un validé)
      if (rejectedDocParent && rejectedDocParent.validation_status === 'validated') {
        // Le rejeté remplace un validé, donc il bloque s'il n'a pas de remplacement valide
        return !hasValidReplacement;
      }
      
      // Sinon, logique normale : le rejeté bloque s'il n'a pas de remplacement valide
      return !hasValidReplacement;
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
    // Vérifier d'abord si l'étape existe
    const { data: existingStep } = await supabase
      .from('DossierStep')
      .select('id')
      .eq('dossier_id', dossierId)
      .eq('step_name', 'Collecte des documents')
      .maybeSingle();

    if (existingStep) {
      const { error: stepError } = await supabase
        .from('DossierStep')
        .update({
          status: 'completed',
          progress: 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingStep.id);

      if (stepError) {
        console.error('❌ Erreur mise à jour étape:', stepError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la mise à jour de l\'étape',
          details: stepError.message
        });
      }
    } else {
      console.warn('⚠️ Étape "Collecte des documents" non trouvée pour le dossier:', dossierId);
      // Créer l'étape si elle n'existe pas
      const { error: createStepError } = await supabase
        .from('DossierStep')
        .insert({
          dossier_id: dossierId,
          step_name: 'Collecte des documents',
          status: 'completed',
          progress: 100,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (createStepError) {
        console.error('❌ Erreur création étape:', createStepError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la création de l\'étape',
          details: createStepError.message
        });
      }
    }


    // Marquer la demande de documents comme complétée si elle existe
    if (documentRequest) {
      const { error: updateRequestError } = await supabase
        .from('document_request')
        .update({
          status: 'completed'
        })
        .eq('id', documentRequest.id);
      
      if (updateRequestError) {
        console.error('⚠️ Erreur mise à jour demande documents (non bloquant):', updateRequestError);
      }
    }

    // Mettre à jour le statut du dossier
    const dossierMetadata = dossier.metadata as any || {};
    const { error: updateDossierError } = await supabase
      .from('ClientProduitEligible')
      .update({
        statut: 'documents_completes',
        metadata: {
          ...dossierMetadata,
          documents_missing: false,
          step_3_completed_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', dossierId);

    if (updateDossierError) {
      console.error('❌ Erreur mise à jour dossier:', updateDossierError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du dossier',
        details: updateDossierError.message
      });
    }

    // Activer l'étape 4 "Audit technique" (si elle existe)
    const { data: auditStep } = await supabase
      .from('DossierStep')
      .select('id')
      .eq('dossier_id', dossierId)
      .eq('step_name', 'Audit technique')
      .maybeSingle();

    if (auditStep) {
      await supabase
        .from('DossierStep')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', auditStep.id);
    }

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
    // 1. Il n'a pas de parent (document original) ET il n'a pas de remplacement valide
    // 2. OU il est un remplacement et c'est la dernière version de son parent
    const activeDocuments = (allDocuments || []).filter(doc => {
      // Si pas de parent, c'est un document original
      if (!doc.parent_document_id) {
        // Vérifier qu'il n'existe pas un remplacement plus récent ET valide (pas rejeté)
        const hasNewerValidReplacement = (allDocuments || []).some(other => 
          other.parent_document_id === doc.id && 
          new Date(other.created_at) > new Date(doc.created_at) &&
          other.validation_status !== 'rejected' // Le remplacement doit être pending ou validated
        );
        return !hasNewerValidReplacement;
      }
      
      // Si c'est un remplacement, vérifier qu'il est le plus récent VALIDE de son parent
      // ET qu'il n'y a pas de remplacement plus récent VALIDE de lui-même
      const parentId = doc.parent_document_id;
      
      // Vérifier s'il existe un remplacement plus récent et VALIDE du même parent
      const newerValidReplacementsOfParent = (allDocuments || []).filter(other => 
        other.parent_document_id === parentId &&
        new Date(other.created_at) > new Date(doc.created_at) &&
        other.validation_status !== 'rejected' // Seuls les remplacements valides comptent
      );
      
      // Si ce remplacement a lui-même un remplacement plus récent VALIDE, il n'est pas actif
      const newerValidReplacementsOfThis = (allDocuments || []).filter(other => 
        other.parent_document_id === doc.id &&
        new Date(other.created_at) > new Date(doc.created_at) &&
        other.validation_status !== 'rejected'
      );
      
      return newerValidReplacementsOfParent.length === 0 && newerValidReplacementsOfThis.length === 0;
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
    const { action, montant, mode, paiement_date } = req.body;

    if (!user || user.type !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients'
      });
    }

    if (!action || !['initiate', 'confirm'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action invalide (attendu: initiate ou confirm)'
      });
    }

    console.log('💳 Client paiement action:', {
      client_id: user.database_id,
      dossierId,
      action,
      montant
    });

    // Vérifier que le dossier appartient au client
    const { data: dossier } = await supabase
      .from('ClientProduitEligible')
      .select('"clientId", expert_id, montantFinal, statut, metadata, current_step, progress, Client(company_name, apporteur_id), ProduitEligible(nom)')
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
    const produitInfo = Array.isArray(dossier.ProduitEligible) ? dossier.ProduitEligible[0] : dossier.ProduitEligible;
    const produitNom = produitInfo?.nom || 'Produit';

    const now = new Date().toISOString();

    if (action === 'initiate') {
      const amountValue = Number(montant);

      if (!montant || Number.isNaN(amountValue) || amountValue <= 0 || !mode || !['virement', 'en_ligne'].includes(mode)) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides pour l’initiation (montant > 0, mode requis)'
        });
      }

      const { data: updatedDossier, error: updateError } = await supabase
        .from('ClientProduitEligible')
        .update({
          statut: 'payment_in_progress',
          current_step: Math.max(dossier.current_step || 8, 8),
          progress: Math.max(dossier.progress || 95, 96),
          metadata: {
            ...(dossier.metadata || {}),
            payment: {
              ...(dossier.metadata?.payment || {}),
              status: 'in_progress',
              initiated_by: user.database_id,
              initiated_at: now,
              mode,
              initiated_amount: amountValue,
              last_update: now
            }
          },
          updated_at: now
        })
        .eq('id', dossierId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erreur mise à jour paiement (initiate):', updateError);
        return res.status(500).json({ success: false, message: 'Erreur lors de l’initiation du paiement' });
      }

      try {
        await DossierTimelineService.paiementEnCours({
          dossier_id: dossierId,
          montant: amountValue,
          mode: mode as 'virement' | 'en_ligne'
        });
      } catch (timelineError) {
        console.error('⚠️ Erreur timeline (paiement en cours):', timelineError);
      }

      // Notifier l'expert que le client a lancé le paiement
      if (dossier.expert_id) {
        const { data: expertUser } = await supabase
          .from('Expert')
          .select('auth_user_id')
          .eq('id', dossier.expert_id)
          .single();

        if (expertUser?.auth_user_id) {
          await supabase.from('notification').insert({
            user_id: expertUser.auth_user_id,
            user_type: 'expert',
            title: '💳 Paiement client en cours',
            message: `${clientName} a initié un paiement de ${amountValue.toLocaleString('fr-FR')} € (${mode === 'virement' ? 'virement bancaire' : 'paiement en ligne'}).`,
            notification_type: 'payment_in_progress',
            priority: 'medium',
            is_read: false,
            action_url: `/expert/dossier/${dossierId}`,
            created_at: now,
            updated_at: now
          });
        }
      }

      return res.json({
        success: true,
        message: 'Paiement client lancé',
        data: updatedDossier
      });
    }

    // action === 'confirm'
    const amountValue = Number(montant);

    if (!montant || Number.isNaN(amountValue) || amountValue <= 0 || !paiement_date) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides pour la confirmation (montant > 0, paiement_date requis)'
      });
    }

    const { data: updatedDossier, error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        statut: 'refund_completed',
        date_remboursement: new Date(paiement_date).toISOString(),
        current_step: 8,
        progress: 100,
        metadata: {
          ...(dossier.metadata || {}),
          payment: {
            ...(dossier.metadata?.payment || {}),
            status: 'completed',
            completed_by: user.database_id,
            completed_at: now,
            paid_amount: amountValue,
            paiement_date,
            last_update: now
          },
          remboursement_recu: true,
          montant_reel_recu: amountValue,
          confirme_par_client: true,
          date_confirmation: now
        },
        updated_at: now
      })
      .eq('id', dossierId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour dossier:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la confirmation'
      });
    }

    console.log('🎉 Paiement confirmé - Dossier clôturé');

    // 📅 TIMELINE
    try {
      await DossierTimelineService.remboursementTermine({
        dossier_id: dossierId,
        montant: amountValue,
        paiement_date
      });
    } catch (timelineError) {
      console.error('⚠️ Erreur timeline (non bloquant):', timelineError);
    }

    // 🔔 NOTIFICATION → EXPERT (si existant)
    if (dossier.expert_id) {
      const { data: expertData } = await supabase
        .from('Expert')
        .select('auth_user_id')
        .eq('id', dossier.expert_id)
        .single();

      if (expertData?.auth_user_id) {
        await supabase.from('notification').insert({
          user_id: expertData.auth_user_id,
          user_type: 'expert',
          title: '✅ Paiement client confirmé',
          message: `${clientName} a confirmé le paiement de ${amountValue.toLocaleString('fr-FR')} €`,
          notification_type: 'payment_confirmed',
          priority: 'medium',
          is_read: false,
          action_url: `/expert/dossier/${dossierId}`,
          created_at: now,
          updated_at: now
        });
      }
    }

    // 🔔 NOTIFICATION → APPORTEUR (si existant)
    if (clientInfo?.apporteur_id) {
      const { data: apporteurData } = await supabase
        .from('ApporteurAffaires')
        .select('auth_user_id')
        .eq('id', clientInfo.apporteur_id)
        .single();

      if (apporteurData?.auth_user_id) {
        await supabase.from('notification').insert({
          user_id: apporteurData.auth_user_id,
          user_type: 'apporteur',
          title: `✅ Paiement confirmé pour ${clientName}`,
          message: `Montant réglé : ${amountValue.toLocaleString('fr-FR')} €`,
          notification_type: 'payment_confirmed',
          priority: 'medium',
          is_read: false,
          action_url: `/apporteur/dossiers/${dossierId}`,
          created_at: now,
          updated_at: now
        });
      }
    }

    if (user.auth_user_id) {
      await NotificationTriggers.onPaymentConfirmed(user.auth_user_id, {
        dossier_id: dossierId,
        produit: produitNom,
        montant: amountValue,
        paiement_date
      });
    }

    return res.json({
      success: true,
      message: 'Paiement confirmé, dossier clôturé',
      data: updatedDossier
    });

  } catch (error) {
    console.error('❌ Erreur confirmation paiement:', error);
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

