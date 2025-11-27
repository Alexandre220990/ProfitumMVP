/**
 * Script pour synchroniser les notifications de tous les RDV existants
 * Usage: ts-node server/scripts/sync-all-rdv-notifications.ts [--dry-run]
 */

// IMPORTANT: Charger le .env AVANT d'importer les services qui en dépendent
import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger le .env depuis le répertoire server
dotenv.config({ path: path.join(__dirname, '../.env') });

// Maintenant importer les services
import { EventNotificationSync } from '../src/services/event-notification-sync';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const isDryRun = process.argv.includes('--dry-run');

async function syncAllRDVNotifications() {
  console.log('\n🔄 Synchronisation des notifications pour tous les RDV\n');
  if (isDryRun) {
    console.log('⚠️  MODE DRY-RUN - Aucune modification ne sera effectuée\n');
  }

  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Récupérer tous les RDV qui devraient avoir des notifications :
    // - RDV dans les 24 prochaines heures
    // - RDV terminés (peu importe depuis quand)
    // - Statut: scheduled, confirmed, completed (pas cancelled ou proposed)
    const { data: rdvs, error: rdvsError } = await supabase
      .from('RDV')
      .select('*')
      .in('status', ['scheduled', 'confirmed', 'completed'])
      .or(`scheduled_date.gte.${now.toISOString().split('T')[0]},status.eq.completed`)
      .order('scheduled_date', { ascending: true });

    if (rdvsError) {
      console.error('❌ Erreur récupération RDV:', rdvsError);
      return;
    }

    if (!rdvs || rdvs.length === 0) {
      console.log('ℹ️  Aucun RDV trouvé à synchroniser');
      return;
    }

    console.log(`📋 ${rdvs.length} RDV trouvés à synchroniser\n`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const rdv of rdvs) {
      try {
        const eventStart = new Date(`${rdv.scheduled_date}T${rdv.scheduled_time}`);
        const eventEnd = new Date(eventStart.getTime() + (rdv.duration_minutes || 60) * 60000);
        const hoursUntilStart = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);
        const hoursSinceEnd = (now.getTime() - eventEnd.getTime()) / (1000 * 60 * 60);
        const isCompleted = rdv.status === 'completed' || now >= eventEnd;

        // Vérifier si le RDV doit avoir des notifications
        if (hoursUntilStart > 24 && !isCompleted) {
          skippedCount++;
          console.log(`⏭️  [SKIP] ${rdv.id} - ${rdv.title || 'Sans titre'} (${rdv.scheduled_date} ${rdv.scheduled_time}) - Plus de 24h et non terminé`);
          continue;
        }

        console.log(`🔄 [${successCount + errorCount + skippedCount + 1}/${rdvs.length}] ${rdv.id} - ${rdv.title || 'Sans titre'} (${rdv.scheduled_date} ${rdv.scheduled_time})`);

        if (!isDryRun) {
          await EventNotificationSync.syncEventNotifications(rdv);
        }

        // Vérifier les notifications créées/mises à jour
        const { data: notifications } = await supabase
          .from('notification')
          .select('id, user_id, user_type, notification_type')
          .eq('metadata->>event_id', rdv.id);

        const notificationCount = notifications?.length || 0;
        if (notificationCount > 0) {
          console.log(`   ✅ ${notificationCount} notification(s) synchronisée(s)`);
          notifications?.forEach((n: any) => {
            console.log(`      - ${n.notification_type} pour ${n.user_type}:${n.user_id}`);
          });
        } else {
          console.log(`   ⚠️  Aucune notification créée (aucun destinataire trouvé)`);
        }

        successCount++;
      } catch (error: any) {
        errorCount++;
        console.error(`   ❌ Erreur: ${error.message || error}`);
      }

      console.log(''); // Ligne vide pour la lisibilité
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(60));
    console.log(`✅ Succès: ${successCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`⏭️  Ignorés: ${skippedCount}`);
    console.log(`📋 Total: ${rdvs.length}`);
    if (isDryRun) {
      console.log('\n⚠️  MODE DRY-RUN - Aucune modification n\'a été effectuée');
    }
    console.log('');

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
  }
}

syncAllRDVNotifications()
  .then(() => {
    console.log('✅ Synchronisation terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

