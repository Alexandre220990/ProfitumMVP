/**
 * Routes pour les actions expert sur les dossiers
 * Accepter/Refuser des dossiers
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { enhancedAuthMiddleware, AuthenticatedRequest } from '../middleware/auth-enhanced';
import { ExpertNotificationService } from '../services/expert-notification-service';
import { DossierTimelineService } from '../services/dossier-timeline-service';
import { NotificationTriggers } from '../services/NotificationTriggers';
import { normalizeDossierStatus } from '../utils/dossierStatus';

const router = Router();

/**
 * POST /api/expert/dossier/:id/accept
 * Expert accepte de traiter un dossier
 */
router.post('/dossier/:id/accept', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: client_produit_id } = req.params;
    const { notes } = req.body;

    // Vérifier que l'utilisateur est un expert
    if (!user || user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    console.log('✅ Expert accepte le dossier:', {
      expert_id: user.database_id,
      client_produit_id,
      notes
    });

    // Récupérer les infos de l'expert depuis la BDD
    const { data: expertData, error: expertError } = await supabase
      .from('Expert')
      .select('id, name, email')
      .eq('id', user.database_id)
      .single();

    if (expertError || !expertData) {
      console.error('❌ Expert non trouvé:', user.database_id);
      return res.status(404).json({
        success: false,
        message: 'Expert non trouvé'
      });
    }

    const expertName = expertData.name || user.email || 'Expert';

    // Récupérer le dossier et vérifier qu'il est bien en attente pour cet expert
    const { data: dossier, error: fetchError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        Client(id, auth_user_id, email, company_name, nom, prenom),
        ProduitEligible(nom, description),
        Expert(id, name, email)
      `)
      .eq('id', client_produit_id)
      .single();

    if (fetchError || !dossier) {
      console.error('❌ Dossier non trouvé:', client_produit_id, fetchError);
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    // Vérifier que le dossier est bien en attente pour cet expert
    if (dossier.expert_pending_id !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Ce dossier n\'est pas en attente pour vous'
      });
    }

    // Mettre à jour le dossier : confirmer l'expert et passer à l'étape 3
    const now = new Date().toISOString();

    const { data: updatedDossier, error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        expertId: user.database_id,
        expert_pending_id: null,
        statut: 'expert_validated',
        current_step: 3,
        progress: 35,
        date_expert_accepted: now,
        updated_at: now,
        metadata: {
          ...dossier.metadata,
          expert_acceptance: {
            expert_id: user.database_id,
            accepted_at: now,
            notes: notes || ''
          }
        }
      })
      .eq('id', client_produit_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour dossier:', updateError);
      throw updateError;
    }

    console.log(`✅ Dossier accepté par expert ${user.database_id}`);

    // 📅 TIMELINE : Ajouter événement acceptation
    try {
      await DossierTimelineService.expertAccepte({
        dossier_id: client_produit_id,
        expert_name: expertName,
        notes: notes
      });

      console.log('✅ Événement timeline ajouté (expert accepté)');
    } catch (timelineError) {
      console.error('⚠️ Erreur timeline (non bloquant):', timelineError);
    }

    // 🔔 NOTIFICATION → CLIENT
    const clientInfo = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
    await ExpertNotificationService.notifyClientExpertAccepted({
      client_id: dossier.clientId,
      client_produit_id,
      expert_id: user.database_id,
      expert_name: expertName,
      expert_email: user.email,
      product_type: dossier.ProduitEligible?.nom || 'Produit',
      product_name: dossier.ProduitEligible?.nom
    });

    // 🔔 NOTIFICATION → ADMIN (info)
    await ExpertNotificationService.notifyAdminExpertDecision({
      expert_id: user.database_id,
      expert_name: expertName,
      client_produit_id,
      client_company: clientInfo?.company_name || clientInfo?.nom,
      product_type: dossier.ProduitEligible?.nom || 'Produit',
      decision: 'accepted'
    });

    // 🔔 NOTIFICATION → APPORTEUR (si relié)
    if (dossier.metadata?.apporteur_id) {
      try {
        const { data: apporteurData } = await supabase
          .from('ApporteurAffaires')
          .select('auth_user_id')
          .eq('id', dossier.metadata.apporteur_id)
          .single();

        if (apporteurData?.auth_user_id) {
          await supabase
            .from('notification')
            .insert({
              user_id: apporteurData.auth_user_id,
              user_type: 'apporteur',
              title: `✅ Expert accepté - ${dossier.ProduitEligible?.nom || 'Dossier'}`,
              message: `${expertName} a accepté le dossier de ${clientInfo?.company_name || 'votre client'}`,
              notification_type: 'apporteur_info',
              priority: 'medium',
              is_read: false,
              action_url: `/apporteur/dossiers/${client_produit_id}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          console.log('✅ Notification apporteur envoyée');
        }
      } catch (apporteurError) {
        console.error('❌ Erreur notification apporteur (non bloquant):', apporteurError);
      }
    }

    return res.json({
      success: true,
      message: 'Dossier accepté avec succès',
      data: updatedDossier
    });

  } catch (error: any) {
    console.error('❌ Erreur acceptation dossier:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'acceptation du dossier',
      details: error.message
    });
  }
});

/**
 * POST /api/expert/dossier/:id/reject
 * Expert refuse de traiter un dossier
 */
router.post('/dossier/:id/reject', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: client_produit_id } = req.params;
    const { reason } = req.body;

    // Vérifier que l'utilisateur est un expert
    if (!user || user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    console.log('❌ Expert refuse le dossier:', {
      expert_id: user.database_id,
      client_produit_id,
      reason
    });

    // Récupérer les infos de l'expert depuis la BDD
    const { data: expertData, error: expertError } = await supabase
      .from('Expert')
      .select('id, name, email')
      .eq('id', user.database_id)
      .single();

    if (expertError || !expertData) {
      console.error('❌ Expert non trouvé:', user.database_id);
      return res.status(404).json({
        success: false,
        message: 'Expert non trouvé'
      });
    }

    const expertName = expertData.name || user.email || 'Expert';

    // Récupérer le dossier
    const { data: dossier, error: fetchError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        Client(id, auth_user_id, email, company_name, nom, prenom),
        ProduitEligible(nom, description)
      `)
      .eq('id', client_produit_id)
      .single();

    if (fetchError || !dossier) {
      console.error('❌ Dossier non trouvé:', client_produit_id, fetchError);
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    // Vérifier que le dossier est bien en attente pour cet expert
    if (dossier.expert_pending_id !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Ce dossier n\'est pas en attente pour vous'
      });
    }

    // Mettre à jour le dossier : retirer expert_pending_id et revenir à l'étape 2
    const { data: updatedDossier, error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        expert_pending_id: null,
        statut: 'eligibility_validated',
        current_step: 2,
        metadata: {
          ...dossier.metadata,
          expert_rejection: {
            expert_id: user.database_id,
            expert_name: expertName,
            rejected_at: new Date().toISOString(),
            reason: reason || 'Non disponible'
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', client_produit_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour dossier:', updateError);
      throw updateError;
    }

    console.log(`❌ Dossier refusé par expert ${user.database_id}`);

    // 📅 TIMELINE : Ajouter événement refus
    try {
      await DossierTimelineService.expertRefuse({
        dossier_id: client_produit_id,
        expert_name: expertName,
        reason: reason || 'Non disponible'
      });

      console.log('✅ Événement timeline ajouté (expert refusé)');
    } catch (timelineError) {
      console.error('⚠️ Erreur timeline (non bloquant):', timelineError);
    }

    // 🔔 NOTIFICATION → CLIENT
    const clientInfo = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
    await ExpertNotificationService.notifyClientExpertRejected({
      client_id: dossier.clientId,
      client_produit_id,
      expert_name: expertName,
      product_type: dossier.ProduitEligible?.nom || 'Produit',
      product_name: dossier.ProduitEligible?.nom,
      rejection_reason: reason
    });

    // 🔔 NOTIFICATION → ADMIN (info)
    await ExpertNotificationService.notifyAdminExpertDecision({
      expert_id: user.database_id,
      expert_name: expertName,
      client_produit_id,
      client_company: clientInfo?.company_name || clientInfo?.nom,
      product_type: dossier.ProduitEligible?.nom || 'Produit',
      decision: 'rejected'
    });

    // 🔔 NOTIFICATION → APPORTEUR (si relié)
    if (dossier.metadata?.apporteur_id) {
      try {
        const { data: apporteurData } = await supabase
          .from('ApporteurAffaires')
          .select('auth_user_id')
          .eq('id', dossier.metadata.apporteur_id)
          .single();

        if (apporteurData?.auth_user_id) {
          await supabase
            .from('notification')
            .insert({
              user_id: apporteurData.auth_user_id,
              user_type: 'apporteur',
              title: `⚠️ Expert refusé - ${dossier.ProduitEligible?.nom || 'Dossier'}`,
              message: `${expertName} a refusé le dossier de ${clientInfo?.company_name || 'votre client'}`,
              notification_type: 'apporteur_info',
              priority: 'medium',
              is_read: false,
              action_url: `/apporteur/dossiers/${client_produit_id}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          console.log('✅ Notification apporteur envoyée');
        }
      } catch (apporteurError) {
        console.error('❌ Erreur notification apporteur (non bloquant):', apporteurError);
      }
    }

    return res.json({
      success: true,
      message: 'Dossier refusé',
      data: updatedDossier
    });

  } catch (error: any) {
    console.error('❌ Erreur refus dossier:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du refus du dossier',
      details: error.message
    });
  }
});

