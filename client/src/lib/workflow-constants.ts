// Constantes pour le ProductProcessWorkflow
export const WORKFLOW_STEPS = {
  SIMULATION: { id: 1, name: 'Simulation', description: 'Calcul préliminaire de votre éligibilité' },
  CHARTE_SIGNATURE: { id: 2, name: 'Signature de la charte', description: 'Validation des conditions d\'engagement' },
  EXPERT_PRESELECTION: { id: 3, name: 'Pré-sélection de l\'expert', description: 'Sélection de l\'expert le plus adapté' },
  ELIGIBILITY_PROCESS: { id: 4, name: 'Vérification de l\'éligibilité', description: 'Analyse approfondie par nos experts' },
  DOSSIER_COMPLETION: { id: 5, name: 'Complétion du dossier', description: 'Finalisation de tous les éléments' },
  EXPERT_MATCHING: { id: 6, name: 'Mise en relation avec l\'expert', description: 'Contact direct et planification' },
  EXPERT_REPORT: { id: 7, name: 'Remise du rapport d\'expert', description: 'Rapport détaillé et recommandations' },
  ADMINISTRATION_SUBMISSION: { id: 8, name: 'Envoi à l\'administration', description: 'Transmission officielle' },
  REIMBURSEMENT: { id: 9, name: 'Remboursement obtenu', description: 'Réception et traitement' },
  DOSSIER_CLOSURE: { id: 10, name: 'Dossier clôturé', description: 'Finalisation et archivage' }
} as const;

export const TOTAL_WORKFLOW_STEPS = Object.keys(WORKFLOW_STEPS).length;

// Fonction pour obtenir le nom de l'étape par ID
export function getStepName(stepId: number): string {
  const step = Object.values(WORKFLOW_STEPS).find(step => step.id === stepId);
  return step?.name || 'Étape inconnue';
}

// Fonction pour obtenir la description de l'étape par ID
export function getStepDescription(stepId: number): string {
  const step = Object.values(WORKFLOW_STEPS).find(step => step.id === stepId);
  return step?.description || '';
}

// Fonction pour formater l'affichage de l'étape
export function formatStepDisplay(currentStep: number, totalSteps: number = TOTAL_WORKFLOW_STEPS): string {
  return `${currentStep}/${totalSteps}`;
}

// Fonction pour calculer l'étape basée sur le statut et la progression
export function calculateCurrentStep(status: string, currentStep: number, progress: number): number {
  if (status === 'terminé') {
    return TOTAL_WORKFLOW_STEPS;
  } else if (status === 'non_démarré') {
    return 0;
  } else if (status === 'en_cours') {
    // Utiliser la progression pour déterminer l'étape
    return Math.max(1, Math.round((progress / 100) * TOTAL_WORKFLOW_STEPS));
  }
  return currentStep || 0;
}

// Fonction pour obtenir l'étape suivante
export function getNextStep(currentStep: number): number {
  return Math.min(currentStep + 1, TOTAL_WORKFLOW_STEPS);
}

// Fonction pour vérifier si une étape est terminée
export function isStepCompleted(currentStep: number, stepToCheck: number): boolean {
  return currentStep >= stepToCheck;
}

// Fonction pour obtenir le pourcentage de progression basé sur l'étape
export function getProgressFromStep(currentStep: number): number {
  return Math.round((currentStep / TOTAL_WORKFLOW_STEPS) * 100);
} 