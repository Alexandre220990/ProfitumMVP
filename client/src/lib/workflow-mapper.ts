import { WORKFLOW_STEPS } from './workflow-constants';

export interface DossierWorkflowStep {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error' | 'blocked';
  progress?: number;
  estimatedDuration?: string;
  actions?: {
    label: string;
    action: string;
    variant: 'primary' | 'secondary' | 'outline';
    disabled?: boolean;
  }[];
  requirements?: string[];
  documents?: {
    name: string;
    status: 'pending' | 'uploaded' | 'validated' | 'rejected';
    required: boolean;
  }[];
  notes?: string[];
  notifications?: {
    type: 'info' | 'warning' | 'success' | 'error';
    message: string;
    timestamp: string;
  }[];
}

export interface DossierData {
  id: string;
  current_step: number;
  progress: number;
  statut: string;
  charte_signed: boolean;
  charte_signed_at?: string;
  expert_id?: string;
  created_at: string;
  updated_at: string;
  montantFinal: number;
  tauxFinal: number;
  dureeFinale: number;
  priorite?: number;
  notes?: string;
  metadata?: any;
  
  Client?: {
    id: string;
    name?: string;
    email: string;
    company_name?: string;
    phone_number?: string;
    city?: string;
    siren?: string;
  };
  ProduitEligible?: {
    id: string;
    nom: string;
    description?: string;
    category?: string;
  };
  Expert?: {
    id: string;
    name: string;
    company_name?: string;
    email: string;
  };
}

/**
 * Mappe les données du dossier sur les étapes du workflow
 */
export function mapDossierToWorkflow(dossier: DossierData): DossierWorkflowStep[] {
  const steps = Object.values(WORKFLOW_STEPS);
  
  return steps.map((step, index) => {
    const stepNumber = index + 1;
    const isCompleted = stepNumber < dossier.current_step;
    const isActive = stepNumber === dossier.current_step;
    const isPending = stepNumber > dossier.current_step;
    
    // Déterminer le statut de l'étape
    let status: DossierWorkflowStep['status'] = 'pending';
    if (isCompleted) status = 'completed';
    else if (isActive) status = 'active';
    else if (isPending) status = 'pending';
    
    // Calculer la progression de l'étape
    let stepProgress = 0;
    if (isCompleted) stepProgress = 100;
    else if (isActive) {
      // Calculer la progression basée sur le progress global
      const totalSteps = steps.length;
      const completedSteps = dossier.current_step - 1;
      const currentStepProgress = (dossier.progress - (completedSteps / totalSteps * 100)) / (1 / totalSteps * 100);
      stepProgress = Math.max(0, Math.min(100, currentStepProgress * 100));
    }
    
    // Actions contextuelles selon l'étape
    const actions = getStepActions(stepNumber, dossier, status);
    
    // Documents requis selon l'étape
    const documents = getStepDocuments(stepNumber, dossier);
    
    // Notifications selon l'étape
    const notifications = getStepNotifications(stepNumber, dossier, status);
    
    // Notes et commentaires
    const notes = getStepNotes(stepNumber, dossier);
    
    return {
      id: stepNumber,
      name: step.name,
      description: step.description,
      status,
      progress: stepProgress,
      estimatedDuration: getStepDuration(stepNumber),
      actions,
      requirements: getStepRequirements(stepNumber, dossier),
      documents,
      notes,
      notifications
    };
  });
}

/**
 * Détermine les actions disponibles pour une étape
 */
