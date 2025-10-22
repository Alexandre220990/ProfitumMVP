import { useState, useCallback } from 'react';

export interface WizardState {
  currentStep: number;
  prospectId: string | null;
  prospectData: any;
  simulationCompleted: boolean;
  simulationResults: any;
  selectedExperts: Record<string, string | null>;
  scheduledMeetings: any[];
  emailOption: 'none' | 'exchange' | 'presentation';
}

const initialState: WizardState = {
  currentStep: 1,
  prospectId: null,
  prospectData: {},
  simulationCompleted: false,
  simulationResults: null,
  selectedExperts: {},
  scheduledMeetings: [],
  emailOption: 'none'
};

export function useWizardState() {
  const [state, setState] = useState<WizardState>(initialState);
  
  // Navigation
  const goToStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);
  
  const nextStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
  }, []);
  
  const previousStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: Math.max(1, prev.currentStep - 1) }));
  }, []);
  
  // Données
  const updateProspectData = useCallback((data: any) => {
    setState(prev => ({ ...prev, prospectData: { ...prev.prospectData, ...data } }));
  }, []);
  
  const setProspectId = useCallback((id: string) => {
    setState(prev => ({ ...prev, prospectId: id }));
  }, []);
  
  const setSimulationResults = useCallback((results: any) => {
    setState(prev => ({
      ...prev,
      simulationCompleted: true,
      simulationResults: results
    }));
  }, []);
  
  const updateSelectedExperts = useCallback((experts: Record<string, string | null>) => {
    setState(prev => ({ ...prev, selectedExperts: { ...prev.selectedExperts, ...experts } }));
  }, []);
  
  const setScheduledMeetings = useCallback((meetings: any[]) => {
    setState(prev => ({ ...prev, scheduledMeetings: meetings }));
  }, []);
  
  const setEmailOption = useCallback((option: 'none' | 'exchange' | 'presentation') => {
    setState(prev => ({ ...prev, emailOption: option }));
  }, []);
  
  // Reset
  const reset = useCallback(() => {
    setState(initialState);
  }, []);
  
  return {
    state,
    goToStep,
    nextStep,
    previousStep,
    updateProspectData,
    setProspectId,
    setSimulationResults,
    updateSelectedExperts,
    setScheduledMeetings,
    setEmailOption,
    reset
  };
}

