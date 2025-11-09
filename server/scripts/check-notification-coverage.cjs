#!/usr/bin/env node

/**
 * Analyse les notifications stockées dans Supabase
 * et fournit un résumé par type d'utilisateur.
 *
 * Usage :
 *   node server/scripts/check-notification-coverage.cjs [limit=200]
 */

const path = require('path');
require('dotenv').config({
  path: process.env.DOTENV_CONFIG_PATH || path.resolve(process.cwd(), '.env'),
});
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d’environnement Supabase manquantes (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}

const LIMIT = Number(process.argv[2] || 200);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function formatCountMap(map) {
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  return entries.map(([key, value]) => `     • ${key}: ${value}`).join('\n');
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        Audit des notifications (tous utilisateurs)           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log(`🔍 Analyse des ${LIMIT} dernières notifications triées par date de création...\n`);

  const { data: notifications, error } = await supabase
    .from('notification')
    .select(`
      id,
      user_id,
      user_type,
      notification_type,
      title,
      message,
      priority,
      status,
      is_read,
      action_url,
      created_at,
      metadata
    `)
    .order('created_at', { ascending: false })
    .limit(LIMIT);

  if (error) {
    console.error('❌ Erreur lors de la récupération des notifications:', error.message);
    process.exit(1);
  }

  if (!notifications || notifications.length === 0) {
    console.log('📭 Aucune notification trouvée.');
    return;
  }

  const statsByUserType = new Map();
  const typeCounts = {};

  notifications.forEach((notif) => {
    if (!statsByUserType.has(notif.user_type)) {
      statsByUserType.set(notif.user_type, {
        total: 0,
        unread: 0,
        byPriority: {},
        byStatus: {},
        byType: {},
        examples: [],
      });
    }

    const bucket = statsByUserType.get(notif.user_type);
    bucket.total += 1;
    if (notif.status === 'unread' || notif.is_read === false) {
      bucket.unread += 1;
    }

    bucket.byPriority[notif.priority] = (bucket.byPriority[notif.priority] || 0) + 1;
    bucket.byStatus[notif.status] = (bucket.byStatus[notif.status] || 0) + 1;
    bucket.byType[notif.notification_type] = (bucket.byType[notif.notification_type] || 0) + 1;

    if (bucket.examples.length < 5) {
      bucket.examples.push({
        created_at: notif.created_at,
        title: notif.title,
        type: notif.notification_type,
        priority: notif.priority,
        status: notif.status,
        action_url: notif.action_url,
      });
    }

    typeCounts[notif.notification_type] = (typeCounts[notif.notification_type] || 0) + 1;
  });

  console.log(`📊 Total notifications analysées : ${notifications.length}\n`);

  for (const [userType, stats] of statsByUserType.entries()) {
    console.log(`=== Utilisateur : ${userType.toUpperCase()} ===`);
    console.log(`   Total           : ${stats.total}`);
    console.log(`   Non lues        : ${stats.unread}`);
    console.log('   Par priorité :');
    console.log(formatCountMap(stats.byPriority) || '     • Aucun');
    console.log('   Par statut :');
    console.log(formatCountMap(stats.byStatus) || '     • Aucun');
    console.log('   Types les plus fréquents :');
    console.log(formatCountMap(stats.byType) || '     • Aucun');
    console.log('   Exemples récents :');
    stats.examples.forEach((example, idx) => {
      console.log(`     ${idx + 1}. [${example.created_at}] (${example.priority}/${example.status}) ${example.title} – ${example.type}${example.action_url ? ` → ${example.action_url}` : ''}`);
    });
    console.log('');
  }

  console.log('=== Répartition globale par type de notification ===');
  console.log(formatCountMap(typeCounts) || '     • Aucun');
  console.log('\n✅ Audit terminé.\n');
}

main().catch((error) => {
  console.error('❌ Erreur inattendue:', error);
  process.exit(1);
});


