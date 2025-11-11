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

type SimplifiedProductKey =
  | 'chronotachygraphes'
  | 'logiciel_solid'
  | 'optimisation_fournisseur_electricite'
  | 'optimisation_fournisseur_gaz';

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function determineProductKey(productName: string): SimplifiedProductKey {
  const normalized = normalizeText(productName || '');

  if (normalized.includes('chrono')) {
    return 'chronotachygraphes';
  }

  if (normalized.includes('solid')) {
    return 'logiciel_solid';
  }

  if (normalized.includes('fournisseur') && normalized.includes('gaz')) {
    return 'optimisation_fournisseur_gaz';
  }

  if (normalized.includes('fournisseur') && (normalized.includes('electricite') || normalized.includes('elec'))) {
    return 'optimisation_fournisseur_electricite';
  }

  // Fallback : électricité pour les anciens dossiers "optimisation énergie"
  if (normalized.includes('optimisation') && normalized.includes('energie')) {
    return 'optimisation_fournisseur_electricite';
  }

  // Par défaut, conserver Solid
  return 'logiciel_solid';
}

function parseNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const matches = value.match(/\d+/g);
    if (!matches || matches.length === 0) return null;
    return Number.parseInt(matches[matches.length - 1], 10);
  }
  return null;
}

function ensurePositiveInteger(value: any): number {
  const parsed = parseNumber(value);
  const safeValue = parsed !== null && parsed > 0 ? parsed : 0;
  return safeValue;
}

// ============================================================================
// HELPER: Récupérer l'expert distributeur par produit
// ============================================================================
async function getDistributorExpert(productKey: SimplifiedProductKey) {
  let candidateEmails: string[] = [];

  switch (productKey) {
    case 'chronotachygraphes':
      candidateEmails = ['sdei@profitum.fr'];
      break;
    case 'logiciel_solid':
      candidateEmails = ['solid@profitum.fr'];
      break;
    case 'optimisation_fournisseur_gaz':
      candidateEmails = ['gaz@profitum.fr'];
      break;
    case 'optimisation_fournisseur_electricite':
      candidateEmails = ['elec@profitum.fr'];
      break;
    default:
      candidateEmails = ['solid@profitum.fr'];
      break;
  }

  for (const email of candidateEmails) {
    const { data: expert, error } = await supabase
      .from('Expert')
      .select('id, name, email, company_name')
      .eq('email', email)
      .eq('status', 'active')
      .maybeSingle();

    if (!error && expert) {
      return expert;
    }
  }

  console.error(`❌ Aucun expert distributeur disponible pour ${productKey}`);
  return null;
}

function formatCurrencyForTimeline(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '—';
  }
  return `${Number(value).toLocaleString('fr-FR')}€`;
}

