/**
 * Configuration des SLA (Service Level Agreement) pour les notifications
 * Définit les délais cibles, acceptables et critiques pour chaque type de notification
 */

export interface NotificationSLA {
  /** Délai cible en heures (vert) */
  targetHours: number;
  /** Délai acceptable en heures (orange) */
  acceptableHours: number;
  /** Délai critique en heures (rouge) */
  criticalHours: number;
  /** Priorité par défaut si non spécifiée */
  defaultPriority: 'low' | 'medium' | 'high' | 'urgent';
  /** Description du SLA */
  description: string;
}

/**
 * Configuration des SLA par type de notification
 */
export const NOTIFICATION_SLA_CONFIG: Record<string, NotificationSLA> = {
  // ============================================
  // NOTIFICATIONS ADMIN
  // ============================================
  
  /** Nouveau message de contact */
  contact_message: {
    targetHours: 24,       // 24h pour répondre
    acceptableHours: 48,   // 48h acceptable
    criticalHours: 120,   // 120h (5j) critique
    defaultPriority: 'high',
    description: 'Réponse attendue sous 24h pour les messages de contact'
  },

  /** Documents de pré-éligibilité uploadés */
  admin_action_required: {
    targetHours: 12,       // 12h pour valider
    acceptableHours: 24,   // 24h acceptable
    criticalHours: 48,    // 48h critique
    defaultPriority: 'high',
    description: 'Validation des documents requise sous 12h'
  },

  /** Documents complémentaires uploadés */
  documents_complementary_uploaded: {
    targetHours: 12,       // 12h pour vérifier
    acceptableHours: 24,   // 24h acceptable
    criticalHours: 48,    // 48h critique
    defaultPriority: 'medium',
    description: 'Vérification des documents complémentaires sous 12h'
  },

  /** Expert a refusé le dossier */
  expert_refused_dossier: {
    targetHours: 12,      // 12h pour réassigner
    acceptableHours: 24,  // 24h acceptable
    criticalHours: 48,    // 48h critique
    defaultPriority: 'high',
    description: 'Réassignation du dossier requise sous 12h'
  },

  /** Dossier urgent */
  dossier_urgent: {
    targetHours: 12,      // 12h pour traiter
    acceptableHours: 24,  // 24h acceptable
    criticalHours: 48,    // 48h critique
    defaultPriority: 'urgent',
    description: 'Traitement urgent requis sous 12h'
  },

  /** Validation finale en attente */
  validation_final_pending: {
    targetHours: 12,      // 12h pour valider
    acceptableHours: 24,  // 24h acceptable
    criticalHours: 48,    // 48h critique
    defaultPriority: 'high',
    description: 'Validation finale requise sous 12h'
  },

  /** Client sans réponse critique */
  client_no_response_critical: {
    targetHours: 24,      // 24h pour agir
    acceptableHours: 48,  // 48h acceptable
    criticalHours: 72,   // 72h critique
    defaultPriority: 'urgent',
    description: 'Action requise pour client sans réponse depuis 15 jours'
  },

  /** Audit à compléter */
  audit_to_complete: {
    targetHours: 120,      // 5 jours
    acceptableHours: 240,  // 10 jours
    criticalHours: 360,    // 15 jours
    defaultPriority: 'medium',
    description: 'Audit à compléter sous 5 jours'
  },

  /** Documents demandés en attente */
  documents_requested: {
    targetHours: 72,      // 3 jours
    acceptableHours: 168, // 7 jours
    criticalHours: 360,   // 15 jours
    defaultPriority: 'medium',
    description: 'Documents demandés depuis plus de 3 jours'
  },

  /** Relance nécessaire */
  relance_needed: {
    targetHours: 24,      // 24h pour relancer
    acceptableHours: 48,  // 48h acceptable
    criticalHours: 72,   // 72h critique
    defaultPriority: 'medium',
    description: 'Relance nécessaire après 7 jours sans contact'
  },

  /** Documents complémentaires reçus */
  complementary_docs_received: {
    targetHours: 12,      // 12h pour examiner
    acceptableHours: 24, // 24h acceptable
    criticalHours: 48,   // 48h critique
    defaultPriority: 'medium',
    description: 'Examen des documents complémentaires sous 12h'
  },

  /** Première revue nécessaire */
  first_review_needed: {
    targetHours: 12,      // 12h pour première revue
    acceptableHours: 24,  // 24h acceptable
    criticalHours: 48,   // 48h critique
    defaultPriority: 'medium',
    description: 'Première revue du nouveau dossier sous 12h'
  },

  /** Expert en attente d'acceptation */
  expert_pending_acceptance: {
    targetHours: 12,      // 12h pour accepter
    acceptableHours: 24,  // 24h acceptable
    criticalHours: 48,    // 48h critique
    defaultPriority: 'high',
    description: 'Acceptation du dossier par l\'expert sous 12h'
  },

  /** Documents en attente de validation */
  documents_pending_validation: {
    targetHours: 24,      // 24h pour valider
    acceptableHours: 48,  // 48h acceptable
    criticalHours: 72,    // 72h critique
    defaultPriority: 'high',
    description: 'Validation des documents sous 24h'
  },

  // ============================================
  // NOTIFICATIONS PAR DÉFAUT
  // ============================================
  
  /** Type par défaut si non trouvé */
  default: {
    targetHours: 48,       // 48h par défaut
    acceptableHours: 96,    // 4 jours
    criticalHours: 168,     // 7 jours
    defaultPriority: 'medium',
    description: 'SLA par défaut pour notifications non spécifiées'
  }
};

/**
 * Calcule le statut SLA d'une notification
 * @param notificationType Type de notification
 * @param createdAt Date de création de la notification
 * @returns Statut SLA et temps restant
 */
export function calculateSLAStatus(
  notificationType: string,
  createdAt: string | Date
): {
  status: 'ok' | 'warning' | 'critical' | 'overdue';
  hoursElapsed: number;
  hoursRemaining: number;
  percentageRemaining: number;
  sla: NotificationSLA;
} {
  const sla = NOTIFICATION_SLA_CONFIG[notificationType] || NOTIFICATION_SLA_CONFIG.default;
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const now = new Date();
  const hoursElapsed = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

  let status: 'ok' | 'warning' | 'critical' | 'overdue';
  let hoursRemaining: number;
  let percentageRemaining: number;

  if (hoursElapsed < sla.targetHours) {
    // Dans les temps (vert)
    status = 'ok';
    hoursRemaining = sla.targetHours - hoursElapsed;
    percentageRemaining = (hoursRemaining / sla.targetHours) * 100;
  } else if (hoursElapsed < sla.acceptableHours) {
    // En danger (orange)
    status = 'warning';
    hoursRemaining = sla.acceptableHours - hoursElapsed;
    percentageRemaining = ((sla.acceptableHours - hoursElapsed) / (sla.acceptableHours - sla.targetHours)) * 100;
  } else if (hoursElapsed < sla.criticalHours) {
    // Critique (rouge)
    status = 'critical';
    hoursRemaining = sla.criticalHours - hoursElapsed;
    percentageRemaining = ((sla.criticalHours - hoursElapsed) / (sla.criticalHours - sla.acceptableHours)) * 100;
  } else {
    // Dépassé (rouge foncé)
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
  const remainingHours = Math.round(hours % 24);
  if (days === 1) return 'Il y a 1 jour';
  if (days < 7) return `Il y a ${days} jours`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return 'Il y a 1 semaine';
  return `Il y a ${weeks} semaines`;
}

