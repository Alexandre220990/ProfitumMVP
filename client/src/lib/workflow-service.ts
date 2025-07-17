import { post, put } from "./api";

export interface WorkflowUpdate {
  clientProduitEligibleId: string;
  currentStep: number;
  progress: number;
  metadata?: any;
}

export interface StepAction {
  stepId: number;
  action: 'sign_charte' | 'assign_expert' | 'complete_dossier' | 'validate_dossier';
  data?: any;
}

/**
 * Service pour gérer le workflow des produits éligibles
 */
export class WorkflowService {
  /**
   * Met à jour l'étape actuelle et la progression
   */
  static async updateStep(update: WorkflowUpdate): Promise<boolean> {
    try {
      const response = await put(`/client/produits-eligibles/${update.clientProduitEligibleId}/workflow`, {
        current_step: update.currentStep,
        progress: update.progress,
        metadata: update.metadata
      });

      return response.success;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du workflow: ', error);
      return false;
    }
  }

  /**
   * Exécute une action d'étape spécifique
   */
  static async executeStepAction(action: StepAction): Promise<boolean> {
    try {
      const response = await post('/workflow/step-action', action);
      return response.success;
    } catch (error) {
      console.error('Erreur lors de l\'exécution de l\'action: ', error);
      return false;
    }
  }

  /**
   * Calcule la progression basée sur l'étape actuelle
   */
  static calculateProgress(currentStep: number): number {
    const totalSteps = 6; // 0 à 5
    return Math.round((currentStep / (totalSteps - 1)) * 100);
  }

  /**
   * Détermine l'étape suivante basée sur l'action
   */
  static getNextStep(currentStep: number, action: string): number {
    switch (action) {
      case 'sign_charte':
        return 1;
      case 'assign_expert':
        return 2;
      case 'complete_dossier':
        return 3;
      case 'validate_dossier':
        return 4;
      case 'finalize_dossier':
        return 5;
      default:
        return currentStep;
    }
  }

  /**
   * Vérifie si une étape peut être exécutée
   */
  static canExecuteStep(currentStep: number, targetStep: number): boolean {
    return targetStep === currentStep + 1;
  }

  /**
   * Obtient les informations de l'étape
   */
  static getStepInfo(step: number) {
    const steps = {
      0: { title: 'Simulation validée', description: 'Votre produit est éligible', progress: 0 },
      1: { title: 'Signature de la charte', description: 'Accepter les conditions d\'engagement', progress: 25 },
      2: { title: 'Sélection d\'expert', description: 'Choisir un expert qualifié', progress: 50 },
      3: { title: 'Complétion du dossier', description: 'Remplir les informations nécessaires', progress: 75 },
      4: { title: 'Validation administrative', description: 'Vérification et approbation', progress: 90 },
      5: { title: 'Dossier finalisé', description: 'Mission accomplie', progress: 100 }
    };

    return steps[step as keyof typeof steps] || steps[0];
  }
}

/**
 * Hook pour gérer le workflow d'un produit éligible
 */
export const useWorkflow = (clientProduitEligibleId: string) => {
  const updateStep = async (step: number, metadata?: any) => {
    const progress = WorkflowService.calculateProgress(step);
    
    return await WorkflowService.updateStep({
      clientProduitEligibleId,
      currentStep: step,
      progress,
      metadata
    });
  };

  const executeAction = async (action: StepAction) => {
    const success = await WorkflowService.executeStepAction(action);
    
    if (success) {
      const nextStep = WorkflowService.getNextStep(action.stepId, action.action);
      await updateStep(nextStep, action.data);
    }
    
    return success;
  };

  return {
    updateStep,
    executeAction,
    calculateProgress: WorkflowService.calculateProgress,
    getStepInfo: WorkflowService.getStepInfo,
    canExecuteStep: WorkflowService.canExecuteStep
  };
}; 