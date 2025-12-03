/**
 * Service d'agrégation de notifications par client pour les EXPERTS
 * Système parent/enfant pour grouper les notifications par client
 * 
 * Architecture :
 * - 1 notification PARENT par client avec actions en attente
 * - N notifications ENFANTS avec détails individuels (masquées par défaut)
 * - Recalcul automatique des parents quand enfants changent
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface ClientPendingActions {
  client_id: string;
  client_name: string;
  client_company: string;
  dossiers: Array<{
    dossier_id: string;
    produit_nom: string;
    notification_type: string;
    priority: string;
    created_at: string;
    days_waiting: number;
  }>;
  most_urgent_days: number;
  highest_priority: 'low' | 'medium' | 'high' | 'urgent';
}

export class NotificationAggregationServiceExpert {
  /**
   * Agréger les notifications par client et créer des parents
   * À exécuter après création de notifications enfants pour un expert
   */
  static async aggregateNotificationsByClient(expertUserId: string): Promise<void> {
    try {
      console.log(`📊 [Aggregation Expert] Début agrégation notifications pour expert ${expertUserId}`);

      // 1. Récupérer toutes les notifications enfants non agrégées pour cet expert
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
        .eq('user_id', expertUserId)
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

      if (childError) {
        console.error('❌ [Aggregation Expert] Erreur récupération notifications enfants:', childError);
        return;
      }

      if (!childNotifications || childNotifications.length === 0) {
        console.log('ℹ️  [Aggregation Expert] Aucune notification à agréger');
        return;
      }

      console.log(`📊 [Aggregation Expert] ${childNotifications.length} notification(s) trouvée(s)`);

      // 2. Grouper par client_id
      const groupedByClient = this.groupNotificationsByClient(childNotifications);

      console.log(`📊 [Aggregation Expert] ${Object.keys(groupedByClient).length} client(s) avec actions`);

      // 3. Pour chaque client, créer ou mettre à jour la notification parent
      for (const [clientId, actions] of Object.entries(groupedByClient)) {
        await this.createOrUpdateParentNotification(expertUserId, clientId, actions);
      }

      console.log('✅ [Aggregation Expert] Agrégation terminée avec succès');
    } catch (error) {
      console.error('❌ [Aggregation Expert] Erreur lors de l\'agrégation:', error);
    }
  }

  /**
   * Grouper les notifications par client_id
   */
  private static groupNotificationsByClient(notifications: any[]): Record<string, ClientPendingActions> {
    const grouped: Record<string, ClientPendingActions> = {};

    for (const notif of notifications) {
      const clientId = notif.action_data?.client_id || notif.metadata?.client_id;
      const clientName = notif.action_data?.client_name || notif.metadata?.client_name || 'Client';
      const clientCompany = notif.action_data?.client_company || notif.metadata?.client_company || clientName;

      if (!clientId) continue;

      if (!grouped[clientId]) {
        grouped[clientId] = {
          client_id: clientId,
          client_name: clientName,
          client_company: clientCompany,
          dossiers: [],
          most_urgent_days: 0,
          highest_priority: 'low'
        };
      }

      // Calculer les jours d'attente
      const createdAt = new Date(notif.created_at);
      const now = new Date();
      const daysWaiting = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      grouped[clientId].dossiers.push({
        dossier_id: notif.action_data?.dossier_id || notif.action_data?.client_produit_id,
        produit_nom: notif.action_data?.product_name || notif.metadata?.produit_nom || 'Dossier',
        notification_type: notif.notification_type,
        priority: notif.priority,
        created_at: notif.created_at,
        days_waiting: daysWaiting
      });

      // Mettre à jour l'urgence maximale
      if (daysWaiting > grouped[clientId].most_urgent_days) {
        grouped[clientId].most_urgent_days = daysWaiting;
      }

      // Mettre à jour la priorité la plus élevée
      const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
      if (priorityOrder[notif.priority as keyof typeof priorityOrder] > priorityOrder[grouped[clientId].highest_priority]) {
        grouped[clientId].highest_priority = notif.priority;
      }
    }

    return grouped;
  }

  /**
   * Créer ou mettre à jour la notification parent pour un client
   */
  private static async createOrUpdateParentNotification(
    expertUserId: string,
    clientId: string,
    actions: ClientPendingActions
  ): Promise<void> {
    try {
      // 1. Vérifier si une notification parent existe déjà
      const { data: existingParent } = await supabase
        .from('notification')
        .select('id, metadata')
        .eq('user_id', expertUserId)
        .eq('notification_type', 'expert_client_actions_summary')
        .eq('metadata->>client_id', clientId)
        .eq('is_read', false)
        .neq('status', 'replaced')
        .maybeSingle();

      const dossiersCount = actions.dossiers.length;
      const dossiersNames = actions.dossiers
        .slice(0, 3)
        .map(d => d.produit_nom)
        .join(', ');
      const moreCount = dossiersCount > 3 ? ` +${dossiersCount - 3} autre(s)` : '';

      const title = `📋 ${actions.client_company} - ${dossiersCount} dossier${dossiersCount > 1 ? 's' : ''}`;
      const message = `${dossiersNames}${moreCount}`;

      // Badge SLA basé sur le plus urgent
      let slaBadge = '';
      if (actions.most_urgent_days >= 5) slaBadge = '🚨';
      else if (actions.most_urgent_days >= 2) slaBadge = '⚠️';
      else if (actions.most_urgent_days >= 1) slaBadge = '📋';

      const parentData = {
        user_id: expertUserId,
        user_type: 'expert',
        title: `${slaBadge} ${title}`.trim(),
        message: message,
        notification_type: 'expert_client_actions_summary',
        priority: actions.highest_priority,
        is_read: false,
        status: 'unread',
        is_parent: true,
        children_count: dossiersCount,
        action_url: `/expert/clients/${clientId}`,
        action_data: {
          client_id: clientId,
          client_name: actions.client_name,
          client_company: actions.client_company,
          pending_actions_count: dossiersCount,
          most_urgent_days: actions.most_urgent_days,
          dossiers_summary: actions.dossiers.map(d => ({
            dossier_id: d.dossier_id,
            produit_nom: d.produit_nom,
            days_waiting: d.days_waiting,
            priority: d.priority
          }))
        },
        metadata: {
          client_id: clientId,
          grouped_by: 'client',
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
          console.error(`❌ [Aggregation Expert] Erreur mise à jour parent pour client ${clientId}:`, updateError);
        } else {
          console.log(`✅ [Aggregation Expert] Parent mis à jour pour client ${actions.client_company} (${dossiersCount} dossiers)`);
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
          console.error(`❌ [Aggregation Expert] Erreur création parent pour client ${clientId}:`, createError);
        } else {
          console.log(`✅ [Aggregation Expert] Parent créé pour client ${actions.client_company} (${dossiersCount} dossiers)`);

          // Lier les notifications enfants à cette parent
          await this.linkChildrenToParent(expertUserId, clientId, newParent.id);
        }
      }
    } catch (error) {
      console.error(`❌ [Aggregation Expert] Erreur pour client ${clientId}:`, error);
    }
  }

  /**
   * Lier les notifications enfants à leur parent
   */
  private static async linkChildrenToParent(
    expertUserId: string,
    clientId: string,
    parentId: string
  ): Promise<void> {
    try {
      // Récupérer toutes les notifications enfants pour ce client
      const { data: children } = await supabase
        .from('notification')
        .select('id')
        .eq('user_id', expertUserId)
        .eq('user_type', 'expert')
        .is('parent_id', null)
        .or(`action_data->>client_id.eq.${clientId},metadata->>client_id.eq.${clientId}`);

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
        console.error(`❌ [Aggregation Expert] Erreur liaison enfants au parent:`, linkError);
      } else {
        console.log(`✅ [Aggregation Expert] ${children.length} enfant(s) lié(s) au parent`);
      }
    } catch (error) {
      console.error('❌ [Aggregation Expert] Erreur lors de la liaison enfants:', error);
    }
  }

  /**
   * Nettoyer les notifications parent orphelines (sans enfants)
   */
  static async cleanupOrphanParents(): Promise<void> {
    try {
      console.log('🧹 [Aggregation Expert] Nettoyage des parents orphelins...');

      // Récupérer tous les parents
      const { data: parents } = await supabase
        .from('notification')
        .select('id, metadata')
        .eq('notification_type', 'expert_client_actions_summary')
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

          console.log(`✅ [Aggregation Expert] Parent orphelin archivé: ${parent.id}`);
        }
      }

      console.log('✅ [Aggregation Expert] Nettoyage terminé');
    } catch (error) {
      console.error('❌ [Aggregation Expert] Erreur lors du nettoyage:', error);
    }
  }

  /**
   * Recalculer tous les parents pour tous les experts
   */
  static async recalculateAllParents(): Promise<void> {
    try {
      console.log('🔄 [Aggregation Expert] Recalcul de tous les parents...');

      // Récupérer tous les experts actifs
      const { data: experts } = await supabase
        .from('Expert')
        .select('auth_user_id')
        .eq('is_active', true)
        .not('auth_user_id', 'is', null);

      if (!experts || experts.length === 0) return;

      for (const expert of experts) {
        await this.aggregateNotificationsByClient(expert.auth_user_id);
      }

      // Nettoyer les orphelins
      await this.cleanupOrphanParents();

      console.log('✅ [Aggregation Expert] Recalcul terminé pour tous les experts');
    } catch (error) {
      console.error('❌ [Aggregation Expert] Erreur lors du recalcul:', error);
    }
  }
}