/**
 * POST /api/expert/dossier/:id/request-documents
 * Expert demande des documents complémentaires au client
 */
router.post('/dossier/:id/request-documents', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: client_produit_id } = req.params;
    const { documents, message } = req.body;

    // Vérifier que l'utilisateur est un expert
    if (!user || user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Liste de documents requise'
      });
    }

    console.log('📋 Expert demande documents complémentaires:', {
      expert_id: user.database_id,
      client_produit_id,
      documents_count: documents.length
    });

    // Récupérer les infos de l'expert
    const { data: expertData, error: expertError } = await supabase
      .from('Expert')
      .select('id, name, email')
      .eq('id', user.database_id)
      .single();

    if (expertError || !expertData) {
      return res.status(404).json({
        success: false,
        message: 'Expert non trouvé'
      });
    }

    const expertName = expertData.name || user.email || 'Expert';

    // Récupérer le dossier
    const { data: dossier, error: fetchError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        Client(id, auth_user_id, email, company_name, nom, prenom, apporteur_id),
        ProduitEligible(nom, description)
      `)
      .eq('id', client_produit_id)
      .single();

    if (fetchError || !dossier) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    // Vérifier que l'expert est bien assigné à ce dossier
    if (dossier.expert_id !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Ce dossier ne vous est pas assigné'
      });
    }

    // Préparer la liste des documents avec IDs uniques
    const documentsWithIds = documents.map((doc: any) => ({
      id: require('crypto').randomUUID(),
      description: doc.description,
      required: doc.required !== false,
      uploaded: false,
      uploaded_at: null,
      document_id: null
    }));

    // Mettre à jour le dossier
    const now = new Date().toISOString();

    const { data: updatedDossier, error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        statut: 'complementary_documents_upload_pending',
        current_step: 3,
        progress: 40,
        metadata: {
          ...dossier.metadata,
          required_documents_expert: documentsWithIds,
          expert_request: {
            requested_by: user.database_id,
            requested_at: now,
            message: message || '',
            documents_count: documents.length
          }
        },
        updated_at: now
      })
      .eq('id', client_produit_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour dossier:', updateError);
      throw updateError;
    }

    console.log(`✅ ${documents.length} documents complémentaires demandés`);

    // 📅 TIMELINE : Ajouter événement
    try {
      await DossierTimelineService.documentsComplementairesDemandes({
        dossier_id: client_produit_id,
        expert_name: expertName,
        validated_count: 0,  // À compléter avec les données du frontend
        rejected_count: 0,   // À compléter avec les données du frontend
        requested_count: documents.length,
        requested_documents: documents.map((d: any) => d.description)
      });

      console.log('✅ Événement timeline ajouté');
    } catch (timelineError) {
      console.error('⚠️ Erreur timeline (non bloquant):', timelineError);
    }

    // 🔔 NOTIFICATION → CLIENT
    const clientInfo = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
    const clientName = clientInfo?.company_name || 
                      `${clientInfo?.nom || ''} ${clientInfo?.prenom || ''}`.trim() || 
                      'Client';

    try {
      // Récupérer auth_user_id du client
      const clientAuthUserId = clientInfo?.auth_user_id;

      if (clientAuthUserId) {
        await supabase
          .from('notification')
          .insert({
            user_id: clientAuthUserId,
            user_type: 'client',
            title: `📋 Documents complémentaires demandés - ${dossier.ProduitEligible?.nom || 'Dossier'}`,
            message: `${expertName} a besoin de ${documents.length} documents complémentaires pour avancer sur votre dossier.${message ? ' Message : ' + message : ''}`,
            notification_type: 'documents_requested',
            priority: 'high',
            is_read: false,
            action_url: `/produits/${dossier.ProduitEligible?.nom?.toLowerCase() || 'dossier'}/${client_produit_id}`,
            action_data: {
              client_produit_id,
              expert_id: user.database_id,
              expert_name: expertName,
              documents_count: documents.length,
              documents: documentsWithIds,
              message: message,
              requested_at: new Date().toISOString()
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        console.log('✅ Notification client envoyée');
      }
    } catch (clientNotifError) {
      console.error('⚠️ Erreur notification client (non bloquant):', clientNotifError);
    }

    // 🔔 NOTIFICATION → ADMIN (info)
    try {
      const { data: admins } = await supabase
        .from('Admin')
        .select('auth_user_id')
        .eq('is_active', true);

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          if (admin.auth_user_id) {
            await supabase
              .from('notification')
              .insert({
                user_id: admin.auth_user_id,
                user_type: 'admin',
                title: `ℹ️ Documents complémentaires demandés - ${dossier.ProduitEligible?.nom || 'Dossier'}`,
                message: `Expert ${expertName} a demandé ${documents.length} documents pour ${clientName}`,
                notification_type: 'admin_info',
                priority: 'low',
                is_read: false,
                action_url: `/admin/dossiers/${client_produit_id}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
          }
        }
      }
    } catch (adminNotifError) {
      console.error('⚠️ Erreur notification admin (non bloquant):', adminNotifError);
    }

    // 🔔 NOTIFICATION → APPORTEUR (si relié)
    if (clientInfo?.apporteur_id) {
      try {
        const { data: apporteurData } = await supabase
          .from('ApporteurAffaires')
          .select('auth_user_id')
          .eq('id', clientInfo.apporteur_id)
          .single();

        if (apporteurData?.auth_user_id) {
          await supabase
            .from('notification')
            .insert({
              user_id: apporteurData.auth_user_id,
              user_type: 'apporteur',
              title: `ℹ️ Documents demandés - ${dossier.ProduitEligible?.nom || 'Dossier'}`,
              message: `Documents complémentaires demandés pour votre client ${clientName}`,
              notification_type: 'apporteur_info',
              priority: 'low',
              is_read: false,
              action_url: `/apporteur/dossiers/${client_produit_id}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          console.log('✅ Notification apporteur envoyée');
        }
      } catch (apporteurError) {
        console.error('⚠️ Erreur notification apporteur (non bloquant):', apporteurError);
      }
    }

    return res.json({
      success: true,
      message: 'Documents complémentaires demandés au client',
      data: updatedDossier
    });

  } catch (error: any) {
    console.error('❌ Erreur demande documents:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la demande de documents',
      details: error.message
    });
  }
});

/**
 * POST /api/expert/dossier/:id/review-complementary-documents
 * Expert valide ou refuse les documents complémentaires
 */
router.post('/dossier/:id/review-complementary-documents', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: dossierId } = req.params;
    const { action, notes, rejected_documents } = req.body;

    if (!user || user.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux experts' });
    }

    if (!['validate', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action invalide (validate ou reject requis)' });
    }

    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        Client:clientId (
          id,
          auth_user_id,
          company_name
        ),
        ProduitEligible:produitId (
          id,
          nom
        )
      `)
      .eq('id', dossierId)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
    }

    if (dossier.expert_id !== user.database_id) {
      return res.status(403).json({ success: false, message: 'Ce dossier ne vous est pas assigné' });
    }

    const expertNameFallback = user.email || 'Expert';
    const expertName = dossier.Expert[0]?.name || expertNameFallback;

    const { data: docRequest, error: requestError } = await supabase
      .from('document_request')
      .select('id, requested_documents, status')
      .eq('dossier_id', dossierId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (requestError || !docRequest) {
      return res.status(404).json({ success: false, message: 'Aucune demande de documents complémentaires trouvée' });
    }

    const now = new Date().toISOString();
    const requestedDocs = (docRequest.requested_documents as any[]) || [];
    const requestedDocNames = requestedDocs.map(doc => doc.name || doc.description || 'Document');
    const clientInfo = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
    const produitNom = dossier.ProduitEligible?.nom || 'Produit';

    if (action === 'validate') {
      const { data: updatedDossier, error: updateError } = await supabase
        .from('ClientProduitEligible')
        .update({
          statut: 'complementary_documents_validated',
          current_step: 3,
          progress: 45,
          updated_at: now,
          metadata: {
            ...dossier.metadata,
            complementary_documents: {
              ...(dossier.metadata?.complementary_documents || {}),
              status: 'validated',
              validated_at: now,
              validated_by: user.database_id,
              notes: notes || null,
              requested_documents: requestedDocs
            }
          }
        })
        .eq('id', dossierId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      await supabase
        .from('document_request')
        .update({
          status: 'validated',
          completed_at: now,
          notes: notes || null
        })
        .eq('id', docRequest.id);

      try {
        await DossierTimelineService.documentsComplementairesValides({
          dossier_id: dossierId,
          expert_name: expertName,
          documents_count: requestedDocs.length,
          documents: requestedDocNames,
          notes
        });
      } catch (timelineError) {
        console.error('⚠️ Erreur timeline (documents validés):', timelineError);
      }

      if (clientInfo?.auth_user_id) {
        await NotificationTriggers.onComplementaryDocumentsValidated(clientInfo.auth_user_id, {
          dossier_id: dossierId,
          produit: produitNom,
          expert_name: expertName,
          documents_count: requestedDocs.length
        });
      }

      return res.json({
        success: true,
        message: 'Documents complémentaires validés',
        data: updatedDossier
      });
    }

    const rejectedList: string[] = Array.isArray(rejected_documents) ? rejected_documents : [];

    const { data: updatedDossier, error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        statut: 'complementary_documents_refused',
        current_step: 3,
        progress: 35,
        updated_at: now,
        metadata: {
          ...dossier.metadata,
          complementary_documents: {
            ...(dossier.metadata?.complementary_documents || {}),
            status: 'refused',
            rejected_at: now,
            rejected_by: user.database_id,
            reason: notes || null,
            rejected_documents: rejectedList
          }
        }
      })
      .eq('id', dossierId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    await supabase
      .from('document_request')
      .update({
        status: 'pending',
        notes: notes || null,
        updated_at: now
      })
      .eq('id', docRequest.id);

    try {
      await DossierTimelineService.documentsComplementairesRefuses({
        dossier_id: dossierId,
        expert_name: expertName,
        rejected_documents: rejectedList.length ? rejectedList : requestedDocNames,
        reason: notes
      });
    } catch (timelineError) {
      console.error('⚠️ Erreur timeline (documents refusés):', timelineError);
    }

    if (clientInfo?.auth_user_id) {
      await NotificationTriggers.onComplementaryDocumentsRejected(clientInfo.auth_user_id, {
        dossier_id: dossierId,
        produit: produitNom,
        expert_name: expertName,
        reason: notes || undefined
      });
    }

    return res.json({
      success: true,
      message: 'Documents complémentaires refusés, nouvelle action requise',
      data: updatedDossier
    });

  } catch (error) {
    console.error('❌ Erreur review documents complémentaires:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la revue des documents complémentaires'
    });
  }
});

/**
 * POST /api/expert/dossier/:id/start-audit
 * Expert démarre l'audit (sans demander de documents complémentaires)
 */
router.post('/dossier/:id/start-audit', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: client_produit_id } = req.params;

    if (!user || user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    // Récupérer infos expert
    const { data: expertData } = await supabase
      .from('Expert')
      .select('id, name')
      .eq('id', user.database_id)
      .single();

    const expertNameFallback = expertData?.name || user.email || 'Expert';

    // Récupérer le dossier
    const { data: dossier, error: fetchError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        Client(id, auth_user_id, company_name, nom, prenom, apporteur_id),
        ProduitEligible(nom)
      `)
      .eq('id', client_produit_id)
      .single();

    if (fetchError || !dossier) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    // Vérifier que l'expert est assigné
    if (dossier.expert_id !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Ce dossier ne vous est pas assigné'
      });
    }

    if (!dossier.charte_signed) {
      return res.status(400).json({
        success: false,
        message: "La charte commerciale doit être signée avant de démarrer l'audit"
      });
    }

    // Mettre à jour le dossier
    const { data: updatedDossier, error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        statut: 'audit_in_progress',
        current_step: 4,
        progress: 50,
        metadata: {
          ...dossier.metadata,
          documents_complementaires: 'none_required',
          audit_started: {
            started_by: user.database_id,
            started_at: new Date().toISOString()
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', client_produit_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Audit démarré (sans documents complémentaires)');

    // Infos client
    const clientInfo = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
    const clientName = clientInfo?.company_name || clientInfo?.nom || 'Client';

    // 📅 TIMELINE
    try {
      await DossierTimelineService.auditDemarre({
        dossier_id: client_produit_id,
        expert_name: expertNameFallback,
        documents_complementaires: false
      });
    } catch (timelineError) {
      console.error('⚠️ Erreur timeline (non bloquant):', timelineError);
    }

    // 🔔 NOTIFICATION → CLIENT
    if (clientInfo?.auth_user_id) {
      await supabase
        .from('notification')
        .insert({
          user_id: clientInfo.auth_user_id,
          user_type: 'client',
          title: `ℹ️ Audit démarré - ${dossier.ProduitEligible?.nom || 'Dossier'}`,
          message: `${expertNameFallback} analyse actuellement votre dossier`,
          notification_type: 'audit_started',
          priority: 'medium',
          is_read: false,
          action_url: `/produits/${dossier.ProduitEligible?.nom?.toLowerCase()}/${client_produit_id}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }

    // 🔔 NOTIFICATION → ADMIN
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
            title: `ℹ️ Audit démarré - ${dossier.ProduitEligible?.nom || 'Dossier'}`,
            message: `${expertNameFallback} démarre l'audit pour ${clientName}`,
            notification_type: 'admin_info',
            priority: 'medium',
            is_read: false,
            action_url: `/admin/dossiers/${client_produit_id}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    }

    return res.json({
      success: true,
      message: 'Audit démarré',
      data: updatedDossier
    });

  } catch (error: any) {
    console.error('❌ Erreur démarrage audit:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du démarrage de l\'audit',
      details: error.message
    });
  }
});

/**
 * POST /api/expert/dossier/:id/complete-audit
 * Expert termine l'audit avec montant final et rapport
 */
router.post('/dossier/:id/complete-audit', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: client_produit_id } = req.params;
    const { montant_final, rapport_url, notes } = req.body;

    if (!user || user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    if (!montant_final || montant_final <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Montant final requis'
      });
    }

    console.log('✅ Expert termine audit:', {
      expert_id: user.database_id,
      client_produit_id,
      montant_final
    });

    // Récupérer infos expert
    const { data: expertData } = await supabase
      .from('Expert')
      .select('id, name')
      .eq('id', user.database_id)
      .single();

    const expertNameFallback = expertData?.name || user.email || 'Expert';

    // Récupérer le dossier
    const { data: dossier, error: fetchError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        Client(id, auth_user_id, company_name, nom, prenom, apporteur_id),
        ProduitEligible(nom)
      `)
      .eq('id', client_produit_id)
      .single();

    if (fetchError || !dossier) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    // Vérifier que l'expert est assigné
    if (dossier.expert_id !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Ce dossier ne vous est pas assigné'
      });
    }

    // Mettre à jour le dossier
    const { data: updatedDossier, error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        statut: 'audit_completed',
        current_step: 4,
        progress: 70,
        montantFinal: montant_final,
        metadata: {
          ...dossier.metadata,
          audit_result: {
            completed_by: user.database_id,
            completed_at: new Date().toISOString(),
            montant_initial: dossier.montantFinal,
            montant_final: montant_final,
            rapport_url: rapport_url || null,
            notes: notes || ''
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', client_produit_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Audit terminé - Montant final: ${montant_final} €`);

    // Infos client
    const clientInfo = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
    const clientName = clientInfo?.company_name || clientInfo?.nom || 'Client';

    // 📅 TIMELINE
    try {
      await DossierTimelineService.auditTermine({
        dossier_id: client_produit_id,
        expert_name: expertNameFallback,
        montant_final: montant_final,
        rapport_url: rapport_url,
        notes: notes
      });
    } catch (timelineError) {
      console.error('⚠️ Erreur timeline (non bloquant):', timelineError);
    }

    // 🔔 NOTIFICATION → CLIENT (avec mention CGV)
    if (clientInfo?.auth_user_id) {
      await supabase
        .from('notification')
        .insert({
          user_id: clientInfo.auth_user_id,
          user_type: 'client',
          title: `✅ Audit terminé - ${dossier.ProduitEligible?.nom || 'Dossier'}`,
          message: `Montant estimé : ${montant_final.toLocaleString('fr-FR')} €. Veuillez confirmer l'audit pour demander le remboursement. ** En validant, vous acceptez les CGV et le contrat de l'expert avec son commissionnement.`,
          notification_type: 'audit_completed',
          priority: 'high',
          is_read: false,
          action_url: `/produits/${dossier.ProduitEligible?.nom?.toLowerCase()}/${client_produit_id}`,
          action_data: {
            client_produit_id,
            expert_id: user.database_id,
            expert_name: expertNameFallback,
            montant_final: montant_final,
            rapport_url: rapport_url,
            completed_at: new Date().toISOString(),
            next_step: 'validate_audit',
            cgv_acceptance_required: true
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }

    // 🔔 NOTIFICATION → ADMIN
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
            title: `📋 Audit terminé - En attente validation client`,
            message: `${expertNameFallback} - ${clientName} - Montant : ${montant_final.toLocaleString('fr-FR')} €`,
            notification_type: 'admin_info',
            priority: 'medium',
            is_read: false,
            action_url: `/admin/dossiers/${client_produit_id}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    }

    // 🔔 NOTIFICATION → APPORTEUR
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
          title: `ℹ️ Audit terminé - ${dossier.ProduitEligible?.nom || 'Dossier'}`,
          message: `Audit complété pour votre client - Montant : ${montant_final.toLocaleString('fr-FR')} €`,
          notification_type: 'apporteur_info',
          priority: 'medium',
          is_read: false,
          action_url: `/apporteur/dossiers/${client_produit_id}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    return res.json({
      success: true,
      message: 'Audit terminé avec succès',
      data: updatedDossier
    });

  } catch (error: any) {
    console.error('❌ Erreur completion audit:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la finalisation de l\'audit',
      details: error.message
    });
  }
});

/**
 * GET /api/client/dossier/:id/audit-commission-info
 * Récupérer les infos de commission pour affichage modal (avant validation)
 */
router.get('/client/dossier/:id/audit-commission-info', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: client_produit_id } = req.params;

    if (!user || user.type !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients'
      });
    }

    // Récupérer le dossier avec expert
    const { data: dossier, error: fetchError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        clientId,
        montantFinal,
        Expert(id, name, email, client_fee_percentage, profitum_fee_percentage)
      `)
      .eq('id', client_produit_id)
      .single();

    if (fetchError || !dossier || dossier.clientId !== user.database_id) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé ou non autorisé'
      });
    }

    const expertInfo = Array.isArray(dossier.Expert) ? dossier.Expert[0] : dossier.Expert;
    const clientFeePercentage = expertInfo?.client_fee_percentage ?? 0.30;
    const profitumFeePercentage = expertInfo?.profitum_fee_percentage ?? 0.30;
    const montantRemboursement = dossier.montantFinal || 0;
    
    // Calcul WATERFALL pour estimation
    const expertTotalFee = montantRemboursement * clientFeePercentage; // Client → Expert
    const profitumTotalFee = expertTotalFee * profitumFeePercentage; // Expert → Profitum
    const tva = profitumTotalFee * 0.20;
    const profitumTotalTTC = profitumTotalFee + tva;

    return res.json({
      success: true,
      data: {
        expert_name: expertInfo?.name,
        client_fee_percentage: clientFeePercentage,
        client_fee_percent: (clientFeePercentage * 100).toFixed(0),
        profitum_fee_percentage: profitumFeePercentage,
        profitum_fee_percent: (profitumFeePercentage * 100).toFixed(0),
        montant_remboursement: montantRemboursement,
        expert_total_fee: expertTotalFee,
        profitum_total_fee: profitumTotalFee,
        estimation_ht: profitumTotalFee,
        estimation_tva: tva,
        estimation_ttc: profitumTotalTTC
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur récupération infos commission:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/client/dossier/:id/validate-audit
 * Client valide ou refuse l'audit
 */
router.post('/client/dossier/:id/validate-audit', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: client_produit_id } = req.params;
    const { action, reason } = req.body;

    if (!user || user.type !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients'
      });
    }

    if (!action || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action invalide (accept ou reject requis)'
      });
    }

    console.log(`${action === 'accept' ? '✅' : '❌'} Client ${action === 'accept' ? 'accepte' : 'refuse'} audit:`, {
      client_id: user.database_id,
      client_produit_id,
      reason
    });

    // Récupérer le dossier avec infos expert
    const { data: dossier, error: fetchError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        Client(id, auth_user_id, company_name, nom, prenom, first_name, last_name, apporteur_id),
        ProduitEligible(nom),
        Expert(id, auth_user_id, name, email, client_fee_percentage, profitum_fee_percentage)
      `)
      .eq('id', client_produit_id)
      .single();

    if (fetchError || !dossier) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    // Vérifier que le dossier appartient au client
    if (dossier.clientId !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const clientInfo = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
    const clientName = clientInfo?.company_name || 
                      `${clientInfo?.first_name || ''} ${clientInfo?.last_name || ''}`.trim() || 
                      'Client';

    const expertInfo = Array.isArray(dossier.Expert) ? dossier.Expert[0] : dossier.Expert;
    const expertNameFallback = expertInfo?.name || user.email || 'Expert';
    const clientFeePercentage = expertInfo?.client_fee_percentage ?? 0.30;
    const profitumFeePercentage = expertInfo?.profitum_fee_percentage ?? 0.30;

    // Calculer estimation WATERFALL (pour info client)
    const montantRemboursement = dossier.montantFinal || 0;
    const expertTotalFee = montantRemboursement * clientFeePercentage;
    const profitumTotalFee = expertTotalFee * profitumFeePercentage;
    const tva = profitumTotalFee * 0.20;
    const profitumTotalTTC = profitumTotalFee + tva;

    // Mettre à jour selon action
    const newStatut = action === 'accept' ? 'validation_finale' : 'audit_rejected_by_client';
    const newStep = action === 'accept' ? 5 : 4;
    const newProgress = action === 'accept' ? 75 : 70;

    // Construire metadata selon action
    let metadataUpdate: any = {
      ...dossier.metadata,
      client_validation: {
        validated_by: user.database_id,
        validated_at: new Date().toISOString(),
        action: action,
        reason: reason || null
      }
    };

    // Si acceptation, enregistrer les conditions de commission acceptées
    if (action === 'accept') {
      metadataUpdate.commission_conditions_accepted = {
        waterfall_model: true,
        client_fee_percentage: clientFeePercentage,
        profitum_fee_percentage: profitumFeePercentage,
        montant_remboursement: montantRemboursement,
        expert_total_fee: expertTotalFee,
        profitum_total_fee: profitumTotalFee,
        estimation_ht: profitumTotalFee,
        estimation_tva: tva,
        estimation_ttc: profitumTotalTTC,
        accepted_at: new Date().toISOString(),
        expert_id: expertInfo?.id,
        expert_name: expertNameFallback
      };
      console.log('💰 Conditions commission WATERFALL acceptées:', {
        client_paie_expert: `${expertTotalFee.toFixed(2)} € (${(clientFeePercentage * 100).toFixed(0)}%)`,
        expert_paie_profitum: `${profitumTotalFee.toFixed(2)} € (${(profitumFeePercentage * 100).toFixed(0)}%)`,
        profitum_ttc: `${profitumTotalTTC.toFixed(2)} €`
      });
    }

    const { data: updatedDossier, error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        statut: newStatut,
        current_step: newStep,
        progress: newProgress,
        date_audit_validated_by_client: action === 'accept' ? new Date().toISOString() : null,
        metadata: metadataUpdate,
        updated_at: new Date().toISOString()
      })
      .eq('id', client_produit_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    console.log(`${action === 'accept' ? '✅' : '❌'} Audit ${action === 'accept' ? 'accepté' : 'refusé'} par client`);

    // 📅 TIMELINE
    try {
      if (action === 'accept') {
        await DossierTimelineService.auditAccepte({
          dossier_id: client_produit_id,
          client_name: clientName,
          montant_final: dossier.montantFinal || 0
        });
      } else {
        await DossierTimelineService.auditRefuse({
          dossier_id: client_produit_id,
          client_name: clientName,
          reason: reason || 'Non spécifié'
        });
      }
    } catch (timelineError) {
      console.error('⚠️ Erreur timeline (non bloquant):', timelineError);
    }

    // 🔔 NOTIFICATIONS
    if (action === 'accept') {
      // NOTIFICATION → EXPERT
      if (expertInfo?.auth_user_id) {
        await supabase.from('notification').insert({
          user_id: expertInfo.auth_user_id,
          user_type: 'expert',
          title: `🎉 Audit accepté par le client`,
          message: `${clientName} a accepté l'audit. Lancement de la production.`,
          notification_type: 'audit_validated',
          priority: 'high',
          is_read: false,
          action_url: `/expert/dossier/${client_produit_id}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // NOTIFICATION → ADMIN
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
              title: `🎉 Audit accepté - Lancement production`,
              message: `${clientName} - ${dossier.ProduitEligible?.nom || 'Dossier'} - ${(dossier.montantFinal || 0).toLocaleString('fr-FR')} € - Production lancée`,
              notification_type: 'admin_info',
              priority: 'high',
              is_read: false,
              action_url: `/admin/dossiers/${client_produit_id}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      }

      // NOTIFICATION → APPORTEUR
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
            title: `🎉 Audit accepté par le client`,
            message: `Production lancée pour votre client ${clientName}`,
            notification_type: 'apporteur_info',
            priority: 'medium',
            is_read: false,
            action_url: `/apporteur/dossiers/${client_produit_id}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    } else {
      // NOTIFICATION → EXPERT (refus)
      if (expertInfo?.auth_user_id) {
        await supabase.from('notification').insert({
          user_id: expertInfo.auth_user_id,
          user_type: 'expert',
          title: `⚠️ Audit refusé par le client`,
          message: `${clientName} a refusé l'audit. Raison : ${reason || 'Non spécifié'}. Veuillez le contacter.`,
          notification_type: 'audit_rejected',
          priority: 'high',
          is_read: false,
          action_url: `/expert/dossier/${client_produit_id}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // NOTIFICATION → ADMIN
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
              title: `⚠️ Audit refusé par client`,
              message: `${clientName} - ${dossier.ProduitEligible?.nom || 'Dossier'} - ${reason || 'Non spécifié'}`,
              notification_type: 'admin_info',
              priority: 'high',
              is_read: false,
              action_url: `/admin/dossiers/${client_produit_id}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      }
    }

    return res.json({
      success: true,
      message: `Audit ${action === 'accept' ? 'accepté' : 'refusé'} avec succès`,
      data: updatedDossier
    });

  } catch (error: any) {
    console.error('❌ Erreur validation audit:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation de l\'audit',
      details: error.message
    });
  }
});

