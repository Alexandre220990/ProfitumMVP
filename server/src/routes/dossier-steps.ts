import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { DossierStepGenerator } from '../services/dossierStepGenerator';
import { enhancedAuthMiddleware } from '../middleware/auth-enhanced';
import jwt from 'jsonwebtoken';
import { normalizeDossierStatus, DossierStatus } from '../utils/dossierStatus';
import { DossierTimelineService } from '../services/dossier-timeline-service';
import { NotificationTriggers } from '../services/NotificationTriggers';

const router = Router();

console.log('🔧 Module dossier-steps chargé');

// POST /api/dossier-steps/generate - Générer les étapes pour un dossier spécifique
router.post('/generate', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { dossier_id } = req.body;
    
    if (!dossier_id) {
      return res.status(400).json({
        success: false,
        message: 'dossier_id requis'
      });
    }

    console.log(`🔧 Génération des étapes pour le dossier: ${dossier_id}`);
    
    const success = await DossierStepGenerator.generateStepsForDossier(dossier_id);
    
    if (success) {
      // Mettre à jour le progress du dossier
      await DossierStepGenerator.updateDossierProgress(dossier_id);
      
      return res.json({
        success: true,
        message: 'Étapes générées avec succès'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération des étapes'
      });
    }
  } catch (error) {
    console.error('❌ Erreur génération étapes:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/dossier/documents/upload - Upload de documents pour l'éligibilité TICPE
router.post('/documents/upload', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { dossier_id, document_type, file_data, file_name, file_size, mime_type } = req.body;
    const user = req.user;

    if (!dossier_id || !document_type || !file_data) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire du dossier
    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('clientId, ProduitEligible(nom)')
      .eq('id', dossier_id)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    if (!user || dossier.clientId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Créer l'enregistrement du document
    const { data: document, error: docError } = await supabase
      .from('DocumentFile')
      .insert({
        client_id: user?.id,
        original_filename: file_name,
        stored_filename: `${Date.now()}_${file_name}`,
        file_path: `dossiers/${dossier_id}/${document_type}/${file_name}`,
        file_size: file_size,
        mime_type: mime_type,
        category: 'document_eligibilite',
        document_type: document_type,
        description: `Document ${document_type} pour dossier TICPE`,
        status: 'uploaded',
        validation_status: 'pending',
        metadata: {
          dossier_id: dossier_id,
          product_type: dossier.ProduitEligible?.[0]?.nom,
          uploaded_by: user?.id,
          upload_date: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (docError) {
      console.error('❌ Erreur création document:', docError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload du document'
      });
    }

    // Vérifier si tous les documents requis sont uploadés
    await checkEligibilityDocumentsComplete(dossier_id);

    return res.json({
      success: true,
      message: 'Document uploadé avec succès',
      data: document
    });

  } catch (error) {
    console.error('❌ Erreur upload document:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/dossier/eligibility/validate - Validation admin de l'éligibilité
router.post('/eligibility/validate', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { dossier_id, is_eligible, admin_notes } = req.body;
    const user = req.user;

    if (!dossier_id || typeof is_eligible !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants'
      });
    }

    // Vérifier que l'utilisateur est admin
    if (!user || user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    // Mettre à jour le statut du dossier
    const { error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        statut: is_eligible ? 'admin_validated' : 'admin_rejected',
        notes: admin_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', dossier_id);

    if (updateError) {
      console.error('❌ Erreur mise à jour dossier:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la validation'
      });
    }

    // Mettre à jour l'étape correspondante
    const { error: stepError } = await supabase
      .from('DossierStep')
      .update({
        status: is_eligible ? 'completed' : 'overdue',
        progress: is_eligible ? 100 : 0,
        updated_at: new Date().toISOString()
      })
      .eq('dossier_id', dossier_id)
      .eq('step_name', 'Confirmer l\'éligibilité');

    if (stepError) {
      console.error('❌ Erreur mise à jour étape:', stepError);
    }

    // Si éligible, passer à l'étape suivante
    if (is_eligible) {
      await supabase
        .from('DossierStep')
        .update({
          status: 'in_progress',
          progress: 0,
          updated_at: new Date().toISOString()
        })
        .eq('dossier_id', dossier_id)
        .eq('step_name', 'Sélection de l\'expert');
    }

    // Mettre à jour le progress global
    await DossierStepGenerator.updateDossierProgress(dossier_id);

    return res.json({
      success: true,
      message: `Éligibilité ${is_eligible ? 'confirmée' : 'refusée'} avec succès`
    });

  } catch (error) {
    console.error('❌ Erreur validation éligibilité:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.post('/charte/send', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { dossier_id, document_url, message } = req.body;

    if (!user || (user.type !== 'expert' && user.type !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts ou administrateurs'
      });
    }

    if (!dossier_id) {
      return res.status(400).json({
        success: false,
        message: 'dossier_id requis'
      });
    }

    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        Client:clientId (
          id,
          auth_user_id,
          company_name,
          first_name,
          last_name
        ),
        ProduitEligible:produitId (
          id,
          nom
        ),
        Expert:expert_id (
          id,
          name,
          auth_user_id
        )
      `)
      .eq('id', dossier_id)
      .single();

    if (dossierError || !dossier) {
      console.error('❌ Dossier non trouvé pour charte:', dossierError);
      return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
    }

    const normalizedStatus = normalizeDossierStatus(dossier.statut);

    if (normalizedStatus === 'charte_signed') {
      return res.status(400).json({
        success: false,
        message: 'La charte est déjà signée'
      });
    }

    if (!['expert_validated', 'charte_pending'].includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Le dossier doit être validé par l’expert avant l’envoi de la charte'
      });
    }

    if (user.type === 'expert' && dossier.expert_id !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Ce dossier ne vous est pas assigné'
      });
    }

    const now = new Date().toISOString();
    const actorName = await (async () => {
      if (user.type === 'expert') {
        const { data } = await supabase
          .from('Expert')
          .select('name, email')
          .eq('id', user.database_id)
          .single();
        return data?.name || data?.email || 'Expert';
      }

      const { data } = await supabase
        .from('Admin')
        .select('name, email')
        .eq('id', user.database_id)
        .single();
      return data?.name || data?.email || 'Admin';
    })();

    const { data: updatedDossier, error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        statut: 'charte_pending',
        charte_signed: false,
        charte_signed_at: null,
        updated_at: now,
        metadata: {
          ...dossier.metadata,
          charte: {
            ...(dossier.metadata?.charte || {}),
            status: 'pending',
            sent_at: now,
            sent_by: user.database_id || user.id,
            sent_by_type: user.type,
            document_url: document_url || null,
            message: message || null
          }
        }
      })
      .eq('id', dossier_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour dossier (charte):', updateError);
      throw updateError;
    }

    try {
      await DossierTimelineService.charteEnvoyee({
        dossier_id,
        actor_name: actorName,
        message,
        document_url
      });
    } catch (timelineError) {
      console.error('⚠️ Erreur timeline charte (non bloquant):', timelineError);
    }

    const clientInfo = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;

    if (clientInfo?.auth_user_id) {
      await NotificationTriggers.onCharteSignatureRequested(clientInfo.auth_user_id, {
        dossier_id,
        produit: dossier.ProduitEligible?.nom || 'Produit',
        expert_name: actorName,
        charte_url: document_url
      });
    }

    return res.json({
      success: true,
      message: 'Charte envoyée avec succès',
      data: updatedDossier
    });

  } catch (error) {
    console.error('❌ Erreur envoi charte:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l’envoi de la charte'
    });
  }
});

router.post('/charte/sign', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { dossier_id, accept_terms } = req.body;

    if (!user || user.type !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients'
      });
    }

    if (!dossier_id) {
      return res.status(400).json({
        success: false,
        message: 'dossier_id requis'
      });
    }

    if (!accept_terms) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez accepter les conditions pour signer la charte'
      });
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
        ),
        Expert:expert_id (
          id,
          name,
          auth_user_id
        )
      `)
      .eq('id', dossier_id)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
    }

    if (dossier.clientId !== user.database_id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    const normalizedStatus = normalizeDossierStatus(dossier.statut);

    if (normalizedStatus !== 'charte_pending' && normalizedStatus !== 'charte_signed') {
      return res.status(400).json({
        success: false,
        message: 'La charte doit être envoyée avant signature'
      });
    }

    const now = new Date().toISOString();
    const userAgent = req.get('User-Agent') || null;
    const ipHeader = req.headers['x-forwarded-for'];
    const ipAddress = Array.isArray(ipHeader) ? ipHeader[0] : ipHeader || req.ip || null;

    const { error: signatureError } = await supabase
      .from('client_charte_signature')
      .upsert({
        client_id: dossier.clientId,
        produit_id: dossier.produitId,
        client_produit_eligible_id: dossier_id,
        signature_date: now,
        ip_address: ipAddress || null,
        user_agent: userAgent
      }, { onConflict: 'client_produit_eligible_id' });

    if (signatureError) {
      console.error('❌ Erreur enregistrement signature charte:', signatureError);
      throw signatureError;
    }

    const { data: updatedDossier, error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        statut: 'charte_signed',
        charte_signed: true,
        charte_signed_at: now,
        updated_at: now,
        metadata: {
          ...dossier.metadata,
          charte: {
            ...(dossier.metadata?.charte || {}),
            status: 'signed',
            signed_at: now,
            signed_ip: ipAddress,
            signed_user_agent: userAgent
          }
        }
      })
      .eq('id', dossier_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    const clientInfo = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
    const clientName = clientInfo?.company_name || 'Client';

    try {
      await DossierTimelineService.charteSignee({
        dossier_id,
        client_name: clientName
      });
    } catch (timelineError) {
      console.error('⚠️ Erreur timeline charte signée (non bloquant):', timelineError);
    }

    const expertInfo = Array.isArray(dossier.Expert) ? dossier.Expert[0] : dossier.Expert;

    await NotificationTriggers.onCharteSigned(expertInfo?.auth_user_id || null, {
      dossier_id,
      produit: dossier.ProduitEligible?.nom || 'Produit',
      client_name: clientName
    });

    return res.json({
      success: true,
      message: 'Charte signée avec succès',
      data: updatedDossier
    });

  } catch (error) {
    console.error('❌ Erreur signature charte:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la signature de la charte'
    });
  }
});

// OPTIONS /api/dossier-steps/expert/select - Preflight request
router.options('/expert/select', (req: Request, res: Response) => {
  console.log('🔍 [DEBUG] OPTIONS request reçue sur /expert/select');
  console.log('🔍 [DEBUG] Headers OPTIONS:', req.headers);
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.header('Access-Control-Max-Age', '86400');
  res.status(200).send();
});

// GET /api/dossier-steps/expert/select - Route temporaire pour debug
router.get('/expert/select', (req: Request, res: Response) => {
  console.log('🔍 [DEBUG] GET request reçue sur /expert/select');
  res.status(405).json({
    success: false,
    message: 'Méthode GET non autorisée. Utilisez POST.',
    allowedMethods: ['POST', 'OPTIONS']
  });
});

// POST /api/dossier-steps/expert/select - Sélection d'un expert par le client
console.log('🔧 Route /expert/select définie');
router.post('/expert/select', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    console.log('🔍 [DEBUG] Endpoint /expert/select appelé');
    console.log('🔍 [DEBUG] Method:', req.method);
    console.log('🔍 [DEBUG] Headers:', req.headers);
    console.log('🔍 [DEBUG] Body:', req.body);
    console.log('🔍 [DEBUG] User:', req.user);
    
    const { dossier_id, expert_id } = req.body;
    const user = req.user;

    if (!dossier_id || !expert_id) {
      console.error('❌ [DEBUG] Paramètres manquants:', { dossier_id, expert_id });
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants'
      });
    }

    console.log('🔍 [DEBUG] Paramètres reçus:', { dossier_id, expert_id, userId: user?.id, userType: user?.type });

    // Vérifier que l'utilisateur est le propriétaire du dossier
    console.log('🔍 [DEBUG] Recherche dossier:', dossier_id);
    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        "clientId", 
        statut,
        montantFinal,
        ProduitEligible:produitId (
          nom,
          type_produit
        )
      `)
      .eq('id', dossier_id)
      .single();

    if (dossierError) {
      console.error('❌ [DEBUG] Erreur recherche dossier:', dossierError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche du dossier'
      });
    }

    if (!dossier) {
      console.error('❌ [DEBUG] Dossier non trouvé:', dossier_id);
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    if (!user || dossier.clientId !== user.database_id) {
      console.error('❌ [DEBUG] Accès refusé:', { 
        dossierClientId: dossier.clientId, 
        userDatabaseId: user?.database_id,
        userAuthId: user?.id,
        match: dossier.clientId === user?.database_id 
      });
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    console.log('🔍 [DEBUG] Dossier trouvé:', { clientId: dossier.clientId, statut: dossier.statut });
    
    const normalized = normalizeDossierStatus(dossier.statut);
    const allowedStatuses = new Set<DossierStatus>([
      'pending_upload',
      'pending_admin_validation',
      'admin_validated',
      'expert_assigned',
      'expert_pending_validation',
      'expert_validated'
    ]);

    if (!allowedStatuses.has(normalized)) {
      console.error('❌ [DEBUG] Statut dossier non autorisé:', dossier.statut);
      return res.status(400).json({
        success: false,
        message: `Le dossier doit être validé par l'admin pour sélectionner un expert. Statut actuel: ${dossier.statut}`
      });
    }
 
    console.log('✅ [DEBUG] Statut autorisé pour sélection expert:', normalized);

    // Vérifier que l'expert existe et est disponible
    const { data: expert, error: expertError } = await supabase
      .from('Expert')
      .select('id, name, email, specializations, status')
      .eq('id', expert_id)
      .eq('status', 'active')
      .single();

    if (expertError || !expert) {
      return res.status(404).json({
        success: false,
        message: 'Expert non trouvé ou non disponible'
      });
    }

    // Mettre à jour l'expert_id dans ClientProduitEligible
    const { error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        expert_id: expert_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', dossier_id);

    if (updateError) {
      console.error('❌ Erreur mise à jour expert_id:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du dossier'
      });
    }

    // Créer l'assignation d'expert
    const { data: assignment, error: assignError } = await supabase
      .from('expertassignment')
      .insert({
        expert_id: expert_id,
        client_id: user?.database_id,  // ✅ FIX: database_id au lieu de auth_user_id
        client_produit_eligible_id: dossier_id,
        status: 'pending',
        assignment_date: new Date().toISOString(),
        notes: `Assignation pour dossier ${dossier_id}`
      })
      .select()
      .single();
    
    console.log('✅ [DEBUG] Assignation créée:', { 
      expert_id, 
      client_id: user?.database_id,
      dossier_id 
    });

    if (assignError) {
      console.error('❌ Erreur création assignation:', assignError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la sélection de l\'expert'
      });
    }

    // Mettre à jour l'étape de sélection d'expert
    const { error: stepError } = await supabase
      .from('DossierStep')
      .update({
        status: 'completed',
        progress: 100,
        assignee_id: expert_id,
        assignee_name: expert.name,
        assignee_type: 'expert',
        updated_at: new Date().toISOString()
      })
      .eq('dossier_id', dossier_id)
      .eq('step_name', 'Sélection de l\'expert');

    if (stepError) {
      console.error('❌ Erreur mise à jour étape:', stepError);
    }

    // Passer à l'étape suivante
    await supabase
      .from('DossierStep')
      .update({
        status: 'in_progress',
        progress: 0,
        updated_at: new Date().toISOString()
      })
      .eq('dossier_id', dossier_id)
      .eq('step_name', 'Collecte des documents');

    // Mettre à jour le progress global
    await DossierStepGenerator.updateDossierProgress(dossier_id);

    // 📅 TIMELINE : Ajouter événement assignation expert
    try {
      const { DossierTimelineService } = await import('../services/dossier-timeline-service');
      
      // Récupérer les infos du dossier pour la timeline
      const { data: dossierInfo } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          Client:clientId (company_name),
          ProduitEligible:produitId (nom)
        `)
        .eq('id', dossier_id)
        .single();

      const clientName = (dossierInfo as any)?.Client?.company_name || 'Client';
      const productName = (dossierInfo as any)?.ProduitEligible?.nom || 'Produit';
      
      await DossierTimelineService.expertAssigne({
        dossier_id: dossier_id,
        expert_id: expert_id,
        expert_name: expert.name,
        product_name: productName,
        client_name: clientName
      });

      console.log('✅ Événement timeline ajouté (expert assigné)');
    } catch (timelineError) {
      console.error('⚠️ Erreur timeline (non bloquant):', timelineError);
    }

    // 🔔 DEMANDE #6: Envoyer notification à l'expert
    try {
      const { ExpertNotificationService } = await import('../services/expert-notification-service');
      
      // Récupérer les infos client pour la notification
      const { data: clientData } = await supabase
        .from('Client')
        .select('company_name, first_name, last_name')
        .eq('id', dossier.clientId)
        .single();
      
      const clientName = clientData?.first_name && clientData?.last_name
        ? `${clientData.first_name} ${clientData.last_name}`
        : clientData?.company_name || 'Client';
      
      // Récupérer le nom du produit depuis la relation
      const produitNom = (dossier as any).ProduitEligible?.nom || expert.specializations?.[0] || 'Produit';
      const produitType = (dossier as any).ProduitEligible?.type_produit || expert.specializations?.[0] || 'Produit';
      
      console.log(`📋 [DEBUG] Notification expert - Produit: ${produitNom}`);
      
      await ExpertNotificationService.notifyDossierPendingAcceptance({
        expert_id: expert_id,
        client_produit_id: dossier_id,
        client_id: dossier.clientId,
        client_company: clientData?.company_name,
        client_name: clientName,
        product_type: produitType,
        product_name: produitNom,
        estimated_amount: (dossier as any).montantFinal || 0
      });
      
      console.log('✅ [DEBUG] Notification envoyée à l\'expert:', expert_id);
    } catch (notifError) {
      console.error('⚠️ [DEBUG] Erreur notification expert (non bloquant):', notifError);
    }

    return res.json({
      success: true,
      message: 'Expert sélectionné avec succès',
      data: {
        assignment,
        expert: {
          id: expert.id,
          name: expert.name,
          email: expert.email
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur sélection expert:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace');
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la sélection de l\'expert',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// POST /api/dossier/expert/accept - Acceptation de l'assignation par l'expert
router.post('/expert/accept', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { assignment_id, expert_notes } = req.body;
    const user = req.user;

    if (!assignment_id) {
      return res.status(400).json({
        success: false,
        message: 'assignment_id requis'
      });
    }

    // Vérifier que l'utilisateur est l'expert assigné
    const { data: assignment, error: assignError } = await supabase
      .from('ExpertAssignment')
      .select('id, expert_id, client_produit_id, status')
      .eq('id', assignment_id)
      .single();

    if (assignError || !assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignation non trouvée'
      });
    }

    if (!user || assignment.expert_id !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    if (assignment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette assignation ne peut plus être acceptée'
      });
    }

    // Accepter l'assignation
    const { error: updateError } = await supabase
      .from('ExpertAssignment')
      .update({
        status: 'accepted',
        accepted_date: new Date().toISOString(),
        notes: expert_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignment_id);

    if (updateError) {
      console.error('❌ Erreur acceptation assignation:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'acceptation'
      });
    }

    return res.json({
      success: true,
      message: 'Assignation acceptée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur acceptation expert:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Fonction utilitaire pour vérifier si tous les documents d'éligibilité sont uploadés
async function checkEligibilityDocumentsComplete(dossier_id: string): Promise<boolean> {
  try {
    const { data: documents, error } = await supabase
      .from('DocumentFile')
      .select('document_type, status')
      .eq('metadata->>dossier_id', dossier_id)
      .eq('category', 'document_eligibilite')
      .in('document_type', ['kbis', 'immatriculation']);

    if (error || !documents) {
      return false;
    }

    const hasKbis = documents.some(doc => doc.document_type === 'kbis' && doc.status === 'uploaded');
    const hasImmatriculation = documents.some(doc => doc.document_type === 'immatriculation' && doc.status === 'uploaded');

    return hasKbis && hasImmatriculation;
  } catch (error) {
    console.error('❌ Erreur vérification documents:', error);
    return false;
  }
}

// GET /api/dossier-steps/:dossier_id - Récupérer les étapes d'un dossier
router.get('/:dossier_id', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { dossier_id } = req.params;
    
    // Forcer le retour de données en évitant le cache
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    const { data: steps, error } = await supabase
      .from('DossierStep')
      .select('*')
      .eq('dossier_id', dossier_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Erreur récupération des étapes:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des étapes'
      });
    }

    // Toujours retourner un tableau, même vide
    return res.status(200).json({
      success: true,
      data: steps || [],
      count: steps?.length || 0,
      dossier_id: dossier_id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur récupération étapes:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PUT /api/dossier-steps/:step_id - Mettre à jour une étape
router.put('/:step_id', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { step_id } = req.params;
    const updateData = req.body;
    
    const { data: step, error } = await supabase
      .from('DossierStep')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', step_id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur mise à jour étape:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'étape'
      });
    }

    // Mettre à jour le progress du dossier parent
    if (step) {
      await DossierStepGenerator.updateDossierProgress(step.dossier_id);
    }

    return res.json({
      success: true,
      data: step
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour étape:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/dossier-steps/auto-generate - Déclencheur automatique
router.post('/auto-generate', async (req: Request, res: Response) => {
  try {
    // Cette route peut être appelée par un webhook ou un cron job
    console.log('🤖 Déclenchement automatique de la génération des étapes...');
    
    const result = await DossierStepGenerator.generateStepsForAllEligibleDossiers();
    
    return res.json({
      success: true,
      message: 'Génération automatique terminée',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur génération automatique:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router; 