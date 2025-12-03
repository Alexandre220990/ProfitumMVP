/**
 * Service d'agrégation de notifications par PROSPECT/CLIENT pour les APPORTEURS
 * Système parent/enfant pour grouper les notifications par prospect apporté
 * 
 * Architecture :
 * - 1 notification PARENT par prospect/client avec actions en attente
 * - N notifications ENFANTS avec détails individuels (masquées par défaut)
 * - Recalcul automatique des parents quand enfants changent
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface ProspectPendingActions {
  prospect_id: string;
  prospect_name: string;
  prospect_company: string;
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

export class NotificationAggregationServiceApporteur {
  /**
   * Agréger les notifications par prospect/client et créer des parents
   * À exécuter après création de notifications enfants pour un apporteur
   */
  static async aggregateNotificationsByProspect(apporteurUserId: string): Promise<void> {
    try {
      console.log(`📊 [Aggregation Apporteur] Début agrégation notifications pour apporteur ${apporteurUserId}`);

      // 1. Récupérer toutes les notifications enfants non agrégées pour cet apporteur
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
        .eq('user_id', apporteurUserId)
        .eq('user_type', 'apporteur')
        .in('notification_type', [
          // Notifications prospects/clients
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
          // Notifications générales d'activité
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

      if (childError) {
        console.error('❌ [Aggregation Apporteur] Erreur récupération notifications enfants:', childError);
        return;
      }

      if (!childNotifications || childNotifications.length === 0) {
        console.log('ℹ️  [Aggregation Apporteur] Aucune notification à agréger');
        return;
      }

      console.log(`📊 [Aggregation Apporteur] ${childNotifications.length} notification(s) trouvée(s)`);

      // 2. Grouper par prospect_id / client_id
      const groupedByProspect = this.groupNotificationsByProspect(childNotifications);

      console.log(`📊 [Aggregation Apporteur] ${Object.keys(groupedByProspect).length} prospect(s) avec actions`);

      // 3. Pour chaque prospect, créer ou mettre à jour la notification parent
      for (const [prospectId, actions] of Object.entries(groupedByProspect)) {
        await this.createOrUpdateParentNotification(apporteurUserId, prospectId, actions);
      }

      console.log('✅ [Aggregation Apporteur] Agrégation terminée avec succès');
    } catch (error) {
      console.error('❌ [Aggregation Apporteur] Erreur lors de l\'agrégation:', error);
    }
  }

  /**
   * Grouper les notifications par prospect_id / client_id
   */
  private static groupNotificationsByProspect(notifications: any[]): Record<string, ProspectPendingActions> {
    const grouped: Record<string, ProspectPendingActions> = {};

    for (const notif of notifications) {
      const prospectId = notif.action_data?.prospect_id || notif.action_data?.client_id || notif.metadata?.prospect_id || notif.metadata?.client_id;
      const prospectName = notif.action_data?.prospect_name || notif.action_data?.client_name || notif.metadata?.name || 'Prospect';
      const prospectCompany = notif.action_data?.prospect_company || notif.action_data?.company_name || notif.metadata?.company || prospectName;

      if (!prospectId) continue;

      if (!grouped[prospectId]) {
        grouped[prospectId] = {
          prospect_id: prospectId,
          prospect_name: prospectName,
          prospect_company: prospectCompany,
          notifications: [],
          most_urgent_days: 0,
          highest_priority: 'low'
        };
      }

      // Calculer les jours d'attente
      const createdAt = new Date(notif.created_at);
      const now = new Date();
      const daysWaiting = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      grouped[prospectId].notifications.push({
        notification_id: notif.id,
        notification_type: notif.notification_type,
        priority: notif.priority,
        created_at: notif.created_at,
        days_waiting: daysWaiting,
        title: notif.title,
        message: notif.message
      });

      // Mettre à jour l'urgence maximale
      if (daysWaiting > grouped[prospectId].most_urgent_days) {
        grouped[prospectId].most_urgent_days = daysWaiting;
      }

      // Mettre à jour la priorité la plus élevée
      const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
      if (priorityOrder[notif.priority as keyof typeof priorityOrder] > priorityOrder[grouped[prospectId].highest_priority]) {
        grouped[prospectId].highest_priority = notif.priority;
      }
    }

    return grouped;
  }

  /**
   * Créer ou mettre à jour la notification parent pour un prospect
   */
  private static async createOrUpdateParentNotification(
    apporteurUserId: string,
    prospectId: string,
    actions: ProspectPendingActions
  ): Promise<void> {
    try {
      // 1. Vérifier si une notification parent existe déjà
      const { data: existingParent } = await supabase
        .from('notification')
        .select('id, metadata')
        .eq('user_id', apporteurUserId)
        .eq('notification_type', 'apporteur_prospect_actions_summary')
        .eq('metadata->>prospect_id', prospectId)
        .eq('is_read', false)
        .neq('status', 'replaced')
        .maybeSingle();

      const actionsCount = actions.notifications.length;
      const actionsSummary = actions.notifications
        .slice(0, 3)
        .map(n => this.getActionLabel(n.notification_type))
        .join(', ');
      const moreCount = actionsCount > 3 ? ` +${actionsCount - 3} autre(s)` : '';

      const title = `📋 ${actions.prospect_company} - ${actionsCount} action${actionsCount > 1 ? 's' : ''}`;
      const message = `${actionsSummary}${moreCount}`;

      // Badge basé sur le plus urgent
      let badge = '📋';
      if (actions.most_urgent_days >= 5) badge = '🚨';
      else if (actions.most_urgent_days >= 2) badge = '⚠️';

      const parentData = {
        user_id: apporteurUserId,
        user_type: 'apporteur',
        title: `${badge} ${title}`,
        message: message,
        notification_type: 'apporteur_prospect_actions_summary',
        priority: actions.highest_priority,
        is_read: false,
        status: 'unread',
        is_parent: true,
        children_count: actionsCount,
        action_url: `/apporteur/prospects/${prospectId}`,
        action_data: {
          prospect_id: prospectId,
          prospect_name: actions.prospect_name,
          prospect_company: actions.prospect_company,
          pending_actions_count: actionsCount,
          most_urgent_days: actions.most_urgent_days,
          actions_summary: actions.notifications.map(n => ({
            notification_type: n.notification_type,
            days_waiting: n.days_waiting,
            priority: n.priority
          }))
        },
        metadata: {
          prospect_id: prospectId,
          grouped_by: 'prospect',
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
          console.error(`❌ [Aggregation Apporteur] Erreur mise à jour parent pour prospect ${prospectId}:`, updateError);
        } else {
          console.log(`✅ [Aggregation Apporteur] Parent mis à jour pour prospect ${actions.prospect_company} (${actionsCount} actions)`);
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
          console.error(`❌ [Aggregation Apporteur] Erreur création parent pour prospect ${prospectId}:`, createError);
        } else {
          console.log(`✅ [Aggregation Apporteur] Parent créé pour prospect ${actions.prospect_company} (${actionsCount} actions)`);

          // Lier les notifications enfants à cette parent
          await this.linkChildrenToParent(apporteurUserId, prospectId, newParent.id);
        }
      }
    } catch (error) {
      console.error(`❌ [Aggregation Apporteur] Erreur pour prospect ${prospectId}:`, error);
    }
  }

  /**
   * Obtenir un label court pour un type de notification
   */
  private static getActionLabel(notificationType: string): string {
    const labels: Record<string, string> = {
      'apporteur_nouveau_prospect': 'Nouveau prospect',
      'apporteur_prospect_qualifie': 'Prospect qualifié',
      'apporteur_prospect_converti': 'Converti en client',
      'apporteur_commission_calculee': 'Commission calculée',
      'apporteur_commission_payee': 'Commission payée',
      'apporteur_expert_assigne': 'Expert assigné',
      'apporteur_rdv_confirme': 'RDV confirmé',
      'apporteur_rdv_programme': 'RDV programmé',
      'apporteur_rappel_suivi': 'Rappel suivi',
      'nouveau_prospect': 'Nouveau prospect',
      'commission_payee': 'Commission payée',
      'commission_calculee': 'Commission calculée',
      'rdv_confirme': 'RDV confirmé',
      'expert_assigne': 'Expert assigné',
      'lead_to_treat': 'Lead à traiter',
      'contact_message': 'Message contact'
    };
    return labels[notificationType] || 'Notification';
  }

  /**
   * Lier les notifications enfants à leur parent
   */
  private static async linkChildrenToParent(
    apporteurUserId: string,
    prospectId: string,
    parentId: string
  ): Promise<void> {
    try {
      // Récupérer toutes les notifications enfants pour ce prospect
      const { data: children } = await supabase
        .from('notification')
        .select('id')
        .eq('user_id', apporteurUserId)
        .is('parent_id', null)
        .or(`action_data->>prospect_id.eq.${prospectId},action_data->>client_id.eq.${prospectId},metadata->>prospect_id.eq.${prospectId},metadata->>client_id.eq.${prospectId}`);

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
        console.error(`❌ [Aggregation Apporteur] Erreur liaison enfants au parent:`, linkError);
      } else {
        console.log(`✅ [Aggregation Apporteur] ${children.length} enfant(s) lié(s) au parent`);
      }
    } catch (error) {
      console.error('❌ [Aggregation Apporteur] Erreur lors de la liaison enfants:', error);
    }
  }

  /**
   * Nettoyer les notifications parent orphelines (sans enfants)
   */
  static async cleanupOrphanParents(): Promise<void> {
    try {
      console.log('🧹 [Aggregation Apporteur] Nettoyage des parents orphelins...');

      // Récupérer tous les parents
      const { data: parents } = await supabase
        .from('notification')
        .select('id, metadata')
        .eq('notification_type', 'apporteur_prospect_actions_summary')
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

          console.log(`✅ [Aggregation Apporteur] Parent orphelin archivé: ${parent.id}`);
        }
      }

      console.log('✅ [Aggregation Apporteur] Nettoyage terminé');
    } catch (error) {
      console.error('❌ [Aggregation Apporteur] Erreur lors du nettoyage:', error);
    }
  }

  /**
   * Recalculer tous les parents pour tous les apporteurs
   */
  static async recalculateAllParents(): Promise<void> {
    try {
      console.log('🔄 [Aggregation Apporteur] Recalcul de tous les parents...');

      // Récupérer tous les apporteurs actifs
      const { data: apporteurs } = await supabase
        .from('ApporteurAffaires')
        .select('auth_user_id')
        .eq('status', 'active')
        .not('auth_user_id', 'is', null);

      if (!apporteurs || apporteurs.length === 0) return;

      for (const apporteur of apporteurs) {
        if (apporteur.auth_user_id) {
          await this.aggregateNotificationsByProspect(apporteur.auth_user_id);
        }
      }

      // Nettoyer les orphelins
      await this.cleanupOrphanParents();

      console.log('✅ [Aggregation Apporteur] Recalcul terminé pour tous les apporteurs');
    } catch (error) {
      console.error('❌ [Aggregation Apporteur] Erreur lors du recalcul:', error);
    }
  }
}

