#!/usr/bin/env node

/**
 * Fait progresser automatiquement le dossier TICPE d'un client jusqu'à l'étape finale,
 * en appliquant toutes les mises à jour de statut, timeline et notifications attendues.
 *
 * Usage:
 *   node server/scripts/advance-ticpe-dossier.cjs [email_client]
 */

const path = require('path');
require('dotenv').config({
  path: process.env.DOTENV_CONFIG_PATH || path.resolve(process.cwd(), '.env'),
});
const { createClient } = require('@supabase/supabase-js');

const TARGET_EMAIL = process.argv[2] || 'alex94@profitum.fr';
const PRODUCT_KEYWORD = 'TICPE';

function assertEnv(variable, label) {
  if (!variable) {
    console.error(`❌ Variable d’environnement manquante: ${label}`);
    process.exit(1);
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

assertEnv(supabaseUrl, 'SUPABASE_URL');
assertEnv(supabaseServiceKey, 'SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const STATUS_ORDER = [
  'eligible',
  'admin_validated',
  'expert_validated',
  'charte_signed',
  'audit_in_progress',
  'audit_completed',
  'validation_finale',
  'implementation_in_progress',
  'implementation_validated',
  'payment_requested',
  'payment_in_progress',
  'refund_completed',
];

function statusIndex(statut) {
  const idx = STATUS_ORDER.indexOf(statut);
  return idx === -1 ? STATUS_ORDER.length : idx;
}

function toISO(date) {
  return (date instanceof Date ? date : new Date(date)).toISOString();
}

function addDays(date, days) {
  const d = new Date(date instanceof Date ? date : new Date(date));
  d.setDate(d.getDate() + days);
  return d;
}

function deepMerge(base, patch) {
  const result = Array.isArray(base) ? [...base] : { ...(base || {}) };
  if (!patch || typeof patch !== 'object') {
    return result;
  }

  for (const [key, value] of Object.entries(patch)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof result[key] === 'object' &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key], value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

async function createNotification(payload) {
  const now = new Date().toISOString();
  if (!payload.user_id) {
    return;
  }

  const notification = {
    user_id: payload.user_id,
    user_type: payload.user_type,
    title: payload.title,
    message: payload.message,
    notification_type: payload.notification_type,
    priority: payload.priority || 'medium',
    status: 'unread',
    is_read: false,
    action_url: payload.action_url || null,
    action_data:
      payload.action_data === undefined || payload.action_data === null ? {} : payload.action_data,
    metadata: payload.metadata === undefined || payload.metadata === null ? {} : payload.metadata,
    created_at: now,
    updated_at: now,
  };

  const { error } = await supabase.from('notification').insert(notification);
  if (error) {
    console.error(`⚠️  Notification non créée (${payload.notification_type}):`, error.message);
  }
}

async function addTimelineEvent(event) {
  const now = new Date().toISOString();
  const payload = {
    dossier_id: event.dossier_id,
    date: event.date || now,
    type: event.type,
    actor_type: event.actor_type,
    actor_id: event.actor_id || null,
    actor_name: event.actor_name,
    title: event.title,
    description: event.description || null,
    metadata: event.metadata || null,
    icon: event.icon || null,
    color: event.color || 'blue',
    action_url: event.action_url || null,
    created_at: now,
    updated_at: now,
  };

  const { error } = await supabase.from('dossier_timeline').insert(payload);
  if (error) {
    console.error(`⚠️  Timeline non créée (${event.title}):`, error.message);
  }
}

async function fetchContext(email) {
  const { data: client, error: clientError } = await supabase
    .from('Client')
    .select('id, auth_user_id, email, company_name, first_name, last_name, apporteur_id')
    .eq('email', email)
    .single();

  if (clientError || !client) {
    throw new Error(`Client introuvable pour ${email}: ${clientError?.message}`);
  }

  const { data: product, error: productError } = await supabase
    .from('ProduitEligible')
    .select('id, nom, type_produit')
    .ilike('nom', `%${PRODUCT_KEYWORD}%`)
    .single();

  if (productError || !product) {
    throw new Error(`Produit TICPE introuvable: ${productError?.message}`);
  }

  const { data: dossier, error: dossierError } = await supabase
    .from('ClientProduitEligible')
    .select(
      `
        *,
        Client:clientId (
          id,
          auth_user_id,
          email,
          company_name,
          first_name,
          last_name,
          apporteur_id
        ),
        ProduitEligible:produitId (
          id,
          nom,
          type_produit
        ),
        Expert:expert_id (
          id,
          auth_user_id,
          name,
          email,
          client_fee_percentage,
          profitum_fee_percentage
        )
      `
    )
    .eq('clientId', client.id)
    .eq('produitId', product.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (dossierError || !dossier) {
    throw new Error(`Dossier TICPE introuvable pour ${email}: ${dossierError?.message}`);
  }

  const { data: admins, error: adminError } = await supabase
    .from('Admin')
    .select('id, auth_user_id, name')
    .eq('is_active', true);

  if (adminError) {
    throw new Error(`Impossible de récupérer la liste des admins: ${adminError.message}`);
  }

  let apporteur = null;
  const apporteurId = dossier.Client?.apporteur_id;
  if (apporteurId) {
    const { data: apporteurData, error: apporteurError } = await supabase
      .from('ApporteurAffaires')
      .select('id, auth_user_id, name')
      .eq('id', apporteurId)
      .single();
    if (!apporteurError) {
      apporteur = apporteurData;
    }
  }

  return { client, product, dossier, admins: admins || [], apporteur };
}

async function updateDossier(dossierId, updatePayload, options = {}) {
  const selectClause = `
    *,
    Client:clientId (
      id,
      auth_user_id,
      email,
      company_name,
      first_name,
      last_name,
      apporteur_id
    ),
    ProduitEligible:produitId (
      id,
      nom,
      type_produit
    ),
    Expert:expert_id (
      id,
      auth_user_id,
      name,
      email,
      client_fee_percentage,
      profitum_fee_percentage
    )
  `;

  const { data, error } = await supabase
    .from('ClientProduitEligible')
    .update(updatePayload)
    .eq('id', dossierId)
    .select(selectClause)
    .single();

  if (error) {
    throw new Error(`Mise à jour dossier échouée (${options.label || 'inconnue'}): ${error.message}`);
  }

  const label = options.label ? ` (${options.label})` : '';
  console.log(`✅ Dossier mis à jour${label}: statut=${data.statut}, étape=${data.current_step}, progress=${data.progress}%`);

  return data;
}

function normalizePercentage(value, fallback) {
  if (value === null || value === undefined) {
    return fallback;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return fallback;
  }
  return numeric > 1 ? numeric / 100 : numeric;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║      Progression complète du dossier TICPE - Profitum        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log(`📧 Client ciblé : ${TARGET_EMAIL}\n`);

  const context = await fetchContext(TARGET_EMAIL);
  let dossier = context.dossier;

  const productName = dossier.ProduitEligible?.nom || PRODUCT_KEYWORD;
  const productSlug = productName.toLowerCase();
  const clientInfo = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
  const expertInfo = Array.isArray(dossier.Expert) ? dossier.Expert[0] : dossier.Expert;

  const clientName =
    clientInfo?.company_name ||
    [clientInfo?.first_name, clientInfo?.last_name].filter(Boolean).join(' ') ||
    'Client';

  const expertName = expertInfo?.name || expertInfo?.email || 'Expert TICPE';

  const clientAuthId = clientInfo?.auth_user_id || null;
  const expertAuthId = expertInfo?.auth_user_id || null;
  const adminAuthIds = context.admins.map((admin) => admin.auth_user_id).filter(Boolean);
  const apporteurAuthId = context.apporteur?.auth_user_id || null;

  console.log('🔎 Statut initial:');
  console.log(`   - Dossier ID         : ${dossier.id}`);
  console.log(`   - Produit            : ${productName}`);
  console.log(`   - Statut actuel      : ${dossier.statut}`);
  console.log(`   - Étape actuelle     : ${dossier.current_step}`);
  console.log(`   - Progression        : ${dossier.progress || 0}%\n`);

  const baseDate = new Date();
  const auditCompletionDate = addDays(baseDate, 1);
  const clientValidationDate = addDays(baseDate, 2);
  const submissionDate = addDays(baseDate, 3);
  const administrationDecisionDate = addDays(baseDate, 7);
  const refundConfirmationDate = addDays(baseDate, 9);
  const paymentInitiatedDate = addDays(baseDate, 11);
  const paymentConfirmedDate = addDays(baseDate, 13);

  const currentMetadata = dossier.metadata || {};
  const rawEstimated = currentMetadata?.simulation?.montant_estime || currentMetadata?.eligibility?.estimated_amount;
  const fallbackAmount = dossier.montantFinal || rawEstimated || 48000;
  const finalAmount = Number(fallbackAmount) > 0 ? Number(fallbackAmount) : 48000;

  const clientFeePct = normalizePercentage(expertInfo?.client_fee_percentage, 0.3);
  const profitumFeePct = normalizePercentage(expertInfo?.profitum_fee_percentage, 0.3);

  const expertFee = Number((finalAmount * clientFeePct).toFixed(2));
  const profitumFeeHT = Number((expertFee * profitumFeePct).toFixed(2));
  const profitumFeeTVA = Number((profitumFeeHT * 0.2).toFixed(2));
  const profitumFeeTTC = Number((profitumFeeHT + profitumFeeTVA).toFixed(2));

  const implementationReference = `TICPE-${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${dossier.id.slice(0, 6).toUpperCase()}`;
  const refundReference = `REMBOURSEMENT-${dossier.id.slice(0, 8).toUpperCase()}`;
  const invoiceReference = `FACT-${dossier.id.slice(0, 6).toUpperCase()}-${baseDate.getFullYear()}`;

  async function runStage(targetStatus, label, action) {
    const shouldRun = statusIndex(dossier.statut) < statusIndex(targetStatus);
    if (!shouldRun) {
      console.log(`⏭️  Étape "${label}" déjà atteinte (statut actuel: ${dossier.statut}).`);
      return;
    }

    console.log(`\n🚀 Étape "${label}" en cours...`);
    dossier = await action(dossier);
  }

  await runStage('expert_validated', 'Validation expert', async (current) => {
    const now = new Date().toISOString();
    const metadata = deepMerge(current.metadata, {
      expert_acceptance: {
        expert_id: expertInfo?.id || current.expert_id,
        expert_name: expertName,
        accepted_at: now,
        notes: 'Acceptation confirmée par script TICPE.',
      },
    });

    const updated = await updateDossier(
      current.id,
      {
        statut: 'expert_validated',
        current_step: Math.max(current.current_step || 0, 3),
        progress: Math.max(current.progress || 0, 35),
        expert_id: expertInfo?.id || current.expert_id,
        expert_pending_id: null,
        date_expert_accepted: now,
        metadata,
        updated_at: now,
      },
      { label: 'Validation expert' }
    );

    await addTimelineEvent({
      dossier_id: updated.id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: expertName,
      title: '✅ Expert a accepté le dossier',
      description: `${expertName} prend en charge le dossier.`,
      metadata: { notes: 'Automatisation script' },
      icon: '✅',
      color: 'green',
    });

    await createNotification({
      user_id: clientAuthId,
      user_type: 'client',
      title: `✅ Expert assigné - ${productName}`,
      message: `${expertName} a confirmé la prise en charge de votre dossier ${productName}.`,
      notification_type: 'expert_accepted',
      priority: 'high',
      action_url: `/produits/${productSlug}/${updated.id}`,
      action_data: {
        client_produit_id: updated.id,
        expert_id: expertInfo?.id,
        expert_name: expertName,
        accepted_at: now,
      },
    });

    for (const adminId of adminAuthIds) {
      await createNotification({
        user_id: adminId,
        user_type: 'admin',
        title: `ℹ️ Expert validé - ${clientName}`,
        message: `${expertName} accepte le dossier ${productName} de ${clientName}.`,
        notification_type: 'admin_info',
        priority: 'medium',
        action_url: `/admin/dossiers/${updated.id}`,
      });
    }

    if (apporteurAuthId) {
      await createNotification({
        user_id: apporteurAuthId,
        user_type: 'apporteur',
        title: `✅ Expert confirmé pour ${clientName}`,
        message: `${expertName} est désormais en charge du dossier ${productName}.`,
        notification_type: 'apporteur_info',
        priority: 'medium',
        action_url: `/apporteur/dossiers/${updated.id}`,
      });
    }

    return updated;
  });

  await runStage('audit_in_progress', 'Démarrage audit', async (current) => {
    const now = new Date().toISOString();
    const metadata = deepMerge(current.metadata, {
      charte_signature: {
        signed: true,
        signed_at: now,
        method: 'auto_script',
      },
      documents_complementaires: 'none_required',
      audit_started: {
        started_by: expertInfo?.id || current.expert_id,
        started_at: now,
      },
    });

    const updated = await updateDossier(
      current.id,
      {
        statut: 'audit_in_progress',
        current_step: Math.max(current.current_step || 0, 4),
        progress: Math.max(current.progress || 0, 50),
        charte_signed: true,
        charte_signed_at: now,
        metadata,
        updated_at: now,
      },
      { label: 'Audit démarré' }
    );

    await addTimelineEvent({
      dossier_id: updated.id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: expertName,
      title: '🔍 Audit démarré',
      description: `Expert ${expertName} lance l'analyse.\nAucun document complémentaire requis.`,
      metadata: { documents_complementaires: false },
      icon: '🔍',
      color: 'purple',
    });

    await createNotification({
      user_id: clientAuthId,
      user_type: 'client',
      title: `ℹ️ Audit démarré - ${productName}`,
      message: `${expertName} analyse actuellement votre dossier.`,
      notification_type: 'audit_started',
      priority: 'medium',
      action_url: `/produits/${productSlug}/${updated.id}`,
    });

    for (const adminId of adminAuthIds) {
      await createNotification({
        user_id: adminId,
        user_type: 'admin',
        title: `ℹ️ Audit lancé - ${clientName}`,
        message: `${expertName} a démarré l'audit pour ${clientName} (${productName}).`,
        notification_type: 'admin_info',
        priority: 'medium',
        action_url: `/admin/dossiers/${updated.id}`,
      });
    }

    return updated;
  });

  await runStage('audit_completed', 'Clôture audit', async (current) => {
    const now = auditCompletionDate.toISOString();
    const reportUrl = `https://profitum-files.example.com/reports/${current.id}/audit-final.pdf`;

    const metadata = deepMerge(current.metadata, {
      audit_result: {
        completed_by: expertInfo?.id || current.expert_id,
        completed_at: now,
        montant_initial: current.montantFinal || finalAmount,
        montant_final: finalAmount,
        rapport_url: reportUrl,
        notes: 'Audit finalisé automatiquement (script TICPE).',
      },
    });

    const updated = await updateDossier(
      current.id,
      {
        statut: 'audit_completed',
        current_step: Math.max(current.current_step || 0, 4),
        progress: Math.max(current.progress || 0, 70),
        montantFinal: finalAmount,
        metadata,
        updated_at: now,
      },
      { label: 'Audit complété' }
    );

    await addTimelineEvent({
      dossier_id: updated.id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: expertName,
      title: '✅ Audit terminé',
      description: `Montant final estimé : ${finalAmount.toLocaleString('fr-FR')} €.\nRapport disponible.`,
      metadata: { montant_final: finalAmount, rapport_url: reportUrl },
      icon: '✅',
      color: 'green',
      action_url: reportUrl,
    });

    await createNotification({
      user_id: clientAuthId,
      user_type: 'client',
      title: `✅ Audit terminé - ${productName}`,
      message: `Montant estimé : ${finalAmount.toLocaleString('fr-FR')} €. Merci de valider pour lancer la production.`,
      notification_type: 'audit_completed',
      priority: 'high',
      action_url: `/produits/${productSlug}/${updated.id}`,
      metadata: {
        montant_final: finalAmount,
        next_step: 'validate_audit',
      },
    });

    for (const adminId of adminAuthIds) {
      await createNotification({
        user_id: adminId,
        user_type: 'admin',
        title: `📋 Audit terminé - ${clientName}`,
        message: `${expertName} a finalisé l'audit (${finalAmount.toLocaleString('fr-FR')} €).`,
        notification_type: 'admin_info',
        priority: 'medium',
        action_url: `/admin/dossiers/${updated.id}`,
      });
    }

    if (apporteurAuthId) {
      await createNotification({
        user_id: apporteurAuthId,
        user_type: 'apporteur',
        title: `ℹ️ Audit terminé - ${clientName}`,
        message: `Montant estimé : ${finalAmount.toLocaleString('fr-FR')} € sur ${productName}.`,
        notification_type: 'apporteur_info',
        priority: 'medium',
        action_url: `/apporteur/dossiers/${updated.id}`,
      });
    }

    return updated;
  });

  await runStage('validation_finale', 'Validation client', async (current) => {
    const now = clientValidationDate.toISOString();

    const metadata = deepMerge(current.metadata, {
      client_validation: {
        validated_by: clientInfo?.id,
        validated_at: now,
        action: 'accept',
        reason: null,
      },
      commission_conditions_accepted: {
        waterfall_model: true,
        client_fee_percentage: clientFeePct,
        profitum_fee_percentage: profitumFeePct,
        montant_remboursement: finalAmount,
        expert_total_fee: expertFee,
        profitum_total_fee: profitumFeeHT,
        estimation_ht: profitumFeeHT,
        estimation_tva: profitumFeeTVA,
        estimation_ttc: profitumFeeTTC,
        accepted_at: now,
        expert_id: expertInfo?.id,
        expert_name: expertName,
      },
    });

    const updated = await updateDossier(
      current.id,
      {
        statut: 'validation_finale',
        current_step: Math.max(current.current_step || 0, 5),
        progress: Math.max(current.progress || 0, 75),
        date_audit_validated_by_client: now,
        metadata,
        updated_at: now,
      },
      { label: 'Validation client' }
    );

    await addTimelineEvent({
      dossier_id: updated.id,
      type: 'client_action',
      actor_type: 'client',
      actor_name: clientName,
      title: '✅ Audit accepté par le client',
      description: `Production lancée.\nMontant validé : ${finalAmount.toLocaleString('fr-FR')} €`,
      metadata: { montant_final: finalAmount },
      icon: '✅',
      color: 'green',
    });

    await createNotification({
      user_id: expertAuthId,
      user_type: 'expert',
      title: '🎉 Audit accepté par le client',
      message: `${clientName} a validé l'audit. Lancement de la production.`,
      notification_type: 'audit_validated',
      priority: 'high',
      action_url: `/expert/dossier/${updated.id}`,
    });

    for (const adminId of adminAuthIds) {
      await createNotification({
        user_id: adminId,
        user_type: 'admin',
        title: '🎉 Audit validé - Production à lancer',
        message: `${clientName} confirme l'audit (${finalAmount.toLocaleString('fr-FR')} €).`,
        notification_type: 'admin_info',
        priority: 'high',
        action_url: `/admin/dossiers/${updated.id}`,
      });
    }

    return updated;
  });

  await runStage('implementation_in_progress', 'Soumission administration', async (current) => {
    const now = submissionDate.toISOString();

    const metadata = deepMerge(current.metadata, {
      implementation: {
        ...(current.metadata?.implementation || {}),
        status: 'in_progress',
        submitted_by: expertInfo?.id || current.expert_id,
        submission_date: now,
        reference: implementationReference,
        organisme: 'Direction Générale des Douanes et Droits Indirects',
        notes: 'Soumission effectuée automatiquement (script TICPE).',
        updated_at: now,
      },
    });

    const updated = await updateDossier(
      current.id,
      {
        statut: 'implementation_in_progress',
        current_step: Math.max(current.current_step || 0, 6),
        progress: Math.max(current.progress || 0, 80),
        date_demande_envoyee: now,
        metadata,
        updated_at: now,
      },
      { label: 'Implementation en cours' }
    );

    await addTimelineEvent({
      dossier_id: updated.id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: expertName,
      title: '🛠️ Mise en œuvre en cours',
      description: `Suivi auprès de la DGDDI.\nRéférence : ${implementationReference}`,
      metadata: {
        organisme: 'DGDDI',
        reference: implementationReference,
        submission_date: now,
      },
      icon: '🛠️',
      color: 'blue',
    });

    await createNotification({
      user_id: clientAuthId,
      user_type: 'client',
      title: '🛠️ Dossier en mise en œuvre',
      message: `${expertName} suit votre remboursement auprès de la DGDDI (réf: ${implementationReference}).`,
      notification_type: 'implementation_in_progress',
      priority: 'medium',
      action_url: `/produits/${productSlug}/${updated.id}`,
      metadata: {
        reference: implementationReference,
        organisme: 'DGDDI',
      },
    });

    for (const adminId of adminAuthIds) {
      await createNotification({
        user_id: adminId,
        user_type: 'admin',
        title: '🛠️ Mise en œuvre en cours',
        message: `${expertName} suit le dossier ${productName} (${clientName}). Référence ${implementationReference}.`,
        notification_type: 'implementation_in_progress',
        priority: 'low',
        action_url: `/admin/dossiers/${updated.id}`,
      });
    }

    if (apporteurAuthId) {
      await createNotification({
        user_id: apporteurAuthId,
        user_type: 'apporteur',
        title: `🛠️ ${clientName} en mise en œuvre`,
        message: `${expertName} suit la demande auprès de la DGDDI (réf: ${implementationReference}).`,
        notification_type: 'implementation_in_progress',
        priority: 'medium',
        action_url: `/apporteur/dossiers/${updated.id}`,
      });
    }

    return updated;
  });

  await runStage('implementation_validated', 'Décision administration', async (current) => {
    const now = administrationDecisionDate.toISOString();
    const difference = 0;

    const metadata = deepMerge(current.metadata, {
      administration_result: {
        decision: 'accepte',
        montant_demande: finalAmount,
        montant_accorde: finalAmount,
        difference,
        date_retour: now,
        motif_difference: null,
        recorded_by: expertInfo?.id || current.expert_id,
        recorded_at: now,
      },
      implementation: {
        ...(current.metadata?.implementation || {}),
        status: 'validated',
        validated_by: expertInfo?.id || current.expert_id,
        validated_at: now,
        decision: 'accepte',
        montant_accorde: finalAmount,
        updated_at: now,
      },
    });

    const updated = await updateDossier(
      current.id,
      {
        statut: 'implementation_validated',
        current_step: Math.max(current.current_step || 0, 7),
        progress: Math.max(current.progress || 0, 90),
        metadata,
        updated_at: now,
      },
      { label: 'Décision positive administration' }
    );

    await addTimelineEvent({
      dossier_id: updated.id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: expertName,
      title: '✅ Résultat de l’administration',
      description: `${expertName} confirme la décision (accepte).\nMontant accordé : ${finalAmount.toLocaleString('fr-FR')} €`,
      metadata: {
        decision: 'accepte',
        montant_accorde: finalAmount,
        date_retour: now,
      },
      icon: '✅',
      color: 'green',
    });

    await createNotification({
      user_id: clientAuthId,
      user_type: 'client',
      title: '🎉 Administration : accord obtenu',
      message: `La DGDDI a validé votre dossier pour ${finalAmount.toLocaleString('fr-FR')} €. Le remboursement arrive.`,
      notification_type: 'implementation_validated',
      priority: 'high',
      action_url: `/produits/${productSlug}/${updated.id}`,
      metadata: {
        montant_accorde: finalAmount,
        decision: 'accepte',
      },
    });

    if (apporteurAuthId) {
      await createNotification({
        user_id: apporteurAuthId,
        user_type: 'apporteur',
        title: `🎉 ${clientName} accordé`,
        message: `Montant accordé : ${finalAmount.toLocaleString('fr-FR')} €`,
        notification_type: 'implementation_validated',
        priority: 'high',
        action_url: `/apporteur/dossiers/${updated.id}`,
      });
    }

    for (const adminId of adminAuthIds) {
      await createNotification({
        user_id: adminId,
        user_type: 'admin',
        title: '🎉 Accord administration',
        message: `${clientName} obtient ${finalAmount.toLocaleString('fr-FR')} € (dossier ${productName}).`,
        notification_type: 'admin_info',
        priority: 'high',
        action_url: `/admin/dossiers/${updated.id}`,
      });
    }

    return updated;
  });

  await runStage('payment_requested', 'Remboursement obtenu', async (current) => {
    const now = refundConfirmationDate.toISOString();

    const metadata = deepMerge(current.metadata, {
      implementation: {
        ...(current.metadata?.implementation || {}),
        status: 'validated',
        refund_reference: refundReference,
        refund_amount: finalAmount,
        refund_date: now,
        last_update: now,
      },
      payment: {
        ...(current.metadata?.payment || {}),
        status: 'requested',
        requested_by: expertInfo?.id || current.expert_id,
        requested_at: now,
        requested_amount: profitumFeeTTC,
        refund_amount: finalAmount,
        refund_date: now,
        payment_reference: invoiceReference,
        invoice: {
          number: invoiceReference,
          montant_ht: profitumFeeHT,
          montant_ttc: profitumFeeTTC,
        },
      },
    });

    const updated = await updateDossier(
      current.id,
      {
        statut: 'payment_requested',
        current_step: 8,
        progress: Math.max(current.progress || 0, 95),
        date_remboursement: now,
        metadata,
        updated_at: now,
      },
      { label: 'Paiement demandé' }
    );

    await addTimelineEvent({
      dossier_id: updated.id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: expertName,
      title: '💶 Remboursement obtenu – facture émise',
      description: `${expertName} confirme le remboursement (${finalAmount.toLocaleString('fr-FR')} €).\nFacture: ${invoiceReference}`,
      metadata: {
        montant: profitumFeeTTC,
        facture_reference: invoiceReference,
        notes: `Remboursement confirmé le ${refundConfirmationDate.toLocaleDateString('fr-FR')}.`,
      },
      icon: '💶',
      color: 'purple',
    });

    await createNotification({
      user_id: clientAuthId,
      user_type: 'client',
      title: '💶 Remboursement confirmé',
      message: `Votre remboursement de ${finalAmount.toLocaleString('fr-FR')} € est validé. Facture Profitum: ${profitumFeeTTC.toLocaleString('fr-FR')} € (réf: ${invoiceReference}).`,
      notification_type: 'payment_requested',
      priority: 'high',
      action_url: `/produits/${productSlug}/${updated.id}`,
      metadata: {
        facture_reference: invoiceReference,
        montant_ttc: profitumFeeTTC,
      },
    });

    for (const adminId of adminAuthIds) {
      await createNotification({
        user_id: adminId,
        user_type: 'admin',
        title: '💶 Facturation requise',
        message: `${clientName} - ${productName}. Remboursement confirmé : ${finalAmount.toLocaleString('fr-FR')} €.`,
        notification_type: 'payment_requested',
        priority: 'medium',
        action_url: `/admin/dossiers/${updated.id}`,
      });
    }

    if (expertAuthId) {
      await createNotification({
        user_id: expertAuthId,
        user_type: 'expert',
        title: '💶 Paiement client attendu',
        message: `Facture ${invoiceReference} envoyée (${profitumFeeTTC.toLocaleString('fr-FR')} € TTC).`,
        notification_type: 'payment_requested',
        priority: 'medium',
        action_url: `/expert/dossier/${updated.id}`,
      });
    }

    if (apporteurAuthId) {
      await createNotification({
        user_id: apporteurAuthId,
        user_type: 'apporteur',
        title: `💶 ${clientName} remboursé`,
        message: `Montant accordé : ${finalAmount.toLocaleString('fr-FR')} €. Commission Profitum en attente (${profitumFeeTTC.toLocaleString('fr-FR')} €).`,
        notification_type: 'payment_requested',
        priority: 'medium',
        action_url: `/apporteur/dossiers/${updated.id}`,
      });
    }

    return updated;
  });

  await runStage('payment_in_progress', 'Paiement client initié', async (current) => {
    const now = paymentInitiatedDate.toISOString();

    const metadata = deepMerge(current.metadata, {
      payment: {
        ...(current.metadata?.payment || {}),
        status: 'in_progress',
        initiated_by: clientInfo?.id,
        initiated_at: now,
        mode: 'virement',
        initiated_amount: profitumFeeTTC,
        last_update: now,
      },
    });

    const updated = await updateDossier(
      current.id,
      {
        statut: 'payment_in_progress',
        current_step: 8,
        progress: Math.max(current.progress || 0, 96),
        metadata,
        updated_at: now,
      },
      { label: 'Paiement en cours' }
    );

    await addTimelineEvent({
      dossier_id: updated.id,
      type: 'client_action',
      actor_type: 'client',
      actor_name: clientName,
      title: '💳 Paiement en cours',
      description: `Paiement de ${profitumFeeTTC.toLocaleString('fr-FR')} € (mode: virement).`,
      metadata: { montant: profitumFeeTTC, mode: 'virement' },
      icon: '💳',
      color: 'blue',
    });

    if (expertAuthId) {
      await createNotification({
        user_id: expertAuthId,
        user_type: 'expert',
        title: '💳 Paiement client en cours',
        message: `${clientName} a initié un paiement de ${profitumFeeTTC.toLocaleString('fr-FR')} € (virement).`,
        notification_type: 'payment_in_progress',
        priority: 'medium',
        action_url: `/expert/dossier/${updated.id}`,
      });
    }

    return updated;
  });

  await runStage('refund_completed', 'Paiement confirmé', async (current) => {
    const now = paymentConfirmedDate.toISOString();

    const metadata = deepMerge(current.metadata, {
      payment: {
        ...(current.metadata?.payment || {}),
        status: 'completed',
        completed_by: clientInfo?.id,
        completed_at: now,
        paid_amount: profitumFeeTTC,
        paiement_date: now,
        last_update: now,
      },
      remboursement_recu: true,
      montant_reel_recu: finalAmount,
      confirme_par_client: true,
      date_confirmation: now,
    });

    const updated = await updateDossier(
      current.id,
      {
        statut: 'refund_completed',
        current_step: 8,
        progress: 100,
        date_remboursement: now,
        metadata,
        updated_at: now,
      },
      { label: 'Paiement confirmé' }
    );

    await addTimelineEvent({
      dossier_id: updated.id,
      type: 'system_action',
      actor_type: 'system',
      actor_name: 'Système',
      title: '✅ Paiement confirmé – dossier clôturé',
      description: `Paiement final de ${profitumFeeTTC.toLocaleString('fr-FR')} € confirmé.\nRemboursement client : ${finalAmount.toLocaleString('fr-FR')} €`,
      metadata: {
        montant: profitumFeeTTC,
        paiement_date: now,
      },
      icon: '✅',
      color: 'green',
    });

    if (expertAuthId) {
      await createNotification({
        user_id: expertAuthId,
        user_type: 'expert',
        title: '✅ Paiement client confirmé',
        message: `${clientName} a confirmé le règlement de ${profitumFeeTTC.toLocaleString('fr-FR')} € (réf: ${invoiceReference}).`,
        notification_type: 'payment_confirmed',
        priority: 'medium',
        action_url: `/expert/dossier/${updated.id}`,
      });
    }

    if (apporteurAuthId) {
      await createNotification({
        user_id: apporteurAuthId,
        user_type: 'apporteur',
        title: `✅ Paiement confirmé pour ${clientName}`,
        message: `Montant réglé : ${profitumFeeTTC.toLocaleString('fr-FR')} €. Dossier clôturé.`,
        notification_type: 'payment_confirmed',
        priority: 'medium',
        action_url: `/apporteur/dossiers/${updated.id}`,
      });
    }

    await createNotification({
      user_id: clientAuthId,
      user_type: 'client',
      title: '✅ Paiement confirmé',
      message: `Merci ! Nous avons enregistré la confirmation du paiement Profitum (${profitumFeeTTC.toLocaleString('fr-FR')} €).`,
      notification_type: 'payment_confirmed',
      priority: 'medium',
      action_url: `/produits/${productSlug}/${updated.id}`,
      metadata: {
        montant: profitumFeeTTC,
        paiement_date: now,
      },
    });

    return updated;
  });

  console.log('\n🎯 Progression terminée.');
  console.log('   - Statut final :', dossier.statut);
  console.log('   - Étape finale :', dossier.current_step);
  console.log('   - Progression  :', dossier.progress, '%');
  console.log('   - Montant final:', finalAmount.toLocaleString('fr-FR'), '€');

  const { data: timeline, error: timelineError } = await supabase
    .from('dossier_timeline')
    .select('*')
    .eq('dossier_id', dossier.id)
    .order('date', { ascending: false })
    .limit(8);

  if (!timelineError && timeline) {
    console.log('\n🗓️  Derniers événements timeline:');
    timeline.forEach((event) => {
      console.log(
        `   - [${event.title}] ${event.date} | ${event.actor_name} | ${event.description?.slice(0, 80) || ''}`
      );
    });
  }

  const { data: notifications, error: notifError } = await supabase
    .from('notification')
    .select('id, user_type, title, created_at')
    .in('user_type', ['client', 'expert'])
    .order('created_at', { ascending: false })
    .limit(6);

  if (!notifError && notifications) {
    console.log('\n🔔 Dernières notifications (client/expert):');
    notifications.forEach((notif) => {
      console.log(`   - [${notif.user_type}] ${notif.created_at} | ${notif.title}`);
    });
  }

  console.log('\n✅ Dossier TICPE entièrement finalisé.\n');
}

main().catch((error) => {
  console.error('\n❌ Erreur lors de la progression du dossier:', error.message);
  process.exit(1);
});


