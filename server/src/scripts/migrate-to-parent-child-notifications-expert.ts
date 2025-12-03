/**
 * Script de migration : Convertir les notifications EXPERT existantes en système parent/enfant
 * 
 * CE SCRIPT DOIT ÊTRE EXÉCUTÉ APRÈS LA MIGRATION SQL :
 * - 20251203_add_notification_parent_child_columns.sql
 * 
 * Ce qu'il fait :
 * 1. Récupère toutes les notifications expert groupables
 * 2. Les groupe par client pour chaque expert
 * 3. Crée des notifications parent pour chaque client
 * 4. Lie les notifications existantes comme enfants
 */

import { createClient } from '@supabase/supabase-js';
import { NotificationAggregationServiceExpert } from '../services/notification-aggregation-service-expert';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function migrateExpertToParentChildSystem() {
  try {
    console.log('🔄 [Migration Expert Parent/Enfant] Début de la migration...\n');

    // 1. Vérifier que les colonnes existent (optionnel)
    console.log('🔍 [Migration Expert] Démarrage de la migration...');

    // 2. Récupérer toutes les notifications expert groupables
    console.log('\n📊 [Migration Expert] Récupération des notifications existantes...');
    const { data: existingNotifications, error: fetchError } = await supabase
      .from('notification')
      .select('*')
      .eq('user_type', 'expert')
      .in('notification_type', [
        'expert_new_assignment',
        'expert_deadline_approaching',
        'expert_deadline_overdue',
        'expert_document_required',
        'expert_workflow_step_completed',
        'expert_workflow_escalated',
        'expert_client_message',
        // Notifications spécifiques produits
        'ticpe_expert_dossier_assigned',
        'ticpe_expert_documents_ready',
        'ticpe_expert_audit_due',
        'urssaf_expert_dossier_assigned',
        'urssaf_expert_documents_ready',
        'urssaf_expert_audit_due',
        'foncier_expert_dossier_assigned',
        'foncier_expert_documents_ready',
        'foncier_expert_audit_due',
        'msa_expert_dossier_assigned',
        'msa_expert_documents_ready',
        'msa_expert_audit_due',
        'dfs_expert_dossier_assigned',
        'dfs_expert_documents_ready',
        'dfs_expert_audit_due'
      ])
      .is('parent_id', null)
      .eq('is_read', false)
      .neq('status', 'replaced');

    if (fetchError) {
      console.error('❌ [Migration Expert] Erreur récupération notifications:', fetchError);
      return;
    }

    if (!existingNotifications || existingNotifications.length === 0) {
      console.log('ℹ️  [Migration Expert] Aucune notification à migrer.');
      return;
    }

    console.log(`✅ [Migration Expert] ${existingNotifications.length} notification(s) trouvée(s)`);

    // 3. Grouper par expert
    console.log('\n📊 [Migration Expert] Groupement par expert...');
    const groupedByExpert: Record<string, any[]> = {};
    
    for (const notif of existingNotifications) {
      const expertId = notif.user_id;
      if (!groupedByExpert[expertId]) {
        groupedByExpert[expertId] = [];
      }
      groupedByExpert[expertId].push(notif);
    }

    console.log(`✅ [Migration Expert] ${Object.keys(groupedByExpert).length} expert(s) concerné(s)`);

    // 4. Pour chaque expert, créer le système parent/enfant
    let totalParentsCreated = 0;
    let totalChildrenLinked = 0;
    let totalNotificationsIgnored = 0;

    for (const [expertId, notifications] of Object.entries(groupedByExpert)) {
      console.log(`\n👤 [Migration Expert] Traitement expert ${expertId} (${notifications.length} notifications)...`);

      // Grouper par client
      const groupedByClient: Record<string, any[]> = {};
      
      for (const notif of notifications) {
        const clientId = notif.action_data?.client_id || notif.metadata?.client_id;
        if (!clientId) {
          console.warn(`⚠️  [Migration Expert] Notification ${notif.id} sans client_id, ignorée`);
          totalNotificationsIgnored++;
          continue;
        }

        if (!groupedByClient[clientId]) {
          groupedByClient[clientId] = [];
        }
        groupedByClient[clientId].push(notif);
      }

      console.log(`  📊 ${Object.keys(groupedByClient).length} client(s) avec notifications`);

      // Pour chaque client, créer un parent et lier les enfants
      for (const [clientId, clientNotifications] of Object.entries(groupedByClient)) {
        try {
          // Récupérer les infos du client depuis la première notification
          const firstNotif = clientNotifications[0];
          const clientName = firstNotif.action_data?.client_name || firstNotif.metadata?.client_name || 'Client';
          const clientCompany = firstNotif.action_data?.client_company || firstNotif.metadata?.client_company || clientName;

          // Calculer les stats
          const dossiersCount = clientNotifications.length;
          const mostUrgentDays = Math.max(...clientNotifications.map(n => {
            const createdAt = new Date(n.created_at);
            const now = new Date();
            return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
          }));

          // Déterminer la priorité la plus élevée
          const priorityOrder: Record<string, number> = { low: 1, medium: 2, high: 3, urgent: 4 };
          const highestPriority = clientNotifications.reduce((max, n) => {
            const currentPriority = n.priority || 'low';
            const maxPriority = max || 'low';
            return (priorityOrder[currentPriority] || 0) > (priorityOrder[maxPriority] || 0)
              ? currentPriority
              : maxPriority;
          }, 'low' as string);

          // Créer le titre et message
          const dossiersNames = clientNotifications
            .slice(0, 3)
            .map(n => n.action_data?.product_name || n.metadata?.produit_nom || 'Dossier')
            .join(', ');
          const moreCount = dossiersCount > 3 ? ` +${dossiersCount - 3} autre(s)` : '';

          let slaBadge = '';
          if (mostUrgentDays >= 5) slaBadge = '🚨';
          else if (mostUrgentDays >= 2) slaBadge = '⚠️';
          else if (mostUrgentDays >= 1) slaBadge = '📋';

          const title = `${slaBadge} 📋 ${clientCompany} - ${dossiersCount} dossier${dossiersCount > 1 ? 's' : ''}`.trim();
          const message = `${dossiersNames}${moreCount}`;

          // Créer la notification parent
          const { data: parent, error: parentError } = await supabase
            .from('notification')
            .insert({
              user_id: expertId,
              user_type: 'expert',
              title: title,
              message: message,
              notification_type: 'expert_client_actions_summary',
              priority: highestPriority,
              is_read: false,
              status: 'unread',
              is_parent: true,
              children_count: dossiersCount,
              action_url: `/expert/clients/${clientId}`,
              action_data: {
                client_id: clientId,
                client_name: clientName,
                client_company: clientCompany,
                pending_actions_count: dossiersCount,
                most_urgent_days: mostUrgentDays
              },
              metadata: {
                client_id: clientId,
                grouped_by: 'client',
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
            console.error(`  ❌ Erreur création parent pour client ${clientCompany}:`, parentError);
            continue;
          }

          console.log(`  ✅ Parent créé: "${title}"`);
          totalParentsCreated++;

          // Lier les notifications enfants
          const childIds = clientNotifications.map(n => n.id);
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
          console.error(`  ❌ Erreur pour client ${clientId}:`, error);
        }
      }
    }

    // 5. Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DE LA MIGRATION EXPERT');
    console.log('='.repeat(60));
    console.log(`✅ ${totalParentsCreated} notification(s) parent créée(s)`);
    console.log(`✅ ${totalChildrenLinked} notification(s) enfant liée(s)`);
    console.log(`⚠️  ${totalNotificationsIgnored} notification(s) ignorée(s) (sans client_id)`);
    console.log(`✅ ${existingNotifications.length} notification(s) traitée(s)`);
    console.log(`✅ ${Object.keys(groupedByExpert).length} expert(s) traité(s)`);
    console.log('='.repeat(60));

    // 6. Vérification finale
    console.log('\n🔍 [Migration Expert] Vérification finale...');
    const { data: verif } = await supabase
      .from('notification')
      .select('notification_type, is_parent, hidden_in_list', { count: 'exact' })
      .eq('user_type', 'expert')
      .eq('is_read', false);

    if (verif) {
      const parents = verif.filter(n => n.is_parent).length;
      const children = verif.filter(n => n.hidden_in_list).length;
      const visible = verif.filter(n => !n.hidden_in_list).length;

      console.log(`\n📊 État final des notifications expert :`);
      console.log(`  - ${parents} parent(s)`);
      console.log(`  - ${children} enfant(s) (masqué(s))`);
      console.log(`  - ${visible} notification(s) visible(s)`);
    }

    console.log('\n✅ Migration expert terminée avec succès !');
    console.log('\n💡 Prochaine étape : Vérifier dans le centre de notifications expert');
    console.log('   Les notifications devraient maintenant être groupées par client.\n');

  } catch (error) {
    console.error('❌ [Migration Expert] Erreur fatale:', error);
    throw error;
  }
}

// Exécuter le script
if (require.main === module) {
  console.log('🚀 Démarrage de la migration expert vers le système parent/enfant...\n');
  migrateExpertToParentChildSystem()
    .then(() => {
      console.log('👋 Migration expert terminée.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erreur fatale:', error);
      process.exit(1);
    });
}

export { migrateExpertToParentChildSystem };