// ============================================================================
// GET /api/simplified-products/:dossierId/initial-checks
// Récupérer les informations du questionnaire initial
// ============================================================================
router.get('/:dossierId/initial-checks', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { dossierId } = req.params;

    if (!user || user.type !== 'client') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux clients' });
    }

    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('id, clientId, produitId, simulationId, metadata, ProduitEligible:produitId(nom)')
      .eq('id', dossierId)
      .eq('clientId', user.database_id)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
    }

    const produitEligible = getFirst(dossier.ProduitEligible);
    const productKey = determineProductKey(produitEligible?.nom || '');
    const checklistKey = `${productKey}_checklist`;
    const metadata = dossier.metadata || {};
    const currentChecklist = metadata[checklistKey] || null;
    const partnerRequest = metadata.partner_request || null;

    const defaults: Record<string, any> = {};

    if (dossier.simulationId) {
      const { data: simulation } = await supabase
        .from('simulations')
        .select('answers')
        .eq('id', dossier.simulationId)
        .single();

      if (simulation?.answers) {
        const answers = simulation.answers as Record<string, any>;
        if (productKey === 'logiciel_solid') {
          defaults.chauffeurs_estimes = ensurePositiveInteger(answers['GENERAL_003']);
        } else {
          defaults.total_camions_estime = ensurePositiveInteger(answers['GENERAL_003']);
          defaults.camions_equipes_estime = ensurePositiveInteger(answers['TICPE_004']);
          defaults.installations_souhaitees_estime = ensurePositiveInteger(answers['TICPE_005']);
        }
      }
    }

    return res.json({
      success: true,
      data: {
        productKey,
        checklist: currentChecklist,
        partnerRequest,
        defaults,
        requiredDocument: productKey === 'logiciel_solid' ? 'fiche_paie' : 'carte_grise'
      }
    });
  } catch (error: any) {
    console.error('❌ Erreur lecture initial-checks:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// POST /api/simplified-products/:dossierId/initial-checks
// Enregistrer les réponses du questionnaire initial
// ============================================================================
router.post('/:dossierId/initial-checks', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { dossierId } = req.params;
    const {
      total_camions,
      camions_equipes,
      installations_souhaitees,
      chauffeurs_estimes,
      chauffeurs_confirmes,
      source
    } = req.body;

    if (!user || user.type !== 'client') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux clients' });
    }

    // Vérifier que le dossier appartient au client
    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('id, clientId, produitId, current_step, progress, ProduitEligible:produitId(nom, type_produit), metadata')
      .eq('id', dossierId)
      .eq('clientId', user.database_id)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
    }

    // Déterminer le productKey
    const produitEligible = getFirst(dossier.ProduitEligible);
    const productName = produitEligible?.nom || '';
    const productKey = determineProductKey(productName);

    const now = new Date().toISOString();

    const checklistKey = `${productKey}_checklist`;
    const metadata = { ...(dossier.metadata || {}) };
    let timelineDescription = '';

    switch (productKey) {
      case 'chronotachygraphes': {
      const totalVehicles = ensurePositiveInteger(total_camions);
      if (totalVehicles <= 0) {
        return res.status(400).json({ success: false, message: 'Nombre de véhicules invalide' });
      }

      const equippedVehicles = Math.min(
        ensurePositiveInteger(camions_equipes),
        totalVehicles
      );
      const installationsValue = Math.min(
        ensurePositiveInteger(installations_souhaitees) || Math.max(totalVehicles - equippedVehicles, 0),
        totalVehicles
      );

      metadata[checklistKey] = {
        total_vehicles: totalVehicles,
        equipped_vehicles: equippedVehicles,
        installations_requested: installationsValue,
        validated_at: now
      };

        timelineDescription = `${totalVehicles} véhicule(s) poids-lourd déclarés • ${equippedVehicles} déjà équipés • ${installationsValue} installation(s) supplémentaires souhaitées.`;
        break;
      }
      case 'logiciel_solid': {
      const confirmedDrivers = ensurePositiveInteger(
        chauffeurs_confirmes ?? chauffeurs_estimes
      );
      if (confirmedDrivers <= 0) {
        return res.status(400).json({ success: false, message: 'Nombre de chauffeurs invalide' });
      }

      const estimatedDrivers = ensurePositiveInteger(chauffeurs_estimes) || confirmedDrivers;

      metadata[checklistKey] = {
        chauffeurs_estimes: estimatedDrivers,
        chauffeurs_confirmes: confirmedDrivers,
        source: source === 'simulation' ? 'simulation' : 'manual',
        validated_at: now
      };

        timelineDescription = `${confirmedDrivers} chauffeur(s) confirmés pour la mise en place du logiciel Solid.`;
        break;
      }
      case 'optimisation_fournisseur_electricite':
      case 'optimisation_fournisseur_gaz': {
        const defaultSource = productKey === 'optimisation_fournisseur_electricite' ? 'electricite' : 'gaz';
        const selectedEnergies: string[] = Array.isArray(req.body.energy_sources)
          ? req.body.energy_sources
          : typeof req.body.energy_source === 'string'
            ? [req.body.energy_source]
            : [defaultSource];

        if (!selectedEnergies.includes(defaultSource)) {
          selectedEnergies.push(defaultSource);
        }

        const siteCount = ensurePositiveInteger(req.body.site_count || req.body.nombre_sites) || 1;
        const consumptionAmount = parseNumber(req.body.consumption_reference || req.body.consommation_reference);

        metadata[checklistKey] = {
          energy_sources: selectedEnergies,
          site_count: siteCount,
          consumption_reference: consumptionAmount,
          validated_at: now
        };

        const energyLabel =
          productKey === 'optimisation_fournisseur_electricite'
            ? 'électricité'
            : 'gaz naturel';
        timelineDescription = `Facture ${energyLabel} fournie. ${siteCount} site(s) identifié(s) pour l’analyse.`;
        break;
      }
      default:
        metadata[checklistKey] = {
          validated_at: now
        };
        timelineDescription = 'Informations initiales vérifiées.';
        break;
    }

    // Mettre à jour le dossier : étape 2 (questions spécifiques) désormais disponible
    const { error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        metadata,
        current_step: Math.max(dossier.current_step || 1, 2),
        progress: Math.max(dossier.progress || 0, 25),
        statut: 'expert_selection',
        updated_at: now
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
      description: timelineDescription,
      icon: 'check-circle',
      color: 'green'
    });

    // Gestion des DossierStep
    const initialStepName = 'Vérifications initiales';
    const questionsStepName = 'Questions spécifiques';

    const { data: existingInitialStep } = await supabase
      .from('DossierStep')
      .select('id')
      .eq('dossier_id', dossierId)
      .eq('step_name', initialStepName)
      .maybeSingle();

    if (!existingInitialStep) {
      await supabase.from('DossierStep').insert({
        dossier_id: dossierId,
        dossier_name: productName,
        step_name: initialStepName,
        step_type: 'validation',
        status: 'completed',
        progress: 100,
        assignee_id: user.database_id,
        assignee_name: user.email,
        assignee_type: 'client',
        priority: 'high',
        estimated_duration_minutes: 60,
        created_at: now,
        updated_at: now
      });
    } else {
      await supabase
        .from('DossierStep')
        .update({ status: 'completed', progress: 100, updated_at: now })
        .eq('id', existingInitialStep.id);
    }

    const { data: existingQuestionsStep } = await supabase
      .from('DossierStep')
      .select('id')
      .eq('dossier_id', dossierId)
      .eq('step_name', questionsStepName)
      .maybeSingle();

    if (!existingQuestionsStep) {
      await supabase.from('DossierStep').insert({
        dossier_id: dossierId,
        dossier_name: productName,
        step_name: questionsStepName,
        step_type: 'client_action',
        status: 'in_progress',
        progress: 30,
        assignee_id: user.database_id,
        assignee_name: user.email,
        assignee_type: 'client',
        priority: 'high',
        estimated_duration_minutes: 45,
        created_at: now,
        updated_at: now
      });
    } else {
      await supabase
        .from('DossierStep')
        .update({ status: 'in_progress', progress: 30, updated_at: now })
        .eq('id', existingQuestionsStep.id);
    }

    await DossierTimelineService.addEvent({
      dossier_id: dossierId,
      type: 'client_action',
      actor_type: 'client',
      actor_id: user.database_id,
      actor_name: user.email,
      title: 'Vérifications initiales complétées',
      description: timelineDescription,
      icon: 'check-circle',
      color: 'green'
    });

    return res.json({
      success: true,
      data: {
        dossier_id: dossierId,
        checklist: metadata[checklistKey]
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur initial-checks:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// POST /api/simplified-products/:dossierId/assign-expert
// Affecte automatiquement l'expert distributeur si aucun expert n'est encore assigné
// ============================================================================
router.post('/:dossierId/assign-expert', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { dossierId } = req.params;

    if (!user || user.type !== 'client') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux clients' });
    }

    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('id, clientId, produitId, expert_id, expert_pending_id, statut, current_step, progress, metadata, ProduitEligible:produitId(nom)')
      .eq('id', dossierId)
      .eq('clientId', user.database_id)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
    }

    if (dossier.expert_id) {
      return res.json({ success: true, data: { alreadyAssigned: true, expert_id: dossier.expert_id } });
    }

    const produitEligible = getFirst(dossier.ProduitEligible);
    const productKey = determineProductKey(produitEligible?.nom || '');

    const distributorExpert = await getDistributorExpert(productKey);
    if (!distributorExpert) {
      return res.status(500).json({ success: false, message: 'Expert distributeur non disponible' });
    }

    const updates: Record<string, any> = {
      expert_id: distributorExpert.id,
      updated_at: new Date().toISOString()
    };

    if (!dossier.statut || ['eligible', 'opportunité', 'pending_admin_validation', 'expert_selection'].includes(dossier.statut)) {
      updates.statut = 'expert_assigned';
    }

    if (!dossier.current_step || dossier.current_step < 2) {
      updates.current_step = 2;
    }

    updates.progress = Math.max(dossier.progress || 0, 40);

    const { error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update(updates)
      .eq('id', dossierId);

    if (updateError) {
      console.error('❌ Erreur assignation expert simplifié:', updateError);
      return res.status(500).json({ success: false, message: 'Erreur lors de l’assignation de l’expert' });
    }

    await DossierTimelineService.addEvent({
      dossier_id: dossierId,
      type: 'system_action',
      actor_type: 'system',
      actor_name: 'Profitum',
      title: 'Expert distributeur assigné automatiquement',
      description: `Expert ${distributorExpert.email} affecté au dossier`,
      icon: 'user-check',
      color: 'blue'
    });

    return res.json({ success: true, data: { expert_id: distributorExpert.id } });
  } catch (error: any) {
    console.error('❌ Erreur assign-expert simplifié:', error);
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
      .select('id, clientId, expert_id, metadata, produitId, ProduitEligible:produitId(nom), Expert:expert_id(id, name, email, company_name)')
      .eq('id', dossierId)
      .eq('clientId', user.database_id)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
    }

    const produit = getFirst(dossier.ProduitEligible);
    const productName = produit?.nom || 'Produit';
    const productKey = determineProductKey(productName);

    const existingMetadata = dossier.metadata || {};
    const checklistKey = `${productKey}_checklist`;
    const checklist = existingMetadata[checklistKey] || {};

    if (existingMetadata.partner_request?.requested_at) {
      return res.json({ success: true, data: { alreadyRequested: true } });
    }

    // Assigner l'expert si nécessaire
    let expert = getFirst(dossier.Expert);
    if (!dossier.expert_id || !expert) {
      const distributorExpert = await getDistributorExpert(productKey);
      if (!distributorExpert) {
        return res.status(500).json({ success: false, message: 'Expert distributeur non disponible' });
      }

      const { error: assignError } = await supabase
        .from('ClientProduitEligible')
        .update({
          expert_id: distributorExpert.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', dossierId);

      if (assignError) {
        console.error('❌ Erreur assignation expert durant partner-request:', assignError);
        return res.status(500).json({ success: false, message: 'Erreur lors de l’assignation de l’expert' });
      }

      expert = distributorExpert;

      await DossierTimelineService.addEvent({
        dossier_id: dossierId,
        type: 'system_action',
        actor_type: 'system',
        actor_name: 'Profitum',
        title: 'Expert distributeur assigné automatiquement',
        description: `Expert ${distributorExpert.email} affecté au dossier`,
        icon: 'user-check',
        color: 'blue'
      });
    }

    if (!expert) {
      return res.status(500).json({ success: false, message: 'Expert distributeur indisponible' });
    }

    // Préparer le récapitulatif transmis au partenaire
    let partnerSummary: Record<string, any> = {};
    let summarySentence = '';

    switch (productKey) {
      case 'chronotachygraphes':
        partnerSummary = {
          total_vehicles: checklist.total_vehicles ?? null,
          equipped_vehicles: checklist.equipped_vehicles ?? null,
          installations_requested: checklist.installations_requested ?? null
        };
        summarySentence = `${partnerSummary.total_vehicles ?? '—'} véhicule(s) déclarés, ${partnerSummary.equipped_vehicles ?? 0} déjà équipés, ${partnerSummary.installations_requested ?? 0} installation(s) souhaitées.`;
        break;
      case 'logiciel_solid':
        partnerSummary = {
          chauffeurs_confirmes: checklist.chauffeurs_confirmes ?? null,
          chauffeurs_estimes: checklist.chauffeurs_estimes ?? null,
          source: checklist.source ?? null
        };
        summarySentence = `${partnerSummary.chauffeurs_confirmes ?? '—'} chauffeur(s) confirmés pour l’externalisation des fiches de paie.`;
        break;
      case 'optimisation_fournisseur_electricite':
      case 'optimisation_fournisseur_gaz': {
        partnerSummary = {
          energy_sources: checklist.energy_sources ?? [],
          site_count: checklist.site_count ?? null,
          consumption_reference: checklist.consumption_reference ?? null
        };
        const energieLabel =
          productKey === 'optimisation_fournisseur_electricite' ? 'électricité' : 'gaz naturel';
        summarySentence = `${energieLabel.toUpperCase()} • Sites : ${partnerSummary.site_count ?? '—'} • Consommation de référence : ${partnerSummary.consumption_reference ?? '—'} kWh.`;
        break;
      }
      default:
        summarySentence = 'Informations client transmises au partenaire.';
        break;
    }

    const requestedAt = new Date().toISOString();

    const partnerRequestMetadata = {
      requested_at: requestedAt,
      requested_by: user.database_id,
      expert_email: expert.email,
      partner_name: productName,
      product_key: productKey,
      status: 'pending_expert_quote',
      summary: partnerSummary
    };

    await supabase.from('ClientProduitEligible')
      .update({
        current_step: Math.max(dossier.current_step || 2, 3),
        progress: Math.max(dossier.progress || 0, 55),
        metadata: {
          ...existingMetadata,
          partner_request: partnerRequestMetadata
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', dossierId);

    // Créer/mettre à jour DossierStep
    const questionsStepName = 'Questions spécifiques';
    const partnerStepName = 'Proposition partenaire';

    const { data: existingQuestionsStep } = await supabase
      .from('DossierStep')
      .select('id')
      .eq('dossier_id', dossierId)
      .eq('step_name', questionsStepName)
      .maybeSingle();

    if (existingQuestionsStep) {
      await supabase
        .from('DossierStep')
        .update({ status: 'completed', progress: 100, updated_at: new Date().toISOString() })
        .eq('id', existingQuestionsStep.id);
    }

    const { data: existingPartnerStep } = await supabase
      .from('DossierStep')
      .select('id')
      .eq('dossier_id', dossierId)
      .eq('step_name', partnerStepName)
      .maybeSingle();

    if (!existingPartnerStep) {
      await supabase.from('DossierStep').insert({
        dossier_id: dossierId,
        dossier_name: productName,
        step_name: partnerStepName,
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
      description: `Demande de devis envoyée à ${expert.name || expert.email}.\n${summarySentence}`,
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
      metadata: { dossier_id: dossierId, product_key: productKey, summary: partnerSummary }
    });

    return res.json({ success: true, data: { requested_at: partnerRequestMetadata.requested_at } });

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
    const {
      type,
      nombre_camions,
      nb_camions,
      installations_souhaitees,
      prix_installation_unitaire,
      prix_abonnement_mensuel,
      prix_abonnement_annuel,
      total_installation,
      total_abonnement_mensuel,
      total_abonnement_annuel,
      nb_chauffeurs,
      nb_utilisateurs,
      prix_par_fiche,
      cout_mensuel_unitaire,
      cout_annuel_unitaire,
      cout_mensuel_total,
      cout_annuel_total,
      valid_until,
      notes,
      document_id
    } = req.body;

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
    const resolvedType = determineProductKey(type || productName);

    // Calculer la date de validité (1 mois par défaut)
    const validUntilDate = valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    let formulaire: Record<string, any> = {};
    let devisTotal = 0;

    if (resolvedType === 'chronotachygraphes') {
      const camions = typeof nombre_camions === 'number' ? nombre_camions : typeof nb_camions === 'number' ? nb_camions : null;
      const installations = typeof installations_souhaitees === 'number'
        ? installations_souhaitees
        : camions;

      const prixInstallation = typeof prix_installation_unitaire === 'number' ? prix_installation_unitaire : 0;
      const abonnementMensuel = typeof prix_abonnement_mensuel === 'number' ? prix_abonnement_mensuel : 0;
      const abonnementAnnuel = typeof prix_abonnement_annuel === 'number'
        ? prix_abonnement_annuel
        : abonnementMensuel * 12;

      const totalInstallationValue = typeof total_installation === 'number'
        ? total_installation
        : (installations || 0) * prixInstallation;
      const totalAbonnementMensuelValue = typeof total_abonnement_mensuel === 'number'
        ? total_abonnement_mensuel
        : (installations || 0) * abonnementMensuel;
      const totalAbonnementAnnuelValue = typeof total_abonnement_annuel === 'number'
        ? total_abonnement_annuel
        : (installations || 0) * abonnementAnnuel;

      devisTotal = totalInstallationValue + totalAbonnementAnnuelValue;

      formulaire = {
        type: resolvedType,
        nombre_camions: camions,
        installations_souhaitees: installations,
        prix_installation_unitaire: prixInstallation,
        prix_abonnement_mensuel: abonnementMensuel,
        prix_abonnement_annuel: abonnementAnnuel,
        total_installation: totalInstallationValue,
        total_abonnement_mensuel: totalAbonnementMensuelValue,
        total_abonnement_annuel: totalAbonnementAnnuelValue,
        valid_until: validUntilDate,
        etapes: [
          'Prise de rendez-vous et planification',
          'Installation des chronotachygraphes',
          'Paramétrage et tests',
          'Transmission automatique des données'
        ]
      };
    } else if (resolvedType === 'logiciel_solid') {
      const chauffeurs = typeof nb_chauffeurs === 'number'
        ? nb_chauffeurs
        : typeof nb_utilisateurs === 'number'
          ? nb_utilisateurs
          : null;

      const prixFiche = typeof prix_par_fiche === 'number' ? prix_par_fiche : 0;
      const coutMensuelUnitaireValue = typeof cout_mensuel_unitaire === 'number'
        ? cout_mensuel_unitaire
        : prixFiche;
      const coutAnnuelUnitaireValue = typeof cout_annuel_unitaire === 'number'
        ? cout_annuel_unitaire
        : coutMensuelUnitaireValue * 12;
      const coutMensuelTotalValue = typeof cout_mensuel_total === 'number'
        ? cout_mensuel_total
        : (chauffeurs || 0) * coutMensuelUnitaireValue;
      const coutAnnuelTotalValue = typeof cout_annuel_total === 'number'
        ? cout_annuel_total
        : (chauffeurs || 0) * coutAnnuelUnitaireValue;

      devisTotal = coutAnnuelTotalValue;

      formulaire = {
        type: resolvedType,
        nb_chauffeurs: chauffeurs,
        prix_par_fiche: prixFiche,
        cout_mensuel_unitaire: coutMensuelUnitaireValue,
        cout_annuel_unitaire: coutAnnuelUnitaireValue,
        cout_mensuel_total: coutMensuelTotalValue,
        cout_annuel_total: coutAnnuelTotalValue,
        valid_until: validUntilDate,
        benefits: [
          'Conformité garantie lors des contrôles',
          'Sécurisation des processus RH',
          'Gain de temps significatif chaque mois',
          'Optimisation des charges sociales'
        ],
        etapes: [
          'Configuration de l’espace client',
          'Intégration de vos équipes',
          'Automatisation des flux comptables',
          'Suivi et accompagnement continu'
        ]
      };
    } else {
      const economiesAnnueles = parseNumber(req.body.economies_annuelles) || parseNumber(req.body.economies_estimees) || 0;
      const investissement = parseNumber(req.body.investissement_estime) || 0;
      const dureeRetour = parseNumber(req.body.duree_retour_investissement) || null;
      const energySources: string[] = Array.isArray(req.body.energy_sources)
        ? req.body.energy_sources
        : typeof req.body.energy_source === 'string'
          ? [req.body.energy_source]
          : [];

      devisTotal = investissement;

      formulaire = {
        type: resolvedType,
        energy_sources: energySources,
        economies_annuelles: economiesAnnueles,
        investissement_estime: investissement,
        duree_retour: dureeRetour,
        valid_until: validUntilDate,
        recommandations: [
          'Audit énergétique détaillé de vos sites',
          'Mise en concurrence des fournisseurs',
          'Plan d’actions priorisées',
          'Suivi trimestriel des économies réalisées'
        ]
      };
    }

    // Mettre à jour metadata avec le devis
    const metadata = {
      ...(dossier.metadata || {}),
      devis: {
        status: 'proposed',
        proposed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expert_id: user.database_id,
        document_id: document_id || null,
        formulaire,
        total: devisTotal,
        commentaire_expert: notes || null
      }
    };

    await supabase.from('ClientProduitEligible')
      .update({ metadata, current_step: Math.max(dossier.current_step || 3, 4), progress: 80, updated_at: new Date().toISOString() })
      .eq('id', dossierId);

    // Mettre à jour DossierStep
    const partnerStepName = 'Proposition partenaire';
    const quoteStepName = 'Devis & validation';

    await supabase.from('DossierStep')
      .update({ status: 'completed', progress: 100, updated_at: new Date().toISOString() })
      .eq('dossier_id', dossierId)
      .eq('step_name', partnerStepName);

    const { data: existingQuoteStep } = await supabase
      .from('DossierStep')
      .select('id')
      .eq('dossier_id', dossierId)
      .eq('step_name', quoteStepName)
      .maybeSingle();

    if (!existingQuoteStep) {
      await supabase.from('DossierStep').insert({
        dossier_id: dossierId,
        dossier_name: productName,
        step_name: quoteStepName,
        step_type: 'validation',
        status: 'in_progress',
        progress: 40,
        assignee_id: dossier.clientId,
        assignee_type: 'client',
        priority: 'high',
        estimated_duration_minutes: 90,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } else {
      await supabase.from('DossierStep')
        .update({ status: 'in_progress', progress: 50, updated_at: new Date().toISOString() })
        .eq('id', existingQuoteStep.id);
    }

    // Timeline
    await DossierTimelineService.addEvent({
      dossier_id: dossierId,
      type: 'expert_action',
      actor_type: 'expert',
      actor_id: user.database_id,
      actor_name: user.email,
      title: 'Devis proposé',
      description:
        resolvedType === 'chronotachygraphes'
          ? `Devis transmis : ${installations_souhaitees ?? nombre_camions} installation(s), abonnement annuel ${formatCurrencyForTimeline(devisTotal)}`
          : resolvedType === 'logiciel_solid'
            ? `Devis transmis : ${nb_chauffeurs ?? nb_utilisateurs} chauffeur(s), forfait annuel ${formatCurrencyForTimeline(devisTotal)}`
            : `Devis optimisation énergie : investissement ${formatCurrencyForTimeline(devisTotal)}, économies estimées ${formatCurrencyForTimeline(parseNumber(req.body.economies_annuelles) || parseNumber(req.body.economies_estimees))}`,
      icon: 'file-text',
      color: 'blue',
      metadata: { type: resolvedType, devis_total: devisTotal, formulaire }
    });

    // Notification client
    await createNotification({
      user_id: dossier.clientId,
      user_type: 'client',
      title: 'Devis disponible',
      message: `Un devis est disponible pour ${productName}`,
      notification_type: 'quote_proposed',
      priority: 'high',
      action_url: `/produits/${dossierId}`,
      metadata: { dossier_id: dossierId, devis_total: devisTotal, type: resolvedType }
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

    const produitEligible = getFirst(dossier.ProduitEligible);
    const productName = produitEligible?.nom || 'Produit';
    const productKey = determineProductKey(productName);

    // Mettre à jour le statut du devis
    metadata.devis = {
      ...devis,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      commentaire_client: commentaire || null
    };

    await supabase.from('ClientProduitEligible')
      .update({ metadata, current_step: Math.max(dossier.current_step || 4, 5), progress: 90, updated_at: new Date().toISOString() })
      .eq('id', dossierId);

    // Mettre à jour DossierStep
    await supabase.from('DossierStep')
      .update({ status: 'completed', progress: 100, updated_at: new Date().toISOString() })
      .eq('dossier_id', dossierId)
      .eq('step_name', 'Devis & validation');

    // Créer l'étape facturation
    const facturationStepName =
      productKey === 'chronotachygraphes' ? 'Facturation & installation' : 'Facturation & déploiement';

    await supabase.from('DossierStep').upsert({
      dossier_id: dossierId,
      dossier_name: productName,
      step_name: facturationStepName,
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
      .select('id, clientId, expert_id, metadata, ProduitEligible:produitId(nom)')
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

    const produitEligible = getFirst(dossier.ProduitEligible);
    const productName = produitEligible?.nom || 'Produit';
    const productKey = determineProductKey(productName);
    const facturationStepName =
      productKey === 'chronotachygraphes' ? 'Facturation & installation' : 'Facturation & déploiement';

    await supabase.from('ClientProduitEligible')
      .update({
        metadata,
        statut: 'refund_completed',
        current_step: 5,
        progress: 100,
        updated_at: new Date().toISOString()
      })
      .eq('id', dossierId);

    // Mettre à jour DossierStep
    await supabase.from('DossierStep')
      .update({ status: 'completed', progress: 100, updated_at: new Date().toISOString() })
      .eq('dossier_id', dossierId)
      .eq('step_name', facturationStepName);

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

