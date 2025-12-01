import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { DossierTimelineService } from './dossier-timeline-service';
import { EmailService } from './EmailService';
import { SecureLinkService } from './secure-link-service';
import { NotificationPreferencesChecker } from './notification-preferences-checker';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Service de relance automatique basé sur les actionType et SLA
 * 
 * Vérifie quotidiennement les dossiers avec des actions en attente
 * et envoie des relances selon les seuils SLA définis
 */

interface ReminderConfig {
  days: number;
  type: 'reminder' | 'reminder_escalated' | 'reminder_critical' | 'reminder_escalation_max';
  priority: 'low' | 'medium' | 'high' | 'critical';
  notifyExpert: boolean;
  notifyClient: boolean;
  notifyAdmin: boolean;
  messageTemplate: string;
}

interface ActionTypeSLA {
  actionType: string;
  slaTarget: number;
  slaAcceptable: number;
  slaCritical: number;
  reminders: ReminderConfig[];
}

// Configuration des SLA par actionType
const ACTION_TYPE_SLA_CONFIG: Record<string, ActionTypeSLA> = {
  expert_pending_acceptance: {
    actionType: 'expert_pending_acceptance',
    slaTarget: 1, // 24h
    slaAcceptable: 2, // 48h
    slaCritical: 3, // 72h
    reminders: [
      {
        days: 1,
        type: 'reminder',
        priority: 'high',
        notifyExpert: true,
        notifyClient: false,
        notifyAdmin: false,
        messageTemplate: 'Vous avez un nouveau dossier à accepter ou refuser depuis 24h'
      },
      {
        days: 2,
        type: 'reminder_escalated',
        priority: 'high',
        notifyExpert: true,
        notifyClient: false,
        notifyAdmin: true,
        messageTemplate: 'Dossier en attente depuis 2 jours - Action requise'
      },
      {
        days: 3,
        type: 'reminder_critical',
        priority: 'critical',
        notifyExpert: true,
        notifyClient: false,
        notifyAdmin: true,
        messageTemplate: 'Dossier en attente depuis 3 jours - Action urgente requise'
      }
    ]
  },
  documents_pending_validation: {
    actionType: 'documents_pending_validation',
    slaTarget: 2, // 48h
    slaAcceptable: 5, // 5 jours
    slaCritical: 7, // 7 jours
    reminders: [
      {
        days: 2,
        type: 'reminder',
        priority: 'medium',
        notifyExpert: true,
        notifyClient: false,
        notifyAdmin: false,
        messageTemplate: '{count} document(s) en attente de validation depuis 2 jours'
      },
      {
        days: 5,
        type: 'reminder_escalated',
        priority: 'high',
        notifyExpert: true,
        notifyClient: true,
        notifyAdmin: false,
        messageTemplate: '{count} document(s) en attente de validation depuis 5 jours - Action requise'
      },
      {
        days: 7,
        type: 'reminder_critical',
        priority: 'critical',
        notifyExpert: true,
        notifyClient: true,
        notifyAdmin: true,
        messageTemplate: '{count} document(s) en attente de validation depuis 7 jours - Action urgente'
      }
    ]
  },
  client_no_response_critical: {
    actionType: 'client_no_response_critical',
    slaTarget: 0,
    slaAcceptable: 0,
    slaCritical: 15,
    reminders: [
      {
        days: 15,
        type: 'reminder_critical',
        priority: 'critical',
        notifyExpert: true,
        notifyClient: false,
        notifyAdmin: true,
        messageTemplate: 'Client sans réponse depuis 15 jours - Risque d\'abandon'
      },
      {
        days: 20,
        type: 'reminder_escalation_max',
        priority: 'critical',
        notifyExpert: true,
        notifyClient: false,
        notifyAdmin: true,
        messageTemplate: 'Client sans réponse depuis 20 jours - Décision requise'
      }
    ]
  },
  audit_to_complete: {
    actionType: 'audit_to_complete',
    slaTarget: 7,
    slaAcceptable: 14,
    slaCritical: 21,
    reminders: [
      {
        days: 7,
        type: 'reminder',
        priority: 'medium',
        notifyExpert: true,
        notifyClient: false,
        notifyAdmin: false,
        messageTemplate: 'Audit technique en cours depuis 7 jours'
      },
      {
        days: 14,
        type: 'reminder_escalated',
        priority: 'high',
        notifyExpert: true,
        notifyClient: true,
        notifyAdmin: false,
        messageTemplate: 'Audit technique en cours depuis 14 jours - Finalisation requise'
      },
      {
        days: 21,
        type: 'reminder_critical',
        priority: 'critical',
        notifyExpert: true,
        notifyClient: false,
        notifyAdmin: true,
        messageTemplate: 'Audit technique en cours depuis 21 jours - Action urgente'
      }
    ]
  },
  documents_requested: {
    actionType: 'documents_requested',
    slaTarget: 5,
    slaAcceptable: 10,
    slaCritical: 15,
    reminders: [
      {
        days: 5,
        type: 'reminder',
        priority: 'medium',
        notifyExpert: false,
        notifyClient: true,
        notifyAdmin: false,
        messageTemplate: 'Rappel : Documents complémentaires demandés il y a 5 jours'
      },
      {
        days: 10,
        type: 'reminder_escalated',
        priority: 'high',
        notifyExpert: true,
        notifyClient: true,
        notifyAdmin: false,
        messageTemplate: 'Relance : Documents complémentaires demandés il y a 10 jours'
      },
      {
        days: 15,
        type: 'reminder_critical',
        priority: 'critical',
        notifyExpert: true,
        notifyClient: true,
        notifyAdmin: true,
        messageTemplate: 'Dernière relance : Documents complémentaires demandés il y a 15 jours. Si pas de retour dans 5 jours, l\'expert se réserve le droit d\'annuler la collaboration.'
      }
    ]
  },
  relance_needed: {
    actionType: 'relance_needed',
    slaTarget: 7,
    slaAcceptable: 10,
    slaCritical: 14,
    reminders: [
      {
        days: 7,
        type: 'reminder',
        priority: 'medium',
        notifyExpert: true,
        notifyClient: false,
        notifyAdmin: false,
        messageTemplate: 'Aucun contact depuis 7 jours - Relance suggérée'
      },
      {
        days: 10,
        type: 'reminder_escalated',
        priority: 'high',
        notifyExpert: true,
        notifyClient: false,
        notifyAdmin: false,
        messageTemplate: 'Aucun contact depuis 10 jours - Relance recommandée'
      },
      {
        days: 14,
        type: 'reminder_critical',
        priority: 'high',
        notifyExpert: true,
        notifyClient: false,
        notifyAdmin: false,
        messageTemplate: 'Aucun contact depuis 14 jours - Relance urgente requise'
      }
    ]
  },
  complementary_docs_received: {
    actionType: 'complementary_docs_received',
    slaTarget: 1, // 24h
    slaAcceptable: 2, // 48h
    slaCritical: 3, // 72h
    reminders: [
      {
        days: 1,
        type: 'reminder',
        priority: 'low',
        notifyExpert: true,
        notifyClient: false,
        notifyAdmin: false,
        messageTemplate: 'Documents complémentaires reçus il y a 24h - À examiner'
      },
      {
        days: 2,
        type: 'reminder',
        priority: 'medium',
        notifyExpert: true,
        notifyClient: false,
        notifyAdmin: false,
        messageTemplate: 'Documents complémentaires reçus il y a 48h - Action requise'
      },
      {
        days: 3,
        type: 'reminder_escalated',
        priority: 'high',
        notifyExpert: true,
        notifyClient: false,
        notifyAdmin: false,
        messageTemplate: 'Documents complémentaires reçus il y a 3 jours - Examen requis'
      }
    ]
  },
  validation_final_pending: {
    actionType: 'validation_final_pending',
    slaTarget: 3,
    slaAcceptable: 7,
    slaCritical: 10,
    reminders: [
      {
        days: 3,
        type: 'reminder',
        priority: 'medium',
        notifyExpert: true,
        notifyClient: false,
        notifyAdmin: false,
        messageTemplate: 'Validation finale en attente depuis 3 jours'
      },
      {
        days: 7,
        type: 'reminder_escalated',
        priority: 'high',
        notifyExpert: true,
        notifyClient: true,
        notifyAdmin: false,
        messageTemplate: 'Validation finale en attente depuis 7 jours - Finalisation requise'
      },
      {
        days: 10,
        type: 'reminder_critical',
        priority: 'critical',
        notifyExpert: true,
        notifyClient: false,
        notifyAdmin: false,
        messageTemplate: 'Validation finale en attente depuis 10 jours - Action urgente'
      }
    ]
  },
  first_review_needed: {
    actionType: 'first_review_needed',
    slaTarget: 1, // 24h
    slaAcceptable: 2, // 48h
    slaCritical: 3, // 72h
    reminders: [
      {
        days: 1,
        type: 'reminder',
        priority: 'low',
        notifyExpert: true,
        notifyClient: false,
        notifyAdmin: false,
        messageTemplate: 'Nouveau dossier assigné - Première revue suggérée'
      },
      {
        days: 2,
        type: 'reminder',
        priority: 'medium',
        notifyExpert: true,
        notifyClient: false,
        notifyAdmin: false,
        messageTemplate: 'Nouveau dossier assigné depuis 2 jours - Première revue recommandée'
      },
      {
        days: 3,
        type: 'reminder_escalated',
        priority: 'high',
        notifyExpert: true,
        notifyClient: false,
        notifyAdmin: false,
        messageTemplate: 'Nouveau dossier assigné depuis 3 jours - Première revue requise'
      }
    ]
  }
};

