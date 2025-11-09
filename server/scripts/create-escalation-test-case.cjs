#!/usr/bin/env node

/**
 * Crée un cas de test pour l'escalade des notifications :
 * 1. Insère une notification simulant un paiement en retard
 * 2. Exécute le service d'escalade
 * 3. Affiche le résultat avant/après
 * 4. Nettoie la notification de test
 *
 * Usage :
 *   node server/scripts/create-escalation-test-case.cjs
 */

const path = require('path');
require('dotenv').config({
  path: process.env.DOTENV_CONFIG_PATH || path.resolve(process.cwd(), '.env'),
});

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'CommonJS',
  },
});

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d’environnement Supabase manquantes (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║      Création d’un scénario de test pour l’escalade SLA      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const now = new Date();
  const triggeredAt = new Date(now.getTime() - 48 * 60 * 60 * 1000); // il y a 48h
  const dueAt = new Date(now.getTime() - 2 * 60 * 60 * 1000); // il y a 2h (déjà en retard)

  const testUserId = uuidv4();
  const dossierId = uuidv4();

  const metadata = {
    dossier_id: dossierId,
    produit: 'TICPE',
    produit_slug: 'ticpe',
    montant: 2500,
    facture_reference: 'FACT-TEST-ESCALADE',
    sla_hours: 48,
    triggered_at: triggeredAt.toISOString(),
    due_at: dueAt.toISOString(),
    escalation_level: 0,
    next_step_label: 'Régler la commission Profitum',
    next_step_description: 'Ce paiement est nécessaire pour clôturer définitivement le dossier.',
    recommended_action: 'Cliquer sur le bouton “Ouvrir” et procéder au paiement.',
    support_email: 'support@profitum.fr'
  };

  console.log('🛠️  Insertion d’une notification de test déjà en retard...');
  const { data: insertData, error: insertError } = await supabase
    .from('notification')
    .insert({
      user_id: testUserId,
      user_type: 'client',
      title: '💶 Paiement requis (test escalade)',
      message: 'Notification de test pour vérifier l’escalade automatique.',
      notification_type: 'payment_requested',
      priority: 'high',
      status: 'unread',
      is_read: false,
      action_url: `/produits/ticpe/${dossierId}`,
      metadata,
    })
    .select('id')
    .single();

  if (insertError || !insertData) {
    console.error('❌ Impossible de créer la notification de test:', insertError?.message);
    process.exit(1);
  }

  const notificationId = insertData.id;
  console.log(`✅ Notification test créée (id=${notificationId}) - due_at=${metadata.due_at}`);

  console.log('\n📋 État AVANT escalade:');
  const { data: beforeData } = await supabase
    .from('notification')
    .select('id, status, metadata')
    .eq('id', notificationId)
    .single();

  console.log(JSON.stringify(beforeData, null, 2));

  console.log('\n🚀 Exécution du service NotificationEscalationService...');
  const { NotificationEscalationService } = require('../src/services/NotificationEscalationService');
  await NotificationEscalationService.run();

  console.log('\n📋 État APRÈS escalade:');
  const { data: afterData } = await supabase
    .from('notification')
    .select('id, status, metadata')
    .eq('id', notificationId)
    .single();

  console.log(JSON.stringify(afterData, null, 2));

  console.log('\n🧹 Nettoyage du scénario de test...');
  await supabase
    .from('notification')
    .delete()
    .eq('id', notificationId);

  console.log('✅ Notification de test supprimée.');
  console.log('\n🎯 Scénario terminé.');
}

main().catch((error) => {
  console.error('❌ Erreur lors du scénario de test d’escalade:', error);
  process.exit(1);
});


