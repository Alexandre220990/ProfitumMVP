import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * ============================================================================
 * SERVICE CENTRALISÉ DE NOTIFICATIONS MÉTIER
 * ============================================================================
 * 
 * Ce service gère TOUTES les notifications automatiques de l'application.
 * Il est appelé par les routes lors d'événements métier importants.
 * 
 * Types de notifications :
 * - CLIENT : 5 types
 * - EXPERT : 5 types
 * - ADMIN : 8 types
 * - APPORTEUR : 6 types
 * 
 * Date: 27 Octobre 2025
 */

interface NotificationData {
  user_id: string;
  user_type: 'client' | 'expert' | 'admin' | 'apporteur';
  title: string;
  message: string;
  notification_type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  event_id?: string;
  event_title?: string;
  metadata?: any;
}

interface AdminNotificationData {
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: any;
  action_url?: string;
  action_label?: string;
}

export class NotificationTriggers {
  
  // ============================================================================
  // HELPERS PRIVÉS
  // ============================================================================
  
  /**
   * Créer une notification standard (client/expert/apporteur)
   */
  private static async createNotification(data: NotificationData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification')
        .insert({
          user_id: data.user_id,
          user_type: data.user_type,
          title: data.title,
          message: data.message,
          notification_type: data.notification_type,
          priority: data.priority,
          event_id: data.event_id,
          event_title: data.event_title,
          status: 'unread',
          is_read: false,
          metadata: data.metadata,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Erreur création notification:', error);
        return false;
      }

      console.log(`✅ Notification créée: ${data.notification_type} pour ${data.user_type} ${data.user_id}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur createNotification:', error);
      return false;
    }
  }

  /**
   * Créer une notification admin (table AdminNotification)
   */
  private static async createAdminNotification(data: AdminNotificationData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('AdminNotification')
        .insert({
          type: data.type,
          title: data.title,
          message: data.message,
          priority: data.priority,
          status: 'pending',
          metadata: data.metadata,
          action_url: data.action_url,
          action_label: data.action_label,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Erreur création notification admin:', error);
        return false;
      }

      console.log(`✅ Notification admin créée: ${data.type}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur createAdminNotification:', error);
      return false;
    }
  }

  // ============================================================================
  // NOTIFICATIONS CLIENT (5 types)
  // ============================================================================

  /**
   * CLIENT 1: Changement de statut d'un dossier
   */
  static async onDossierStatusChange(
    clientId: string,
    dossier: { id: string; nom: string; statut: string; produit?: string }
  ): Promise<boolean> {
    const statusLabels: Record<string, string> = {
      'en_cours': '🟡 En cours',
      'documents_collecte': '📄 Documents en collecte',
      'en_attente_validation': '⏳ En attente de validation',
      'valide': '✅ Validé',
      'termine': '🎉 Terminé',
      'refuse': '❌ Refusé'
    };

    const statusLabel = statusLabels[dossier.statut] || dossier.statut;
    const priority = dossier.statut === 'valide' || dossier.statut === 'termine' ? 'high' : 'normal';

    return this.createNotification({
      user_id: clientId,
      user_type: 'client',
      title: `Dossier ${dossier.nom} mis à jour`,
      message: `Le statut de votre dossier est maintenant : ${statusLabel}`,
      notification_type: 'dossier_status_change',
      priority: priority,
      event_id: dossier.id,
      event_title: dossier.nom,
      metadata: {
        dossier_id: dossier.id,
        nouveau_statut: dossier.statut,
        produit: dossier.produit
      }
    });
  }

  /**
   * CLIENT 2: Rappel de paiement
   */
  static async onPaymentReminder(
    clientId: string,
    payment: { id: string; montant: number; produit: string; echeance: string }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: clientId,
      user_type: 'client',
      title: '💳 Rappel de paiement',
      message: `Un paiement de ${payment.montant}€ pour ${payment.produit} est attendu. Échéance: ${payment.echeance}`,
      notification_type: 'payment_reminder',
      priority: 'high',
      event_id: payment.id,
      metadata: {
        montant: payment.montant,
        produit: payment.produit,
        echeance: payment.echeance
      }
    });
  }

  /**
   * CLIENT 3: Validation administrative complète
   */
  static async onValidationComplete(
    clientId: string,
    dossier: { id: string; nom: string; produit: string; montant?: number }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: clientId,
      user_type: 'client',
      title: '🎉 Validation complète !',
      message: `Votre dossier ${dossier.nom} a été validé. Le traitement peut continuer.`,
      notification_type: 'validation_complete',
      priority: 'high',
      event_id: dossier.id,
      event_title: dossier.nom,
      metadata: {
        dossier_id: dossier.id,
        produit: dossier.produit,
        montant: dossier.montant
      }
    });
  }

  /**
   * CLIENT 4: Commentaire d'un expert sur le dossier
   */
  static async onExpertComment(
    clientId: string,
    expert: { id: string; nom: string; prenom: string },
    dossier: { id: string; nom: string },
    commentaire: string
  ): Promise<boolean> {
    return this.createNotification({
      user_id: clientId,
      user_type: 'client',
      title: `💬 Commentaire de ${expert.prenom} ${expert.nom}`,
      message: commentaire.length > 100 ? commentaire.substring(0, 100) + '...' : commentaire,
      notification_type: 'expert_comment',
      priority: 'normal',
      event_id: dossier.id,
      event_title: dossier.nom,
      metadata: {
        expert_id: expert.id,
        expert_nom: `${expert.prenom} ${expert.nom}`,
        dossier_id: dossier.id,
        commentaire_complet: commentaire
      }
    });
  }

  /**
   * CLIENT 5: Deadline approche (7 jours avant)
   */
  static async onDeadlineApproaching(
    clientId: string,
    dossier: { id: string; nom: string; deadline: string; jours_restants: number }
  ): Promise<boolean> {
    const urgency = dossier.jours_restants <= 3 ? 'urgent' : 'high';
    const emoji = dossier.jours_restants <= 3 ? '🚨' : '⏰';

    return this.createNotification({
      user_id: clientId,
      user_type: 'client',
      title: `${emoji} Deadline approche`,
      message: `Plus que ${dossier.jours_restants} jour(s) pour compléter ${dossier.nom}. Deadline: ${dossier.deadline}`,
      notification_type: 'deadline_approaching',
      priority: urgency,
      event_id: dossier.id,
      event_title: dossier.nom,
      metadata: {
        dossier_id: dossier.id,
        deadline: dossier.deadline,
        jours_restants: dossier.jours_restants
      }
    });
  }

  // ============================================================================
  // NOTIFICATIONS EXPERT (5 types)
  // ============================================================================

  /**
   * EXPERT 1: Client a uploadé un document
   */
  static async onDocumentUploaded(
    expertId: string,
    client: { id: string; nom: string; prenom: string },
    document: { id: string; nom: string; type: string },
    dossier: { id: string; nom: string }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: expertId,
      user_type: 'expert',
      title: `📄 Nouveau document de ${client.prenom} ${client.nom}`,
      message: `Document "${document.nom}" uploadé pour le dossier ${dossier.nom}`,
      notification_type: 'document_uploaded',
      priority: 'normal',
      event_id: dossier.id,
      event_title: dossier.nom,
      metadata: {
        client_id: client.id,
        client_nom: `${client.prenom} ${client.nom}`,
        document_id: document.id,
        document_nom: document.nom,
        document_type: document.type,
        dossier_id: dossier.id
      }
    });
  }

  /**
   * EXPERT 2: Rappel mission urgente
   */
  static async onAssignmentReminder(
    expertId: string,
    dossier: { id: string; nom: string; client_nom: string; jours_inactivite: number }
  ): Promise<boolean> {
    const urgency = dossier.jours_inactivite >= 7 ? 'urgent' : 'high';

    return this.createNotification({
      user_id: expertId,
      user_type: 'expert',
      title: '⏰ Rappel : Dossier en attente',
      message: `Le dossier ${dossier.nom} (${dossier.client_nom}) attend une action depuis ${dossier.jours_inactivite} jour(s)`,
      notification_type: 'assignment_reminder',
      priority: urgency,
      event_id: dossier.id,
      event_title: dossier.nom,
      metadata: {
        dossier_id: dossier.id,
        client_nom: dossier.client_nom,
        jours_inactivite: dossier.jours_inactivite
      }
    });
  }

  /**
   * EXPERT 3: Paiement reçu
   */
  static async onPaymentReceived(
    expertId: string,
    payment: { id: string; montant: number; client_nom: string; dossier_nom: string }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: expertId,
      user_type: 'expert',
      title: '💰 Paiement reçu',
      message: `Vous avez reçu ${payment.montant}€ pour le dossier ${payment.dossier_nom} (${payment.client_nom})`,
      notification_type: 'payment_received',
      priority: 'high',
      metadata: {
        payment_id: payment.id,
        montant: payment.montant,
        client_nom: payment.client_nom,
        dossier_nom: payment.dossier_nom
      }
    });
  }

  /**
   * EXPERT 4: Dossier marqué comme urgent par admin
   */
  static async onDossierUrgent(
    expertId: string,
    dossier: { id: string; nom: string; client_nom: string; raison: string }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: expertId,
      user_type: 'expert',
      title: '🚨 DOSSIER URGENT',
      message: `Le dossier ${dossier.nom} (${dossier.client_nom}) nécessite une attention immédiate. ${dossier.raison}`,
      notification_type: 'dossier_urgent',
      priority: 'urgent',
      event_id: dossier.id,
      event_title: dossier.nom,
      metadata: {
        dossier_id: dossier.id,
        client_nom: dossier.client_nom,
        raison: dossier.raison
      }
    });
  }

  /**
   * EXPERT 5: Demande client via messagerie
   */
  static async onClientRequest(
    expertId: string,
    client: { id: string; nom: string; prenom: string },
    request: { sujet: string; message: string; conversation_id?: string }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: expertId,
      user_type: 'expert',
      title: `📩 Demande de ${client.prenom} ${client.nom}`,
      message: `${request.sujet}: ${request.message.substring(0, 80)}...`,
      notification_type: 'client_request',
      priority: 'normal',
      event_id: request.conversation_id,
      metadata: {
        client_id: client.id,
        client_nom: `${client.prenom} ${client.nom}`,
        sujet: request.sujet,
        conversation_id: request.conversation_id
      }
    });
  }

  // ============================================================================
  // NOTIFICATIONS ADMIN (8 types)
  // ============================================================================

  /**
   * ADMIN 1: Nouveau client inscrit
   */
  static async onNewClientRegistration(
    client: { id: string; nom: string; prenom: string; email: string; company?: string }
  ): Promise<boolean> {
    return this.createAdminNotification({
      type: 'client_registration',
      title: '👤 Nouveau client inscrit',
      message: `${client.prenom} ${client.nom} (${client.email}) ${client.company ? `de ${client.company}` : ''} vient de s'inscrire`,
      priority: 'normal',
      metadata: {
        client_id: client.id,
        email: client.email,
        company: client.company
      },
      action_url: `/admin/clients/${client.id}`,
      action_label: 'Voir profil'
    });
  }

  /**
   * ADMIN 2: Nouvel expert en attente de validation
   */
  static async onNewExpertRegistration(
    expert: { id: string; nom: string; prenom: string; email: string; specialite?: string }
  ): Promise<boolean> {
    return this.createAdminNotification({
      type: 'expert_registration',
      title: '⭐ Nouvel expert en attente',
      message: `${expert.prenom} ${expert.nom} (${expert.specialite || 'Non spécifié'}) attend validation`,
      priority: 'high',
      metadata: {
        expert_id: expert.id,
        email: expert.email,
        specialite: expert.specialite
      },
      action_url: `/admin/experts/${expert.id}`,
      action_label: 'Valider'
    });
  }

  /**
   * ADMIN 3: Problème de paiement détecté
   */
  static async onPaymentIssue(
    payment: { id: string; client_id: string; client_nom: string; montant: number; erreur: string }
  ): Promise<boolean> {
    return this.createAdminNotification({
      type: 'payment_issue',
      title: '⚠️ Problème de paiement',
      message: `Paiement de ${payment.montant}€ échoué pour ${payment.client_nom}. Erreur: ${payment.erreur}`,
      priority: 'high',
      metadata: {
        payment_id: payment.id,
        client_id: payment.client_id,
        montant: payment.montant,
        erreur: payment.erreur
      },
      action_url: `/admin/payments/${payment.id}`,
      action_label: 'Investiguer'
    });
  }

  /**
   * ADMIN 4: Alerte fraude potentielle
   */
  static async onFraudAlert(
    alert: { type: string; user_id: string; user_type: string; raison: string; score_risque: number }
  ): Promise<boolean> {
    return this.createAdminNotification({
      type: 'fraud_alert',
      title: '🚨 ALERTE FRAUDE',
      message: `Activité suspecte détectée (${alert.type}). Score de risque: ${alert.score_risque}/100. ${alert.raison}`,
      priority: 'urgent',
      metadata: {
        user_id: alert.user_id,
        user_type: alert.user_type,
        type_fraude: alert.type,
        score_risque: alert.score_risque,
        raison: alert.raison
      },
      action_url: `/admin/security/alerts`,
      action_label: 'Voir détails'
    });
  }

  /**
   * ADMIN 5: Erreur système critique
   */
  static async onSystemError(
    error: { type: string; message: string; stack?: string; service: string }
  ): Promise<boolean> {
    return this.createAdminNotification({
      type: 'system_error',
      title: '🔴 Erreur système',
      message: `Erreur ${error.type} dans ${error.service}: ${error.message}`,
      priority: 'urgent',
      metadata: {
        error_type: error.type,
        service: error.service,
        stack: error.stack
      },
      action_url: '/admin/system/logs',
      action_label: 'Voir logs'
    });
  }

  /**
   * ADMIN 6: Activité anormalement élevée
   */
  static async onHighActivity(
    activity: { type: string; count: number; periode: string; seuil_normal: number }
  ): Promise<boolean> {
    return this.createAdminNotification({
      type: 'high_activity',
      title: '📈 Activité élevée détectée',
      message: `${activity.count} ${activity.type} en ${activity.periode} (normal: ${activity.seuil_normal})`,
      priority: 'normal',
      metadata: {
        activity_type: activity.type,
        count: activity.count,
        periode: activity.periode,
        seuil_normal: activity.seuil_normal
      },
      action_url: '/admin/analytics',
      action_label: 'Voir analytics'
    });
  }

  /**
   * ADMIN 7: Ticket support urgent
   */
  static async onSupportTicketUrgent(
    ticket: { id: string; user_nom: string; sujet: string; categorie: string }
  ): Promise<boolean> {
    return this.createAdminNotification({
      type: 'support_ticket',
      title: '🆘 Ticket support urgent',
      message: `${ticket.user_nom} - ${ticket.sujet} (${ticket.categorie})`,
      priority: 'high',
      metadata: {
        ticket_id: ticket.id,
        user_nom: ticket.user_nom,
        categorie: ticket.categorie
      },
      action_url: `/admin/support/${ticket.id}`,
      action_label: 'Traiter'
    });
  }

  /**
   * ADMIN 8: Document en attente de validation
   */
  static async onDocumentValidationPending(
    document: { id: string; client_id: string; client_nom: string; type: string; dossier_nom: string }
  ): Promise<boolean> {
    return this.createAdminNotification({
      type: 'document_validation',
      title: '📋 Document à valider',
      message: `${document.type} de ${document.client_nom} pour ${document.dossier_nom} attend validation`,
      priority: 'normal',
      metadata: {
        document_id: document.id,
        client_id: document.client_id,
        type: document.type,
        dossier_nom: document.dossier_nom
      },
      action_url: `/admin/documents/${document.id}`,
      action_label: 'Valider'
    });
  }

  // ============================================================================
  // NOTIFICATIONS APPORTEUR (6 types)
  // ============================================================================

  /**
   * APPORTEUR 1: Commission gagnée
   */
  static async onCommissionEarned(
    apporteurId: string,
    commission: { montant: number; client_nom: string; produit: string; taux: number }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: apporteurId,
      user_type: 'apporteur',
      title: '💰 Commission gagnée !',
      message: `Vous avez gagné ${commission.montant}€ (${commission.taux}%) pour ${commission.client_nom} - ${commission.produit}`,
      notification_type: 'commission_earned',
      priority: 'high',
      metadata: {
        montant: commission.montant,
        client_nom: commission.client_nom,
        produit: commission.produit,
        taux: commission.taux
      }
    });
  }

  /**
   * APPORTEUR 2: Expert trouvé pour prospect
   */
  static async onExpertMatched(
    apporteurId: string,
    match: { prospect_id: string; prospect_nom: string; expert_id: string; expert_nom: string; specialite: string }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: apporteurId,
      user_type: 'apporteur',
      title: '🎯 Expert trouvé',
      message: `${match.expert_nom} (${match.specialite}) a été trouvé pour ${match.prospect_nom}`,
      notification_type: 'expert_matched',
      priority: 'normal',
      event_id: match.prospect_id,
      metadata: {
        prospect_id: match.prospect_id,
        prospect_nom: match.prospect_nom,
        expert_id: match.expert_id,
        expert_nom: match.expert_nom,
        specialite: match.specialite
      }
    });
  }

  /**
   * APPORTEUR 3: Prospect qualifié automatiquement
   */
  static async onProspectQualified(
    apporteurId: string,
    prospect: { id: string; nom: string; score: number; potentiel: string }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: apporteurId,
      user_type: 'apporteur',
      title: '✨ Prospect qualifié',
      message: `${prospect.nom} a été qualifié avec un score de ${prospect.score}/100 (Potentiel: ${prospect.potentiel})`,
      notification_type: 'prospect_qualified',
      priority: 'normal',
      event_id: prospect.id,
      metadata: {
        prospect_id: prospect.id,
        score: prospect.score,
        potentiel: prospect.potentiel
      }
    });
  }

  /**
   * APPORTEUR 4: RDV terminé - demande feedback
   */
  static async onMeetingCompleted(
    apporteurId: string,
    meeting: { id: string; prospect_nom: string; expert_nom: string; date: string }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: apporteurId,
      user_type: 'apporteur',
      title: '✅ RDV terminé',
      message: `Le RDV entre ${meeting.expert_nom} et ${meeting.prospect_nom} est terminé. N'oubliez pas de demander un feedback.`,
      notification_type: 'meeting_completed',
      priority: 'normal',
      event_id: meeting.id,
      metadata: {
        meeting_id: meeting.id,
        prospect_nom: meeting.prospect_nom,
        expert_nom: meeting.expert_nom,
        date: meeting.date
      }
    });
  }

  /**
   * APPORTEUR 5: Affaire conclue
   */
  static async onDealClosed(
    apporteurId: string,
    deal: { id: string; client_nom: string; montant: number; produit: string; commission_prevue: number }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: apporteurId,
      user_type: 'apporteur',
      title: '🎉 Affaire conclue !',
      message: `${deal.client_nom} a signé pour ${deal.produit} (${deal.montant}€). Commission prévue: ${deal.commission_prevue}€`,
      notification_type: 'deal_closed',
      priority: 'high',
      event_id: deal.id,
      metadata: {
        deal_id: deal.id,
        client_nom: deal.client_nom,
        montant: deal.montant,
        produit: deal.produit,
        commission_prevue: deal.commission_prevue
      }
    });
  }

  /**
   * APPORTEUR 6: Paiement commission en attente
   */
  static async onCommissionPending(
    apporteurId: string,
    payment: { montant: number; deal_nom: string; date_traitement: string }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: apporteurId,
      user_type: 'apporteur',
      title: '⏳ Commission en traitement',
      message: `Votre commission de ${payment.montant}€ (${payment.deal_nom}) est en cours de traitement. Paiement prévu: ${payment.date_traitement}`,
      notification_type: 'commission_pending',
      priority: 'normal',
      metadata: {
        montant: payment.montant,
        deal_nom: payment.deal_nom,
        date_traitement: payment.date_traitement
      }
    });
  }

  // ============================================================================
  // UTILITAIRES
  // ============================================================================

  /**
   * Envoyer une notification de test (pour debugging)
   */
  static async sendTestNotification(userId: string, userType: 'client' | 'expert' | 'admin' | 'apporteur'): Promise<boolean> {
    if (userType === 'admin') {
      return this.createAdminNotification({
        type: 'test',
        title: 'Test Notification Admin',
        message: `Notification de test envoyée le ${new Date().toLocaleString('fr-FR')}`,
        priority: 'normal'
      });
    }

    return this.createNotification({
      user_id: userId,
      user_type: userType,
      title: `Test Notification ${userType}`,
      message: `Notification de test envoyée le ${new Date().toLocaleString('fr-FR')}`,
      notification_type: 'test',
      priority: 'normal'
    });
  }
}