export class ActionTypeReminderService {
  /**
   * Génère le type de notification selon l'actionType et le type de rappel
   * Format: {actionType}_{reminderLevel}
   */
  private static getNotificationType(actionType: string, reminderType: string): string {
    const suffixMap: Record<string, string> = {
      'reminder': 'reminder',
      'reminder_escalated': 'escalated',
      'reminder_critical': 'critical',
      'reminder_escalation_max': 'critical'
    };
    
    const suffix = suffixMap[reminderType] || 'reminder';
    return `${actionType}_${suffix}`;
  }
  /**
   * Vérifier et envoyer les relances pour tous les actionType
   */
  async checkAndSendReminders(): Promise<void> {
    try {
      console.log('🔔 [ActionType Reminder] Début de la vérification des relances...');

      // Récupérer tous les dossiers actifs avec leur actionType
      const dossiers = await this.getDossiersWithActionTypes();

      let totalRemindersSent = 0;

      for (const dossier of dossiers) {
        if (!dossier.actionType || dossier.actionType === 'other') {
          continue; // Pas de relance pour 'other'
        }

        const slaConfig = ACTION_TYPE_SLA_CONFIG[dossier.actionType];
        if (!slaConfig) {
          console.warn(`⚠️ Pas de configuration SLA pour actionType: ${dossier.actionType}`);
          continue;
        }

        // Calculer les jours depuis la dernière action
        const daysSinceAction = this.calculateDaysSinceAction(dossier);

        // Vérifier chaque seuil de relance
        for (const reminderConfig of slaConfig.reminders) {
          if (daysSinceAction === reminderConfig.days) {
            const alreadySent = await this.checkReminderAlreadySent(
              dossier.id,
              dossier.actionType,
              reminderConfig.days
            );

            if (!alreadySent) {
              await this.sendReminder(dossier, reminderConfig, daysSinceAction);
              totalRemindersSent++;
            }
          }
        }
      }

      console.log(`✅ [ActionType Reminder] Vérification terminée - ${totalRemindersSent} relance(s) envoyée(s)`);
    } catch (error) {
      console.error('❌ [ActionType Reminder] Erreur lors de la vérification:', error);
    }
  }

