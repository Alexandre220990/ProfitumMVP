import { createClient } from '@supabase/supabase-js';
import { NotificationTriggers } from './NotificationTriggers';

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
  }
};

function computeNextDueDate(metadata: any): string {
  const slaHours = Number(metadata?.sla_hours || 24);
  return new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();
}

function shouldEscalate(notification: DBNotification, now: Date): boolean {
  const metadata = notification.metadata || {};

  const dueAt = metadata.due_at ? new Date(metadata.due_at) : null;
  const escalationLevel = Number(metadata.escalation_level || 0);

  if (notification.is_read) {
    return false;
  }

  if (escalationLevel >= MAX_ESCALATION_LEVEL) {
    return false;
  }

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
      .select('id, user_id, user_type, notification_type, priority, status, is_read, metadata')
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

      const updatedMetadata = {
        ...metadata,
        escalation_level: escalationLevel + 1,
        last_escalation_at: new Date().toISOString(),
        due_at: computeNextDueDate(metadata)
      };

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


