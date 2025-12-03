/**
 * Service d'agrégation de notifications par PRODUIT/DOSSIER pour les CLIENTS
 * Système parent/enfant pour grouper les notifications par dossier
 * 
 * Architecture :
 * - 1 notification PARENT par dossier/produit avec actions en attente
 * - N notifications ENFANTS avec détails individuels (masquées par défaut)
 * - Recalcul automatique des parents quand enfants changent
 * 
 * DIFFÉRENCE avec Admin/Expert : 
 * - Admin/Expert : Groupe par CLIENT_ID
 * - Client : Groupe par PRODUIT/DOSSIER_ID
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface DossierPendingActions {
  dossier_id: string;
  produit_nom: string;
  produit_type: string;
  notifications: Array<{
    notification_id: string;
    notification_type: string;
    priority: string;
    created_at: string;
    days_waiting: number;
    title: string;
    message: string;
  }>;
  most_urgent_days: number;
  highest_priority: 'low' | 'medium' | 'high' | 'urgent';
}

export class NotificationAggregationServiceClient {
  /**
   * Agréger les notifications par dossier/produit et créer des parents
   * À exécuter après création de notifications enfants pour un client
   */
  static async aggregateNotificationsByDossier(clientUserId: string): Promise<void> {
    try {
      console.log(`📊 [Aggregation Client] Début agrégation notifications pour client ${clientUserId}`);

      // 1. Récupérer toutes les notifications enfants non agrégées pour ce client
      const { data: childNotifications, error: childError } = await supabase
        .from('notification')
        .select(`
          id,
          notification_type,
          title,
          message,
          priority,
          created_at,
          action_data,
          metadata,
          parent_id
        `)
        .eq('user_id', clientUserId)
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

      if (childError) {
        console.error('❌ [Aggregation Client] Erreur récupération notifications enfants:', childError);
        return;
      }

      if (!childNotifications || childNotifications.length === 0) {
        console.log('ℹ️  [Aggregation Client] Aucune notification à agréger');
        return;
      }

      console.log(`📊 [Aggregation Client] ${childNotifications.length} notification(s) trouvée(s)`);

      // 2. Grouper par dossier_id / client_produit_id
      const groupedByDossier = this.groupNotificationsByDossier(childNotifications);

      console.log(`📊 [Aggregation Client] ${Object.keys(groupedByDossier).length} dossier(s) avec actions`);

      // 3. Pour chaque dossier, créer ou mettre à jour la notification parent
      for (const [dossierId, actions] of Object.entries(groupedByDossier)) {
        await this.createOrUpdateParentNotification(clientUserId, dossierId, actions);
      }

      console.log('✅ [Aggregation Client] Agrégation terminée avec succès');
    } catch (error) {
      console.error('❌ [Aggregation Client] Erreur lors de l\'agrégation:', error);
    }
  }

  /**
   * Grouper les notifications par dossier_id / client_produit_id
   */
  private static groupNotificationsByDossier(notifications: any[]): Record<string, DossierPendingActions> {
    const grouped: Record<string, DossierPendingActions> = {};

    for (const notif of notifications) {
      const dossierId = notif.action_data?.client_produit_id || notif.action_data?.dossier_id || notif.metadata?.dossier_id;
      const produitNom = notif.action_data?.product_name || notif.metadata?.produit_nom || 'Dossier';
      const produitType = notif.action_data?.product_type || notif.metadata?.produit_type || 'unknown';

      if (!dossierId) continue;

      if (!grouped[dossierId]) {
        grouped[dossierId] = {
          dossier_id: dossierId,
          produit_nom: produitNom,
          produit_type: produitType,
          notifications: [],
          most_urgent_days: 0,
          highest_priority: 'low'
        };
      }

      // Calculer les jours d'attente
      const createdAt = new Date(notif.created_at);
      const now = new Date();
      const daysWaiting = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      grouped[dossierId].notifications.push({
        notification_id: notif.id,
        notification_type: notif.notification_type,
        priority: notif.priority,
        created_at: notif.created_at,
        days_waiting: daysWaiting,
        title: notif.title,
        message: notif.message
      });

      // Mettre à jour l'urgence maximale
      if (daysWaiting > grouped[dossierId].most_urgent_days) {
        grouped[dossierId].most_urgent_days = daysWaiting;
      }

      // Mettre à jour la priorité la plus élevée
      const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
      if (priorityOrder[notif.priority as keyof typeof priorityOrder] > priorityOrder[grouped[dossierId].highest_priority]) {
        grouped[dossierId].highest_priority = notif.priority;
      }
    }

    return grouped;
  }

  /**
   * Créer ou mettre à jour la notification parent pour un dossier
   */
  private static async createOrUpdateParentNotification(
    clientUserId: string,
    dossierId: string,
    actions: DossierPendingActions
  ): Promise<void> {
    try {
      // 1. Vérifier si une notification parent existe déjà
      const { data: existingParent } = await supabase
        .from('notification')
        .select('id, metadata')
        .eq('user_id', clientUserId)
        .eq('notification_type', 'client_dossier_actions_summary')
        .eq('metadata->>dossier_id', dossierId)
        .eq('is_read', false)
        .neq('status', 'replaced')
        .maybeSingle();

      const actionsCount = actions.notifications.length;
      const actionsSummary = actions.notifications
        .slice(0, 3)
        .map(n => this.getActionLabel(n.notification_type))
        .join(', ');
      const moreCount = actionsCount > 3 ? ` +${actionsCount - 3} autre(s)` : '';

      const title = `📋 ${actions.produit_nom} - ${actionsCount} action${actionsCount > 1 ? 's' : ''}`;
      const message = `${actionsSummary}${moreCount}`;

      // Badge basé sur le plus urgent
      let badge = '📋';
      if (actions.most_urgent_days >= 5) badge = '🚨';
      else if (actions.most_urgent_days >= 2) badge = '⚠️';

      const parentData = {
        user_id: clientUserId,
        user_type: 'client',
        title: `${badge} ${title}`,
        message: message,
        notification_type: 'client_dossier_actions_summary',
        priority: actions.highest_priority,
        is_read: false,
        status: 'unread',
        is_parent: true,
        children_count: actionsCount,
        action_url: `/client/dossiers/${dossierId}`,
        action_data: {
          dossier_id: dossierId,
          produit_nom: actions.produit_nom,
          produit_type: actions.produit_type,
          pending_actions_count: actionsCount,
          most_urgent_days: actions.most_urgent_days,
          actions_summary: actions.notifications.map(n => ({
            notification_type: n.notification_type,
            days_waiting: n.days_waiting,
            priority: n.priority
          }))
        },
        metadata: {
          dossier_id: dossierId,
          grouped_by: 'dossier',
          aggregation_date: new Date().toISOString(),
          most_urgent_days: actions.most_urgent_days
        },
        updated_at: new Date().toISOString()
      };

      if (existingParent) {
        // Mettre à jour la notification parent existante
        const { error: updateError } = await supabase
          .from('notification')
          .update(parentData)
          .eq('id', existingParent.id);

        if (updateError) {
          console.error(`❌ [Aggregation Client] Erreur mise à jour parent pour dossier ${dossierId}:`, updateError);
        } else {
          console.log(`✅ [Aggregation Client] Parent mis à jour pour dossier ${actions.produit_nom} (${actionsCount} actions)`);
        }
      } else {
        // Créer une nouvelle notification parent
        const { data: newParent, error: createError } = await supabase
          .from('notification')
          .insert({
            ...parentData,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error(`❌ [Aggregation Client] Erreur création parent pour dossier ${dossierId}:`, createError);
        } else {
          console.log(`✅ [Aggregation Client] Parent créé pour dossier ${actions.produit_nom} (${actionsCount} actions)`);

          // Lier les notifications enfants à cette parent
          await this.linkChildrenToParent(clientUserId, dossierId, newParent.id);
        }
      }
    } catch (error) {
      console.error(`❌ [Aggregation Client] Erreur pour dossier ${dossierId}:`, error);
    }
  }

  /**
   * Obtenir un label court pour un type de notification
   */
  private static getActionLabel(notificationType: string): string {
    const labels: Record<string, string> = {
      'client_document_validated': 'Document validé',
      'client_document_rejected': 'Document rejeté',
      'client_document_expiring': 'Document expire',
      'client_expert_assigned': 'Expert assigné',
      'client_deadline_reminder': 'Deadline proche',
      'client_deadline_overdue': 'Deadline dépassée',
      'client_workflow_completed': 'Étape complétée',
      'client_workflow_stuck': 'Action requise'
    };
    return labels[notificationType] || 'Notification';
  }

  /**
   * Lier les notifications enfants à leur parent
   */
  private static async linkChildrenToParent(
    clientUserId: string,
    dossierId: string,
    parentId: string
  ): Promise<void> {
    try {
      // Récupérer toutes les notifications enfants pour ce dossier
      const { data: children } = await supabase
        .from('notification')
        .select('id')
        .eq('user_id', clientUserId)
        .is('parent_id', null)
        .or(`action_data->>client_produit_id.eq.${dossierId},action_data->>dossier_id.eq.${dossierId},metadata->>dossier_id.eq.${dossierId}`);

      if (!children || children.length === 0) return;

      // Mettre à jour chaque enfant
      const { error: linkError } = await supabase
        .from('notification')
        .update({
          parent_id: parentId,
          is_child: true,
          hidden_in_list: true,
          updated_at: new Date().toISOString()
        })
        .in('id', children.map(c => c.id));

      if (linkError) {
        console.error(`❌ [Aggregation Client] Erreur liaison enfants au parent:`, linkError);
      } else {
        console.log(`✅ [Aggregation Client] ${children.length} enfant(s) lié(s) au parent`);
      }
    } catch (error) {
      console.error('❌ [Aggregation Client] Erreur lors de la liaison enfants:', error);
    }
  }

  /**
   * Nettoyer les notifications parent orphelines (sans enfants)
   */
  static async cleanupOrphanParents(): Promise<void> {
    try {
      console.log('🧹 [Aggregation Client] Nettoyage des parents orphelins...');

      // Récupérer tous les parents
      const { data: parents } = await supabase
        .from('notification')
        .select('id, metadata')
        .eq('notification_type', 'client_dossier_actions_summary')
        .eq('is_parent', true)
        .eq('is_read', false);

      if (!parents || parents.length === 0) return;

      for (const parent of parents) {
        // Compter les enfants actifs
        const { count } = await supabase
          .from('notification')
          .select('id', { count: 'exact', head: true })
          .eq('parent_id', parent.id)
          .eq('is_read', false)
          .neq('status', 'replaced');

        // Si aucun enfant actif, supprimer le parent
        if (count === 0) {
          await supabase
            .from('notification')
            .update({
              status: 'archived',
              is_read: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', parent.id);

          console.log(`✅ [Aggregation Client] Parent orphelin archivé: ${parent.id}`);
        }
      }

      console.log('✅ [Aggregation Client] Nettoyage terminé');
    } catch (error) {
      console.error('❌ [Aggregation Client] Erreur lors du nettoyage:', error);
    }
  }

  /**
   * Recalculer tous les parents pour tous les clients
   */
  static async recalculateAllParents(): Promise<void> {
    try {
      console.log('🔄 [Aggregation Client] Recalcul de tous les parents...');

      // Récupérer tous les clients actifs avec auth_user_id
      const { data: clients } = await supabase
        .from('Client')
        .select('auth_user_id')
        .eq('is_active', true)
        .not('auth_user_id', 'is', null);

      if (!clients || clients.length === 0) return;

      for (const client of clients) {
        if (client.auth_user_id) {
          await this.aggregateNotificationsByDossier(client.auth_user_id);
        }
      }

      // Nettoyer les orphelins
      await this.cleanupOrphanParents();

      console.log('✅ [Aggregation Client] Recalcul terminé pour tous les clients');
    } catch (error) {
      console.error('❌ [Aggregation Client] Erreur lors du recalcul:', error);
    }
  }
}