function getStepActions(stepNumber: number, dossier: DossierData, status: string): DossierWorkflowStep['actions'] {
  if (status !== 'active') return [];
  
  switch (stepNumber) {
    case 1: // Simulation
      return [];
      
    case 2: // Signature de la charte
      if (!dossier.charte_signed) {
        return [{
          label: 'Signer la charte',
          action: 'sign_charte',
          variant: 'primary'
        }];
      }
      return [];
      
    case 3: // Pré-sélection de l'expert
      if (dossier.charte_signed && !dossier.expert_id) {
        return [{
          label: 'Sélectionner un expert',
          action: 'select_expert',
          variant: 'primary'
        }];
      }
      return [];
      
    case 4: // Vérification de l'éligibilité
      if (dossier.expert_id) {
        return [
          {
            label: 'Analyser le dossier',
            action: 'analyze_dossier',
            variant: 'primary'
          },
          {
            label: 'Demander des documents',
            action: 'request_documents',
            variant: 'outline'
          }
        ];
      }
      return [];
      
    case 5: // Complétion du dossier
      return [
        {
          label: 'Compléter le dossier',
          action: 'complete_dossier',
          variant: 'primary'
        },
        {
          label: 'Voir les éléments manquants',
          action: 'view_missing',
          variant: 'outline'
        }
      ];
      
    case 6: // Mise en relation avec l'expert
      return [
        {
          label: 'Contacter le client',
          action: 'contact_client',
          variant: 'primary'
        },
        {
          label: 'Planifier un rendez-vous',
          action: 'schedule_meeting',
          variant: 'outline'
        }
      ];
      
    case 7: // Remise du rapport d'expert
      return [
        {
          label: 'Générer le rapport',
          action: 'generate_report',
          variant: 'primary'
        },
        {
          label: 'Prévisualiser',
          action: 'preview_report',
          variant: 'outline'
        }
      ];
      
    case 8: // Envoi à l'administration
      return [
        {
          label: 'Soumettre à l\'administration',
          action: 'submit_to_admin',
          variant: 'primary'
        }
      ];
      
    case 9: // Remboursement
      return [
        {
          label: 'Suivre le remboursement',
          action: 'track_reimbursement',
          variant: 'outline'
        }
      ];
      
    case 10: // Dossier clôturé
      return [
        {
          label: 'Clôturer le dossier',
          action: 'close_dossier',
          variant: 'primary'
        }
      ];
      
    default:
      return [];
  }
}

/**
 * Détermine les documents requis pour une étape
 */
function getStepDocuments(stepNumber: number, dossier: DossierData): DossierWorkflowStep['documents'] {
  switch (stepNumber) {
    case 4: // Vérification de l'éligibilité
      return [
        {
          name: 'Bulletins de salaire (3 dernières années)',
          status: 'pending',
          required: true
        },
        {
          name: 'Contrats de travail',
          status: 'pending',
          required: true
        },
        {
          name: 'Conventions collectives',
          status: 'pending',
          required: false
        },
        {
          name: 'Justificatifs de frais',
          status: 'pending',
          required: true
        },
        {
          name: 'Déclarations sociales nominatives (DSN)',
          status: 'pending',
          required: true
        }
      ];
      
    case 5: // Complétion du dossier
      return [
        {
          name: 'Rapport d\'analyse',
          status: 'pending',
          required: true
        },
        {
          name: 'Calculs d\'éligibilité',
          status: 'pending',
          required: true
        },
        {
          name: 'Recommandations',
          status: 'pending',
          required: true
        }
      ];
      
    case 7: // Remise du rapport d'expert
      return [
        {
          name: 'Rapport d\'expert final',
          status: 'pending',
          required: true
        },
        {
          name: 'Annexes techniques',
          status: 'pending',
          required: false
        }
      ];
      
    default:
      return [];
  }
}

/**
 * Détermine les notifications pour une étape
 */
function getStepNotifications(stepNumber: number, dossier: DossierData, status: string): DossierWorkflowStep['notifications'] {
  const notifications: DossierWorkflowStep['notifications'] = [];
  
  // Notifications basées sur le statut
  if (status === 'active') {
    notifications.push({
      type: 'info',
      message: `Étape en cours : ${getStepName(stepNumber)}`,
      timestamp: new Date().toISOString()
    });
  }
  
  // Notifications spécifiques selon l'étape
  switch (stepNumber) {
    case 2: // Signature de la charte
      if (!dossier.charte_signed) {
        notifications.push({
          type: 'warning',
          message: 'Signature de la charte requise pour continuer',
          timestamp: new Date().toISOString()
        });
      }
      break;
      
    case 4: // Vérification de l'éligibilité
      notifications.push({
        type: 'info',
        message: 'Documents requis pour l\'analyse d\'éligibilité',
        timestamp: new Date().toISOString()
      });
      break;
      
    case 6: // Mise en relation avec l'expert
      if (dossier.expert_id) {
        notifications.push({
          type: 'success',
          message: 'Expert assigné avec succès',
          timestamp: new Date().toISOString()
        });
      }
      break;
  }
  
  return notifications;
}

