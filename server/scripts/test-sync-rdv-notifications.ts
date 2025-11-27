/**
 * Script pour tester manuellement la synchronisation des notifications d'un RDV
 * Usage: ts-node server/scripts/test-sync-rdv-notifications.ts <RDV_ID>
 */

import { EventNotificationSync } from '../src/services/event-notification-sync';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSyncNotifications(rdvId: string) {
  console.log(`\n🔍 Test de synchronisation des notifications pour le RDV: ${rdvId}\n`);

  try {
    // Récupérer le RDV
    const { data: rdv, error: rdvError } = await supabase
      .from('RDV')
      .select('*')
      .eq('id', rdvId)
      .single();

    if (rdvError || !rdv) {
      console.error('❌ RDV non trouvé:', rdvError);
      return;
    }

    console.log('📋 RDV trouvé:');
    console.log(`   - Titre: ${rdv.title}`);
    console.log(`   - Date: ${rdv.scheduled_date} ${rdv.scheduled_time}`);
    console.log(`   - Statut: ${rdv.status}`);
    console.log(`   - client_id: ${rdv.client_id || 'null'}`);
    console.log(`   - expert_id: ${rdv.expert_id || 'null'}`);
    console.log(`   - apporteur_id: ${rdv.apporteur_id || 'null'}`);
    console.log(`   - created_by: ${rdv.created_by || 'null'}`);

    // Vérifier les participants
    const { data: participants } = await supabase
      .from('RDV_Participants')
      .select('*')
      .eq('rdv_id', rdvId);

    console.log(`\n📋 Participants dans RDV_Participants: ${participants?.length || 0}`);
    if (participants && participants.length > 0) {
      participants.forEach((p: any) => {
        console.log(`   - ${p.user_type}: ${p.user_id} (${p.user_name})`);
      });
    }

    // Synchroniser les notifications
    console.log('\n🔄 Synchronisation des notifications...\n');
    await EventNotificationSync.syncEventNotifications(rdv);

    // Vérifier les notifications créées
    const { data: notifications } = await supabase
      .from('notification')
      .select('*')
      .eq('metadata->>event_id', rdvId)
      .order('created_at', { ascending: false });

    console.log(`\n✅ Notifications créées: ${notifications?.length || 0}`);
    if (notifications && notifications.length > 0) {
      notifications.forEach((n: any) => {
        console.log(`   - ${n.notification_type} pour ${n.user_type}:${n.user_id}`);
        console.log(`     Titre: ${n.title}`);
        console.log(`     Message: ${n.message}`);
        console.log(`     Statut: ${n.status}, Lu: ${n.is_read}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️ Aucune notification créée');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Récupérer l'ID du RDV depuis les arguments
const rdvId = process.argv[2];

if (!rdvId) {
  console.error('❌ Usage: ts-node server/scripts/test-sync-rdv-notifications.ts <RDV_ID>');
  console.error('   Exemple: ts-node server/scripts/test-sync-rdv-notifications.ts 03995845-fbb3-4192-b038-2b5cb4b004fb');
  process.exit(1);
}

testSyncNotifications(rdvId)
  .then(() => {
    console.log('\n✅ Test terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

