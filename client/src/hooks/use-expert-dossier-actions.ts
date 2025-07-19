import { useCallback } from 'react';
import { useToast } from '@/components/ui/toast-notifications';
import { ExpertDossierActions } from '@/services/expert-dossier-actions';

export const useExpertDossierActions = () => {
  const { addToast } = useToast();

  const dossierActions = new ExpertDossierActions(addToast);

  const handleStepAction = useCallback(async (
    dossierId: string,
    stepId: number,
    action: string,
    data?: any
  ) => {
    return await dossierActions.handleStepAction({
      dossierId,
      stepId,
      action,
      data
    });
  }, [dossierActions]);

  const handleDocumentAction = useCallback(async (
    dossierId: string,
    documentName: string,
    action: string,
    file?: File,
    metadata?: any
  ) => {
    return await dossierActions.handleDocumentAction({
      dossierId,
      documentName,
      action,
      file,
      metadata
    });
  }, [dossierActions]);

  return {
    handleStepAction,
    handleDocumentAction
  };
}; 