/**
 * Utilitaires pour calculer et afficher les SLA des notifications côté client
 */

export interface NotificationSLA {
  targetHours: number;
  acceptableHours: number;
  criticalHours: number;
  defaultPriority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
}

/**
 * Configuration des SLA par type de notification (identique au serveur)
 */
export const NOTIFICATION_SLA_CONFIG: Record<string, NotificationSLA> = {
  contact_message: {
    targetHours: 24,
    acceptableHours: 48,
    criticalHours: 120,
    defaultPriority: 'high',
    description: 'Réponse attendue sous 24h pour les messages de contact'
  },
  admin_action_required: {
    targetHours: 12,
    acceptableHours: 24,
    criticalHours: 48,
    defaultPriority: 'high',
    description: 'Validation des documents requise sous 12h'
  },
  documents_complementary_uploaded: {
    targetHours: 12,
    acceptableHours: 24,
    criticalHours: 48,
    defaultPriority: 'medium',
    description: 'Vérification des documents complémentaires sous 12h'
  },
  expert_refused_dossier: {
    targetHours: 12,
    acceptableHours: 24,
    criticalHours: 48,
    defaultPriority: 'high',
    description: 'Réassignation du dossier requise sous 12h'
  },
  dossier_urgent: {
    targetHours: 12,
    acceptableHours: 24,
    criticalHours: 48,
    defaultPriority: 'urgent',
    description: 'Traitement urgent requis sous 12h'
  },
  validation_final_pending: {
    targetHours: 12,
    acceptableHours: 24,
    criticalHours: 48,
    defaultPriority: 'high',
    description: 'Validation finale requise sous 12h'
  },
  client_no_response_critical: {
    targetHours: 24,
    acceptableHours: 48,
    criticalHours: 72,
    defaultPriority: 'urgent',
    description: 'Action requise pour client sans réponse depuis 15 jours'
  },
  audit_to_complete: {
    targetHours: 120,
    acceptableHours: 240,
    criticalHours: 360,
    defaultPriority: 'medium',
    description: 'Audit à compléter sous 5 jours'
  },
  documents_requested: {
    targetHours: 72,
    acceptableHours: 168,
    criticalHours: 360,
    defaultPriority: 'medium',
    description: 'Documents demandés depuis plus de 3 jours'
  },
  relance_needed: {
    targetHours: 24,
    acceptableHours: 48,
    criticalHours: 72,
    defaultPriority: 'medium',
    description: 'Relance nécessaire après 7 jours sans contact'
  },
  complementary_docs_received: {
    targetHours: 12,
    acceptableHours: 24,
    criticalHours: 48,
    defaultPriority: 'medium',
    description: 'Examen des documents complémentaires sous 12h'
  },
  first_review_needed: {
    targetHours: 12,
    acceptableHours: 24,
    criticalHours: 48,
    defaultPriority: 'medium',
    description: 'Première revue du nouveau dossier sous 12h'
  },
  expert_pending_acceptance: {
    targetHours: 12,
    acceptableHours: 24,
    criticalHours: 48,
    defaultPriority: 'high',
    description: 'Acceptation du dossier par l\'expert sous 12h'
  },
  documents_pending_validation: {
    targetHours: 24,
    acceptableHours: 48,
    criticalHours: 72,
    defaultPriority: 'high',
    description: 'Validation des documents sous 24h'
  },
  default: {
    targetHours: 48,
    acceptableHours: 96,
    criticalHours: 168,
    defaultPriority: 'medium',
    description: 'SLA par défaut pour notifications non spécifiées'
  }
};

export type SLAStatus = 'ok' | 'warning' | 'critical' | 'overdue';

export interface SLAStatusResult {
  status: SLAStatus;
  hoursElapsed: number;
  hoursRemaining: number;
  percentageRemaining: number;
  sla: NotificationSLA;
}

/**
 * Calcule le statut SLA d'une notification
 */
export function calculateSLAStatus(
  notificationType: string,
  createdAt: string | Date
): SLAStatusResult {
  const sla = NOTIFICATION_SLA_CONFIG[notificationType] || NOTIFICATION_SLA_CONFIG.default;
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const now = new Date();
  const hoursElapsed = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

  let status: SLAStatus;
  let hoursRemaining: number;
  let percentageRemaining: number;

  if (hoursElapsed < sla.targetHours) {
    status = 'ok';
    hoursRemaining = sla.targetHours - hoursElapsed;
    percentageRemaining = (hoursRemaining / sla.targetHours) * 100;
  } else if (hoursElapsed < sla.acceptableHours) {
    status = 'warning';
    hoursRemaining = sla.acceptableHours - hoursElapsed;
    percentageRemaining = ((sla.acceptableHours - hoursElapsed) / (sla.acceptableHours - sla.targetHours)) * 100;
  } else if (hoursElapsed < sla.criticalHours) {
    status = 'critical';
    hoursRemaining = sla.criticalHours - hoursElapsed;
    percentageRemaining = ((sla.criticalHours - hoursElapsed) / (sla.criticalHours - sla.acceptableHours)) * 100;
  } else {
    status = 'overdue';
    hoursRemaining = 0;
    percentageRemaining = 0;
  }

  return {
    status,
    hoursElapsed,
    hoursRemaining,
    percentageRemaining,
    sla
  };
}

/**
 * Formate le temps restant en texte lisible
 */
export function formatTimeRemaining(hours: number): string {
  if (hours < 0) return 'Dépassé';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  if (remainingHours === 0) return `${days}j`;
  return `${days}j ${remainingHours}h`;
}

/**
 * Formate le temps écoulé en texte lisible
 */
export function formatTimeElapsed(hours: number): string {
  if (hours < 1) return `Il y a ${Math.round(hours * 60)} min`;
  if (hours < 24) return `Il y a ${Math.round(hours)}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Il y a 1 jour';
  if (days < 7) return `Il y a ${days} jours`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return 'Il y a 1 semaine';
  return `Il y a ${weeks} semaines`;
}

/**
 * Retourne les classes CSS pour le statut SLA
 */
export function getSLAStatusClasses(status: SLAStatus): string {
  switch (status) {
    case 'ok':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'warning':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'overdue':
      return 'bg-red-200 text-red-900 border-red-500';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

/**
 * Retourne l'icône pour le statut SLA
 */
export function getSLAStatusIcon(status: SLAStatus) {
  switch (status) {
    case 'ok':
      return '✓';
    case 'warning':
      return '⚠';
    case 'critical':
      return '🔴';
    case 'overdue':
      return '⛔';
    default:
      return '•';
  }
}

