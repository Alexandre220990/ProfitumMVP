import { createClient } from '@supabase/supabase-js';
import { NotificationTriggers } from './NotificationTriggers';
import { NOTIFICATION_SLA_CONFIG, calculateSLAStatus } from '../config/notification-sla-config';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DBNotification {
  id: string;
  user_id: string;
  user_type: 'client' | 'expert' | 'admin' | 'apporteur';
  notification_type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | string;
  status: string;
  is_read: boolean;
  metadata: any;
  created_at?: string;
}

const MAX_ESCALATION_LEVEL = 3;

type EscalationHandler = (notification: DBNotification) => Promise<void>;

const ESCALATION_HANDLERS: Record<string, EscalationHandler> = {
  charte_signature_requested: async (notification) => {
    const metadata = notification.metadata || {};
    if (!metadata.dossier_id || !metadata.produit) {
      return;
    }

    await NotificationTriggers.onCharteSignatureRequested(notification.user_id, {
      dossier_id: metadata.dossier_id,
      produit: metadata.produit,
      expert_name: metadata.expert_name || 'Votre expert',
      charte_url: metadata.charte_url || undefined
    });
  },
  complementary_documents_rejected: async (notification) => {
    const metadata = notification.metadata || {};
    if (!metadata.dossier_id || !metadata.produit || !metadata.expert_name) {
      return;
    }

    await NotificationTriggers.onComplementaryDocumentsRejected(notification.user_id, {
      dossier_id: metadata.dossier_id,
      produit: metadata.produit,
      expert_name: metadata.expert_name,
      reason: metadata.reason || undefined
    });
  },
  payment_requested: async (notification) => {
    const metadata = notification.metadata || {};
    if (!metadata.dossier_id || !metadata.produit || !metadata.montant) {
      return;
    }

    await NotificationTriggers.onPaymentRequested(notification.user_id, {
      dossier_id: metadata.dossier_id,
      produit: metadata.produit,
      montant: metadata.montant,
      facture_reference: metadata.facture_reference || undefined
    });
  },
  assignment_reminder: async (notification) => {
    const metadata = notification.metadata || {};
    if (!metadata.dossier_id || !metadata.client_nom) {
      return;
    }

    const joursInactivite = Number(metadata.jours_inactivite || 0);

    await NotificationTriggers.onAssignmentReminder(notification.user_id, {
      id: metadata.dossier_id,
      nom: metadata.dossier_nom || 'Dossier',
      client_nom: metadata.client_nom,
      jours_inactivite: joursInactivite + 1
    });
  },
  contact_message: async (notification) => {
    const metadata = notification.metadata || {};
    const escalationLevel = Number(metadata.escalation_level || 0);
    
    if (!metadata.contact_message_id || !metadata.name || !metadata.email) {
      return;
    }

    // Calculer les heures écoulées depuis la création
    const createdAt = notification.created_at || metadata.created_at || new Date().toISOString();
    const hoursElapsed = (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    
    const slaConfig = NOTIFICATION_SLA_CONFIG.contact_message;
    let reminderPriority: 'high' | 'urgent' = 'high';
    let reminderMessage = '';
    
    if (hoursElapsed >= slaConfig.criticalHours) {
      // 120h+ : Critique
      reminderPriority = 'urgent';
      reminderMessage = `🚨 URGENT : Demande de contact non traitée depuis ${Math.floor(hoursElapsed / 24)} jours - ${metadata.name} (${metadata.email})`;
    } else if (hoursElapsed >= slaConfig.acceptableHours) {
      // 48h+ : Important
      reminderPriority = 'high';
      reminderMessage = `⚠️ Demande de contact en attente depuis ${Math.floor(hoursElapsed / 24)} jours - ${metadata.name} (${metadata.email})`;
    } else if (hoursElapsed >= slaConfig.targetHours) {
      // 24h+ : Rappel doux
      reminderPriority = 'high';
      reminderMessage = `📋 Rappel : Demande de contact à traiter - ${metadata.name} (${metadata.email})`;
    } else {
      return; // Pas encore le temps d'escalader
    }

    // Créer une notification de rappel
    const { error: reminderError } = await supabase
      .from('notification')
      .insert({
        user_id: notification.user_id,
        user_type: notification.user_type,
        title: reminderMessage,
        message: metadata.message || metadata.contexte || `Contact de ${metadata.name}`,
        notification_type: 'reminder',
        priority: reminderPriority,
        is_read: false,
        status: 'unread',
        action_url: metadata.action_url || `/admin/contact/${metadata.contact_message_id}`,
        action_data: {
          contact_message_id: metadata.contact_message_id,
          original_notification_id: notification.id,
          escalation_level: escalationLevel + 1
        },
        metadata: {
          original_notification_id: notification.id,
          contact_message_id: metadata.contact_message_id,
          name: metadata.name,
          email: metadata.email,
          phone: metadata.phone,
          hours_elapsed: Math.floor(hoursElapsed),
          escalation_level: escalationLevel + 1,
          reminder_type: 'contact_message'
        }
      });

    if (reminderError) {
      console.error('❌ Erreur création rappel contact_message:', reminderError);
    }
  },
  lead_to_treat: async (notification) => {
    const metadata = notification.metadata || {};
    const escalationLevel = Number(metadata.escalation_level || 0);
    
    if (!metadata.contact_message_id || !metadata.name || !metadata.email) {
      return;
    }

    // Calculer les heures écoulées depuis la création
    const createdAt = notification.created_at || metadata.created_at || new Date().toISOString();
    const hoursElapsed = (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    
    const slaConfig = NOTIFICATION_SLA_CONFIG.contact_message;
    let reminderPriority: 'high' | 'urgent' = 'high';
    let reminderMessage = '';
    
    if (hoursElapsed >= slaConfig.criticalHours) {
      // 120h+ : Critique
      reminderPriority = 'urgent';
      reminderMessage = `🚨 URGENT : Lead non traité depuis ${Math.floor(hoursElapsed / 24)} jours - ${metadata.name} (${metadata.email})`;
    } else if (hoursElapsed >= slaConfig.acceptableHours) {
      // 48h+ : Important
      reminderPriority = 'high';
      reminderMessage = `⚠️ Lead en attente depuis ${Math.floor(hoursElapsed / 24)} jours - ${metadata.name} (${metadata.email})`;
    } else if (hoursElapsed >= slaConfig.targetHours) {
      // 24h+ : Rappel doux
      reminderPriority = 'high';
      reminderMessage = `📋 Rappel : Lead à traiter - ${metadata.name} (${metadata.email})`;
    } else {
      return; // Pas encore le temps d'escalader
    }

    // Déterminer l'action_url selon le type d'utilisateur
    let actionUrl = `/admin/contact/${metadata.contact_message_id}`;
    if (notification.user_type === 'expert') {
      actionUrl = `/expert/leads/${metadata.contact_message_id}`;
    } else if (notification.user_type === 'client') {
      actionUrl = `/leads/${metadata.contact_message_id}`;
    } else if (notification.user_type === 'apporteur') {
      actionUrl = `/apporteur/leads/${metadata.contact_message_id}`;
    }

    // Créer une notification de rappel
    const { error: reminderError } = await supabase
      .from('notification')
      .insert({
        user_id: notification.user_id,
        user_type: notification.user_type,
        title: reminderMessage,
        message: metadata.message || metadata.contexte || `Lead de ${metadata.name}`,
        notification_type: 'reminder',
        priority: reminderPriority,
        is_read: false,
        status: 'unread',
        action_url: actionUrl,
        action_data: {
          contact_message_id: metadata.contact_message_id,
          original_notification_id: notification.id,
          escalation_level: escalationLevel + 1
        },
        metadata: {
          original_notification_id: notification.id,
          contact_message_id: metadata.contact_message_id,
          name: metadata.name,
          email: metadata.email,
          phone: metadata.phone,
          hours_elapsed: Math.floor(hoursElapsed),
          escalation_level: escalationLevel + 1,
          reminder_type: 'lead_to_treat'
        }
      });

    if (reminderError) {
      console.error('❌ Erreur création rappel lead_to_treat:', reminderError);
    }
  }
};

function computeNextDueDate(metadata: any): string {
  const slaHours = Number(metadata?.sla_hours || 24);
  return new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();
}

function shouldEscalate(notification: DBNotification, now: Date): boolean {
  const metadata = notification.metadata || {};
  const escalationLevel = Number(metadata.escalation_level || 0);

  if (notification.is_read) {
    return false;
  }

  if (escalationLevel >= MAX_ESCALATION_LEVEL) {
    return false;
  }

  // Pour contact_message et lead_to_treat, utiliser la logique basée sur les heures écoulées
  if (notification.notification_type === 'contact_message' || notification.notification_type === 'lead_to_treat') {
    const createdAt = notification.created_at || metadata.created_at;
    if (!createdAt) {
      return false;
    }

    const createdDate = new Date(createdAt);
    const hoursElapsed = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    
    const slaConfig = NOTIFICATION_SLA_CONFIG.contact_message;
    const remindersSent = metadata.reminders_sent || {};
    
    // Vérifier les seuils SLA et si les rappels ont déjà été envoyés
    if (hoursElapsed >= slaConfig.targetHours && !remindersSent['24h']) {
      return true; // Premier rappel à 24h
    }
    if (hoursElapsed >= slaConfig.acceptableHours && !remindersSent['48h']) {
      return true; // Deuxième rappel à 48h
    }
    if (hoursElapsed >= slaConfig.criticalHours && !remindersSent['120h']) {
      return true; // Troisième rappel à 120h
    }
    
    return false;
  }

  // Pour les autres types, utiliser la logique basée sur due_at
  const dueAt = metadata.due_at ? new Date(metadata.due_at) : null;
  if (!dueAt) {
    return false;
  }

  return dueAt <= now;
}

async function escalateNotification(notification: DBNotification): Promise<void> {
  const handler = ESCALATION_HANDLERS[notification.notification_type];

  if (handler) {
    try {
      await handler(notification);
    } catch (error) {
      console.error(
        `❌ Erreur exécution handler escalade (${notification.notification_type})`,
        error
      );
    }
  }
}

export class NotificationEscalationService {
  public static async run(): Promise<void> {
    const now = new Date();

    const { data, error } = await supabase
      .from('notification')
      .select('id, user_id, user_type, notification_type, priority, status, is_read, metadata, created_at')
      .in('status', ['unread', 'active'])
      .eq('is_read', false)
      .limit(500);

    if (error) {
      console.error('❌ Erreur récupération notifications pour escalade:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('ℹ️  Aucune notification à escalader.');
      return;
    }

    const candidates = data.filter((notification) => shouldEscalate(notification, now));

    if (candidates.length === 0) {
      console.log('ℹ️  Aucune notification arrivée à échéance SLA.');
      return;
    }

    console.log(`🚨 Notifications à escalader: ${candidates.length}`);

    for (const notification of candidates) {
      const metadata = notification.metadata || {};
      const escalationLevel = Number(metadata.escalation_level || 0);

      await escalateNotification(notification);

      // Mettre à jour les métadonnées selon le type de notification
      let updatedMetadata: any = {
        ...metadata,
        escalation_level: escalationLevel + 1,
        last_escalation_at: new Date().toISOString()
      };

      // Pour contact_message et lead_to_treat, marquer le rappel comme envoyé
      if (notification.notification_type === 'contact_message' || notification.notification_type === 'lead_to_treat') {
        const createdAt = notification.created_at || metadata.created_at || new Date().toISOString();
        const hoursElapsed = (now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
        const slaConfig = NOTIFICATION_SLA_CONFIG.contact_message;
        const remindersSent = metadata.reminders_sent || {};
        
        if (hoursElapsed >= slaConfig.criticalHours && !remindersSent['120h']) {
          remindersSent['120h'] = true;
        } else if (hoursElapsed >= slaConfig.acceptableHours && !remindersSent['48h']) {
          remindersSent['48h'] = true;
        } else if (hoursElapsed >= slaConfig.targetHours && !remindersSent['24h']) {
          remindersSent['24h'] = true;
        }
        
        updatedMetadata.reminders_sent = remindersSent;
      } else {
        // Pour les autres types, utiliser due_at
        updatedMetadata.due_at = computeNextDueDate(metadata);
      }

      const { error: updateError } = await supabase
        .from('notification')
        .update({
          status: 'late',
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', notification.id);

      if (updateError) {
        console.error('❌ Erreur mise à jour notification en escalade:', updateError);
      } else {
        console.log(
          `✅ Notification ${notification.id} escaladée (niveau ${escalationLevel + 1})`
        );
      }
    }
  }
}


