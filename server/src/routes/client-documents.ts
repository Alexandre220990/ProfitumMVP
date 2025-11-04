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

export default router;