/**
 * POST /api/expert/dossier/:id/update-refund-status
 * Expert met à jour le statut de la demande de remboursement
 */
router.post('/dossier/:id/update-refund-status', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: client_produit_id } = req.params;
    const { status, submission_date, reference } = req.body;

    if (!user || user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    if (!status || !['in_preparation', 'submitted'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide (in_preparation ou submitted requis)'
      });
    }

    // Récupérer infos expert
    const { data: expertData } = await supabase
      .from('Expert')
      .select('id, name')
      .eq('id', user.database_id)
      .single();

    const expertNameFallback = expertData?.name || user.email || 'Expert';

    // Récupérer le dossier
    const { data: dossier, error: fetchError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        Client(id, auth_user_id, company_name, nom, prenom, apporteur_id),
        ProduitEligible(nom)
      `)
      .eq('id', client_produit_id)
      .single();

    if (fetchError || !dossier) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    // Vérifier que l'expert est assigné
    if (dossier.expert_id !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Ce dossier ne vous est pas assigné'
      });
    }

    const clientInfo = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
    const clientName = clientInfo?.company_name || clientInfo?.nom || 'Client';

    let newStatut = dossier.statut;
    let newStep = dossier.current_step;
    let newProgress = dossier.progress;
    let metadataUpdate: any = {};

    if (status === 'in_preparation') {
      newStatut = 'refund_in_preparation';
      newStep = 5;
      newProgress = 85;
      metadataUpdate = {
        refund_preparation: {
          updated_by: user.database_id,
          updated_at: new Date().toISOString()
        }
      };
    } else if (status === 'submitted') {
      newStatut = 'refund_requested';
      newStep = 6;
      newProgress = 90;
      metadataUpdate = {
        refund_submission: {
          submitted_by: user.database_id,
          submitted_at: new Date().toISOString(),
          submission_date: submission_date || new Date().toISOString(),
          reference: reference || ''
        }
      };
    }

    // Mettre à jour le dossier
    const { data: updatedDossier, error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        statut: newStatut,
        current_step: newStep,
        progress: newProgress,
        date_demande_envoyee: status === 'submitted' ? new Date().toISOString() : null,
        metadata: {
          ...dossier.metadata,
          ...metadataUpdate
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', client_produit_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Statut remboursement mis à jour: ${status}`);

    // 📅 TIMELINE
    if (status === 'in_preparation') {
      try {
        await DossierTimelineService.demandeEnPreparation({
          dossier_id: client_produit_id,
          expert_name: expertNameFallback
        });
      } catch (timelineError) {
        console.error('⚠️ Erreur timeline (non bloquant):', timelineError);
      }
    } else if (status === 'submitted') {
      try {
        await DossierTimelineService.demandeEnvoyee({
          dossier_id: client_produit_id,
          expert_name: expertNameFallback,
          montant: dossier.montantFinal || 0,
          reference: reference || 'N/A'
        });
      } catch (timelineError) {
        console.error('⚠️ Erreur timeline (non bloquant):', timelineError);
      }

      // 🔔 NOTIFICATION → CLIENT (seulement si demande envoyée)
      if (clientInfo?.auth_user_id) {
        await supabase.from('notification').insert({
          user_id: clientInfo.auth_user_id,
          user_type: 'client',
          title: `ℹ️ Demande de remboursement envoyée`,
          message: `Votre demande est en cours de traitement auprès de l'administration (Réf: ${reference || 'N/A'})`,
          notification_type: 'refund_submitted',
          priority: 'medium',
          is_read: false,
          action_url: `/produits/${dossier.ProduitEligible?.nom?.toLowerCase()}/${client_produit_id}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // 🔔 NOTIFICATION → ADMIN
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
              title: `ℹ️ Demande remboursement envoyée`,
              message: `${clientName} - ${dossier.ProduitEligible?.nom || 'Dossier'} - ${(dossier.montantFinal || 0).toLocaleString('fr-FR')} €`,
              notification_type: 'admin_info',
              priority: 'medium',
              is_read: false,
              action_url: `/admin/dossiers/${client_produit_id}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      }

      // 🔔 NOTIFICATION → APPORTEUR
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
            title: `ℹ️ Demande envoyée`,
            message: `Demande soumise pour votre client ${clientName}`,
            notification_type: 'apporteur_info',
            priority: 'low',
            is_read: false,
            action_url: `/apporteur/dossiers/${client_produit_id}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    }

    return res.json({
      success: true,
      message: 'Statut de remboursement mis à jour',
      data: updatedDossier
    });

  } catch (error: any) {
    console.error('❌ Erreur mise à jour statut remboursement:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      details: error.message
    });
  }
});

/**
 * POST /api/expert/dossier/:id/confirm-refund
 * Expert confirme que le remboursement a été obtenu
 */
router.post('/dossier/:id/confirm-refund', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: client_produit_id } = req.params;
    const { refund_date, refund_amount, payment_reference } = req.body;

    if (!user || user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    if (!refund_date || !refund_amount || !payment_reference) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes (refund_date, refund_amount, payment_reference requis)'
      });
    }

    // Récupérer infos expert
    const { data: expertData } = await supabase
      .from('Expert')
      .select('id, name')
      .eq('id', user.database_id)
      .single();

    const expertNameFallback = expertData?.name || user.email || 'Expert';

    // Récupérer le dossier
    const { data: dossier, error: fetchError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        Client(id, auth_user_id, company_name, nom, prenom, apporteur_id),
        ProduitEligible(nom),
        Expert(id, name)
      `)
      .eq('id', client_produit_id)
      .single();

    if (fetchError || !dossier) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    // Vérifier que l'expert est assigné
    if (dossier.expert_id !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Ce dossier ne vous est pas assigné'
      });
    }

    const clientInfo = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
    const clientName = clientInfo?.company_name || clientInfo?.nom || 'Client';
    const expertInfo = Array.isArray(dossier.Expert) ? dossier.Expert[0] : dossier.Expert;
    const expertName = expertInfo?.name || expertNameFallback;
    const produitInfo = Array.isArray(dossier.ProduitEligible) ? dossier.ProduitEligible[0] : dossier.ProduitEligible;
    const produitNom = produitInfo?.nom || 'Produit';

    // 🧾 Génération (ou récupération) de la facture Profitum
    let factureData: any = null;
    try {
      const { FactureService } = await import('../services/facture-service');
      const result = await FactureService.generate({
        dossierId: client_produit_id,
        montantReelAccorde: refund_amount,
        expertId: user.database_id
      });

      if (result.success) {
        factureData = result.data;
        console.log(`✅ Facture ${result.data?.invoice_number} générée pour la phase paiement`);
      } else {
        console.error('❌ Erreur génération facture:', result.error);
      }
    } catch (factureError) {
      console.error('⚠️ Erreur génération facture (non bloquant):', factureError);
    }

    const now = new Date().toISOString();

    // Mettre à jour le dossier
    const { data: updatedDossier, error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        statut: 'payment_requested',
        current_step: 8,
        progress: 95,
        date_remboursement: new Date(refund_date).toISOString(),
        metadata: {
          ...(dossier.metadata || {}),
          implementation: {
            ...(dossier.metadata?.implementation || {}),
            status: 'validated',
            refund_reference: payment_reference,
            refund_amount,
            refund_date,
            last_update: now
          },
          payment: {
            ...(dossier.metadata?.payment || {}),
            status: 'requested',
            requested_by: user.database_id,
            requested_at: now,
            requested_amount: factureData?.montant_ttc || refund_amount,
            refund_amount,
            refund_date,
            payment_reference,
            invoice: factureData
              ? {
                  id: factureData.id,
                  number: factureData.invoice_number,
                  montant_ht: factureData.montant_ht,
                  montant_ttc: factureData.montant_ttc
                }
              : null
          }
        },
        updated_at: now
      })
      .eq('id', client_produit_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Remboursement obtenu – paiement demandé: ${refund_amount} €`);

    // 📅 TIMELINE
    try {
      await DossierTimelineService.paiementDemande({
        dossier_id: client_produit_id,
        expert_name: expertName,
        montant: factureData?.montant_ttc || refund_amount,
        facture_reference: factureData?.invoice_number || payment_reference,
        notes: `Remboursement confirmé le ${refund_date}. Référence: ${payment_reference}`
      });
    } catch (timelineError) {
      console.error('⚠️ Erreur timeline (paiement demandé):', timelineError);
    }

    // 🔔 NOTIFICATIONS → CLIENT (paiement requis)
    if (clientInfo?.auth_user_id) {
      await NotificationTriggers.onPaymentRequested(clientInfo.auth_user_id, {
        dossier_id: client_produit_id,
        produit: produitNom,
        montant: factureData?.montant_ttc || refund_amount,
        facture_reference: factureData?.invoice_number || payment_reference
      });
    }

    // 🔔 NOTIFICATION → ADMIN (information)
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
            title: '💶 Facturation client requise',
            message: `${clientName} - ${produitNom} - ${refund_amount.toLocaleString('fr-FR')} € remboursés`,
            notification_type: 'payment_requested',
            priority: 'medium',
            is_read: false,
            action_url: `/admin/dossiers/${client_produit_id}`,
            created_at: now,
            updated_at: now
          });
        }
      }
    }

    // 🔔 NOTIFICATION → EXPERT (information)
    await supabase.from('notification').insert({
      user_id: user.auth_user_id,
      user_type: 'expert',
      title: '💶 Paiement client demandé',
      message: `Facture ${factureData?.invoice_number || payment_reference} envoyée au client (${(factureData?.montant_ttc || refund_amount).toLocaleString('fr-FR')} €).`,
      notification_type: 'payment_requested',
      priority: 'medium',
      is_read: false,
      action_url: `/expert/dossier/${client_produit_id}`,
      created_at: now,
      updated_at: now
    });

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
          title: `💶 Paiement en attente pour ${clientName}`,
          message: `Montant attendu : ${(factureData?.montant_ttc || refund_amount).toLocaleString('fr-FR')} €.` ,
          notification_type: 'payment_requested',
          priority: 'medium',
          is_read: false,
          action_url: `/apporteur/dossiers/${client_produit_id}`,
          created_at: now,
          updated_at: now
        });
      }
    }

    return res.json({
      success: true,
      message: 'Remboursement confirmé, paiement client demandé',
      data: {
        dossier: updatedDossier,
        facture: factureData
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur confirmation remboursement:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la confirmation du remboursement',
      details: error.message
    });
  }
});

/**
 * GET /api/expert/dossier/:id/download-complete
 * Télécharger tous les documents d'un dossier en ZIP
 */
router.get('/dossier/:id/download-complete', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: client_produit_id } = req.params;

    if (!user || user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    // Récupérer le dossier
    const { data: dossier, error: fetchError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        Client(company_name, nom),
        ProduitEligible(nom)
      `)
      .eq('id', client_produit_id)
      .single();

    if (fetchError || !dossier) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    // Vérifier que l'expert est assigné OU que c'est pending pour lui
    const isAssigned = dossier.expert_id === user.database_id;
    const isPending = dossier.expert_pending_id === user.database_id;

    if (!isAssigned && !isPending) {
      return res.status(403).json({
        success: false,
        message: 'Ce dossier ne vous est pas assigné'
      });
    }

    // Récupérer tous les documents du dossier
    const { data: documents, error: docsError } = await supabase
      .from('ClientProcessDocument')
      .select('*')
      .eq('client_produit_id', client_produit_id)
      .order('created_at', { ascending: true });

    if (docsError) {
      console.error('❌ Erreur récupération documents:', docsError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des documents'
      });
    }

    if (!documents || documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucun document trouvé pour ce dossier'
      });
    }

    console.log(`📦 Préparation ZIP: ${documents.length} documents`);

    // Importer archiver pour créer le ZIP
    const archiver = require('archiver');
    
    // Nom du fichier ZIP
    const clientInfo = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
    const clientName = clientInfo?.company_name || clientInfo?.nom || 'Client';
    const produitNom = dossier.ProduitEligible?.nom || 'Dossier';
    const zipFilename = `${clientName.replace(/[^a-z0-9]/gi, '_')}_${produitNom}_${new Date().toISOString().split('T')[0]}.zip`;

    // Configurer les headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

    // Créer l'archive ZIP
    const archive = archiver('zip', {
      zlib: { level: 9 } // Compression maximale
    });

    // Gérer les erreurs
    archive.on('error', (err: any) => {
      console.error('❌ Erreur création ZIP:', err);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du ZIP'
      });
    });

    // Pipe l'archive vers la réponse
    archive.pipe(res);

    // Ajouter chaque document au ZIP
    for (const doc of documents) {
      try {
        // Télécharger le document depuis Supabase Storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(doc.bucket_name || 'client-documents')
          .download(doc.storage_path);

        if (downloadError || !fileData) {
          console.warn(`⚠️ Impossible de télécharger: ${doc.original_filename}`);
          continue;
        }

        // Convertir en Buffer
        const buffer = Buffer.from(await fileData.arrayBuffer());

        // Organiser par type de document dans le ZIP
        const folderName = doc.document_type || 'autres';
        const fileName = `${folderName}/${doc.original_filename || doc.filename}`;

        // Ajouter au ZIP
        archive.append(buffer, { name: fileName });

      } catch (docError) {
        console.warn(`⚠️ Erreur document ${doc.id}:`, docError);
        // Continuer avec les autres documents
      }
    }

    // Ajouter un fichier README
    const readme = `DOSSIER ${produitNom}
Client: ${clientName}
Date de création: ${new Date(dossier.created_at).toLocaleDateString('fr-FR')}
Montant estimé: ${dossier.montantFinal ? dossier.montantFinal.toLocaleString('fr-FR') + ' €' : 'N/A'}
Statut: ${dossier.statut}
Étape: ${dossier.current_step}/6

Nombre de documents: ${documents.length}

Documents inclus:
${documents.map((d, i) => `${i + 1}. ${d.original_filename || d.filename} (${d.document_type || 'N/A'})`).join('\n')}

---
Téléchargé le: ${new Date().toLocaleString('fr-FR')}
Par: ${user.email}
`;

    archive.append(readme, { name: 'README.txt' });

    // Finaliser l'archive
    archive.finalize();

    console.log(`✅ ZIP généré: ${zipFilename} (${documents.length} documents)`);

    // Attendre que le stream soit terminé
    return new Promise<void>((resolve, reject) => {
      archive.on('end', () => {
        console.log('✅ ZIP envoyé avec succès');
        resolve();
      });
      archive.on('error', (err: any) => {
        console.error('❌ Erreur stream ZIP:', err);
        reject(err);
      });
    });

  } catch (error: any) {
    console.error('❌ Erreur download-complete:', error);
    
    // Si headers pas encore envoyés, envoyer erreur JSON
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du téléchargement',
        details: error.message
      });
    }
  }
});

