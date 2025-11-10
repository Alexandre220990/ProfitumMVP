/**
 * Routes API pour les produits simplifiés (Chronotachygraphes, Logiciel Solid)
 * Workflow simplifié : questionnaire initial → devis partenaire → validation → facturation
 */

import express, { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { enhancedAuthMiddleware, AuthenticatedRequest } from '../middleware/auth-enhanced';
import { DossierTimelineService } from '../services/dossier-timeline-service';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface NotificationPayload {
  user_id: string;
  user_type: 'client' | 'expert' | 'admin' | 'apporteur';
  title: string;
  message: string;
  notification_type: string;
  priority?: 'low' | 'medium' | 'high';
  action_url?: string;
  metadata?: Record<string, any>;
}

async function createNotification(payload: NotificationPayload) {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from('notification').insert({
    user_id: payload.user_id,
    user_type: payload.user_type,
    title: payload.title,
    message: payload.message,
    notification_type: payload.notification_type,
    priority: payload.priority ?? 'medium',
    is_read: false,
    created_at: now,
    updated_at: now,
    action_url: payload.action_url ?? null,
    metadata: payload.metadata ?? null,
  });

  if (error) {
    console.error('❌ Erreur création notification:', error);
  }
}

function getFirst<T>(value: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value ?? undefined;
}

// ============================================================================
// HELPER: Récupérer l'expert distributeur par produit
// ============================================================================
async function getDistributorExpert(productKey: 'chronotachygraphes' | 'logiciel_solid') {
  const email = productKey === 'chronotachygraphes' 
    ? 'oclock@profitum.fr' 
    : 'solid@profitum.fr';
  
  const { data: expert, error } = await supabase
    .from('Expert')
    .select('id, name, email, company_name')
    .eq('email', email)
    .eq('status', 'active')
    .single();
  
  if (error || !expert) {
    console.error(`❌ Expert distributeur non trouvé pour ${productKey}:`, error);
    return null;
  }
  
  return expert;
}

// ============================================================================
// POST /api/simplified-products/:dossierId/initial-checks
// Enregistrer les réponses du questionnaire initial
// ============================================================================
router.post('/:dossierId/initial-checks', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { dossierId } = req.params;
    const { nb_camions, equipement_chrono, nb_utilisateurs, besoins } = req.body;

    if (!user || user.type !== 'client') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux clients' });
    }

    // Vérifier que le dossier appartient au client
    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('id, clientId, produitId, ProduitEligible:produitId(nom, type_produit), metadata')
      .eq('id', dossierId)
      .eq('clientId', user.database_id)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
    }

    // Déterminer le productKey
    const produitEligible = getFirst(dossier.ProduitEligible);
    const productName = produitEligible?.nom || '';
    const productKey = productName.toLowerCase().includes('chronotachygraphe') 
      ? 'chronotachygraphes' 
      : 'logiciel_solid';

    // Préparer les métadonnées
    const checklist = productKey === 'chronotachygraphes'
      ? { nb_camions, equipement_chrono, validated_at: new Date().toISOString() }
      : { nb_utilisateurs, besoins, validated_at: new Date().toISOString() };

    const metadata = {
      ...(dossier.metadata || {}),
      [`${productKey}_checklist`]: checklist
    };

    // Assigner l'expert distributeur automatiquement
    const distributorExpert = await getDistributorExpert(productKey);
    if (!distributorExpert) {
      return res.status(500).json({ success: false, message: 'Expert distributeur non disponible' });
    }

    // Mettre à jour le dossier
    const { error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        metadata,
        expert_id: distributorExpert.id,
        current_step: 1,
        progress: 25,
        statut: 'expert_assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', dossierId);

    if (updateError) {
      console.error('❌ Erreur mise à jour dossier:', updateError);
      return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour' });
    }

    // Créer l'étape DossierStep
    const stepName = 'Vérifications initiales';
    const { data: existingStep } = await supabase
      .from('DossierStep')
      .select('id')
      .eq('dossier_id', dossierId)
      .eq('step_name', stepName)
      .maybeSingle();

    if (!existingStep) {
      await supabase.from('DossierStep').insert({
        dossier_id: dossierId,
        dossier_name: productName,
        step_name: stepName,
        step_type: 'validation',
        status: 'completed',
        progress: 100,
        assignee_id: user.database_id,
        assignee_name: user.email,
        assignee_type: 'client',
        priority: 'high',
        estimated_duration_minutes: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } else {
      await supabase.from('DossierStep')
        .update({ status: 'completed', progress: 100, updated_at: new Date().toISOString() })
        .eq('id', existingStep.id);
    }

    // Timeline
    await DossierTimelineService.addEvent({
      dossier_id: dossierId,
      type: 'client_action',
      actor_type: 'client',
      actor_id: user.database_id,
      actor_name: user.email,
      title: 'Vérifications initiales complétées',
      description: productKey === 'chronotachygraphes'
        ? `${nb_camions} véhicules de +7,5T, équipement chrono: ${equipement_chrono ? 'Oui' : 'Non'}`
        : `${nb_utilisateurs} utilisateurs, besoins: ${besoins}`,
      icon: 'check-circle',
      color: 'green'
    });

    // Notification expert
    await createNotification({
      user_id: distributorExpert.id,
      user_type: 'expert',
      title: 'Nouveau dossier - Vérifications complétées',
      message: `Le client a complété les vérifications initiales pour ${productName}`,
      notification_type: 'dossier_update',
      priority: 'high',
      action_url: `/expert/dossier/${dossierId}`,
      metadata: { dossier_id: dossierId, product_key: productKey }
    });

    return res.json({ success: true, data: { dossier_id: dossierId, expert_id: distributorExpert.id } });

  } catch (error: any) {
    console.error('❌ Erreur initial-checks:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// POST /api/simplified-products/:dossierId/partner-request
// Client demande un devis au partenaire
// ============================================================================
router.post('/:dossierId/partner-request', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { dossierId } = req.params;

    if (!user || user.type !== 'client') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux clients' });
    }

    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('id, clientId, expert_id, ProduitEligible:produitId(nom), Expert:expert_id(id, name, email)')
      .eq('id', dossierId)
      .eq('clientId', user.database_id)
      .single();

    if (dossierError || !dossier || !dossier.expert_id) {
      return res.status(404).json({ success: false, message: 'Dossier ou expert non trouvé' });
    }

    const expert = getFirst(dossier.Expert);
    const produitPartner = getFirst(dossier.ProduitEligible);
    const productName = produitPartner?.nom || 'Produit';

    if (!expert) {
      return res.status(404).json({ success: false, message: 'Expert non trouvé' });
    }

    // Mettre à jour le statut
    await supabase.from('ClientProduitEligible')
      .update({ current_step: 2, progress: 50, updated_at: new Date().toISOString() })
      .eq('id', dossierId);

    // Créer/mettre à jour DossierStep
    const stepName = 'Proposition partenaire';
    const { data: existingStep } = await supabase
      .from('DossierStep')
      .select('id')
      .eq('dossier_id', dossierId)
      .eq('step_name', stepName)
      .maybeSingle();

    if (!existingStep) {
      await supabase.from('DossierStep').insert({
        dossier_id: dossierId,
        dossier_name: productName,
        step_name: stepName,
        step_type: 'expertise',
        status: 'in_progress',
        progress: 50,
        assignee_id: expert.id,
        assignee_name: expert.name,
        assignee_type: 'expert',
        priority: 'high',
        estimated_duration_minutes: 120,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    // Timeline
    await DossierTimelineService.addEvent({
      dossier_id: dossierId,
      type: 'client_action',
      actor_type: 'client',
      actor_id: user.database_id,
      actor_name: user.email,
      title: 'Demande de devis envoyée',
      description: `Demande de devis envoyée à ${expert.name || expert.email}`,
      icon: 'send',
      color: 'blue'
    });

    // Notification expert
    await createNotification({
      user_id: expert.id,
      user_type: 'expert',
      title: 'Demande de devis reçue',
      message: `Le client souhaite recevoir un devis pour ${productName}`,
      notification_type: 'quote_request',
      priority: 'high',
      action_url: `/expert/dossier/${dossierId}`,
      metadata: { dossier_id: dossierId }
    });

    return res.json({ success: true });

  } catch (error: any) {
    console.error('❌ Erreur partner-request:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// POST /api/simplified-products/:dossierId/quote/propose
// Expert propose un devis (formulaire + document optionnel)
// ============================================================================
router.post('/:dossierId/quote/propose', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { dossierId } = req.params;
    const { nombre_camions, prix_unit, total, valid_until, notes, document_id } = req.body;

    if (!user || user.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux experts' });
    }

    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('id, clientId, expert_id, metadata, ProduitEligible:produitId(nom), Client:clientId(company_name, email)')
      .eq('id', dossierId)
      .single();

    if (dossierError || !dossier || dossier.expert_id !== user.database_id) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé ou non assigné' });
    }

    const produitEligible = getFirst(dossier.ProduitEligible);
    const productName = produitEligible?.nom || 'Produit';

    // Calculer la date de validité (1 mois par défaut)
    const validUntilDate = valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Mettre à jour metadata avec le devis
    const metadata = {
      ...(dossier.metadata || {}),
      devis: {
        status: 'proposed',
        proposed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expert_id: user.database_id,
        document_id: document_id || null,
        formulaire: {
          nombre_camions: nombre_camions || null,
          prix_unit: prix_unit || null,
          total: total || null,
          valid_until: validUntilDate,
          etapes: [
            'Prenez RDV pour installation',
            'Installation produit dans véhicule',
            'Paramétrage',
            'Transmission automatique des données'
          ]
        },
        commentaire_expert: notes || null
      }
    };

    await supabase.from('ClientProduitEligible')
      .update({ metadata, current_step: 3, progress: 75, updated_at: new Date().toISOString() })
      .eq('id', dossierId);

    // Mettre à jour DossierStep
    const stepName = 'Devis & validation';
    await supabase.from('DossierStep')
      .update({ status: 'in_progress', progress: 50, updated_at: new Date().toISOString() })
      .eq('dossier_id', dossierId)
      .eq('step_name', stepName);

    // Timeline
    await DossierTimelineService.addEvent({
      dossier_id: dossierId,
      type: 'expert_action',
      actor_type: 'expert',
      actor_id: user.database_id,
      actor_name: user.email,
      title: 'Devis proposé',
      description: `Devis de ${total}€ proposé au client`,
      icon: 'file-text',
      color: 'blue',
      metadata: { total, prix_unit, nombre_camions }
    });

    // Notification client
    await createNotification({
      user_id: dossier.clientId,
      user_type: 'client',
      title: 'Devis disponible',
      message: `Un devis de ${total}€ vous a été proposé pour ${productName}`,
      notification_type: 'quote_proposed',
      priority: 'high',
      action_url: `/produits/${dossierId}`,
      metadata: { dossier_id: dossierId }
    });

    return res.json({ success: true, data: { devis: metadata.devis } });

  } catch (error: any) {
    console.error('❌ Erreur quote/propose:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// POST /api/simplified-products/:dossierId/quote/accept
// Client accepte le devis
// ============================================================================
router.post('/:dossierId/quote/accept', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { dossierId } = req.params;
    const { commentaire } = req.body;

    if (!user || user.type !== 'client') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux clients' });
    }

    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('id, clientId, expert_id, metadata, ProduitEligible:produitId(nom), Expert:expert_id(id, name, email)')
      .eq('id', dossierId)
      .eq('clientId', user.database_id)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
    }

    const expert = getFirst(dossier.Expert);
    const metadata = dossier.metadata || {};
    const devis = metadata.devis || {};

    if (!expert) {
      return res.status(404).json({ success: false, message: 'Expert non trouvé' });
    }

    // Mettre à jour le statut du devis
    metadata.devis = {
      ...devis,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      commentaire_client: commentaire || null
    };

    await supabase.from('ClientProduitEligible')
      .update({ metadata, current_step: 4, progress: 90, updated_at: new Date().toISOString() })
      .eq('id', dossierId);

    // Mettre à jour DossierStep
    await supabase.from('DossierStep')
      .update({ status: 'completed', progress: 100, updated_at: new Date().toISOString() })
      .eq('dossier_id', dossierId)
      .eq('step_name', 'Devis & validation');

    // Créer l'étape facturation
    const produitEligible = getFirst(dossier.ProduitEligible);
    const productName = produitEligible?.nom || 'Produit';
    await supabase.from('DossierStep').upsert({
      dossier_id: dossierId,
      dossier_name: productName,
      step_name: 'Facturation & installation',
      step_type: 'payment',
      status: 'in_progress',
      progress: 0,
      assignee_id: expert.id,
      assignee_name: expert.name,
      assignee_type: 'expert',
      priority: 'high',
      estimated_duration_minutes: 120,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'dossier_id,step_name' });

    // Timeline
    await DossierTimelineService.addEvent({
      dossier_id: dossierId,
      type: 'client_action',
      actor_type: 'client',
      actor_id: user.database_id,
      actor_name: user.email,
      title: 'Devis accepté',
      description: commentaire || 'Devis accepté sans commentaire',
      icon: 'check-circle',
      color: 'green'
    });

    // Notification expert
    await createNotification({
      user_id: expert.id,
      user_type: 'expert',
      title: 'Devis accepté',
      message: 'Le client a accepté votre devis. Vous pouvez maintenant émettre la facture.',
      notification_type: 'quote_accepted',
      priority: 'high',
      action_url: `/expert/dossier/${dossierId}`,
      metadata: { dossier_id: dossierId }
    });

    return res.json({ success: true });

  } catch (error: any) {
    console.error('❌ Erreur quote/accept:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// POST /api/simplified-products/:dossierId/quote/reject
// Client refuse le devis
// ============================================================================
router.post('/:dossierId/quote/reject', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { dossierId } = req.params;
    const { commentaire } = req.body;

    if (!user || user.type !== 'client') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux clients' });
    }

    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('id, clientId, expert_id, metadata, Expert:expert_id(id, name, email)')
      .eq('id', dossierId)
      .eq('clientId', user.database_id)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
    }

    const expert = getFirst(dossier.Expert);
    const metadata = dossier.metadata || {};
    const devis = metadata.devis || {};

    if (!expert) {
      return res.status(404).json({ success: false, message: 'Expert non trouvé' });
    }

    metadata.devis = {
      ...devis,
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      commentaire_client: commentaire || null
    };

    await supabase.from('ClientProduitEligible')
      .update({ metadata, updated_at: new Date().toISOString() })
      .eq('id', dossierId);

    // Timeline
    await DossierTimelineService.addEvent({
      dossier_id: dossierId,
      type: 'client_action',
      actor_type: 'client',
      actor_id: user.database_id,
      actor_name: user.email,
      title: 'Devis refusé',
      description: commentaire || 'Devis refusé',
      icon: 'x-circle',
      color: 'red'
    });

    // Notification expert
    await createNotification({
      user_id: expert.id,
      user_type: 'expert',
      title: 'Devis refusé',
      message: 'Le client a refusé votre devis. Vous pouvez le modifier et le renvoyer.',
      notification_type: 'quote_rejected',
      priority: 'medium',
      action_url: `/expert/dossier/${dossierId}`,
      metadata: { dossier_id: dossierId }
    });

    return res.json({ success: true });

  } catch (error: any) {
    console.error('❌ Erreur quote/reject:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// POST /api/simplified-products/:dossierId/quote/comment
// Client ou expert ajoute un commentaire (demande d'infos complémentaires)
// ============================================================================
router.post('/:dossierId/quote/comment', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { dossierId } = req.params;
    const { commentaire } = req.body;

    if (!user || !['client', 'expert'].includes(user.type)) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('id, clientId, expert_id, metadata, Expert:expert_id(id, name, email)')
      .eq('id', dossierId)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
    }

    // Vérifier permissions
    if (user.type === 'client' && dossier.clientId !== user.database_id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }
    if (user.type === 'expert' && dossier.expert_id !== user.database_id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    const expert = getFirst(dossier.Expert);
    const metadata = dossier.metadata || {};
    const devis = metadata.devis || {};

    if (!expert) {
      return res.status(404).json({ success: false, message: 'Expert non trouvé' });
    }

    if (user.type === 'client') {
      metadata.devis = {
        ...devis,
        status: 'needs_info',
        commentaire_client: commentaire,
        updated_at: new Date().toISOString()
      };

      // Notification expert
      await createNotification({
        user_id: expert.id,
        user_type: 'expert',
        title: 'Demande d\'informations complémentaires',
        message: commentaire,
        notification_type: 'quote_comment',
        priority: 'medium',
        action_url: `/expert/dossier/${dossierId}`,
        metadata: { dossier_id: dossierId }
      });
    } else {
      metadata.devis = {
        ...devis,
        commentaire_expert: commentaire,
        updated_at: new Date().toISOString()
      };

      // Notification client
      await createNotification({
        user_id: dossier.clientId,
        user_type: 'client',
        title: 'Réponse de l\'expert',
        message: commentaire,
        notification_type: 'quote_comment',
        priority: 'medium',
        action_url: `/produits/${dossierId}`,
        metadata: { dossier_id: dossierId }
      });
    }

    await supabase.from('ClientProduitEligible')
      .update({ metadata, updated_at: new Date().toISOString() })
      .eq('id', dossierId);

    // Timeline
    await DossierTimelineService.addEvent({
      dossier_id: dossierId,
      type: user.type === 'client' ? 'client_action' : 'expert_action',
      actor_type: user.type,
      actor_id: user.database_id,
      actor_name: user.email,
      title: user.type === 'client' ? 'Commentaire client' : 'Commentaire expert',
      description: commentaire,
      icon: 'message-circle',
      color: 'blue'
    });

    return res.json({ success: true });

  } catch (error: any) {
    console.error('❌ Erreur quote/comment:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// POST /api/simplified-products/:dossierId/invoice/emit
// Expert émet la facture
// ============================================================================
router.post('/:dossierId/invoice/emit', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { dossierId } = req.params;
    const { amount, description, items } = req.body;

    if (!user || user.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux experts' });
    }

    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('id, clientId, expert_id, metadata, ProduitEligible:produitId(nom), Client:clientId(company_name, email)')
      .eq('id', dossierId)
      .single();

    if (dossierError || !dossier || dossier.expert_id !== user.database_id) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé ou non assigné' });
    }

    const produitEligible = getFirst(dossier.ProduitEligible);
    const productName = produitEligible?.nom || 'Produit';
    const metadata = dossier.metadata || {};
    const devis = metadata.devis || {};

    // Créer la facture dans la table invoice
    const invoiceNumber = `INV-${Date.now()}`;
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoice')
      .insert({
        invoice_number: invoiceNumber,
        client_id: dossier.clientId,
        expert_id: user.database_id,
        client_produit_eligible_id: dossierId,
        amount: amount || devis.formulaire?.total || 0,
        currency: 'EUR',
        status: 'sent',
        issue_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        description: description || `Facture pour ${productName}`,
        items: items || [{ description: productName, amount: amount || devis.formulaire?.total || 0 }],
        metadata: { product_key: 'simplified', devis_id: devis.formulaire?.total },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('❌ Erreur création facture:', invoiceError);
      return res.status(500).json({ success: false, message: 'Erreur lors de la création de la facture' });
    }

    // Mettre à jour metadata
    metadata.facture = {
      status: 'sent',
      facture_id: invoice.id,
      issued_at: new Date().toISOString(),
      amount: amount || devis.formulaire?.total || 0
    };

    await supabase.from('ClientProduitEligible')
      .update({ metadata, updated_at: new Date().toISOString() })
      .eq('id', dossierId);

    // Timeline
    await DossierTimelineService.addEvent({
      dossier_id: dossierId,
      type: 'expert_action',
      actor_type: 'expert',
      actor_id: user.database_id,
      actor_name: user.email,
      title: 'Facture émise',
      description: `Facture ${invoiceNumber} de ${amount || devis.formulaire?.total || 0}€`,
      icon: 'file-invoice',
      color: 'green',
      metadata: { invoice_id: invoice.id, invoice_number: invoiceNumber }
    });

    // Notification client
    await createNotification({
      user_id: dossier.clientId,
      user_type: 'client',
      title: 'Facture disponible',
      message: `Une facture de ${amount || devis.formulaire?.total || 0}€ a été émise pour ${productName}`,
      notification_type: 'invoice_issued',
      priority: 'high',
      action_url: `/produits/${dossierId}`,
      metadata: { dossier_id: dossierId, invoice_id: invoice.id }
    });

    return res.json({ success: true, data: { invoice } });

  } catch (error: any) {
    console.error('❌ Erreur invoice/emit:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// POST /api/simplified-products/:dossierId/invoice/confirm-payment
// Expert ou client confirme le paiement
// ============================================================================
router.post('/:dossierId/invoice/confirm-payment', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { dossierId } = req.params;

    if (!user || !['client', 'expert'].includes(user.type)) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('id, clientId, expert_id, metadata')
      .eq('id', dossierId)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
    }

    // Vérifier permissions
    if (user.type === 'client' && dossier.clientId !== user.database_id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }
    if (user.type === 'expert' && dossier.expert_id !== user.database_id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    const metadata = dossier.metadata || {};
    const facture = metadata.facture || {};

    // Mettre à jour la facture
    if (facture.facture_id) {
      await supabase.from('invoice')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', facture.facture_id);
    }

    // Mettre à jour metadata
    metadata.facture = {
      ...facture,
      status: 'paid',
      paid_at: new Date().toISOString()
    };

    await supabase.from('ClientProduitEligible')
      .update({
        metadata,
        statut: 'refund_completed',
        current_step: 4,
        progress: 100,
        updated_at: new Date().toISOString()
      })
      .eq('id', dossierId);

    // Mettre à jour DossierStep
    await supabase.from('DossierStep')
      .update({ status: 'completed', progress: 100, updated_at: new Date().toISOString() })
      .eq('dossier_id', dossierId)
      .eq('step_name', 'Facturation & installation');

    // Timeline
    await DossierTimelineService.addEvent({
      dossier_id: dossierId,
      type: user.type === 'client' ? 'client_action' : 'expert_action',
      actor_type: user.type,
      actor_id: user.database_id,
      actor_name: user.email,
      title: 'Paiement confirmé',
      description: 'Le paiement de la facture a été confirmé',
      icon: 'check-circle',
      color: 'green'
    });

    return res.json({ success: true });

  } catch (error: any) {
    console.error('❌ Erreur invoice/confirm-payment:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

