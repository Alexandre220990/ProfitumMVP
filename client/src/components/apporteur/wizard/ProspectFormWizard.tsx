import React from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StepIndicator } from './StepIndicator';
import { useWizardState } from '@/hooks/useWizardState';
import { Step1_ProspectInfo } from './Step1_ProspectInfo';
import { Step2_Simulation } from './Step2_Simulation';
import { Step3_ExpertSelection } from './Step3_ExpertSelection';
import { Step4_MeetingPlanning } from './Step4_MeetingPlanning';
import { Step5_EmailOption } from './Step5_EmailOption';

interface ProspectFormWizardProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const WIZARD_STEPS = [
  { number: 1, title: 'Informations', optional: false },
  { number: 2, title: 'Simulation', optional: true },
  { number: 3, title: 'Experts', optional: true },
  { number: 4, title: 'Rendez-vous', optional: true },
  { number: 5, title: 'Email', optional: true }
];

export function ProspectFormWizard({ onClose, onSuccess }: ProspectFormWizardProps) {
  const {
    state,
    nextStep,
    previousStep,
    goToStep,
    updateProspectData,
    setProspectId,
    setSimulationResults,
    updateSelectedExperts,
    setScheduledMeetings,
    setEmailOption,
    reset
  } = useWizardState();

  const handleClose = () => {
    if (window.confirm('Voulez-vous vraiment quitter ? Les données non sauvegardées seront perdues.')) {
      reset();
      onClose();
    }
  };

  const handleSuccess = () => {
    reset();
    if (onSuccess) {
      onSuccess();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="sticky top-0 bg-white z-10 border-b">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="flex items-center gap-2 text-2xl">
                Nouveau Prospect
              </CardTitle>
              <button
                onClick={handleClose}
                className="rounded-full p-2 hover:bg-gray-100 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Barre de progression */}
            <StepIndicator currentStep={state.currentStep} steps={WIZARD_STEPS} />
          </CardHeader>

          <CardContent className="pt-6">
            {/* Étape 1 : Informations Prospect (OBLIGATOIRE) */}
            {state.currentStep === 1 && (
              <Step1_ProspectInfo
                data={state.prospectData}
                onUpdate={updateProspectData}
                onNext={(prospectId) => {
                  setProspectId(prospectId);
                  nextStep();
                }}
                onSaveAndClose={(prospectId) => {
                  setProspectId(prospectId);
                  handleSuccess();
                }}
              />
            )}

            {/* Étape 2 : Simulation Éligibilité (OPTIONNELLE) */}
            {state.currentStep === 2 && (
              <Step2_Simulation
                prospectId={state.prospectId!}
                prospectData={state.prospectData}
                onComplete={(results) => {
                  setSimulationResults(results);
                  nextStep();
                }}
                onSkip={nextStep}
                onBack={previousStep}
              />
            )}

            {/* Étape 3 : Sélection Experts (OPTIONNELLE) */}
            {state.currentStep === 3 && (
              <Step3_ExpertSelection
                prospectId={state.prospectId!}
                simulationResults={state.simulationResults}
                selectedExperts={state.selectedExperts}
                onUpdate={updateSelectedExperts}
                onNext={nextStep}
                onSkip={nextStep}
                onBack={previousStep}
              />
            )}

            {/* Étape 4 : Planification RDV (OPTIONNELLE) */}
            {state.currentStep === 4 && (
              <Step4_MeetingPlanning
                prospectId={state.prospectId!}
                prospectName={state.prospectData.company_name || state.prospectData.name}
                selectedExperts={state.selectedExperts}
                simulationResults={state.simulationResults}
                scheduledMeetings={state.scheduledMeetings}
                onUpdate={setScheduledMeetings}
                onNext={nextStep}
                onSkip={nextStep}
                onBack={previousStep}
              />
            )}

            {/* Étape 5 : Envoi Email (OPTIONNELLE) */}
            {state.currentStep === 5 && (
              <Step5_EmailOption
                prospectId={state.prospectId!}
                prospectEmail={state.prospectData.email}
                emailOption={state.emailOption}
                onUpdate={setEmailOption}
                onFinish={handleSuccess}
                onBack={previousStep}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

