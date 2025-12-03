/**
 * Script de migration : Convertir les notifications CLIENT existantes en système parent/enfant
 * 
 * CE SCRIPT DOIT ÊTRE EXÉCUTÉ APRÈS LA MIGRATION SQL :
 * - 20251203_add_notification_parent_child_columns.sql
 * 
 * Ce qu'il fait :
 * 1. Récupère toutes les notifications client groupables
 * 2. Les groupe par DOSSIER/PRODUIT pour chaque client
 * 3. Crée des notifications parent pour chaque dossier
 * 4. Lie les notifications existantes comme enfants
 * 
 * DIFFÉRENCE : Les clients sont groupés par DOSSIER, pas par CLIENT comme admin/expert
 */

import { createClient } from '@supabase/supabase-js';
import { NotificationAggregationServiceClient } from '../services/notification-aggregation-service-client';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function migrateClientToParentChildSystem() {
  try {
    console.log('🔄 [Migration Client Parent/Enfant] Début de la migration...\n');

    // 1. Vérifier que les colonnes existent (optionnel)
    console.log('🔍 [Migration Client] Démarrage de la migration...');

    // 2. Récupérer toutes les notifications client groupables
    console.log('\n📊 [Migration Client] Récupération des notifications existantes...');
    const { data: existingNotifications, error: fetchError } = await supabase
      .from('notification')
      .select('*')
      .eq('user_type', 'client')
      .in('notification_type', [
        'client_document_uploaded',
        'client_document_validated',
        'client_document_rejected',
        'client_document_expiring',
        'client_document_expired',
        'client_expert_assigned',
        'client_expert_unassigned',
        'client_deadline_reminder',
        'client_deadline_overdue',
        'client_workflow_completed',
        'client_workflow_stuck',
        // Notifications spécifiques produits
        'ticpe_client_eligibility_confirmed',
        'ticpe_client_documents_validated',
        'ticpe_client_audit_completed',
        'urssaf_client_eligibility_confirmed',
        'urssaf_client_documents_validated',
        'urssaf_client_audit_completed',
        'foncier_client_eligibility_confirmed',
        'foncier_client_documents_validated',
        'foncier_client_audit_completed',
        'msa_client_eligibility_confirmed',
        'msa_client_documents_validated',
        'msa_client_audit_completed',
        'dfs_client_eligibility_confirmed',
        'dfs_client_documents_validated',
        'dfs_client_audit_completed'
      ])
      .is('parent_id', null)
      .eq('is_read', false)
      .neq('status', 'replaced');

    if (fetchError) {
      console.error('❌ [Migration Client] Erreur récupération notifications:', fetchError);
      return;
    }

    if (!existingNotifications || existingNotifications.length === 0) {
      console.log('ℹ️  [Migration Client] Aucune notification à migrer.');
      return;
    }

    console.log(`✅ [Migration Client] ${existingNotifications.length} notification(s) trouvée(s)`);

    // 3. Grouper par client (user_id)
    console.log('\n📊 [Migration Client] Groupement par client...');
    const groupedByClient: Record<string, any[]> = {};
    
    for (const notif of existingNotifications) {
      const clientId = notif.user_id;
      if (!groupedByClient[clientId]) {
        groupedByClient[clientId] = [];
      }
      groupedByClient[clientId].push(notif);
    }

    console.log(`✅ [Migration Client] ${Object.keys(groupedByClient).length} client(s) concerné(s)`);

    // 4. Pour chaque client, créer le système parent/enfant
    let totalParentsCreated = 0;
    let totalChildrenLinked = 0;
    let totalNotificationsIgnored = 0;

    for (const [clientUserId, notifications] of Object.entries(groupedByClient)) {
      console.log(`\n👤 [Migration Client] Traitement client ${clientUserId} (${notifications.length} notifications)...`);

      // Grouper par dossier/produit
      const groupedByDossier: Record<string, any[]> = {};
      
      for (const notif of notifications) {
        const dossierId = notif.action_data?.client_produit_id || notif.action_data?.dossier_id || notif.metadata?.dossier_id;
        if (!dossierId) {
          console.warn(`⚠️  [Migration Client] Notification ${notif.id} sans dossier_id, ignorée`);
          totalNotificationsIgnored++;
          continue;
        }

        if (!groupedByDossier[dossierId]) {
          groupedByDossier[dossierId] = [];
        }
        groupedByDossier[dossierId].push(notif);
      }

      console.log(`  📊 ${Object.keys(groupedByDossier).length} dossier(s) avec notifications`);

      // Pour chaque dossier, créer un parent et lier les enfants
      for (const [dossierId, dossierNotifications] of Object.entries(groupedByDossier)) {
        try {
          // Récupérer les infos du dossier depuis la première notification
          const firstNotif = dossierNotifications[0];
          const produitNom = firstNotif.action_data?.product_name || firstNotif.metadata?.produit_nom || 'Dossier';
          const produitType = firstNotif.action_data?.product_type || firstNotif.metadata?.produit_type || 'unknown';

          // Calculer les stats
          const actionsCount = dossierNotifications.length;
          const mostUrgentDays = Math.max(...dossierNotifications.map(n => {
            const createdAt = new Date(n.created_at);
            const now = new Date();
            return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
          }));

          // Déterminer la priorité la plus élevée
          const priorityOrder: Record<string, number> = { low: 1, medium: 2, high: 3, urgent: 4 };
          const highestPriority = dossierNotifications.reduce((max, n) => {
            const currentPriority = n.priority || 'low';
            const maxPriority = max || 'low';
            return (priorityOrder[currentPriority] || 0) > (priorityOrder[maxPriority] || 0)
              ? currentPriority
              : maxPriority;
          }, 'low' as string);

          // Créer le titre et message
          const getActionLabel = (type: string) => {
            const labels: Record<string, string> = {
              'client_document_validated': 'Document validé',
              'client_document_rejected': 'Document rejeté',
              'client_document_expiring': 'Document expire',
              'client_expert_assigned': 'Expert assigné',
              'client_deadline_reminder': 'Deadline proche',
              'client_deadline_overdue': 'Deadline dépassée',
              'client_workflow_completed': 'Étape complétée'
            };
            return labels[type] || 'Notification';
          };

          const actionsSummary = dossierNotifications
            .slice(0, 3)
            .map(n => getActionLabel(n.notification_type))
            .join(', ');
          const moreCount = actionsCount > 3 ? ` +${actionsCount - 3} autre(s)` : '';

          let badge = '📋';
          if (mostUrgentDays >= 5) badge = '🚨';
          else if (mostUrgentDays >= 2) badge = '⚠️';

          const title = `${badge} 📋 ${produitNom} - ${actionsCount} action${actionsCount > 1 ? 's' : ''}`;
          const message = `${actionsSummary}${moreCount}`;

          // Créer la notification parent
          const { data: parent, error: parentError } = await supabase
            .from('notification')
            .insert({
              user_id: clientUserId,
              user_type: 'client',
              title: title,
              message: message,
              notification_type: 'client_dossier_actions_summary',
              priority: highestPriority,
              is_read: false,
              status: 'unread',
              is_parent: true,
              children_count: actionsCount,
              action_url: `/client/dossiers/${dossierId}`,
              action_data: {
                dossier_id: dossierId,
                produit_nom: produitNom,
                produit_type: produitType,
                pending_actions_count: actionsCount,
                most_urgent_days: mostUrgentDays
              },
              metadata: {
                dossier_id: dossierId,
                grouped_by: 'dossier',
                aggregation_date: new Date().toISOString(),
                most_urgent_days: mostUrgentDays,
                migrated_from: 'legacy_system'
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (parentError) {
            console.error(`  ❌ Erreur création parent pour dossier ${produitNom}:`, parentError);
            continue;
          }

          console.log(`  ✅ Parent créé: "${title}"`);
          totalParentsCreated++;

          // Lier les notifications enfants
          const childIds = dossierNotifications.map(n => n.id);
          const { error: linkError } = await supabase
            .from('notification')
            .update({
              parent_id: parent.id,
              is_child: true,
              hidden_in_list: true,
              updated_at: new Date().toISOString()
            })
            .in('id', childIds);

          if (linkError) {
            console.error(`  ❌ Erreur liaison enfants:`, linkError);
          } else {
            console.log(`  ✅ ${childIds.length} enfant(s) lié(s)`);
            totalChildrenLinked += childIds.length;
          }

        } catch (error) {
          console.error(`  ❌ Erreur pour dossier ${dossierId}:`, error);
        }
      }
    }

    // 5. Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DE LA MIGRATION CLIENT');
    console.log('='.repeat(60));
    console.log(`✅ ${totalParentsCreated} notification(s) parent créée(s)`);
    console.log(`✅ ${totalChildrenLinked} notification(s) enfant liée(s)`);
    console.log(`⚠️  ${totalNotificationsIgnored} notification(s) ignorée(s) (sans dossier_id)`);
    console.log(`✅ ${existingNotifications.length} notification(s) traitée(s)`);
    console.log(`✅ ${Object.keys(groupedByClient).length} client(s) traité(s)`);
    console.log('='.repeat(60));

    // 6. Vérification finale
    console.log('\n🔍 [Migration Client] Vérification finale...');
    const { data: verif } = await supabase
      .from('notification')
      .select('notification_type, is_parent, hidden_in_list', { count: 'exact' })
      .eq('user_type', 'client')
      .eq('is_read', false);

    if (verif) {
      const parents = verif.filter(n => n.is_parent).length;
      const children = verif.filter(n => n.hidden_in_list).length;
      const visible = verif.filter(n => !n.hidden_in_list).length;

      console.log(`\n📊 État final des notifications client :`);
      console.log(`  - ${parents} parent(s)`);
      console.log(`  - ${children} enfant(s) (masqué(s))`);
      console.log(`  - ${visible} notification(s) visible(s)`);
    }

    console.log('\n✅ Migration client terminée avec succès !');
    console.log('\n💡 Prochaine étape : Vérifier dans le centre de notifications client');
    console.log('   Les notifications devraient maintenant être groupées par dossier/produit.\n');

  } catch (error) {
    console.error('❌ [Migration Client] Erreur fatale:', error);
    throw error;
  }
}

// Exécuter le script
if (require.main === module) {
  console.log('🚀 Démarrage de la migration client vers le système parent/enfant...\n');
  migrateClientToParentChildSystem()
    .then(() => {
      console.log('👋 Migration client terminée.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erreur fatale:', error);
      process.exit(1);
    });
}

export { migrateClientToParentChildSystem };

