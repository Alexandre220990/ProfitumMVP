/**
 * Cron job pour envoyer le rapport d'activité quotidien aux admins
 * Exécution : Tous les jours à 20h (timezone Europe/Paris)
 */

import cron from 'node-cron';
import { supabase } from '../lib/supabase';
import { DailyActivityReportServiceV2 } from '../services/daily-activity-report-service-v2';

/**
 * Envoyer le rapport d'activité quotidien à tous les admins actifs
 */
async function sendDailyReportsToAllAdmins() {
  try {
    console.log('⏰ [CRON] Démarrage envoi rapports d\'activité quotidiens');

    // Récupérer tous les admins actifs
    const { data: admins, error: adminsError } = await supabase
      .from('Admin')
      .select('id, email, name, is_active')
      .eq('is_active', true);

    if (adminsError) {
      console.error('❌ [CRON] Erreur récupération admins:', adminsError);
      return;
    }

    if (!admins || admins.length === 0) {
      console.log('⚠️ [CRON] Aucun admin actif trouvé');
      return;
    }

    console.log(`📧 [CRON] Envoi du rapport à ${admins.length} admin(s)`);

    // Envoyer le rapport à chaque admin
    const results = await Promise.allSettled(
      admins.map(async (admin) => {
        try {
          const adminName = admin.name || admin.email || 'Administrateur';
          // Récupérer l'auth_user_id pour les liens sécurisés
          const { data: adminData } = await supabase
            .from('Admin')
            .select('auth_user_id')
            .eq('id', admin.id)
            .single();
          
          const success = await DailyActivityReportServiceV2.sendDailyReport(
            admin.email,
            adminName,
            adminData?.auth_user_id,
            'admin'
          );

          if (success) {
            console.log(`✅ [CRON] Rapport envoyé à ${admin.email}`);
          } else {
            console.error(`❌ [CRON] Échec envoi rapport à ${admin.email}`);
          }

          return { admin: admin.email, success };
        } catch (error: any) {
          console.error(`❌ [CRON] Erreur envoi rapport à ${admin.email}:`, error.message);
          return { admin: admin.email, success: false, error: error.message };
        }
      })
    );

    // Résumé des résultats
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`📊 [CRON] Résumé : ${successful} succès, ${failed} échec(s)`);

  } catch (error) {
    console.error('❌ [CRON] Erreur générale envoi rapports:', error);
  }
}

/**
 * Démarrer le cron job
 * Exécution : Tous les jours à 20h (timezone Europe/Paris)
 */
export function startDailyActivityReportCron() {
  // Cron expression: 0 20 * * * = Tous les jours à 20h
  cron.schedule('0 20 * * *', async () => {
    console.log('⏰ [CRON] Démarrage vérification rapports d\'activité quotidiens');
    await sendDailyReportsToAllAdmins();
  }, {
    timezone: 'Europe/Paris'
  });

  console.log('✅ Cron job rapports d\'activité quotidiens activé (tous les jours à 20h)');
}

/**
 * Exécution manuelle (pour tests)
 */
export async function sendDailyReportsNow() {
  console.log('🧪 Exécution manuelle sendDailyReportsToAllAdmins');
  await sendDailyReportsToAllAdmins();
}

