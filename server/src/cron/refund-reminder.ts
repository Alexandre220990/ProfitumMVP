/**
 * Cron job pour relancer les experts si la demande de remboursement n'est pas envoyée
 * Exécution : Tous les jours à 10h
 */

import cron from 'node-cron';
import { supabase } from '../lib/supabase';

/**
 * Vérifier les dossiers validés sans demande envoyée
 * Relances : J+7 (expert), J+14 (expert + admin)
 */
async function checkRefundRequests() {
  try {
    console.log('🔍 Vérification des demandes de remboursement en attente...');

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Récupérer les dossiers validés sans demande envoyée
    const { data: dossiers, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        clientId,
        expert_id,
        statut,
        montantFinal,
        date_audit_validated_by_client,
        metadata,
        Client(company_name, nom, prenom),
        ProduitEligible(nom),
        Expert(auth_user_id, name, email)
      `)
      .eq('statut', 'validated')
      .not('expert_id', 'is', null)
      .not('date_audit_validated_by_client', 'is', null) as { data: any[] | null, error: any };

    if (error) {
      console.error('❌ Erreur récupération dossiers:', error);
      return;
    }

    if (!dossiers || dossiers.length === 0) {
      console.log('✅ Aucun dossier en attente de demande');
      return;
    }

    console.log(`📋 ${dossiers.length} dossier(s) validé(s) trouvé(s)`);

    for (const dossier of dossiers) {
      const validationDate = new Date(dossier.date_audit_validated_by_client);
      const daysSinceValidation = Math.floor((now.getTime() - validationDate.getTime()) / (24 * 60 * 60 * 1000));

      const clientInfo: any = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
      const clientName = clientInfo?.company_name || clientInfo?.nom || 'Client';
      
      const expertInfo: any = Array.isArray(dossier.Expert) ? dossier.Expert[0] : dossier.Expert;
      const expertName = expertInfo?.name || 'Expert';

      const produitInfo: any = Array.isArray(dossier.ProduitEligible) ? dossier.ProduitEligible[0] : dossier.ProduitEligible;
      const produitNom = produitInfo?.nom || 'Dossier';

      // Vérifier si déjà relancé
      const alreadyReminded = dossier.metadata?.refund_reminders || [];

      // Relance J+7 : Expert uniquement
      if (daysSinceValidation >= 7 && daysSinceValidation < 8 && !alreadyReminded.includes('7days')) {
        console.log(`⏰ Relance J+7 pour dossier ${dossier.id}`);

        // Notification expert
        if (expertInfo?.auth_user_id) {
          await supabase
            .from('notification')
            .insert({
              user_id: expertInfo.auth_user_id,
              user_type: 'expert',
              title: `⚠️ Action requise - ${produitNom}`,
              message: `Demande de remboursement à envoyer pour ${clientName}. Le dossier est validé depuis 7 jours.`,
              notification_type: 'reminder',
              priority: 'high',
              is_read: false,
              action_url: `/expert/dossier/${dossier.id}`,
              action_data: {
                client_produit_id: dossier.id,
                reminder_type: '7days',
                days_since_validation: 7
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }

        // Mettre à jour metadata pour éviter les doublons
        await supabase
          .from('ClientProduitEligible')
          .update({
            metadata: {
              ...dossier.metadata,
              refund_reminders: [...alreadyReminded, '7days']
            }
          })
          .eq('id', dossier.id);

        console.log(`✅ Relance J+7 envoyée pour ${clientName}`);
      }

      // Relance J+14 : Expert + Admin
      if (daysSinceValidation >= 14 && daysSinceValidation < 15 && !alreadyReminded.includes('14days')) {
        console.log(`⚠️ Relance J+14 pour dossier ${dossier.id}`);

        // Notification expert
        if (expertInfo?.auth_user_id) {
          await supabase
            .from('notification')
            .insert({
              user_id: expertInfo.auth_user_id,
              user_type: 'expert',
              title: `🔴 ACTION URGENTE - ${produitNom}`,
              message: `URGENT : Demande de remboursement toujours pas envoyée pour ${clientName}. Le dossier est validé depuis 14 jours.`,
              notification_type: 'reminder_urgent',
              priority: 'high',
              is_read: false,
              action_url: `/expert/dossier/${dossier.id}`,
              action_data: {
                client_produit_id: dossier.id,
                reminder_type: '14days',
                days_since_validation: 14
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }

        // Notification admin
        const { data: admins } = await supabase
          .from('Admin')
          .select('auth_user_id')
          .eq('is_active', true);

        if (admins && admins.length > 0) {
          for (const admin of admins) {
            if (admin.auth_user_id) {
              await supabase
                .from('notification')
                .insert({
                  user_id: admin.auth_user_id,
                  user_type: 'admin',
                  title: `⚠️ Demande en retard - ${produitNom}`,
                  message: `${expertName} n'a pas encore envoyé la demande pour ${clientName} (validé depuis 14 jours)`,
                  notification_type: 'admin_alert',
                  priority: 'high',
                  is_read: false,
                  action_url: `/admin/dossiers/${dossier.id}`,
                  action_data: {
                    client_produit_id: dossier.id,
                    expert_id: dossier.expert_id,
                    expert_name: expertName,
                    client_name: clientName,
                    days_since_validation: 14
                  },
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
            }
          }
        }

        // Mettre à jour metadata
        await supabase
          .from('ClientProduitEligible')
          .update({
            metadata: {
              ...dossier.metadata,
              refund_reminders: [...alreadyReminded, '14days']
            }
          })
          .eq('id', dossier.id);

        console.log(`✅ Relance J+14 envoyée pour ${clientName} (expert + admin)`);
      }
    }

    console.log('✅ Vérification relances terminée');

  } catch (error) {
    console.error('❌ Erreur checkRefundRequests:', error);
  }
}

/**
 * Démarrer le cron job
 * Exécution : Tous les jours à 10h
 */
export function startRefundRemindersCron() {
  // Cron expression: 0 10 * * * = Tous les jours à 10h
  cron.schedule('0 10 * * *', async () => {
    console.log('⏰ [CRON] Démarrage vérification relances remboursement');
    await checkRefundRequests();
  }, {
    timezone: 'Europe/Paris'
  });

  console.log('✅ Cron job relances remboursement activé (tous les jours à 10h)');
}

/**
 * Exécution manuelle (pour tests)
 */
export async function checkRefundRequestsNow() {
  console.log('🧪 Exécution manuelle checkRefundRequests');
  await checkRefundRequests();
}