  /**
   * Récupérer tous les dossiers actifs avec leur actionType calculé
   */
  private async getDossiersWithActionTypes(): Promise<any[]> {
    // Récupérer les dossiers actifs
    const { data: dossiers, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        "clientId",
        "produitId",
        expert_id,
        statut,
        metadata,
        updated_at,
        created_at,
        Client:"clientId" (
          id,
          email,
          company_name,
          name
        ),
        Expert:expert_id (
          id,
          name,
          auth_user_id
        ),
        ProduitEligible:"produitId" (
          nom
        )
      `)
      .in('statut', [
        'eligible',
        'admin_validated',
        'expert_assigned',
        'expert_pending_acceptance',
        'documents_requested',
        'documents_completes',
        'audit_en_cours',
        'audit_in_progress',
        'validation_pending',
        'validated',
        'en_cours'
      ])
      .not('expert_id', 'is', null); // Seulement les dossiers avec expert assigné

    if (error) {
      console.error('❌ Erreur récupération dossiers:', error);
      return [];
    }

    // Enrichir avec les actionType et données nécessaires
    const enrichedDossiers = await Promise.all(
      (dossiers || []).map(async (dossier: any) => {
        const actionType = await this.determineActionType(dossier);
        return {
          ...dossier,
          actionType,
          // Données supplémentaires pour les relances
          pendingDocumentsCount: await this.getPendingDocumentsCount(dossier.id),
          daysWaitingDocuments: await this.getDaysWaitingDocuments(dossier.id),
          lastContactDate: dossier.updated_at
        };
      })
    );

    return enrichedDossiers;
  }

  /**
   * Déterminer l'actionType d'un dossier
   */
  private async determineActionType(dossier: any): Promise<string> {
    // 1. Expert pending acceptance
    if (dossier.statut === 'expert_pending_acceptance') {
      return 'expert_pending_acceptance';
    }

    // 2. Documents pending validation
    const pendingDocsCount = await this.getPendingDocumentsCount(dossier.id);
    if (pendingDocsCount > 0) {
      return 'documents_pending_validation';
    }

    // 3. Documents requested
    const daysWaiting = await this.getDaysWaitingDocuments(dossier.id);
    if (daysWaiting !== null && daysWaiting > 0) {
      return 'documents_requested';
    }

    // 4. Client no response critical
    const daysSinceContact = this.calculateDaysSince(dossier.updated_at);
    if (daysSinceContact >= 15) {
      return 'client_no_response_critical';
    }

    // 5. Audit to complete
    if (dossier.statut === 'audit_en_cours' || dossier.statut === 'audit_in_progress') {
      return 'audit_to_complete';
    }

    // 6. Relance needed
    if (daysSinceContact > 7) {
      return 'relance_needed';
    }

    // 7. Validation final pending
    if (dossier.statut === 'documents_completes' || dossier.statut === 'validation_pending') {
      return 'validation_final_pending';
    }

    // 8. First review needed
    if (dossier.statut === 'expert_assigned') {
      const daysSinceAssignment = this.calculateDaysSince(dossier.created_at);
      if (daysSinceAssignment <= 3) {
        return 'first_review_needed';
      }
    }

    // 9. Complementary docs received (à implémenter si nécessaire)
    // Vérifier si des documents complémentaires ont été reçus récemment

    return 'other';
  }

  /**
   * Compter les documents en attente de validation
   */
  private async getPendingDocumentsCount(dossierId: string): Promise<number> {
    const { data: docs, error } = await supabase
      .from('ClientProcessDocument')
      .select('id, validation_status, status')
      .eq('client_produit_id', dossierId);

    if (error || !docs) return 0;

    return docs.filter((doc: any) => {
      const validationStatus = doc.validation_status;
      const status = doc.status;
      return (
        (validationStatus === 'pending' || validationStatus === null) &&
        status !== 'rejected' &&
        validationStatus !== 'validated'
      );
    }).length;
  }

  /**
   * Calculer les jours d'attente de documents
   */
  private async getDaysWaitingDocuments(dossierId: string): Promise<number | null> {
    const { data: request, error } = await supabase
      .from('document_request')
      .select('created_at, status')
      .eq('dossier_id', dossierId)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !request) return null;

    return this.calculateDaysSince(request.created_at);
  }

  /**
   * Calculer les jours depuis une date
   */
  private calculateDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculer les jours depuis la dernière action selon l'actionType
   */
  private calculateDaysSinceAction(dossier: any): number {
    switch (dossier.actionType) {
      case 'expert_pending_acceptance':
        // Depuis l'assignation
        return this.calculateDaysSince(dossier.created_at);
      
      case 'documents_pending_validation':
        // Depuis la réception des documents (dernier document uploadé)
        return this.calculateDaysSince(dossier.lastContactDate);
      
      case 'documents_requested':
        // Depuis la demande de documents
        return dossier.daysWaitingDocuments || 0;
      
      case 'client_no_response_critical':
      case 'relance_needed':
        // Depuis le dernier contact
        return this.calculateDaysSince(dossier.lastContactDate);
      
      case 'audit_to_complete':
        // Depuis le début de l'audit
        return this.calculateDaysSince(dossier.lastContactDate);
      
      case 'validation_final_pending':
        // Depuis la validation des documents
        return this.calculateDaysSince(dossier.lastContactDate);
      
      case 'first_review_needed':
        // Depuis l'assignation
        return this.calculateDaysSince(dossier.created_at);
      
      default:
        return 0;
    }
  }

  /**
   * Vérifier si une relance a déjà été envoyée
   */
  private async checkReminderAlreadySent(
    dossierId: string,
    actionType: string,
    reminderDays: number
  ): Promise<boolean> {
    const { data: dossier } = await supabase
      .from('ClientProduitEligible')
      .select('metadata')
      .eq('id', dossierId)
      .single();

    if (!dossier?.metadata) return false;

    const reminders = dossier.metadata.reminders || [];
    const reminderKey = `${actionType}_${reminderDays}`;

    return reminders.includes(reminderKey);
  }

  /**
   * Envoyer une relance
   */
  private async sendReminder(
    dossier: any,
    reminderConfig: ReminderConfig,
    daysSinceAction: number
  ): Promise<void> {
    const client = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
    const expert = Array.isArray(dossier.Expert) ? dossier.Expert[0] : dossier.Expert;
    const produit = Array.isArray(dossier.ProduitEligible) ? dossier.ProduitEligible[0] : dossier.ProduitEligible;

    const clientName = client?.company_name || client?.name || 'Client';
    const produitNom = produit?.nom || 'Dossier';

    // Personnaliser le message
    let message = reminderConfig.messageTemplate;
    if (dossier.pendingDocumentsCount) {
      message = message.replace('{count}', dossier.pendingDocumentsCount.toString());
    }

    // Envoyer à l'expert si nécessaire
    if (reminderConfig.notifyExpert && expert?.auth_user_id) {
      const notificationType = ActionTypeReminderService.getNotificationType(dossier.actionType, reminderConfig.type);
      
      // Vérifier les préférences avant d'envoyer
      const shouldSendInApp = await NotificationPreferencesChecker.shouldSendInApp(
        expert.auth_user_id,
        'expert',
        notificationType
      );

      if (shouldSendInApp) {
        await supabase.from('notification').insert({
          user_id: expert.auth_user_id,
          user_type: 'expert',
          title: `⏰ ${reminderConfig.type === 'reminder_critical' ? 'Action urgente' : 'Rappel'} - ${produitNom}`,
          message: `${message} - ${clientName}`,
          notification_type: notificationType,
          priority: reminderConfig.priority,
          is_read: false,
          action_url: `/expert/dossier/${dossier.id}`,
          action_data: {
            client_produit_id: dossier.id,
            action_type: dossier.actionType,
            days_since_action: daysSinceAction,
            reminder_type: reminderConfig.type
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else {
        console.log(`⏭️ Notification in-app non créée pour expert ${expert.auth_user_id} - préférences désactivées pour ${notificationType}`);
      }
    }

    // Envoyer au client si nécessaire
    if (reminderConfig.notifyClient && client?.id) {
      // Récupérer l'auth_user_id du client
      const { data: clientAuth } = await supabase
        .from('Client')
        .select('auth_user_id')
        .eq('id', client.id)
        .single();

      if (clientAuth?.auth_user_id) {
        const notificationType = ActionTypeReminderService.getNotificationType(dossier.actionType, reminderConfig.type);
        
        // Vérifier les préférences avant d'envoyer
        const shouldSendInApp = await NotificationPreferencesChecker.shouldSendInApp(
          clientAuth.auth_user_id,
          'client',
          notificationType
        );

        if (shouldSendInApp) {
          await supabase.from('notification').insert({
            user_id: clientAuth.auth_user_id,
            user_type: 'client',
            title: `ℹ️ Information - ${produitNom}`,
            message: message,
            notification_type: notificationType,
            priority: reminderConfig.priority === 'critical' ? 'high' : 'medium',
            is_read: false,
            action_url: `/produits/${dossier.ProduitEligible?.id || dossier.produitId}/${dossier.id}`,
            action_data: {
              client_produit_id: dossier.id,
              action_type: dossier.actionType,
              days_since_action: daysSinceAction
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        } else {
          console.log(`⏭️ Notification in-app non créée pour client ${clientAuth.auth_user_id} - préférences désactivées pour ${notificationType}`);
        }
      }
    }

    // Envoyer à l'admin si nécessaire
    if (reminderConfig.notifyAdmin) {
      // Récupérer tous les admins actifs avec leurs emails
      const { data: admins } = await supabase
        .from('Admin')
        .select('auth_user_id, email, name')
        .eq('is_active', true)
        .not('auth_user_id', 'is', null);

      if (admins) {
        // Générer le type de notification selon l'actionType et le type de rappel
        const notificationType = ActionTypeReminderService.getNotificationType(dossier.actionType, reminderConfig.type);
        
        // Déterminer le niveau SLA selon la priorité
        const slaLevel = reminderConfig.priority === 'critical' ? 'critical' 
          : reminderConfig.priority === 'high' ? 'acceptable' : 'target';

        for (const admin of admins) {
          if (admin.auth_user_id) {
            // Vérifier les préférences avant d'envoyer
            const shouldSendInApp = await NotificationPreferencesChecker.shouldSendInApp(
              admin.auth_user_id,
              'admin',
              notificationType
            );

            const shouldSendEmail = await NotificationPreferencesChecker.shouldSendEmail(
              admin.auth_user_id,
              'admin',
              notificationType,
              slaLevel
            );

            // Créer la notification in-app si autorisée
            if (shouldSendInApp) {
              await supabase.from('notification').insert({
                user_id: admin.auth_user_id,
                user_type: 'admin',
                title: `⚠️ Escalade - ${produitNom}`,
                message: `${message} - Client: ${clientName}, Expert: ${expert?.name || 'N/A'}`,
                notification_type: notificationType,
                priority: reminderConfig.priority,
                is_read: false,
                action_url: `/admin/dossiers/${dossier.id}`,
                action_data: {
                  client_produit_id: dossier.id,
                  action_type: dossier.actionType,
                  days_since_action: daysSinceAction,
                  escalation: true
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            } else {
              console.log(`⏭️ Notification in-app non créée pour ${admin.email} - préférences désactivées pour ${notificationType}`);
            }

            // Envoyer l'email à l'admin si autorisé
            if (admin.email && !admin.email.includes('@profitum.temp') && !admin.email.includes('temp_')) {
              if (!shouldSendEmail) {
                console.log(`⏭️ Email non envoyé à ${admin.email} - préférences utilisateur désactivées pour ${notificationType}`);
                continue;
              }

              try {
                const { subject, html, text } = this.generateActionReminderEmailTemplate(
                  dossier,
                  reminderConfig,
                  daysSinceAction,
                  clientName,
                  expert?.name || 'N/A',
                  produitNom,
                  admin.name || 'Administrateur'
                );

                await EmailService.sendDailyReportEmail(admin.email, subject, html, text);
                console.log(`✅ Email action reminder envoyé à ${admin.email} pour dossier ${dossier.id}`);
              } catch (error) {
                console.error(`❌ Erreur envoi email action reminder à ${admin.email}:`, error);
              }
            }
          }
        }
      }
    }

    // Marquer la relance comme envoyée dans les métadonnées
    await this.markReminderSent(dossier.id, dossier.actionType, reminderConfig.days);

    // Déterminer le type de relance pour la timeline
    let typeRelance: 'relance_1' | 'relance_2' | 'relance_3' | 'relance_critical' = 'relance_1';
    if (reminderConfig.type === 'reminder_critical' || reminderConfig.type === 'reminder_escalation_max') {
      typeRelance = 'relance_critical';
    } else if (daysSinceAction >= 15) {
      typeRelance = 'relance_3';
    } else if (daysSinceAction >= 10) {
      typeRelance = 'relance_2';
    } else if (daysSinceAction >= 5) {
      typeRelance = 'relance_1';
    }

    // Créer un événement dans la timeline
    try {
      await DossierTimelineService.relanceSystemeEnvoyee({
        dossier_id: dossier.id,
        type_relance: typeRelance,
        action_type: dossier.actionType,
        jours_attente: daysSinceAction,
        message: message,
        produit_nom: produitNom,
        client_nom: clientName
      });
    } catch (error) {
      console.error('❌ Erreur création événement timeline relance:', error);
      // Ne pas faire échouer la relance si l'événement timeline échoue
    }

    console.log(`✅ Relance envoyée pour dossier ${dossier.id} (${dossier.actionType}, J+${daysSinceAction})`);
  }

  /**
   * Génère le template email pour les rappels d'actions à effectuer
   */
  private generateActionReminderEmailTemplate(
    dossier: any,
    reminderConfig: ReminderConfig,
    daysSinceAction: number,
    clientName: string,
    expertName: string,
    produitNom: string,
    adminName: string
  ): { subject: string; html: string; text: string } {
    // Déterminer le niveau d'urgence et les couleurs
    let urgencyColor: string;
    let urgencyBg: string;
    let icon: string;
    
    if (reminderConfig.priority === 'critical' || reminderConfig.type === 'reminder_critical' || reminderConfig.type === 'reminder_escalation_max') {
      urgencyColor = '#dc2626';
      urgencyBg = '#fef2f2';
      icon = '🚨';
    } else if (reminderConfig.priority === 'high' || reminderConfig.type === 'reminder_escalated') {
      urgencyColor = '#f59e0b';
      urgencyBg = '#fffbeb';
      icon = '⚠️';
    } else {
      urgencyColor = '#3b82f6';
      urgencyBg = '#eff6ff';
      icon = '📋';
    }

    const actionTypeLabels: Record<string, string> = {
      expert_pending_acceptance: 'Acceptation expert en attente',
      client_documents_pending: 'Documents client en attente',
      expert_analysis_pending: 'Analyse expert en attente',
      refund_request_pending: 'Demande de remboursement en attente',
      other: 'Action en attente'
    };

    const actionLabel = actionTypeLabels[dossier.actionType] || 'Action en attente';

    const subject = reminderConfig.priority === 'critical' 
      ? `${icon} URGENT : ${actionLabel} - ${produitNom} (J+${daysSinceAction})`
      : reminderConfig.priority === 'high'
      ? `${icon} ${actionLabel} - ${produitNom} (J+${daysSinceAction})`
      : `${icon} Rappel : ${actionLabel} - ${produitNom}`;

    const actionPath = `/admin/dossiers/${dossier.id}`;
    const actionLink = SecureLinkService.generateSmartLinkHTML(
      'Voir et traiter le dossier',
      actionPath,
      undefined,
      'admin',
      'cta-button'
    );
    
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f3f4f6;
      padding: 0;
      margin: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, ${urgencyColor} 0%, ${this.darkenColor(urgencyColor, 20)} 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .header-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .header-subtitle {
      font-size: 16px;
      opacity: 0.95;
      font-weight: 400;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 24px;
      font-weight: 500;
    }
    .alert-box {
      background: ${urgencyBg};
      border-left: 4px solid ${urgencyColor};
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .alert-title {
      font-size: 16px;
      font-weight: 600;
      color: ${urgencyColor};
      margin-bottom: 8px;
    }
    .alert-text {
      font-size: 14px;
      color: #4b5563;
      line-height: 1.6;
    }
    .info-card {
      background: #f9fafb;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
    }
    .info-row {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #6b7280;
      width: 140px;
      font-size: 14px;
    }
    .info-value {
      color: #1f2937;
      font-size: 14px;
      flex: 1;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin: 32px 0;
      text-align: center;
      box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
    }
    .cta-container {
      text-align: center;
    }
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.6;
    }
    .footer-link {
      color: ${urgencyColor};
      text-decoration: none;
    }
    .time-badge {
      display: inline-block;
      background: ${urgencyColor};
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 8px;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      .content {
        padding: 30px 20px;
      }
      .info-row {
        flex-direction: column;
      }
      .info-label {
        width: 100%;
        margin-bottom: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="header-icon">${icon}</div>
      <div class="header-title">Action à effectuer</div>
      <div class="header-subtitle">Délai écoulé : ${daysSinceAction} jour${daysSinceAction > 1 ? 's' : ''}</div>
    </div>
    
    <div class="content">
      <div class="greeting">
        Bonjour ${adminName || 'Administrateur'},
      </div>
      
      <div class="alert-box">
        <div class="alert-title">
          ${reminderConfig.priority === 'critical' ? 'Action urgente requise' : reminderConfig.priority === 'high' ? 'Action importante requise' : 'Rappel d\'action'}
        </div>
        <div class="alert-text">
          Une action nécessite votre attention depuis ${daysSinceAction} jour${daysSinceAction > 1 ? 's' : ''}.
          ${reminderConfig.priority === 'critical' ? ' Cette action dépasse le délai critique et nécessite un traitement immédiat.' : ''}
        </div>
      </div>
      
      <div class="info-card">
        <div class="info-row">
          <div class="info-label">Type d'action</div>
          <div class="info-value">${actionLabel}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Produit</div>
          <div class="info-value">${produitNom}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Client</div>
          <div class="info-value">${clientName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Expert</div>
          <div class="info-value">${expertName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Délai écoulé</div>
          <div class="info-value">
            ${daysSinceAction} jour${daysSinceAction > 1 ? 's' : ''}
            <span class="time-badge">J+${daysSinceAction}</span>
          </div>
        </div>
        <div class="info-row">
          <div class="info-label">Message</div>
          <div class="info-value">${reminderConfig.messageTemplate}</div>
        </div>
      </div>
      
      <div class="cta-container">
        ${actionLink}
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-text">
        <p>Cet email a été envoyé automatiquement par le système de rappels Profitum.</p>
        <p style="margin-top: 12px;">
          <a href="${SecureLinkService.getPlatformUrl('admin')}" class="footer-link">Accéder à la plateforme</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
${subject}

Bonjour ${adminName || 'Administrateur'},

Une action nécessite votre attention :

Type d'action : ${actionLabel}
Produit : ${produitNom}
Client : ${clientName}
Expert : ${expertName}
Délai écoulé : ${daysSinceAction} jour${daysSinceAction > 1 ? 's' : ''} (J+${daysSinceAction})
Message : ${reminderConfig.messageTemplate}

Voir le dossier : ${process.env.FRONTEND_URL || 'https://app.profitum.fr'}${actionPath}
    `.trim();

    return { subject, html, text };
  }

  /**
   * Fonction utilitaire pour assombrir une couleur hex
   */
  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) - amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) - amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) - amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  /**
   * Marquer une relance comme envoyée
   */
  private async markReminderSent(
    dossierId: string,
    actionType: string,
    reminderDays: number
  ): Promise<void> {
    const { data: dossier } = await supabase
      .from('ClientProduitEligible')
      .select('metadata')
      .eq('id', dossierId)
      .single();

    const metadata = dossier?.metadata || {};
    const reminders = metadata.reminders || [];
    const reminderKey = `${actionType}_${reminderDays}`;

    if (!reminders.includes(reminderKey)) {
      reminders.push(reminderKey);
    }

    await supabase
      .from('ClientProduitEligible')
      .update({
        metadata: {
          ...metadata,
          reminders
        }
      })
      .eq('id', dossierId);
  }
}