/**
 * POST /api/expert/dossier/:id/record-final-result
 * Expert saisit le résultat final de l'administration + Génération facture automatique
 */
router.post('/dossier/:id/record-final-result', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: client_produit_id } = req.params;
    const { decision, montant_reel_accorde, date_retour, motif_difference } = req.body;

    if (!user || user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    if (!decision || !['accepte', 'partiel', 'refuse'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Décision invalide (accepte, partiel ou refuse requis)'
      });
    }

    if (!montant_reel_accorde || !date_retour) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes (montant_reel_accorde, date_retour requis)'
      });
    }

    console.log('📋 Expert saisit résultat final administration:', {
      expert_id: user.database_id,
      client_produit_id,
      decision,
      montant_reel: montant_reel_accorde
    });

    // Récupérer le dossier
    const { data: dossier, error: fetchError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        Client(id, auth_user_id, company_name, nom, prenom, apporteur_id),
        ProduitEligible(nom),
        Expert(id, name, compensation)
      `)
      .eq('id', client_produit_id)
      .eq('expert_id', user.database_id)
      .single();

    if (fetchError || !dossier) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé ou non autorisé'
      });
    }

    const clientInfo = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
    const clientName = clientInfo?.company_name || clientInfo?.nom || 'Client';
    const expertInfo = Array.isArray(dossier.Expert) ? dossier.Expert[0] : dossier.Expert;
    const expertNameFallback = expertInfo?.name || user.email || 'Expert';

    const montantDemande = dossier.montantFinal || 0;
    const difference = montant_reel_accorde - montantDemande;

    const isPositiveDecision = decision !== 'refuse';
    const statutResultat = isPositiveDecision ? 'implementation_validated' : 'implementation_in_progress';
    const stepResultat = isPositiveDecision ? 7 : Math.max(dossier.current_step || 6, 6);
    const progressResultat = isPositiveDecision ? 90 : Math.min((dossier.progress || 80), 85);

    const { data: updatedDossier, error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        statut: statutResultat,
        current_step: stepResultat,
        progress: progressResultat,
        metadata: {
          ...(dossier.metadata || {}),
          administration_result: {
            decision: decision,
            montant_demande: montantDemande,
            montant_accorde: montant_reel_accorde,
            difference: difference,
            date_retour: date_retour,
            motif_difference: motif_difference || null,
            recorded_by: user.database_id,
            recorded_at: new Date().toISOString()
          },
          implementation: {
            ...(dossier.metadata?.implementation || {}),
            status: isPositiveDecision ? 'validated' : 'rejected',
            validated_by: user.database_id,
            validated_at: new Date().toISOString(),
            decision,
            montant_accorde: montant_reel_accorde
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', client_produit_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Résultat administration enregistré - ${decision} - ${montant_reel_accorde} €`);

    // 📅 TIMELINE
    try {
      if (isPositiveDecision) {
        await DossierTimelineService.implementationValidee({
          dossier_id: client_produit_id,
          expert_name: expertNameFallback,
          montant_accorde: montant_reel_accorde,
          decision,
          difference,
          date_retour
        });
      } else {
        await DossierTimelineService.addEvent({
          dossier_id: client_produit_id,
          type: 'expert_action',
          actor_type: 'expert',
          actor_name: expertNameFallback,
          title: '❌ Administration: dossier refusé',
          description: `Décision finale : refusée. Motif : ${motif_difference || 'Non communiqué'}`,
          metadata: {
            decision,
            motif_difference: motif_difference || null,
            date_retour
          },
          icon: '❌',
          color: 'red'
        });
      }
    } catch (timelineError) {
      console.error('⚠️ Erreur timeline (non bloquant):', timelineError);
    }

    // 🔔 NOTIFICATIONS
    const produitInfo = Array.isArray(dossier.ProduitEligible) ? dossier.ProduitEligible[0] : dossier.ProduitEligible;
    const produitNom = produitInfo?.nom || 'Produit';

    if (clientInfo?.auth_user_id) {
      if (isPositiveDecision) {
        await NotificationTriggers.onImplementationValidated(clientInfo.auth_user_id, {
          dossier_id: client_produit_id,
          produit: produitNom,
          montant_accorde: montant_reel_accorde,
          decision
        });
      } else {
        await supabase.from('notification').insert({
          user_id: clientInfo.auth_user_id,
          user_type: 'client',
          title: '❌ Dossier refusé par l\'administration',
          message: `Motif communiqué : ${motif_difference || 'Non précisé'}. Votre expert vous contactera pour la suite.`,
          notification_type: 'dossier_refused',
          priority: 'high',
          is_read: false,
          action_url: `/produits/${produitNom.toLowerCase()}/${client_produit_id}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    if (isPositiveDecision && clientInfo?.apporteur_id) {
      const { data: apporteurData } = await supabase
        .from('ApporteurAffaires')
        .select('auth_user_id')
        .eq('id', clientInfo.apporteur_id)
        .single();

      if (apporteurData?.auth_user_id) {
        await supabase.from('notification').insert({
          user_id: apporteurData.auth_user_id,
          user_type: 'apporteur',
          title: `✅ Résultat positif pour ${clientName}`,
          message: `Montant accordé : ${montant_reel_accorde.toLocaleString('fr-FR')} €. Nous préparons la facturation.` ,
          notification_type: 'implementation_validated',
          priority: 'medium',
          is_read: false,
          action_url: `/apporteur/dossiers/${client_produit_id}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

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
            title: `${isPositiveDecision ? '✅' : '❌'} Résultat administration`,
            message: `${clientName} - Décision: ${decision} - ${montant_reel_accorde.toLocaleString('fr-FR')} €`,
            notification_type: isPositiveDecision ? 'implementation_validated' : 'dossier_refused',
            priority: isPositiveDecision ? 'medium' : 'high',
            is_read: false,
            action_url: `/admin/dossiers/${client_produit_id}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    }

    return res.json({
      success: true,
      message: 'Résultat final enregistré avec succès',
      data: {
        dossier: updatedDossier
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur enregistrement résultat final:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement',
      details: error.message
    });
  }
});

/**
 * POST /api/expert/dossier/:id/mark-as-submitted
 * Expert marque le dossier comme soumis à l'administration française
 */
router.post('/dossier/:id/mark-as-submitted', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: client_produit_id } = req.params;
    const { submission_date, reference, organisme, notes } = req.body;

    if (!user || user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    if (!submission_date || !reference || !organisme) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes (submission_date, reference, organisme requis)'
      });
    }

    console.log('📨 Expert marque dossier comme soumis:', {
      expert_id: user.database_id,
      client_produit_id,
      reference,
      organisme
    });

    // Récupérer le dossier
    const { data: dossier, error: fetchError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        Client(id, auth_user_id, company_name, nom, prenom, apporteur_id),
        ProduitEligible(nom),
        Expert(id, name)
      `)
      .eq('id', client_produit_id)
      .eq('expert_id', user.database_id)
      .single();

    if (fetchError || !dossier) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé ou non autorisé'
      });
    }

    const clientInfo = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
    const clientName = clientInfo?.company_name || clientInfo?.nom || 'Client';
    const expertInfo = Array.isArray(dossier.Expert) ? dossier.Expert[0] : dossier.Expert;
    const expertNameFallback = expertInfo?.name || user.email || 'Expert';

    // Mettre à jour le dossier
    const { data: updatedDossier, error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        statut: 'implementation_in_progress',
        date_demande_envoyee: new Date(submission_date).toISOString(),
        current_step: 6,
        progress: 80,
        metadata: {
          ...(dossier.metadata || {}),
          implementation: {
            ...(dossier.metadata?.implementation || {}),
            status: 'in_progress',
            submitted_by: user.database_id,
            submission_date,
            reference,
            organisme,
            notes: notes || null,
            updated_at: new Date().toISOString()
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', client_produit_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Dossier marqué comme soumis - Réf: ${reference}`);

    // 📅 TIMELINE
    try {
      await DossierTimelineService.implementationEnCours({
        dossier_id: client_produit_id,
        expert_name: expertNameFallback,
        organisme,
        reference,
        submission_date
      });
    } catch (timelineError) {
      console.error('⚠️ Erreur timeline (non bloquant):', timelineError);
    }

    // 🔔 NOTIFICATION → CLIENT
    if (clientInfo?.auth_user_id) {
      await NotificationTriggers.onImplementationInProgress(clientInfo.auth_user_id, {
        dossier_id: client_produit_id,
        produit: dossier.ProduitEligible?.nom || 'Produit',
        organisme,
        reference
      });
    }

    // 🔔 NOTIFICATION → APPORTEUR
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
          title: `🛠️ Dossier ${clientName} en mise en œuvre`,
          message: `${expertNameFallback} suit le remboursement auprès de ${organisme}. Référence : ${reference}.`,
          notification_type: 'implementation_in_progress',
          priority: 'medium',
          is_read: false,
          action_url: `/apporteur/dossiers/${client_produit_id}`,
          action_data: {
            reference,
            organisme,
            submission_date
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    // 🔔 NOTIFICATION → ADMIN
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
            title: `🛠️ Dossier en mise en œuvre`,
            message: `${clientName} - ${expertNameFallback} - Réf: ${reference}`,
            notification_type: 'implementation_in_progress',
            priority: 'low',
            is_read: false,
            action_url: `/admin/dossiers/${client_produit_id}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    }

    return res.json({
      success: true,
      message: 'Dossier marqué comme soumis avec succès',
      data: updatedDossier
    });

  } catch (error: any) {
    console.error('❌ Erreur soumission dossier:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la soumission',
      details: error.message
    });
  }
});

/**
 * GET /api/expert/invoices
 * Liste des factures/commissions Profitum pour l'expert
 */
router.get('/invoices', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user || user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    console.log('💰 Récupération factures expert:', user.database_id);

    // Récupérer toutes les factures de l'expert
    const { data: invoices, error } = await supabase
      .from('invoice')
      .select(`
        *,
        ClientProduitEligible(
          id,
          montantFinal,
          Client(company_name, nom, prenom),
          ProduitEligible(nom)
        )
      `)
      .eq('expert_id', user.database_id)
      .order('issue_date', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération factures expert:', error);
      throw error;
    }

    // Calculer les totaux
    const totaux = {
      nombre_factures: invoices?.length || 0,
      total_ht: invoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0,
      total_ttc: invoices?.reduce((sum, inv) => {
        const ht = inv.amount || 0;
        const tva = (inv.metadata as any)?.tva || (ht * 0.20);
        return sum + ht + tva;
      }, 0) || 0,
      factures_payees: invoices?.filter(inv => inv.status === 'paid').length || 0
    };

    console.log(`✅ ${totaux.nombre_factures} facture(s) trouvée(s)`);

    return res.json({
      success: true,
      data: invoices || [],
      totaux
    });

  } catch (error: any) {
    console.error('❌ Erreur récupération factures expert:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      details: error.message
    });
  }
});

export default router;



