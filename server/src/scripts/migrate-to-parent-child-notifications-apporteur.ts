/**
 * Script de migration : Convertir les notifications APPORTEUR existantes en système parent/enfant
 * 
 * CE SCRIPT DOIT ÊTRE EXÉCUTÉ APRÈS LA MIGRATION SQL :
 * - 20251203_add_notification_parent_child_columns.sql
 * 
 * Ce qu'il fait :
 * 1. Récupère toutes les notifications apporteur groupables
 * 2. Les groupe par PROSPECT/CLIENT pour chaque apporteur
 * 3. Crée des notifications parent pour chaque prospect
 * 4. Lie les notifications existantes comme enfants
 */

import { createClient } from '@supabase/supabase-js';
import { NotificationAggregationServiceApporteur } from '../services/notification-aggregation-service-apporteur';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function migrateApporteurToParentChildSystem() {
  try {
    console.log('🔄 [Migration Apporteur Parent/Enfant] Début de la migration...\n');

    console.log('🔍 [Migration Apporteur] Démarrage de la migration...');

    // Récupérer toutes les notifications apporteur groupables
    console.log('\n📊 [Migration Apporteur] Récupération des notifications existantes...');
    const { data: existingNotifications, error: fetchError } = await supabase
      .from('notification')
      .select('*')
      .eq('user_type', 'apporteur')
      .in('notification_type', [
        'apporteur_nouveau_prospect',
        'apporteur_prospect_qualifie',
        'apporteur_prospect_converti',
        'apporteur_prospect_perdu',
        'apporteur_commission_calculee',
        'apporteur_commission_payee',
        'apporteur_expert_assigne',
        'apporteur_rdv_confirme',
        'apporteur_rdv_programme',
        'apporteur_rappel_suivi',
        'apporteur_formation_disponible',
        'apporteur_document_requis',
        'apporteur_document_valide',
        'apporteur_contrat_signe',
        'apporteur_client_actif',
        'nouveau_prospect',
        'commission_payee',
        'commission_calculee',
        'rdv_confirme',
        'rdv_programme',
        'rappel_suivi',
        'expert_assigne',
        'lead_to_treat',
        'contact_message'
      ])
      .is('parent_id', null)
      .eq('is_read', false)
      .neq('status', 'replaced');

    if (fetchError) {
      console.error('❌ [Migration Apporteur] Erreur récupération notifications:', fetchError);
      return;
    }

    if (!existingNotifications || existingNotifications.length === 0) {
      console.log('ℹ️  [Migration Apporteur] Aucune notification à migrer.');
      return;
    }

    console.log(`✅ [Migration Apporteur] ${existingNotifications.length} notification(s) trouvée(s)`);

    // Grouper par apporteur
    console.log('\n📊 [Migration Apporteur] Groupement par apporteur...');
    const groupedByApporteur: Record<string, any[]> = {};
    
    for (const notif of existingNotifications) {
      const apporteurId = notif.user_id;
      if (!groupedByApporteur[apporteurId]) {
        groupedByApporteur[apporteurId] = [];
      }
      groupedByApporteur[apporteurId].push(notif);
    }

    console.log(`✅ [Migration Apporteur] ${Object.keys(groupedByApporteur).length} apporteur(s) concerné(s)`);

    // Pour chaque apporteur, créer le système parent/enfant
    let totalParentsCreated = 0;
    let totalChildrenLinked = 0;
    let totalNotificationsIgnored = 0;

    for (const [apporteurUserId, notifications] of Object.entries(groupedByApporteur)) {
      console.log(`\n👤 [Migration Apporteur] Traitement apporteur ${apporteurUserId} (${notifications.length} notifications)...`);

      // Grouper par prospect/client
      const groupedByProspect: Record<string, any[]> = {};
      
      for (const notif of notifications) {
        const prospectId = notif.action_data?.prospect_id || notif.action_data?.client_id || notif.metadata?.prospect_id || notif.metadata?.client_id;
        if (!prospectId) {
          console.warn(`⚠️  [Migration Apporteur] Notification ${notif.id} sans prospect_id, ignorée`);
          totalNotificationsIgnored++;
          continue;
        }

        if (!groupedByProspect[prospectId]) {
          groupedByProspect[prospectId] = [];
        }
        groupedByProspect[prospectId].push(notif);
      }

      console.log(`  📊 ${Object.keys(groupedByProspect).length} prospect(s) avec notifications`);

      // Pour chaque prospect, créer un parent et lier les enfants
      for (const [prospectId, prospectNotifications] of Object.entries(groupedByProspect)) {
        try {
          // Récupérer les infos du prospect depuis la première notification
          const firstNotif = prospectNotifications[0];
          const prospectName = firstNotif.action_data?.prospect_name || firstNotif.action_data?.client_name || firstNotif.metadata?.name || 'Prospect';
          const prospectCompany = firstNotif.action_data?.prospect_company || firstNotif.action_data?.company_name || firstNotif.metadata?.company || prospectName;

          // Calculer les stats
          const actionsCount = prospectNotifications.length;
          const mostUrgentDays = Math.max(...prospectNotifications.map(n => {
            const createdAt = new Date(n.created_at);
            const now = new Date();
            return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
          }));

          // Déterminer la priorité la plus élevée
          const priorityOrder: Record<string, number> = { low: 1, medium: 2, high: 3, urgent: 4 };
          const highestPriority = prospectNotifications.reduce((max, n) => {
            const currentPriority = n.priority || 'low';
            const maxPriority = max || 'low';
            return (priorityOrder[currentPriority] || 0) > (priorityOrder[maxPriority] || 0)
              ? currentPriority
              : maxPriority;
          }, 'low' as string);

          // Créer le titre et message
          const getActionLabel = (type: string) => {
            const labels: Record<string, string> = {
              'apporteur_nouveau_prospect': 'Nouveau prospect',
              'apporteur_prospect_qualifie': 'Prospect qualifié',
              'apporteur_commission_calculee': 'Commission calculée',
              'apporteur_commission_payee': 'Commission payée',
              'apporteur_rdv_confirme': 'RDV confirmé',
              'nouveau_prospect': 'Nouveau prospect',
              'commission_payee': 'Commission payée',
              'rdv_confirme': 'RDV confirmé',
              'lead_to_treat': 'Lead à traiter'
            };
            return labels[type] || 'Notification';
          };

          const actionsSummary = prospectNotifications
            .slice(0, 3)
            .map(n => getActionLabel(n.notification_type))
            .join(', ');
          const moreCount = actionsCount > 3 ? ` +${actionsCount - 3} autre(s)` : '';

          let badge = '📋';
          if (mostUrgentDays >= 5) badge = '🚨';
          else if (mostUrgentDays >= 2) badge = '⚠️';

          const title = `${badge} 📋 ${prospectCompany} - ${actionsCount} action${actionsCount > 1 ? 's' : ''}`;
          const message = `${actionsSummary}${moreCount}`;

          // Créer la notification parent
          const { data: parent, error: parentError } = await supabase
            .from('notification')
            .insert({
              user_id: apporteurUserId,
              user_type: 'apporteur',
              title: title,
              message: message,
              notification_type: 'apporteur_prospect_actions_summary',
              priority: highestPriority,
              is_read: false,
              status: 'unread',
              is_parent: true,
              children_count: actionsCount,
              action_url: `/apporteur/prospects/${prospectId}`,
              action_data: {
                prospect_id: prospectId,
                prospect_name: prospectName,
                prospect_company: prospectCompany,
                pending_actions_count: actionsCount,
                most_urgent_days: mostUrgentDays
              },
              metadata: {
                prospect_id: prospectId,
                grouped_by: 'prospect',
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
            console.error(`  ❌ Erreur création parent pour prospect ${prospectCompany}:`, parentError);
            continue;
          }

          console.log(`  ✅ Parent créé: "${title}"`);
          totalParentsCreated++;

          // Lier les notifications enfants
          const childIds = prospectNotifications.map(n => n.id);
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
          console.error(`  ❌ Erreur pour prospect ${prospectId}:`, error);
        }
      }
    }

    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DE LA MIGRATION APPORTEUR');
    console.log('='.repeat(60));
    console.log(`✅ ${totalParentsCreated} notification(s) parent créée(s)`);
    console.log(`✅ ${totalChildrenLinked} notification(s) enfant liée(s)`);
    console.log(`⚠️  ${totalNotificationsIgnored} notification(s) ignorée(s) (sans prospect_id)`);
    console.log(`✅ ${existingNotifications.length} notification(s) traitée(s)`);
    console.log(`✅ ${Object.keys(groupedByApporteur).length} apporteur(s) traité(s)`);
    console.log('='.repeat(60));

    // Vérification finale
    console.log('\n🔍 [Migration Apporteur] Vérification finale...');
    const { data: verif } = await supabase
      .from('notification')
      .select('notification_type, is_parent, hidden_in_list', { count: 'exact' })
      .eq('user_type', 'apporteur')
      .eq('is_read', false);

    if (verif) {
      const parents = verif.filter(n => n.is_parent).length;
      const children = verif.filter(n => n.hidden_in_list).length;
      const visible = verif.filter(n => !n.hidden_in_list).length;

      console.log(`\n📊 État final des notifications apporteur :`);
      console.log(`  - ${parents} parent(s)`);
      console.log(`  - ${children} enfant(s) (masqué(s))`);
      console.log(`  - ${visible} notification(s) visible(s)`);
    }

    console.log('\n✅ Migration apporteur terminée avec succès !');
    console.log('\n💡 Prochaine étape : Vérifier dans le centre de notifications apporteur');
    console.log('   Les notifications devraient maintenant être groupées par prospect.\n');

  } catch (error) {
    console.error('❌ [Migration Apporteur] Erreur fatale:', error);
    throw error;
  }
}

// Exécuter le script
if (require.main === module) {
  console.log('🚀 Démarrage de la migration apporteur vers le système parent/enfant...\n');
  migrateApporteurToParentChildSystem()
    .then(() => {
      console.log('👋 Migration apporteur terminée.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erreur fatale:', error);
      process.exit(1);
    });
}

export { migrateApporteurToParentChildSystem };

