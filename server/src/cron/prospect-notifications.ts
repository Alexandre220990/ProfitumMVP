import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { AdminNotificationService } from '../services/admin-notification-service';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Vérifier les prospects prêts pour emailing et notifier les admins
 */
async function checkProspectsReadyForEmailing() {
  try {
    // Récupérer le nombre de prospects prêts pour emailing
    const { data: readyProspects, error } = await supabase
      .from('prospects_ready_for_emailing')
      .select('id', { count: 'exact' });

    if (error) {
      console.error('❌ [CRON] Erreur récupération prospects prêts:', error);
      return;
    }

    const count = readyProspects?.length || 0;

    // Notifier seulement si au moins 1 prospect est prêt
    if (count > 0) {
      console.log(`📧 [CRON] ${count} prospect${count > 1 ? 's' : ''} prêt${count > 1 ? 's' : ''} pour emailing`);
      await AdminNotificationService.notifyProspectsReadyForEmailing(count);
    }
  } catch (error) {
    console.error('❌ [CRON] Erreur checkProspectsReadyForEmailing:', error);
  }
}

/**
 * Vérifier les prospects avec score de priorité élevé et notifier les admins
 */
async function checkHighPriorityProspects() {
  try {
    const minScore = 80; // Seuil de priorité élevée

    // Récupérer le nombre de prospects avec score élevé
    const { data: highPriorityProspects, error } = await supabase
      .from('prospects')
      .select('id', { count: 'exact' })
      .gte('score_priority', minScore);

    if (error) {
      console.error('❌ [CRON] Erreur récupération prospects haute priorité:', error);
      return;
    }

    const count = highPriorityProspects?.length || 0;

    // Notifier seulement si au moins 1 prospect a un score élevé
    if (count > 0) {
      console.log(`⭐ [CRON] ${count} prospect${count > 1 ? 's' : ''} avec score ≥ ${minScore}`);
      await AdminNotificationService.notifyHighPriorityProspects(count, minScore);
    }
  } catch (error) {
    console.error('❌ [CRON] Erreur checkHighPriorityProspects:', error);
  }
}

/**
 * Démarrer le cron job
 * Exécution : Toutes les heures
 */
export function startProspectNotificationsCron() {
  // Cron expression: 0 * * * * = Toutes les heures à la minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ [CRON] Démarrage vérification notifications prospects');
    await checkProspectsReadyForEmailing();
    await checkHighPriorityProspects();
  }, {
    timezone: 'Europe/Paris'
  });

  console.log('✅ Cron job notifications prospects activé (toutes les heures)');
}

/**
 * Exécution manuelle (pour tests)
 */
export async function checkProspectNotificationsNow() {
  console.log('🧪 Exécution manuelle checkProspectNotifications');
  await checkProspectsReadyForEmailing();
  await checkHighPriorityProspects();
}

