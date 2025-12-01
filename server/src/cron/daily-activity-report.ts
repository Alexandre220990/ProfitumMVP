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

    // Récupérer tous les admins actifs avec leur auth_user_id
    const { data: admins, error: adminsError } = await supabase
      .from('Admin')
      .select('id, email, name, is_active, auth_user_id')
      .eq('is_active', true)
      .not('email', 'is', null);

    if (adminsError) {
      console.error('❌ [CRON] Erreur récupération admins:', adminsError);
      return;
    }

    if (!admins || admins.length === 0) {
      console.log('⚠️ [CRON] Aucun admin actif trouvé');
      return;
    }

    // Filtrer les admins avec email valide (pas d'emails temporaires)
    const validAdmins = admins.filter(admin => 
      admin.email && 
      !admin.email.includes('@profitum.temp') && 
      !admin.email.includes('temp_')
    );

    if (validAdmins.length === 0) {
      console.log('⚠️ [CRON] Aucun admin avec email valide trouvé');
      return;
    }

    console.log(`📧 [CRON] Envoi du rapport à ${validAdmins.length} admin(s) sur ${admins.length} total`);

    // Envoyer le rapport à chaque admin
    const results = await Promise.allSettled(
      validAdmins.map(async (admin) => {
        try {
          const adminName = admin.name || admin.email || 'Administrateur';
          
          console.log(`📧 [CRON] Traitement admin: ${admin.email} (auth_user_id: ${admin.auth_user_id || 'non défini'})`);
          
          const success = await DailyActivityReportServiceV2.sendDailyReport(
            admin.email,
            adminName,
            admin.auth_user_id || undefined,
            'admin'
          );

          if (success) {
            console.log(`✅ [CRON] Rapport envoyé avec succès à ${admin.email}`);
          } else {
            console.error(`❌ [CRON] Échec envoi rapport à ${admin.email} - vérifier les logs ci-dessus`);
          }

          return { admin: admin.email, success };
        } catch (error: any) {
          console.error(`❌ [CRON] Erreur envoi rapport à ${admin.email}:`, error.message);
          console.error(`❌ [CRON] Stack trace:`, error.stack);
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

  // Vérifier si on doit exécuter le rapport maintenant (si redémarrage après 20h)
  const now = new Date();
  const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const currentHour = parisTime.getHours();
  const currentMinute = parisTime.getMinutes();

  // Si on démarre après 20h00 et avant 20h30, exécuter le rapport (rattrapage)
  if (currentHour === 20 && currentMinute < 30) {
    console.log('🔄 [CRON] Redémarrage détecté après 20h - Exécution immédiate du rapport quotidien');
    // Exécuter avec un petit délai pour laisser le serveur finir de démarrer
    setTimeout(async () => {
      await sendDailyReportsToAllAdmins();
    }, 5000); // 5 secondes de délai
  }
}

/**
 * Exécution manuelle (pour tests)
 */
export async function sendDailyReportsNow() {
  console.log('🧪 Exécution manuelle sendDailyReportsToAllAdmins');
  await sendDailyReportsToAllAdmins();
}

