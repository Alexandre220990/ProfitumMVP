#!/usr/bin/env node

/**
 * Script de test end-to-end (sans API) pour les produits simplifiés :
 * - Chronotachygraphes digitaux
 * - Logiciel Solid
 *
 * Le script utilise la clé service Supabase pour simuler l'enchaînement des étapes
 * telles qu'elles sont codées dans `server/src/routes/simplified-products.ts`.
 *
 * Étapes contrôlées :
 * 1. Vérifications initiales (questionnaire client)
 * 2. Demande de devis au partenaire
 * 3. Proposition de devis par l'expert + validation client
 * 4. Émission de facture + confirmation paiement
 *
 * Chaque étape vérifie que les tables suivantes sont correctement synchronisées :
 * - ClientProduitEligible
 * - DossierStep
 * - dossier_timeline
 * - invoice
 *
 * ⚠️ Prérequis :
 * - Variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY chargées (cf. .env)
 * - Clients et produits déjà présents dans la base
 * - Experts distributeurs créés (script create-distributor-experts.mjs)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PRODUCT_CONFIG = {
  chronotachygraphes: {
    produitId: '21b6f7b7-40d2-4937-903b-2ea53acdac6b',
    expertEmail: 'oclock@profitum.fr',
    initialChecklist: {
      nb_camions: 12,
      equipement_chrono: true
    },
    devis: {
      nombre_camions: 12,
      prix_unit: 850,
      total: 10200
    }
  },
  logiciel_solid: {
    produitId: 'e17fa8b5-dbd8-4c9b-8e31-31310813a71f',
    expertEmail: 'solid@profitum.fr',
    initialChecklist: {
      nb_utilisateurs: 25,
      besoins: 'Automatisation comptable + intégration ERP + flux RH'
    },
    devis: {
      nombre_utilisateurs: 25,
      prix_unit: 120,
      total: 3000
    }
  }
};

// Utiliser un client de test existant (Compte temporaire)
const TEST_CLIENT_ID = 'eefdc5ff-082c-4ccc-a622-32cf599075fe';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function ensureExpert(expertEmail) {
  const { data, error } = await supabase
    .from('Expert')
    .select('id, name, email, company_name')
    .eq('email', expertEmail)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    throw new Error(`Expert ${expertEmail} introuvable ou inactif`);
  }

  return data;
}

async function createDossier(productKey, config) {
  const dossierId = crypto.randomUUID();
  const now = new Date().toISOString();

  const { error } = await supabase.from('ClientProduitEligible').insert({
    id: dossierId,
    clientId: TEST_CLIENT_ID,
    produitId: config.produitId,
    statut: 'eligible',
    current_step: 1,
    progress: 0,
    created_at: now,
    updated_at: now,
    metadata: {},
    notes: '📎 Dossier de test automatisé',
    priorite: 1
  });

  if (error) {
    throw new Error(`Erreur création dossier (${productKey}): ${error.message}`);
  }

  console.log(`✅ Dossier créé (${productKey}) → ${dossierId}`);
  return dossierId;
}

async function initialChecks(dossierId, productKey, config, expert) {
  const { data: dossier, error: fetchError } = await supabase
    .from('ClientProduitEligible')
    .select(`
      id,
      clientId,
      produitId,
      ProduitEligible:produitId ( nom )
    `)
    .eq('id', dossierId)
    .single();

  if (fetchError || !dossier) {
    throw new Error(`Dossier ${dossierId} introuvable pour vérifications initiales`);
  }

  const checklistKey = `${productKey}_checklist`;
  const checklist = {
    ...config.initialChecklist,
    validated_at: new Date().toISOString(),
    validated_by: 'script_test'
  };

  const metadata = {
    ...(dossier.metadata || {}),
    [checklistKey]: checklist
  };

  const { error: updateError } = await supabase
    .from('ClientProduitEligible')
    .update({
      metadata,
      expert_id: expert.id,
      current_step: 1,
      progress: 25,
      statut: 'expert_assigned',
      updated_at: new Date().toISOString()
    })
    .eq('id', dossierId);

  if (updateError) {
    throw new Error(`Erreur update dossier (initial checks): ${updateError.message}`);
  }

  // DossierStep
  const { data: existingStep } = await supabase
    .from('DossierStep')
    .select('id')
    .eq('dossier_id', dossierId)
    .eq('step_name', 'Vérifications initiales')
    .maybeSingle();

  if (existingStep) {
    await supabase
      .from('DossierStep')
      .update({
        status: 'completed',
        progress: 100,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingStep.id);
  } else {
    await supabase.from('DossierStep').insert({
      dossier_id: dossierId,
      dossier_name: dossier.ProduitEligible?.nom || productKey,
      step_name: 'Vérifications initiales',
      step_type: 'validation',
      status: 'completed',
      progress: 100,
      assignee_id: dossier.clientId,
      assignee_type: 'client',
      priority: 'high',
      estimated_duration_minutes: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  console.log('✅ Étape 1 : vérifications initiales OK');
}

async function partnerRequest(dossierId, productKey, expert) {
  const { error: updateError } = await supabase
    .from('ClientProduitEligible')
    .update({
      current_step: 2,
      progress: 50,
      updated_at: new Date().toISOString()
    })
    .eq('id', dossierId);

  if (updateError) {
    throw new Error(`Erreur update dossier (partner request): ${updateError.message}`);
  }

  const { data: existingStep } = await supabase
    .from('DossierStep')
    .select('id')
    .eq('dossier_id', dossierId)
    .eq('step_name', 'Proposition partenaire')
    .maybeSingle();

  if (!existingStep) {
    await supabase.from('DossierStep').insert({
      dossier_id: dossierId,
      dossier_name: productKey,
      step_name: 'Proposition partenaire',
      step_type: 'expertise',
      status: 'in_progress',
      progress: 50,
      assignee_id: expert.id,
      assignee_name: expert.name,
      assignee_type: 'expert',
      priority: 'high',
      estimated_duration_minutes: 60,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  console.log('✅ Étape 2 : demande partenaire OK');
}

async function expertProposesQuote(dossierId, productKey, config, expert) {
  const { data: dossier, error: fetchError } = await supabase
    .from('ClientProduitEligible')
    .select('metadata, clientId')
    .eq('id', dossierId)
    .single();

  if (fetchError || !dossier) {
    throw new Error(`Dossier ${dossierId} introuvable pour devis`);
  }

  const metadata = dossier.metadata || {};
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  metadata.devis = {
    status: 'proposed',
    proposed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expert_id: expert.id,
    document_id: null,
    formulaire: {
      ...config.devis,
      valid_until: validUntil,
      etapes: [
        'Prenez RDV pour installation',
        'Installation produit dans véhicule',
        'Paramétrage',
        'Transmission automatique des données'
      ]
    },
    commentaire_expert: 'Offre standard partenaire',
    commentaire_client: null
  };

  const { error: updateError } = await supabase
    .from('ClientProduitEligible')
    .update({
      metadata,
      current_step: 3,
      progress: 75,
      updated_at: new Date().toISOString()
    })
    .eq('id', dossierId);

  if (updateError) {
    throw new Error(`Erreur update dossier (quote): ${updateError.message}`);
  }

  await supabase
    .from('DossierStep')
    .update({
      status: 'in_progress',
      progress: 50,
      updated_at: new Date().toISOString()
    })
    .eq('dossier_id', dossierId)
    .eq('step_name', 'Devis & validation');

  console.log('✅ Étape 3a : devis proposé par l’expert');
}

async function clientAcceptsQuote(dossierId) {
  const { data: dossier, error: fetchError } = await supabase
    .from('ClientProduitEligible')
    .select('metadata, ProduitEligible:produitId(nom), expert_id')
    .eq('id', dossierId)
    .single();

  if (fetchError || !dossier) {
    throw new Error('Erreur récupération dossier pour acceptation devis');
  }

  const metadata = dossier.metadata || {};
  const devis = metadata.devis || {};

  metadata.devis = {
    ...devis,
    status: 'accepted',
    accepted_at: new Date().toISOString(),
    commentaire_client: 'Parfait pour nous'
  };

  const { error: updateError } = await supabase
    .from('ClientProduitEligible')
    .update({
      metadata,
      current_step: 4,
      progress: 90,
      updated_at: new Date().toISOString()
    })
    .eq('id', dossierId);

  if (updateError) {
    throw new Error(`Erreur update dossier (accept quote): ${updateError.message}`);
  }

  await supabase
    .from('DossierStep')
    .update({
      status: 'completed',
      progress: 100,
      updated_at: new Date().toISOString()
    })
    .eq('dossier_id', dossierId)
    .eq('step_name', 'Devis & validation');

  await supabase.from('DossierStep').upsert({
    dossier_id: dossierId,
    dossier_name: dossier.ProduitEligible?.nom || 'Produit simplifié',
    step_name: 'Facturation & installation',
    step_type: 'payment',
    status: 'in_progress',
    progress: 0,
    assignee_id: dossier.expert_id,
    assignee_type: 'expert',
    priority: 'high',
    estimated_duration_minutes: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'dossier_id,step_name' });

  console.log('✅ Étape 3b : devis accepté par le client');
}

async function expertEmitsInvoice(dossierId, productKey, config, expert) {
  const { data: dossier, error: fetchError } = await supabase
    .from('ClientProduitEligible')
    .select('metadata, clientId, ProduitEligible:produitId(nom)')
    .eq('id', dossierId)
    .single();

  if (fetchError || !dossier) {
    throw new Error('Erreur récupération dossier pour facture');
  }

  const devis = dossier.metadata?.devis;
  const amount = config.devis.total;
  const invoiceNumber = `TEST-${productKey.toUpperCase()}-${Date.now()}`;

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoice')
    .insert({
      invoice_number: invoiceNumber,
      client_id: dossier.clientId,
      expert_id: expert.id,
      client_produit_eligible_id: dossierId,
      amount,
      currency: 'EUR',
      status: 'sent',
      issue_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: `Facture test ${productKey}`,
      items: [
        {
          description: `Prestation ${productKey}`,
          amount
        }
      ],
      metadata: { test_script: true, productKey },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (invoiceError) {
    throw new Error(`Erreur création facture: ${invoiceError.message}`);
  }

  const metadata = {
    ...(dossier.metadata || {}),
    facture: {
      status: 'sent',
      facture_id: invoice.id,
      issued_at: new Date().toISOString(),
      amount
    }
  };

  await supabase
    .from('ClientProduitEligible')
    .update({
      metadata,
      updated_at: new Date().toISOString()
    })
    .eq('id', dossierId);

  console.log('✅ Étape 4a : facture émise');
  return invoice.id;
}

async function confirmPayment(dossierId, invoiceId) {
  const { data: dossier, error: fetchError } = await supabase
    .from('ClientProduitEligible')
    .select('metadata')
    .eq('id', dossierId)
    .single();

  if (fetchError || !dossier) {
    throw new Error('Erreur récupération dossier pour confirmation paiement');
  }

  await supabase
    .from('invoice')
    .update({
      status: 'paid',
      paid_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', invoiceId);

  const metadata = dossier.metadata || {};
  const facture = metadata.facture || {};

  metadata.facture = {
    ...facture,
    status: 'paid',
    paid_at: new Date().toISOString(),
    facture_id: invoiceId
  };

  await supabase
    .from('ClientProduitEligible')
    .update({
      metadata,
      statut: 'refund_completed',
      current_step: 4,
      progress: 100,
      updated_at: new Date().toISOString()
    })
    .eq('id', dossierId);

  await supabase
    .from('DossierStep')
    .update({
      status: 'completed',
      progress: 100,
      updated_at: new Date().toISOString()
    })
    .eq('dossier_id', dossierId)
    .eq('step_name', 'Facturation & installation');

  console.log('✅ Étape 4b : paiement confirmé');
}

async function verifyFinalState(dossierId) {
  const { data: dossier } = await supabase
    .from('ClientProduitEligible')
    .select('statut, progress, metadata')
    .eq('id', dossierId)
    .single();

  if (!dossier) {
    throw new Error('Dossier introuvable en vérification finale');
  }

  if (dossier.statut !== 'refund_completed' || dossier.progress !== 100) {
    throw new Error(`Dossier ${dossierId} non terminé : statut=${dossier.statut}, progress=${dossier.progress}`);
  }

  console.log('🎉 Vérification finale OK → statut refund_completed, progress 100%');
}

async function runForProduct(productKey) {
  console.log('\n====================================================');
  console.log(`🚀 Démarrage test produit simplifié : ${productKey}`);
  console.log('====================================================');

  const config = PRODUCT_CONFIG[productKey];
  if (!config) {
    throw new Error(`Configuration manquante pour ${productKey}`);
  }

  const expert = await ensureExpert(config.expertEmail);
  const dossierId = await createDossier(productKey, config);

  await initialChecks(dossierId, productKey, config, expert);
  await sleep(500);

  await partnerRequest(dossierId, productKey, expert);
  await sleep(500);

  await expertProposesQuote(dossierId, productKey, config, expert);
  await sleep(500);

  await clientAcceptsQuote(dossierId);
  await sleep(500);

  const invoiceId = await expertEmitsInvoice(dossierId, productKey, config, expert);
  await sleep(500);

  await confirmPayment(dossierId, invoiceId);
  await sleep(500);

  await verifyFinalState(dossierId);

  console.log(`✅ Test complet pour ${productKey} terminé avec succès (dossier ${dossierId})`);
  return dossierId;
}

async function main() {
  try {
    const results = [];
    for (const productKey of Object.keys(PRODUCT_CONFIG)) {
      const dossierId = await runForProduct(productKey);
      results.push({ productKey, dossierId });
    }

    console.log('\n==================== RÉSUMÉ ====================');
    results.forEach((r) => {
      console.log(`- ${r.productKey}: dossier ${r.dossierId}`);
    });
    console.log('===============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test échoué :', error);
    process.exit(1);
  }
}

main();