/**
 * Détermine les notes pour une étape
 */
function getStepNotes(stepNumber: number, dossier: DossierData): string[] {
  const notes: string[] = [];
  
  // Notes basées sur les métadonnées du dossier
  if (dossier.metadata?.notes) {
    notes.push(dossier.metadata.notes);
  }
  
  // Notes spécifiques selon l'étape
  switch (stepNumber) {
    case 4: // Vérification de l'éligibilité
      notes.push('Analyse approfondie requise pour valider l\'éligibilité');
      break;
      
    case 5: // Complétion du dossier
      notes.push('Vérification de tous les éléments avant finalisation');
      break;
  }
  
  return notes;
}

/**
 * Détermine les prérequis pour une étape
 */
function getStepRequirements(stepNumber: number, dossier: DossierData): string[] {
  switch (stepNumber) {
    case 2: // Signature de la charte
      return ['Simulation validée'];
      
    case 3: // Pré-sélection de l'expert
      return ['Charte signée'];
      
    case 4: // Vérification de l'éligibilité
      return ['Expert assigné', 'Documents collectés'];
      
    case 5: // Complétion du dossier
      return ['Analyse d\'éligibilité terminée'];
      
    case 6: // Mise en relation avec l'expert
      return ['Dossier complété'];
      
    case 7: // Remise du rapport d'expert
      return ['Contact client établi'];
      
    case 8: // Envoi à l'administration
      return ['Rapport d\'expert validé'];
      
    case 9: // Remboursement
      return ['Dossier soumis à l\'administration'];
      
    case 10: // Dossier clôturé
      return ['Remboursement reçu'];
      
    default:
      return [];
  }
}

/**
 * Détermine la durée estimée pour une étape
 */
function getStepDuration(stepNumber: number): string {
  switch (stepNumber) {
    case 1: return 'Immédiat';
    case 2: return '5 minutes';
    case 3: return '24-48h';
    case 4: return '3-5 jours';
    case 5: return '2-3 jours';
    case 6: return '1-2 jours';
    case 7: return '3-7 jours';
    case 8: return '1-2 semaines';
    case 9: return '2-4 semaines';
    case 10: return '1 jour';
    default: return 'Variable';
  }
}

/**
 * Obtient le nom d'une étape
 */
function getStepName(stepNumber: number): string {
  const steps = Object.values(WORKFLOW_STEPS);
  return steps[stepNumber - 1]?.name || 'Étape inconnue';
}

/**
 * Calcule la progression globale du dossier
 */
export function calculateDossierProgress(dossier: DossierData): number {
  const totalSteps = Object.keys(WORKFLOW_STEPS).length;
  const completedSteps = Math.max(0, dossier.current_step - 1);
  const currentStepProgress = dossier.progress || 0;
  
  return Math.round(((completedSteps + (currentStepProgress / 100)) / totalSteps) * 100);
}

/**
 * Vérifie si une étape peut être activée
 */
export function canActivateStep(stepNumber: number, dossier: DossierData): boolean {
  // L'étape précédente doit être complétée
  if (stepNumber > 1 && stepNumber > dossier.current_step) {
    return false;
  }
  
  // Vérifications spécifiques selon l'étape
  switch (stepNumber) {
    case 2: // Signature de la charte
      return dossier.current_step >= 1;
      
    case 3: // Pré-sélection de l'expert
      return dossier.charte_signed;
      
    case 4: // Vérification de l'éligibilité
      return dossier.expert_id !== undefined;
      
    default:
      return true;
  }
} 