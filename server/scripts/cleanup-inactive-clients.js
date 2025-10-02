#!/usr/bin/env node

/**
 * ============================================================================
 * SCRIPT DE NETTOYAGE AUTOMATIQUE - CLIENTS INACTIFS
 * ============================================================================
 * 
 * Ce script marque automatiquement comme 'inactive' les clients qui n'ont pas
 * d'activité depuis 2 ans :
 * - client → inactive (2 ans sans action)
 * - converted → inactive (2 ans sans action)
 * 
 * Usage:
 *   node cleanup-inactive-clients.js
 *   npm run cleanup-inactive-clients
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const INACTIVITY_THRESHOLD_DAYS = 730; // 2 ans
const DRY_RUN = process.argv.includes('--dry-run');

console.log('🔍 SCRIPT DE NETTOYAGE CLIENTS INACTIFS');
console.log('========================================');
console.log(`📅 Date d'exécution: ${new Date().toISOString()}`);
console.log(`⏰ Seuil d'inactivité: ${INACTIVITY_THRESHOLD_DAYS} jours (2 ans)`);
console.log(`🧪 Mode dry-run: ${DRY_RUN ? 'OUI (aucune modification)' : 'NON (modifications réelles)'}`);
console.log('');

async function cleanupInactiveClients() {
  try {
    // 1. Calculer la date limite (2 ans en arrière)
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - INACTIVITY_THRESHOLD_DAYS);
    
    console.log(`📊 Recherche des clients inactifs depuis le: ${thresholdDate.toISOString()}`);
    console.log('');

    // 2. Récupérer les clients inactifs (client ou converted)
    const { data: inactiveClients, error: fetchError } = await supabase
      .from('Client')
      .select('id, email, status, last_activity_at, created_at')
      .in('status', ['client', 'converted'])
      .lt('last_activity_at', thresholdDate.toISOString())
      .order('last_activity_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération des clients:', fetchError);
      return;
    }

    console.log(`📋 Clients inactifs trouvés: ${inactiveClients?.length || 0}`);
    console.log('');

    if (!inactiveClients || inactiveClients.length === 0) {
      console.log('✅ Aucun client inactif à traiter.');
      return;
    }

    // 3. Afficher les détails des clients inactifs
    console.log('📝 DÉTAILS DES CLIENTS INACTIFS:');
    console.log('--------------------------------');
    
    const stats = {
      client: 0,
      converted: 0,
      total: inactiveClients.length
    };

    inactiveClients.forEach((client, index) => {
      const daysSinceActivity = Math.floor(
        (new Date() - new Date(client.last_activity_at)) / (1000 * 60 * 60 * 24)
      );
      
      console.log(`${index + 1}. ${client.email}`);
      console.log(`   Status: ${client.status}`);
      console.log(`   Dernière activité: ${client.last_activity_at}`);
      console.log(`   Jours d'inactivité: ${daysSinceActivity}`);
      console.log('');
      
      stats[client.status]++;
    });

    console.log('📊 STATISTIQUES:');
    console.log(`   - Clients 'client': ${stats.client}`);
    console.log(`   - Clients 'converted': ${stats.converted}`);
    console.log(`   - Total: ${stats.total}`);
    console.log('');

    // 4. Exécuter la mise à jour (ou dry-run)
    if (DRY_RUN) {
      console.log('🧪 MODE DRY-RUN - Aucune modification ne sera effectuée');
      console.log('   Pour exécuter réellement: node cleanup-inactive-clients.js');
    } else {
      console.log('🔄 Mise à jour des statuts...');
      
      const clientIds = inactiveClients.map(client => client.id);
      
      const { data: updateResult, error: updateError } = await supabase
        .from('Client')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .in('id', clientIds)
        .select('id, email, status');

      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour:', updateError);
        return;
      }

      console.log(`✅ ${updateResult?.length || 0} clients marqués comme 'inactive'`);
      
      // 5. Log des modifications
      console.log('');
      console.log('📝 CLIENTS MODIFIÉS:');
      updateResult?.forEach((client, index) => {
        console.log(`${index + 1}. ${client.email} → inactive`);
      });
    }

    // 6. Créer un log d'audit
    const auditLog = {
      timestamp: new Date().toISOString(),
      script: 'cleanup-inactive-clients',
      threshold_days: INACTIVITY_THRESHOLD_DAYS,
      threshold_date: thresholdDate.toISOString(),
      clients_found: inactiveClients.length,
      clients_processed: DRY_RUN ? 0 : (inactiveClients.length),
      stats: stats,
      dry_run: DRY_RUN
    };

    console.log('');
    console.log('📋 LOG D\'AUDIT:');
    console.log(JSON.stringify(auditLog, null, 2));

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    process.exit(1);
  }
}

// Fonction utilitaire pour afficher l'aide
function showHelp() {
  console.log('Usage: node cleanup-inactive-clients.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run    Mode test (aucune modification)');
  console.log('  --help       Afficher cette aide');
  console.log('');
  console.log('Exemples:');
  console.log('  node cleanup-inactive-clients.js --dry-run');
  console.log('  node cleanup-inactive-clients.js');
  console.log('');
}

// Gestion des arguments
if (process.argv.includes('--help')) {
  showHelp();
  process.exit(0);
}

// Exécuter le script
cleanupInactiveClients()
  .then(() => {
    console.log('');
    console.log('🎉 Script terminé avec succès!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
