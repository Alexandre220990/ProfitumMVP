#!/usr/bin/env node

/**
 * Script de migration manuelle d'un client temporaire vers un client définitif.
 * Usage :
 *   node server/scripts/manual-migrate-client.cjs <TEMP_CLIENT_ID> <NEW_CLIENT_ID>
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables d’environnement Supabase manquantes. Vérifiez server/.env');
  process.exit(1);
}

const [tempClientId, newClientId] = process.argv.slice(2);

if (!tempClientId || !newClientId) {
  console.error('❌ Usage: node server/scripts/manual-migrate-client.cjs <TEMP_CLIENT_ID> <NEW_CLIENT_ID>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function migrateClient() {
  const nowIso = new Date().toISOString();
  console.log(`🔄 Migration manuelle des données du client ${tempClientId} vers ${newClientId}`);

  // 1. Migrer les ClientProduitEligible
  const { data: cpeList, error: cpeFetchError } = await supabase
    .from('ClientProduitEligible')
    .select('id, metadata')
    .eq('clientId', tempClientId);

  if (cpeFetchError) {
    console.error('❌ Erreur récupération ClientProduitEligible:', cpeFetchError.message);
    process.exit(1);
  }

  console.log(`📦 ${cpeList?.length || 0} ClientProduitEligible à migrer`);

  for (const cpe of cpeList || []) {
    const mergedMetadata = {
      ...(cpe.metadata || {}),
      manual_migration: true,
      manual_migration_at: nowIso,
      manual_migration_from: tempClientId
    };

    const { error: cpeUpdateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        clientId: newClientId,
        metadata: mergedMetadata,
        updated_at: nowIso
      })
      .eq('id', cpe.id);

    if (cpeUpdateError) {
      console.error(`⚠️ Erreur migration CPE ${cpe.id}:`, cpeUpdateError.message);
    } else {
      console.log(`✅ CPE migré: ${cpe.id}`);
    }
  }

  // 2. Migrer les simulations
  const { data: simulations, error: simFetchError } = await supabase
    .from('simulations')
    .select('id, metadata, status')
    .eq('client_id', tempClientId);

  if (simFetchError) {
    console.error('❌ Erreur récupération simulations:', simFetchError.message);
    process.exit(1);
  }

  console.log(`🧮 ${simulations?.length || 0} simulations à migrer`);

  for (const simulation of simulations || []) {
    const mergedMetadata = {
      ...(simulation.metadata || {}),
      manual_migration: true,
      manual_migration_at: nowIso,
      manual_migration_from: tempClientId
    };

    const { error: simUpdateError } = await supabase
      .from('simulations')
      .update({
        client_id: newClientId,
        status: simulation.status === 'completed' ? 'completed' : simulation.status,
        metadata: mergedMetadata,
        updated_at: nowIso
      })
      .eq('id', simulation.id);

    if (simUpdateError) {
      console.error(`⚠️ Erreur migration simulation ${simulation.id}:`, simUpdateError.message);
    } else {
      console.log(`✅ Simulation migrée: ${simulation.id}`);
    }
  }

  console.log('🎉 Migration terminée');
}

migrateClient().catch((error) => {
  console.error('❌ Erreur inattendue lors de la migration:', error);
  process.exit(1);
});

